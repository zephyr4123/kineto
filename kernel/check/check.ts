// 全库一致性校验：把 AGENTS.md 里的规矩变成机器能判的检查，接进 CI 当门禁。
// 只读，不改任何文件；能继续查的就继续查，一次报全所有问题。
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { listVideoIds, readVideo } from "../catalog/catalog.ts";
import { compositionOwner, COMPOSITIONS_FILE, registersComposition, scanRegistrations } from "../catalog/compositions.ts";
import type { VideoManifest } from "../catalog/schema.ts";
import { isNodeError, KinetoError } from "../errors.ts";
import { videoDir, type KinetoPaths } from "../paths.ts";
import { assetStorageKey, readManifest, type AssetRecord } from "../assets/assets.ts";
import { readRenders } from "../render/records.ts";
import type { StorageBackend } from "../storage/types.ts";
import { syncAll } from "../sync/sync.ts";

export interface Problem {
  level: "error" | "warn";
  code: string;
  message: string;
  hint?: string;
}

export interface CheckReport {
  ok: boolean;
  videos: number;
  assets: number;
  problems: Problem[];
}

export async function checkRepo(
  paths: KinetoPaths,
  storage: StorageBackend,
  options: { deep?: boolean } = {},
): Promise<CheckReport> {
  const problems: Problem[] = [];
  const report = (err: unknown, level: Problem["level"] = "error") => {
    if (!(err instanceof KinetoError)) throw err;
    problems.push({ level, code: err.code, message: err.message, ...(err.hint ? { hint: err.hint } : {}) });
  };

  // 记录本身读不出来时没法推算生成文件该长什么样，漂移检查要等它们修好
  let recordsReadable = true;
  let manifest = new Map<string, AssetRecord>();
  try {
    manifest = await readManifest(paths);
  } catch (err) {
    report(err);
    recordsReadable = false;
  }

  const ids = await listVideoIds(paths);
  const videos: VideoManifest[] = [];
  const seenIds = new Map<string, string>();
  for (const id of ids) {
    try {
      videos.push(await readVideo(paths, id));
    } catch (err) {
      report(err);
      recordsReadable = false;
      continue;
    }
    for (const p of await checkCompositions(paths, id, ids, seenIds)) problems.push(p);
    try {
      await readRenders(paths, id);
    } catch (err) {
      report(err);
    }
  }

  for (const video of videos) {
    const byLower = new Map<string, string[]>();
    for (const alias of Object.keys(video.assets)) {
      byLower.set(alias.toLowerCase(), [...(byLower.get(alias.toLowerCase()) ?? []), alias]);
    }
    for (const group of byLower.values()) {
      if (group.length > 1) {
        problems.push({
          level: "error",
          code: "ALIAS_CONFLICT",
          message: `videos/${video.id} has aliases that differ only by case: ${group.join(", ")}`,
          hint: "They collide as file names on case-insensitive file systems. Keep one.",
        });
      }
    }
    for (const [alias, assetId] of Object.entries(video.assets)) {
      const record = manifest.get(assetId);
      if (!record) {
        problems.push({
          level: "error",
          code: "ASSET_NOT_FOUND",
          message: `videos/${video.id} references unknown asset ${assetId} as "${alias}"`,
          hint: "Register the file with `./kineto asset add`.",
        });
      } else {
        const size = await storage.size(assetStorageKey(record));
        if (size === null) {
          // 别人 clone 下来、没接共享存储时属于正常情况，所以只是警告
          problems.push({
            level: "warn",
            code: "ASSET_NOT_LOCAL",
            message: `videos/${video.id} asset "${alias}" is not available in storage backend "${storage.name}"`,
            hint: "Configure the shared storage backend in kineto.config.yaml, or re-add the asset.",
          });
        } else if (size !== record.bytes) {
          problems.push({
            level: "error",
            code: "ASSET_CORRUPT",
            message: `videos/${video.id} asset "${alias}" is ${size} bytes in storage but ${record.bytes} in the manifest`,
            hint: "The stored copy was modified. Re-run `./kineto asset add` with the original file to repair it.",
          });
        }
      }
    }
  }

  for (const p of await strayRegistrations(paths, ids)) problems.push(p);

  if (recordsReadable) {
    const { drift } = await syncAll(paths, storage, { check: true });
    if (drift.length > 0) {
      problems.push({
        level: "error",
        code: "GENERATED_OUT_OF_DATE",
        message: `Generated files are out of date: ${drift.join(", ")}`,
        hint: "Run `./kineto sync` and commit the result. Never edit *.gen.* files by hand.",
      });
    }
  }

  // deep 依赖记录可读；import 放在这里，普通 check 不加载打包器
  if (options.deep && recordsReadable) {
    const { deepCheck } = await import("./deep.ts");
    problems.push(...(await deepCheck(paths, storage)));
  }

  return {
    ok: !problems.some((p) => p.level === "error"),
    videos: ids.length,
    assets: manifest.size,
    problems,
  };
}

