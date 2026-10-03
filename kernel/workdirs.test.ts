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
    for (const name of [`render-${dead}-1`, `check-${dead}-demo`, `render-${process.pid}-2`, "download-x.png"]) {
      await mkdir(path.join(fx.paths.tmpDir, name), { recursive: true });
    }
    await removeOrphanedWorkDirs(fx.paths);
    assert.deepEqual((await readdir(fx.paths.tmpDir)).sort(), ["download-x.png", `render-${process.pid}-2`].sort());
  } finally {
    await fx.cleanup();
  }
});
