// render / check --deep / 工具插件在 .kineto/tmp 下建私有工作目录（render-<pid>-…、check-<pid>-…、tool-<pid>-…），正常结束会自己删；
// 进程被杀（Ctrl-C、kill -9）时 finally 来不及执行，下次开工前清掉已不存在的进程留下的目录。
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { KinetoPaths } from "./paths.ts";
import { processGone } from "./process.ts";

/** 已不存在的进程留下的工作目录名（在 tmpDir 下） */
export async function orphanedWorkDirs(paths: KinetoPaths): Promise<string[]> {
  const entries = await readdir(paths.tmpDir).catch(() => [] as string[]);
  return entries.filter((name) => {
    const pid = Number(/^(?:render|check|tool)-(\d+)-/.exec(name)?.[1]);
    return pid > 0 && pid !== process.pid && processGone(pid);
  });
}

export async function removeOrphanedWorkDirs(paths: KinetoPaths): Promise<void> {
  for (const name of await orphanedWorkDirs(paths)) await rm(path.join(paths.tmpDir, name), { recursive: true, force: true });
}