// 官方 skill 要求 composition id 写成 JSX 字符串字面量（Studio 写回源码依赖它），
// 这里再加两条 kineto 约束：必须带视频 id 前缀（几百条视频不撞名）、只能写在 compositions.tsx。
async function checkCompositions(
  paths: KinetoPaths,
  id: string,
  allIds: string[],
  seen: Map<string, string>,
): Promise<Problem[]> {
  const dir = videoDir(paths, id);
  const problems: Problem[] = [];
  let source: string;
  try {
    source = await readFile(path.join(dir, COMPOSITIONS_FILE), "utf8");
  } catch (err) {
    if (!isNodeError(err, "ENOENT")) throw err;
    return [
      {
        level: "error",
        code: "COMPOSITIONS_MISSING",
        message: `videos/${id}/${COMPOSITIONS_FILE} is missing`,
        hint: "Every video registers its compositions in compositions.tsx (exporting `Compositions`).",
      },
    ];
  }

  const why = { spread: "uses spread props", "non-literal": "has a non-literal id", missing: "has no id" } as const;
  for (const { id: literal, problem } of scanRegistrations(source, path.join(dir, COMPOSITIONS_FILE))) {
    if (literal === null) {
      problems.push({
        level: "error",
        code: "COMPOSITION_ID_NOT_LITERAL",
        message: `videos/${id}/${COMPOSITIONS_FILE}: a composition ${why[problem ?? "non-literal"]}; its owner cannot be verified`,
        hint: `Write id="${id}-scene" as a string literal directly on the JSX node, with no {...spread}, so Studio can edit it.`,
      });
      continue;
    }
    const owner = compositionOwner(literal, allIds);
    if (owner !== id) {
      problems.push({
        level: "error",
        code: "COMPOSITION_ID_PREFIX",
        message:
          owner === undefined
            ? `videos/${id}/${COMPOSITIONS_FILE}: composition id "${literal}" must be "${id}" or start with "${id}-"`
            : `videos/${id}/${COMPOSITIONS_FILE}: composition id "${literal}" falls in the namespace of video "${owner}"`,
      });
      continue;
    }
    const firstSeen = seen.get(literal);
    if (firstSeen) {
      problems.push({
        level: "error",
        code: "COMPOSITION_ID_DUPLICATE",
        message: `Composition id "${literal}" is registered more than once (videos/${firstSeen}, videos/${id})`,
      });
    }
    seen.set(literal, id);
  }

  return problems;
}

// <Composition>/<Still> 只能写在各视频的 compositions.tsx 里。扫描所有可能被打包进 Remotion 的源码
// （包括 .js——Remotion 的打包器对 .js 也开了 JSX），只跳过不会进 bundle 的 Node 侧代码与依赖。
// 静态扫描看不见的写法（如 {...props} 展开传 id）由 `check --deep` 按运行时真实注册结果兜底。
const SKIP_DIRS = new Set(["node_modules", ".git", ".kineto", ".agents", ".claude", "kernel", "cli", "templates"]);
const SOURCE_RE = /\.(tsx|jsx|ts|js|mjs|cjs|mts|cts)$/;

async function strayRegistrations(paths: KinetoPaths, videoIds: string[]): Promise<Problem[]> {
  const allowed = new Set(videoIds.map((id) => path.join(paths.videosDir, id, COMPOSITIONS_FILE)));
  const problems: Problem[] = [];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!(dir === paths.root && SKIP_DIRS.has(entry.name))) await walk(full);
      } else if (entry.isFile() && SOURCE_RE.test(entry.name) && !allowed.has(full)) {
        if (registersComposition(await readFile(full, "utf8"), full)) {
          problems.push({
            level: "error",
            code: "COMPOSITION_OUTSIDE_REGISTRY",
            message: `${path.relative(paths.root, full)} registers a composition`,
            hint: "Move <Composition>/<Still> into the compositions.tsx of the video it belongs to.",
          });
        }
      }
    }
  };
  await walk(paths.root);
  return problems;
}
