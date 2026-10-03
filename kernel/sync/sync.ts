// sync：把受控区的记录（video.json、assets/manifest.jsonl）投影成 Remotion 能直接用的形态：
// - src/registry.gen.tsx：把每条视频的 <Compositions /> 挂进同名 <Folder>
// - videos/<id>/assets.gen.ts：素材别名 → staticFile 路径的类型化常量
// - .kineto/public/<id>/<alias><ext>：指向存储副本的符号链接（Remotion 每次运行只认一个 public dir）
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { listVideos } from "../catalog/catalog.ts";
import type { VideoManifest } from "../catalog/schema.ts";
import { KinetoError, isNodeError } from "../errors.ts";
import { videoDir, type KinetoPaths } from "../paths.ts";
import { assetStorageKey, readManifest, type AssetRecord } from "../assets/assets.ts";
import type { StorageBackend } from "../storage/types.ts";

const REGISTRY_HEADER = "// 由 `kineto sync` 生成，勿手改。新增视频请用 `kineto new`。\n";
const ASSETS_HEADER =
  "// 由 `kineto sync` 生成，勿手改。素材用 `kineto asset add <file> --to <video> --as <alias>` 登记。\n" +
  "// 用法：<Img src={staticFile(assets.logo)} />\n";

const componentName = (id: string) => `V_${id.replaceAll("-", "_")}`;

export function renderRegistry(ids: string[]): string {
  if (ids.length === 0) {
    return `${REGISTRY_HEADER}\nexport const Registry: React.FC = () => {\n  return <></>;\n};\n`;
  }
  const imports = ids
    .map((id) => `import { Compositions as ${componentName(id)} } from "../videos/${id}/compositions";`)
    .join("\n");
  const folders = ids
    .map((id) => `      <Folder name="${id}">\n        <${componentName(id)} />\n      </Folder>`)
    .join("\n");
  return (
    `${REGISTRY_HEADER}import { Folder } from "remotion";\n${imports}\n\n` +
    `export const Registry: React.FC = () => {\n  return (\n    <>\n${folders}\n    </>\n  );\n};\n`
  );
}

export interface AssetEntry {
  alias: string;
  ext: string;
}

export function renderAssetsModule(videoId: string, entries: AssetEntry[]): string {
  if (entries.length === 0) return `${ASSETS_HEADER}\nexport const assets = {} as const;\n`;
  const lines = entries.map((e) => `  ${e.alias}: "${videoId}/${e.alias}${e.ext}",`).join("\n");
  return `${ASSETS_HEADER}\nexport const assets = {\n${lines}\n} as const;\n`;
}

export interface MissingAsset {
  video: string;
  alias: string;
  key: string;
}

export interface SyncResult {
  // 内容需要更新的生成文件（check 模式下即漂移清单），相对仓库根
  drift: string[];
  written: string[];
  staged: number;
  missing: MissingAsset[];
}

export async function syncAll(
  paths: KinetoPaths,
  storage: StorageBackend,
  options: { check?: boolean } = {},
): Promise<SyncResult> {
  const [videos, manifest] = await Promise.all([listVideos(paths), readManifest(paths)]);
  // check 模式下跳过解析不了的素材引用（由 checkRepo 单独报 ASSET_NOT_FOUND），其余漂移照查
  const resolved = videos.map((v) => ({ video: v, assets: resolveAssets(v, manifest, !options.check) }));

  const expected = new Map<string, string>([
    [paths.registryFile, renderRegistry(videos.map((v) => v.id))],
    ...resolved.map(
      ({ video, assets }) =>
        [
          path.join(videoDir(paths, video.id), "assets.gen.ts"),
          renderAssetsModule(
            video.id,
            assets.map(({ alias, record }) => ({ alias, ext: record.ext })),
          ),
        ] as const,
    ),
  ]);

  const drift: string[] = [];
  for (const [file, content] of expected) {
    if ((await readOrNull(file)) !== content) drift.push(path.relative(paths.root, file));
  }
  if (options.check) return { drift, written: [], staged: 0, missing: [] };

  for (const rel of drift) await writeFile(path.join(paths.root, rel), expected.get(path.join(paths.root, rel))!);

  // 暂存区整体重建：别名改名、素材解绑后不会留下陈旧链接
  await rm(paths.publicDir, { recursive: true, force: true });
  await mkdir(paths.publicDir, { recursive: true });
  let staged = 0;
  const missing: MissingAsset[] = [];
  for (const { video, assets } of resolved) {
    const dir = path.join(paths.publicDir, video.id);
    await mkdir(dir, { recursive: true });
    for (const { alias, record } of assets) {
      const key = assetStorageKey(record);
      let local: string;
      try {
        local = await storage.fetch(key);
      } catch (err) {
        if (err instanceof KinetoError && err.code === "STORAGE_OBJECT_MISSING") {
          missing.push({ video: video.id, alias, key });
          continue;
        }
        throw err;
      }
      await symlink(local, path.join(dir, `${alias}${record.ext}`));
      staged++;
    }
  }
  return { drift, written: drift, staged, missing };
}

function resolveAssets(video: VideoManifest, manifest: Map<string, AssetRecord>, strict: boolean) {
  const out: { alias: string; record: AssetRecord }[] = [];
  for (const [alias, id] of Object.entries(video.assets).sort(([a], [b]) => a.localeCompare(b))) {
    const record = manifest.get(id);
    if (record) {
      out.push({ alias, record });
    } else if (strict) {
      throw new KinetoError("ASSET_NOT_FOUND", `videos/${video.id} references unknown asset ${id} as "${alias}"`, {
        hint: "Register the file with `kineto asset add` first; it links the alias for you with --to/--as.",
      });
    }
  }
  return out;
}

async function readOrNull(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch (err) {
    if (isNodeError(err, "ENOENT")) return null;
    throw err;
  }
}
