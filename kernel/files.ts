// 目录遍历的两件小事：列出底下所有文件、删掉清空了的子目录。缓存清理和本机清理都用
import { readdir, rmdir } from "node:fs/promises";
import path from "node:path";
import { isNodeError } from "./errors.ts";

/** 目录下（含子目录）所有文件的绝对路径，按路径排序；目录不存在时为空 */
export async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
    .sort();
}

/** 自底向上删掉空目录，dir 自己空了也删；删的同时别的进程往里写了文件（ENOTEMPTY）或先删掉了（ENOENT）就留给它 */
export async function removeEmptyDirs(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
  if (!entries) return;
  for (const e of entries) if (e.isDirectory()) await removeEmptyDirs(path.join(dir, e.name));
  await rmdir(dir).catch((err: unknown) => {
    if (!isNodeError(err, "ENOTEMPTY") && !isNodeError(err, "ENOENT")) throw err;
  });
}
