// 资产库：二进制按内容寻址进存储后端，元数据追加到 assets/manifest.jsonl（入库）。
// 只追加、同 id 后写者生效——历史可追溯，git diff 永远只有新增行。
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import { ASSET_ID_RE } from "../catalog/schema.ts";
import { isNodeError, KinetoError } from "../errors.ts";
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
    hint: "The manifest is append-only and written by `kineto asset add`; restore it with git.",
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

  const local = isUrl ? await download(paths, input.source, ext) : input.source;
  try {
    const [hex, { size }] = await Promise.all([sha256File(local), stat(local)]);
    // 剔除 undefined 键：保证返回值与写进 JSONL 再读回来的对象完全一致
    const fields = {
      id: `sha256:${hex}`,
      ext,
      bytes: size,
      addedAt: (input.now ?? new Date()).toISOString(),
      license,
      author: input.author,
      sourceUrl: input.sourceUrl ?? (isUrl ? input.source : undefined),
      description: input.description,
    };
    const record = AssetRecord.parse(Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)));
    await storage.put(local, assetStorageKey(record));

    const existing = (await readManifest(paths)).get(record.id);
    if (existing && sameMetadata(existing, record)) return existing;
    await mkdir(path.dirname(paths.assetsManifest), { recursive: true });
    await appendFile(paths.assetsManifest, JSON.stringify(record) + "\n");
    return record;
  } finally {
    if (isUrl) await rm(local, { force: true });
  }
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
