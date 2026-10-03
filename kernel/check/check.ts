// 全库一致性校验：把 AGENTS.md 里的规矩变成机器能判的检查，接进 CI 当门禁。
// 只读，不改任何文件；能继续查的就继续查，一次报全所有问题。
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { listVideoIds, readVideo } from "../catalog/catalog.ts";
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

const COMPOSITIONS_FILE = "compositions.tsx";

export async function checkRepo(paths: KinetoPaths, storage: StorageBackend): Promise<CheckReport> {
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
    for (const p of await checkCompositions(paths, id, seenIds)) problems.push(p);
    try {
      await readRenders(paths, id);
    } catch (err) {
      report(err);
    }
  }

  for (const video of videos) {
    for (const [alias, assetId] of Object.entries(video.assets)) {
      const record = manifest.get(assetId);
      if (!record) {
        problems.push({
          level: "error",
          code: "ASSET_NOT_FOUND",
          message: `videos/${video.id} references unknown asset ${assetId} as "${alias}"`,
          hint: "Register the file with `kineto asset add`.",
        });
      } else if (!(await storage.has(assetStorageKey(record)))) {
        // 别人 clone 下来、没接共享存储时属于正常情况，所以只是警告
        problems.push({
          level: "warn",
          code: "ASSET_NOT_LOCAL",
          message: `videos/${video.id} asset "${alias}" is not available in storage backend "${storage.name}"`,
          hint: "Configure the shared storage backend in kineto.config.yaml, or re-add the asset.",
        });
      }
    }
  }

  if (recordsReadable) {
    const { drift } = await syncAll(paths, storage, { check: true });
    if (drift.length > 0) {
      problems.push({
        level: "error",
        code: "GENERATED_OUT_OF_DATE",
        message: `Generated files are out of date: ${drift.join(", ")}`,
        hint: "Run `kineto sync` and commit the result. Never edit *.gen.* files by hand.",
      });
    }
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
async function checkCompositions(paths: KinetoPaths, id: string, seen: Map<string, string>): Promise<Problem[]> {
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

  for (const match of source.matchAll(/\bid=(?:"([^"]*)"|'([^']*)'|(\{))/g)) {
    const literal = match[1] ?? match[2];
    if (literal === undefined) {
      problems.push({
        level: "error",
        code: "COMPOSITION_ID_NOT_LITERAL",
        message: `videos/${id}/${COMPOSITIONS_FILE}: composition id must be a string literal`,
        hint: `Write id="${id}-scene" directly on the JSX node so Studio can edit it.`,
      });
      continue;
    }
    if (literal !== id && !literal.startsWith(`${id}-`)) {
      problems.push({
        level: "error",
        code: "COMPOSITION_ID_PREFIX",
        message: `videos/${id}/${COMPOSITIONS_FILE}: composition id "${literal}" must be "${id}" or start with "${id}-"`,
      });
      continue;
    }
    const owner = seen.get(literal);
    if (owner) {
      problems.push({
        level: "error",
        code: "COMPOSITION_ID_DUPLICATE",
        message: `Composition id "${literal}" is registered more than once (videos/${owner}, videos/${id})`,
      });
    }
    seen.set(literal, id);
  }

  const files = await readdir(dir, { recursive: true, withFileTypes: true });
  for (const f of files) {
    if (!f.isFile() || !f.name.endsWith(".tsx") || f.name === COMPOSITIONS_FILE) continue;
    const text = await readFile(path.join(f.parentPath, f.name), "utf8");
    if (/<(Composition|Still)\b/.test(text)) {
      problems.push({
        level: "error",
        code: "COMPOSITION_OUTSIDE_REGISTRY",
        message: `${path.relative(paths.root, path.join(f.parentPath, f.name))} registers a composition`,
        hint: `Move <Composition>/<Still> into videos/${id}/${COMPOSITIONS_FILE}.`,
      });
    }
  }
  return problems;
}
