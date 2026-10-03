// 仓库级互斥锁：改受控区（video.json、manifest、生成文件、暂存目录）的操作串行执行。
// agent 常把多条命令并行发出，没有锁时 read-modify-write 会互相覆盖、报告与事实不符。
import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { isNodeError, KinetoError } from "./errors.ts";
import type { KinetoPaths } from "./paths.ts";

// 同一进程内可重入：kernel 函数互相调用时不会自己锁死自己
let depth = 0;

export async function withRepoLock<T>(
  paths: KinetoPaths,
  fn: () => Promise<T>,
  { timeoutMs = 120_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  if (depth > 0) return runHeld(fn);
  const file = path.join(paths.stateDir, "lock");
  await mkdir(paths.stateDir, { recursive: true });
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const fh = await open(file, "wx");
      await fh.writeFile(JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
      await fh.close();
      break;
    } catch (err) {
      if (!isNodeError(err, "EEXIST")) throw err;
      const holder = await readHolder(file);
      if (holder.stale) {
        await rm(file, { force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new KinetoError("REPO_LOCKED", `Another kineto command holds the repository lock (pid ${holder.pid ?? "?"})`, {
          hint: "Wait for it to finish. If that process no longer exists, delete .kineto/lock.",
        });
      }
      await new Promise((r) => setTimeout(r, 25 + Math.random() * 75));
    }
  }
  try {
    return await runHeld(fn);
  } finally {
    await rm(file, { force: true });
  }
}

async function runHeld<T>(fn: () => Promise<T>): Promise<T> {
  depth++;
  try {
    return await fn();
  } finally {
    depth--;
  }
}

async function readHolder(file: string): Promise<{ pid: number | null; stale: boolean }> {
  try {
    const { pid } = JSON.parse(await readFile(file, "utf8")) as { pid: number };
    try {
      process.kill(pid, 0);
      return { pid, stale: false };
    } catch (err) {
      return { pid, stale: isNodeError(err, "ESRCH") };
    }
  } catch {
    // 锁文件刚创建还没写完，或内容损坏：超过 30 秒还读不出来才算陈旧
    const age = await stat(file).then((s) => Date.now() - s.mtimeMs, () => 0);
    return { pid: null, stale: age > 30_000 };
  }
}
