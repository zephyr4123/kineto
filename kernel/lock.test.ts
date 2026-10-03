import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { makeRepo } from "./testing/fixture.ts";
import { withRepoLock } from "./lock.ts";

test("withRepoLock 串行执行临界区；同进程嵌套可重入", async () => {
  const fx = await makeRepo();
  try {
    const order: string[] = [];
    const slow = (name: string) =>
      withRepoLock(fx.paths, async () => {
        order.push(`${name}:start`);
        await new Promise((r) => setTimeout(r, 30));
        order.push(`${name}:end`);
      });
    await Promise.all([slow("a"), slow("b")]);
    assert.deepEqual(order.slice(0, 2).map((s) => s.split(":")[1]), ["start", "end"]);
    assert.equal(await withRepoLock(fx.paths, () => withRepoLock(fx.paths, async () => 42)), 42);
  } finally {
    await fx.cleanup();
  }
});

test("withRepoLock 接管已死进程留下的陈旧锁", async () => {
  const fx = await makeRepo();
  try {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(fx.paths.stateDir, { recursive: true });
    await writeFile(path.join(fx.paths.stateDir, "lock"), JSON.stringify({ pid: 2 ** 22 + 12345, at: "x" }));
    assert.equal(await withRepoLock(fx.paths, async () => "ran"), "ran");
  } finally {
    await fx.cleanup();
  }
});
