// render / check --deep 在 .kineto/tmp 下建私有工作目录（render-<pid>-…、check-<pid>-…），正常结束会自己删；
// 进程被杀（Ctrl-C、kill -9）时 finally 来不及执行，下次开工前清掉已不存在的进程留下的目录。
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { KinetoPaths } from "./paths.ts";

export async function removeOrphanedWorkDirs(paths: KinetoPaths): Promise<void> {
  const entries = await readdir(paths.tmpDir).catch(() => [] as string[]);
  for (const name of entries) {
    const pid = Number(/^(?:render|check)-(\d+)-/.exec(name)?.[1]);
    if (!pid || pid === process.pid) continue;
    try {
      process.kill(pid, 0);
    } catch {
      await rm(path.join(paths.tmpDir, name), { recursive: true, force: true });
    }
  }
}
