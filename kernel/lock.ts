// 仓库级互斥锁：改受控区（video.json、manifest、生成文件、暂存目录）的操作串行执行。
// agent 常把多条命令并行发出，没有锁时 read-modify-write 会互相覆盖、报告与事实不符。
//
// 正确性要点（都踩过）：
// - 可重入按「异步调用链」判断（AsyncLocalStorage），不能用进程级计数——同进程里并发的另一个调用方会被误放行
// - 锁文件写随机 token，释放前核对：不删别人的锁
// - 接管陈旧锁要先抢「接管守卫」再复核：否则两个等待者会互删对方刚建的锁，同时持锁
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { isNodeError, KinetoError } from "./errors.ts";
import type { KinetoPaths } from "./paths.ts";

// 当前异步调用链已持有的锁文件：嵌套拿不同的锁（工具锁里再拿仓库锁）时互不遮挡
const held = new AsyncLocalStorage<ReadonlySet<string>>();

interface Holder {
  pid: number | null;
  token: string | null;
  stale: boolean;
}

export function withRepoLock<T>(
  paths: KinetoPaths,
  fn: () => Promise<T>,
  { timeoutMs = 120_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  return withFileLock(path.join(paths.stateDir, "lock"), fn, {
    timeoutMs,
    onTimeout: (pid) =>
      new KinetoError("REPO_LOCKED", `Another kineto command holds the repository lock (pid ${pid ?? "?"})`, {
        hint: "Wait for it to finish. If that process no longer exists, delete .kineto/lock.",
      }),
  });
}

// 通用的跨进程互斥锁（锁文件 + 随机 token + 陈旧锁接管）。工具插件用它保护首次安装、下载这类不能并发的步骤
export async function withFileLock<T>(
  file: string,
  fn: () => Promise<T>,
  {
    timeoutMs = 120_000,
    onTimeout = (pid: number | null) =>
      new KinetoError("LOCKED", `Another kineto process holds ${file} (pid ${pid ?? "?"})`, {
        hint: `Wait for it to finish. If that process no longer exists, delete ${file}.`,
      }),
  }: { timeoutMs?: number; onTimeout?: (pid: number | null) => KinetoError } = {},
): Promise<T> {
  const holding = held.getStore() ?? new Set<string>();
  if (holding.has(file)) return fn();
  await mkdir(path.dirname(file), { recursive: true });
  const token = randomUUID();
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await tryCreate(file, token)) break;
    const holder = await readHolder(file);
    if (holder.stale && (await takeOver(file, holder))) continue;
    if (Date.now() > deadline) throw onTimeout(holder.pid);
    await sleep(25 + Math.random() * 75);
  }
  try {
    return await held.run(new Set([...holding, file]), fn);
  } finally {
    const holder = await readHolder(file);
    if (holder.token === token) await rm(file, { force: true });
  }
}

async function tryCreate(file: string, token: string): Promise<boolean> {
  try {
    const fh = await open(file, "wx");
    try {
      await fh.writeFile(JSON.stringify({ pid: process.pid, token, at: new Date().toISOString() }));
    } finally {
      await fh.close();
    }
    return true;
  } catch (err) {
    if (isNodeError(err, "EEXIST")) return false;
    throw err;
  }
}

// 只有抢到守卫的那一个进程能删陈旧锁，且删之前复核锁仍是刚才看到的那一把
async function takeOver(file: string, stale: Holder): Promise<boolean> {
  const guard = `${file}.takeover`;
  try {
    const fh = await open(guard, "wx");
    await fh.close();
  } catch (err) {
    if (!isNodeError(err, "EEXIST")) throw err;
    // 守卫自身也可能被崩溃的进程遗留下来
    const age = await stat(guard).then((s) => Date.now() - s.mtimeMs, () => 0);
    if (age > 10_000) await rm(guard, { force: true });
    return false;
  }
  try {
    const now = await readHolder(file);
    if (now.stale && now.token === stale.token) await rm(file, { force: true });
    return true;
  } finally {
    await rm(guard, { force: true });
  }
}

async function readHolder(file: string): Promise<Holder> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (err) {
    if (isNodeError(err, "ENOENT")) return { pid: null, token: null, stale: false };
    throw err;
  }
  try {
    const { pid, token } = JSON.parse(text) as { pid: number; token?: string };
    try {
      process.kill(pid, 0);
      return { pid, token: token ?? null, stale: false };
    } catch (err) {
      return { pid, token: token ?? null, stale: isNodeError(err, "ESRCH") };
    }
  } catch {
    // 锁文件刚创建还没写完，或内容损坏：超过 30 秒还读不出来才算陈旧
    const age = await stat(file).then((s) => Date.now() - s.mtimeMs, () => 0);
    return { pid: null, token: null, stale: age > 30_000 };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
