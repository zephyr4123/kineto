// 资产库：二进制按内容寻址进存储后端，元数据追加到 assets/manifest.jsonl（入库）。
// 只追加、同 id 后写者生效——历史可追溯，git diff 永远只有新增行。
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import { ASSET_ID_RE } from "../catalog/schema.ts";
import { isNodeError, KinetoError } from "../errors.ts";
import { appendJsonLine } from "../jsonl.ts";
import { withRepoLock } from "../lock.ts";
import type { KinetoPaths } from "../paths.ts";
import type { StorageBackend } from "../storage/types.ts";

export const AssetRecord = z
  .object({
    id: z.string().regex(ASSET_ID_RE),
    ext: z.string().regex(/^\.[a-z0-9]+$/),
    bytes: z.number().int().nonnegative(),
    addedAt: z.iso.datetime(),
    // 必填：素材来源不明、许可不明的，一律不进库
    license: z.string().min(1),
    author: z.string().min(1).optional(),
    sourceUrl: z.url().optional(),
    description: z.string().min(1).optional(),
  })
  .strict();
export type AssetRecord = z.infer<typeof AssetRecord>;

export const assetStorageKey = (rec: Pick<AssetRecord, "id" | "ext">): string => {
  const hex = rec.id.slice("sha256:".length);
  return `assets/${hex.slice(0, 2)}/${hex}${rec.ext}`;
};

export async function readManifest(paths: KinetoPaths): Promise<Map<string, AssetRecord>> {
  let text: string;
  try {
    text = await readFile(paths.assetsManifest, "utf8");
  } catch (err) {
    if (isNodeError(err, "ENOENT")) return new Map();
    throw err;
  }
  const records = new Map<string, AssetRecord>();
  text.split("\n").forEach((line, i) => {
    if (line.trim() === "") return;
    let json: unknown;
    try {
      json = JSON.parse(line);
    } catch {
      throw manifestError(i + 1, "not valid JSON");
    }
    const parsed = AssetRecord.safeParse(json);
    if (!parsed.success) throw manifestError(i + 1, z.prettifyError(parsed.error));
    records.set(parsed.data.id, parsed.data);
  });
  return records;
}

const manifestError = (line: number, why: string) =>
  new KinetoError("MANIFEST_INVALID", `assets/manifest.jsonl line ${line}: ${why}`, {
    hint: "The manifest is append-only and written by `./kineto asset add`; restore it with git.",
  });

export interface IngestInput {
  // 本地文件路径或 http(s) URL
  source: string;
  license: string;
  author?: string;
  sourceUrl?: string;
  description?: string;
  now?: Date;
}

export async function ingestAsset(
  paths: KinetoPaths,
  storage: StorageBackend,
  input: IngestInput,
): Promise<AssetRecord> {
  const license = input.license.trim();
  if (license === "") {
    throw new KinetoError("LICENSE_REQUIRED", "Every asset needs a license", {
      hint: 'Pass --license with an SPDX id (e.g. CC0-1.0, CC-BY-4.0) or the exact terms, e.g. "Pexels License".',
    });
  }
  const isUrl = /^https?:\/\//i.test(input.source);
  const ext = path.extname(isUrl ? new URL(input.source).pathname : input.source).toLowerCase();
  if (!/^\.[a-z0-9]+$/.test(ext)) {
    throw new KinetoError("ASSET_EXT_REQUIRED", `Cannot tell the file type of ${input.source}`, {
      hint: "Remotion needs a file extension to load media; rename the file (e.g. .png, .wav, .mp4).",
    });
  }

  if (!isUrl && !(await stat(input.source).then((s) => s.isFile(), () => false))) {
    throw new KinetoError("ASSET_SOURCE_NOT_FOUND", `No such file: ${input.source}`, {
      hint: "Pass a path to an existing file (relative to your current directory) or an http(s) URL.",
    });
  }
  // 下载、哈希、入存储都是幂等的内容寻址操作，放在锁外（下载可能很久）；只有读-改-写 manifest 持锁
  const local = isUrl ? await download(paths, input.source, ext) : input.source;
  try {
    const [hex, { size }] = await Promise.all([sha256File(local), stat(local)]);
    const id = `sha256:${hex}`;
    assertCompatible((await readManifest(paths)).get(id), license, ext);
    await storage.put(local, assetStorageKey({ id, ext }), { sha256: hex });

    return await withRepoLock(paths, async () => {
      const existing = (await readManifest(paths)).get(id);
      assertCompatible(existing, license, ext);
      // 剔除 undefined 键：保证返回值与写进 JSONL 再读回来的对象完全一致。
      // 同一文件再次登记时，没传的字段沿用旧值——只为挂到另一条视频而重新 add 不会抹掉作者与来源
      const given = Object.fromEntries(
        Object.entries({
          license,
          author: input.author,
          sourceUrl: input.sourceUrl ?? (isUrl ? input.source : undefined),
          description: input.description,
        }).filter(([, v]) => v !== undefined),
      );
      const record = AssetRecord.parse({
        ...existing,
        ...given,
        id,
        ext,
        bytes: size,
        addedAt: existing?.addedAt ?? (input.now ?? new Date()).toISOString(),
      });
      if (existing && sameMetadata(existing, record)) return existing;
      await mkdir(path.dirname(paths.assetsManifest), { recursive: true });
      await appendJsonLine(paths.assetsManifest, record);
      return record;
    });
  } finally {
    if (isUrl) await rm(local, { force: true });
  }
}

