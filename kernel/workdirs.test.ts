import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { makeRepo } from "./testing/fixture.ts";
import { removeOrphanedWorkDirs } from "./workdirs.ts";

test("清理已死进程遗留的 render-* / check-* 工作目录，保留活进程的与其它文件", async () => {
  const fx = await makeRepo();
  try {
    const dead = 2 ** 22 + 4321;
    // pid 1 是别的用户的活进程：process.kill 报 EPERM 而不是 ESRCH，不能当成已死
    const others = [`render-${process.pid}-2`, "render-1-x", "download-x.png"];
    for (const name of [`render-${dead}-1`, `check-${dead}-demo`, ...others]) {
      await mkdir(path.join(fx.paths.tmpDir, name), { recursive: true });
    }
    await removeOrphanedWorkDirs(fx.paths);
    assert.deepEqual((await readdir(fx.paths.tmpDir)).sort(), others.sort());
  } finally {
    await fx.cleanup();
  }
});
