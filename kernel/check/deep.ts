// check --deep：静态扫描兜不住的，按运行时真实情况再查一遍（会打包每条视频，约数秒一条）：
// - 每条视频单独打包、getCompositions 取 Remotion 真实注册的 id，校验归属（展开写法、动态 id 都逃不掉）
// - 本机存储里的素材按 sha256 复核（同尺寸篡改按大小发现不了）
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions } from "@remotion/renderer";
import { listVideoIds, readVideo } from "../catalog/catalog.ts";
import { compositionOwner } from "../catalog/compositions.ts";
import type { KinetoPaths } from "../paths.ts";
import { assetStorageKey, readManifest } from "../assets/assets.ts";
import { sha256File } from "../hash.ts";
import { writeVideoEntry } from "../render/render.ts";
import { remotionSettings } from "../render/settings.ts";
import type { StorageBackend } from "../storage/types.ts";
import { stageVideoAssets } from "../sync/sync.ts";
import { removeOrphanedWorkDirs } from "../workdirs.ts";
import { KinetoError } from "../errors.ts";
import type { Problem } from "./check.ts";

// 逐个核对视频挂着的素材：存储里的内容哈希必须等于素材 id
export async function verifyStoredAssets(paths: KinetoPaths, storage: StorageBackend): Promise<Problem[]> {
  const problems: Problem[] = [];
  const manifest = await readManifest(paths);
  for (const id of await listVideoIds(paths)) {
    const video = await readVideo(paths, id);
    for (const [alias, assetId] of Object.entries(video.assets)) {
      const record = manifest.get(assetId);
      if (!record || (await storage.size(assetStorageKey(record))) === null) continue;
      let file: string;
      try {
        file = await storage.fetch(assetStorageKey(record));
      } catch (err) {
        // 远端后端下载时就验了哈希：坏对象记一条问题，继续查别的
        if (!(err instanceof KinetoError) || err.code !== "STORAGE_OBJECT_CORRUPT") throw err;
        problems.push({ level: "error", code: "ASSET_CORRUPT", message: `videos/${id} asset "${alias}": ${err.message}`, ...(err.hint ? { hint: err.hint } : {}) });
        continue;
      }
      const actual = `sha256:${await sha256File(file)}`;
      if (actual !== record.id) {
        problems.push({
          level: "error",
          code: "ASSET_CORRUPT",
          message: `videos/${id} asset "${alias}": stored content hashes to ${actual}, expected ${record.id}`,
          hint: "The stored copy was modified. Re-run `./kineto asset add` with the original file to repair it.",
        });
      }
    }
  }
  return problems;
}

export async function deepCheck(paths: KinetoPaths, storage: StorageBackend): Promise<Problem[]> {
  const problems: Problem[] = await verifyStoredAssets(paths, storage);
  const ids = await listVideoIds(paths);
  const manifest = await readManifest(paths);
  await removeOrphanedWorkDirs(paths);

  for (const id of ids) {
    const video = await readVideo(paths, id);

    // 悬空引用已由静态 check 报 ASSET_NOT_FOUND；这条视频没法加载，跳过而不是让整份报告作废
    const dangling = Object.entries(video.assets).filter(([, assetId]) => !manifest.has(assetId));
    if (dangling.length > 0) {
      problems.push({
        level: "warn",
        code: "DEEP_CHECK_SKIPPED",
        message: `videos/${id} not loaded: it references unregistered assets (${dangling.map(([a]) => a).join(", ")})`,
      });
      continue;
    }

    const workDir = path.join(paths.tmpDir, `check-${process.pid}-${id}`);
    const publicDir = path.join(workDir, "public");
    let serveUrl: string | undefined;
    try {
      await mkdir(publicDir, { recursive: true });
      const { missing } = await stageVideoAssets(paths, storage, video, publicDir);
      if (missing.length > 0) {
        problems.push({
          level: "warn",
          code: "DEEP_CHECK_SKIPPED",
          message: `videos/${id} not loaded: assets missing from storage (${missing.map((m) => m.alias).join(", ")})`,
          hint: "Configure the storage backend that holds them to include this video in the deep check.",
        });
        continue;
      }
      const entryPoint = await writeVideoEntry(paths, id, path.join(workDir, "entry.tsx"));
      serveUrl = await bundle({ entryPoint, publicDir, rspack: remotionSettings.rspack });
      const compositions = await getCompositions(serveUrl, { inputProps: {}, logLevel: "error" });
      for (const { id: compositionId } of compositions) {
        const owner = compositionOwner(compositionId, ids);
        if (owner !== id) {
          problems.push({
            level: "error",
            code: "COMPOSITION_ID_PREFIX",
            message: `videos/${id} registers composition "${compositionId}" at runtime` +
              (owner ? `, which belongs to video "${owner}"` : `; it must be "${id}" or start with "${id}-"`),
            hint: `Write the id as a string literal on the <Composition> in videos/${id}/compositions.tsx.`,
          });
        }
      }
    } catch (err) {
      // 一条视频加载失败只记一条问题，其它视频照查，报告完整返回
      problems.push({
        level: "error",
        code: "VIDEO_LOAD_FAILED",
        message: `videos/${id} failed to bundle or load: ${(err as Error).message.split("\n")[0]}`,
        hint: `Open it with \`./kineto studio ${id}\` to see the full error.`,
      });
    } finally {
      if (serveUrl) await rm(serveUrl, { recursive: true, force: true });
      await rm(workDir, { recursive: true, force: true });
    }
  }
  return problems;
}