// 同一份内容已登记过：许可证与扩展名是素材的身份，再次登记不能悄悄改写它们
function assertCompatible(existing: AssetRecord | undefined, license: string, ext: string): void {
  if (!existing) return;
  if (existing.license !== license) {
    throw new KinetoError(
      "ASSET_LICENSE_CONFLICT",
      `This exact file is already registered as ${existing.id} under license "${existing.license}", not "${license}"`,
      {
        hint:
          `To use it in another video: ./kineto asset link ${existing.id} --to <video> --as <alias>. ` +
          `To correct the recorded license: ./kineto asset update ${existing.id} --license <license>`,
      },
    );
  }
  if (existing.ext !== ext) {
    throw new KinetoError("ASSET_EXT_CONFLICT", `This exact file is already registered as ${existing.id} with extension ${existing.ext}`, {
      hint: `Rename the file to ${existing.ext}, or reuse it with: kineto asset link ${existing.id} --to <video> --as <alias>`,
    });
  }
}

export interface AssetPatch {
  license?: string;
  author?: string;
  sourceUrl?: string;
  description?: string;
}

// 显式修正已登记素材的元数据（例如许可证登错了）：追加一行新记录，后写者生效，历史留在 manifest 里
export async function updateAsset(paths: KinetoPaths, id: string, patch: AssetPatch): Promise<AssetRecord> {
  return withRepoLock(paths, async () => {
    const existing = (await readManifest(paths)).get(id);
    if (!existing) {
      throw new KinetoError("ASSET_NOT_FOUND", `No asset ${id} in the library`, {
        hint: "Run `./kineto asset list` for ids.",
      });
    }
    const given = Object.fromEntries(
      Object.entries({ ...patch, license: patch.license?.trim() }).filter(([, v]) => v !== undefined),
    );
    const record = AssetRecord.parse({ ...existing, ...given });
    if (sameMetadata(existing, record)) return existing;
    await appendJsonLine(paths.assetsManifest, record);
    return record;
  });
}

const sameMetadata = (a: AssetRecord, b: AssetRecord) => {
  const strip = ({ addedAt: _, ...rest }: AssetRecord) => JSON.stringify(rest);
  return strip(a) === strip(b);
};

export async function sha256File(file: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(file), hash);
  return hash.digest("hex");
}

async function download(paths: KinetoPaths, url: string, ext: string): Promise<string> {
  const res = await fetch(url).catch((err: unknown) => {
    throw new KinetoError("DOWNLOAD_FAILED", `Cannot download ${url}: ${(err as Error).message}`, { cause: err });
  });
  if (!res.ok || !res.body) {
    throw new KinetoError("DOWNLOAD_FAILED", `Download of ${url} failed with HTTP ${res.status}`);
  }
  await mkdir(paths.tmpDir, { recursive: true });
  const file = path.join(paths.tmpDir, `download-${process.pid}-${Date.now()}${ext}`);
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(file));
  return file;
}
