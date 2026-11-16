import { test } from "node:test";
import assert from "node:assert/strict";
import { link, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Storage } from "../storage/s3.ts";
import { LocalStorage } from "../storage/local.ts";
import { FakeTransport } from "../testing/fake-s3.ts";
import { makeRepo } from "../testing/fixture.ts";
import { cleanLocalCopies } from "./clean.ts";

const SETTINGS = { endpoint: "https://cos.example.com", region: "ap-shanghai", bucket: "demo-1250000000", prefix: "", publicUrl: undefined };

test("clean 清掉暂存区、已退出进程的工作目录和远端已有的缓存；正在跑的工作目录不动", async () => {
  const fx = await makeRepo();
  try {
    const storage = new S3Storage(SETTINGS, fx.paths.cacheDir, new FakeTransport());
    const src = path.join(fx.root, "a.mp4");
    await writeFile(src, "0123456789");
    await storage.put(src, "assets/aa/a.mp4");
    // 暂存区：一份是缓存的硬链接（和缓存共用一份数据），一份是独有的
    await mkdir(path.join(fx.paths.publicDir, "demo"), { recursive: true });
    await link(await storage.fetch("assets/aa/a.mp4"), path.join(fx.paths.publicDir, "demo", "clip.mp4"));
    await writeFile(path.join(fx.paths.publicDir, "demo", "own.txt"), "abc");
    // 工作目录：已退出进程留下的（删），本进程正在用的（留）
    const orphan = path.join(fx.paths.tmpDir, "render-999999999-1", "public");
    const live = path.join(fx.paths.tmpDir, `render-${process.pid}-1`);
    await mkdir(orphan, { recursive: true });
    await writeFile(path.join(orphan, "x.bin"), "12345");
    await mkdir(live, { recursive: true });
    await writeFile(path.join(live, "y.bin"), "keep");

    const report = await cleanLocalCopies(fx.paths, storage);

    assert.deepEqual(report.cache, { removed: [{ key: "assets/aa/a.mp4", bytes: 10 }], kept: [] });
    assert.deepEqual(report.staging, { files: 2, bytes: 3 });
    assert.deepEqual(report.workDirs, { removed: ["render-999999999-1"], bytes: 5 });
    // 硬链接共用的那 10 字节只算一次：暂存区只算独有的 3 字节
    assert.equal(report.freedBytes, 10 + 3 + 5);
    await assert.rejects(stat(fx.paths.publicDir), { code: "ENOENT" });
    await assert.rejects(stat(orphan), { code: "ENOENT" });
    assert.equal(await readFile(path.join(live, "y.bin"), "utf8"), "keep");
  } finally {
    await fx.cleanup();
  }
});

test("clean dryRun 只报告，算出的可腾空间和真删时一样", async () => {
  const fx = await makeRepo();
  try {
    const storage = new S3Storage(SETTINGS, fx.paths.cacheDir, new FakeTransport());
    const src = path.join(fx.root, "a.mp4");
    await writeFile(src, "0123456789");
    await storage.put(src, "assets/aa/a.mp4");
    await mkdir(path.join(fx.paths.publicDir, "demo"), { recursive: true });
    await link(await storage.fetch("assets/aa/a.mp4"), path.join(fx.paths.publicDir, "demo", "clip.mp4"));

    const report = await cleanLocalCopies(fx.paths, storage, { dryRun: true });

    assert.equal(report.freedBytes, 10);
    assert.equal(await readFile(path.join(fx.paths.publicDir, "demo", "clip.mp4"), "utf8"), "0123456789");
    assert.equal(await readFile(await storage.fetch("assets/aa/a.mp4"), "utf8"), "0123456789");
  } finally {
    await fx.cleanup();
  }
});

test("本地后端：暂存区是存储的硬链接，清掉它不碰存储、也不算腾出空间", async () => {
  const fx = await makeRepo();
  try {
    const storage = new LocalStorage(path.join(fx.root, ".kineto", "store"));
    const src = path.join(fx.root, "a.mp4");
    await writeFile(src, "0123456789");
    await storage.put(src, "assets/aa/a.mp4");
    await mkdir(path.join(fx.paths.publicDir, "demo"), { recursive: true });
    await link(await storage.fetch("assets/aa/a.mp4"), path.join(fx.paths.publicDir, "demo", "clip.mp4"));

    const report = await cleanLocalCopies(fx.paths, storage);

    assert.deepEqual(report.staging, { files: 1, bytes: 0 });
    assert.equal(report.freedBytes, 0);
    assert.equal(await readFile(await storage.fetch("assets/aa/a.mp4"), "utf8"), "0123456789");
  } finally {
    await fx.cleanup();
  }
});
