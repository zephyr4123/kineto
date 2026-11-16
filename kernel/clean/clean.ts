// 腾本机磁盘：kineto 在本机留下的副本里，能安全删的都删掉 ——
// 远端后端已有同一份内容的缓存（要用时再下载）、Studio 的暂存区（下次 sync / studio 重建）、已退出进程留下的工作目录。
// 素材库、渲染记录、本地后端的存储一律不碰。
import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { listFiles } from "../files.ts";
import type { KinetoPaths } from "../paths.ts";
import type { CacheCleanup, StorageBackend } from "../storage/types.ts";
import { orphanedWorkDirs } from "../workdirs.ts";

export interface CleanReport {
  cache: CacheCleanup;
  staging: { files: number; bytes: number };
  workDirs: { removed: string[]; bytes: number };
  // 腾出的磁盘空间：同一份数据的多个硬链接只算一次
  freedBytes: number;
}

export async function cleanLocalCopies(
  paths: KinetoPaths,
  storage: StorageBackend,
  { dryRun = false, onProgress }: { dryRun?: boolean; onProgress?: (done: number, total: number) => void } = {},
): Promise<CleanReport> {
  // 先确认后端连得上：连不上就一个文件都不删，免得暂存区删了、缓存却验不了
  await storage.probe();
  // 先删暂存区和工作目录、最后删缓存：暂存文件多是缓存的硬链接，这样缓存文件删掉时是最后一个链接，大小只算一次
  const staging = await measure(paths.publicDir);
  if (!dryRun) await rm(paths.publicDir, { recursive: true, force: true });
  const removed = await orphanedWorkDirs(paths);
  let workBytes = 0;
  for (const name of removed) {
    const dir = path.join(paths.tmpDir, name);
    workBytes += (await measure(dir)).bytes;
    if (!dryRun) await rm(dir, { recursive: true, force: true });
  }
  const cache = await storage.cleanCache({ dryRun, onProgress });
  const cacheBytes = cache.removed.reduce((sum, o) => sum + o.bytes, 0);
  return { cache, staging, workDirs: { removed, bytes: workBytes }, freedBytes: staging.bytes + workBytes + cacheBytes };
}

// 文件数和独占的字节数：还有别的硬链接的文件（缓存或本地存储里的同一份）删了也腾不出空间，不计
async function measure(dir: string): Promise<{ files: number; bytes: number }> {
  const files = await listFiles(dir);
  let bytes = 0;
  for (const file of files) {
    const info = await stat(file);
    if (info.nlink === 1) bytes += info.size;
  }
  return { files: files.length, bytes };
}
