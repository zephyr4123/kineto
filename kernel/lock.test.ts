import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeRepo } from "./testing/fixture.ts";
import { withRepoLock } from "./lock.ts";

const LOCK_MODULE = path.join(path.dirname(fileURLToPath(import.meta.url)), "lock.ts");
const DEAD_PID = 2 ** 22 + 12345;

test("同进程里并发的两个调用方也互斥：B 在 A 持锁期间进入时必须等待", async () => {
  const fx = await makeRepo();
  try {
    const order: string[] = [];
    let aHolding!: () => void;
    const aIn = new Promise<void>((r) => (aHolding = r));
    const a = withRepoLock(fx.paths, async () => {
      order.push("a:start");
      aHolding();
      await new Promise((r) => setTimeout(r, 80));
      order.push("a:end");
    });
    await aIn;
    const b = withRepoLock(fx.paths, async () => {
      order.push("b:start");
    });
    await Promise.all([a, b]);
    assert.deepEqual(order, ["a:start", "a:end", "b:start"]);
    // 同一异步调用链内嵌套可重入，不会自己锁死自己
    assert.equal(await withRepoLock(fx.paths, () => withRepoLock(fx.paths, async () => 42)), 42);
  } finally {
    await fx.cleanup();
  }
});

test("多个进程同时接管同一把陈旧锁：任何时刻最多一个持有者", async () => {
  const fx = await makeRepo();
  try {
    const script = path.join(fx.root, "contend.mjs");
    await writeFile(
      script,
      `import { mkdir, readdir, rm, writeFile, appendFile } from "node:fs/promises";
import { withRepoLock } from ${JSON.stringify(LOCK_MODULE)};
import { pathsFor } from ${JSON.stringify(path.join(path.dirname(LOCK_MODULE), "paths.ts"))};
const root = process.argv[2];
const holders = root + "/holders";
await withRepoLock(pathsFor(root), async () => {
  await writeFile(holders + "/" + process.pid, "");
  const n = (await readdir(holders)).length;
  await appendFile(root + "/max.log", n + "\\n");
  await new Promise((r) => setTimeout(r, 40));
  await rm(holders + "/" + process.pid);
});
`,
    );
    await mkdir(path.join(fx.root, "holders"));
    for (let round = 0; round < 3; round++) {
      await mkdir(fx.paths.stateDir, { recursive: true });
      await writeFile(path.join(fx.paths.stateDir, "lock"), JSON.stringify({ pid: DEAD_PID, token: "stale" }));
      await Promise.all(
        Array.from({ length: 6 }, () => new Promise((resolve) => spawn(process.execPath, [script, fx.root]).on("close", resolve))),
      );
    }
    const counts = (await readFile(path.join(fx.root, "max.log"), "utf8")).trim().split("\n").map(Number);
    assert.equal(counts.length, 18);
    assert.equal(Math.max(...counts), 1);
  } finally {
    await fx.cleanup();
  }
});

test("withFileLock：同一个锁文件串行；持有它时再拿仓库锁不会死锁，持有仓库锁时再拿它也不会", async () => {
  const fx = await makeRepo();
  try {
    const { withFileLock, withRepoLock } = await import("./lock.ts");
    const file = path.join(fx.root, ".kineto/tools/demo/lock");
    let inside = 0;
    let maxInside = 0;
    const work = () =>
      withFileLock(file, async () => {
        inside++;
        maxInside = Math.max(maxInside, inside);
        await new Promise((r) => setTimeout(r, 20));
        inside--;
      });
    await Promise.all([work(), work(), work()]);
    assert.equal(maxInside, 1);

    const nested = await withFileLock(file, () => withRepoLock(fx.paths, () => withFileLock(file, async () => "ok")));
    assert.equal(nested, "ok");
    assert.equal(await withRepoLock(fx.paths, () => withFileLock(file, () => withRepoLock(fx.paths, async () => "ok"))), "ok");
  } finally {
    await fx.cleanup();
  }
});
