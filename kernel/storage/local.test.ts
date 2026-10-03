import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LocalStorage } from "./local.ts";

async function withStore(fn: (store: LocalStorage, dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-store-"));
  try {
    await fn(new LocalStorage(path.join(dir, "store")), dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("put 把文件存到 key 下，has / fetch 能取回同样内容", async () => {
  await withStore(async (store, dir) => {
    const src = path.join(dir, "a.txt");
    await writeFile(src, "hello");
    const obj = await store.put(src, "assets/ab/abc.txt");
    assert.deepEqual(obj, { backend: "local", key: "assets/ab/abc.txt", url: null });
    assert.equal(await store.has("assets/ab/abc.txt"), true);
    assert.equal(await readFile(await store.fetch("assets/ab/abc.txt"), "utf8"), "hello");
  });
});

test("put 对已存在的 key 幂等：内容寻址的 key 不会被覆盖", async () => {
  await withStore(async (store, dir) => {
    const src = path.join(dir, "a.txt");
    await writeFile(src, "first");
    await store.put(src, "k/x.txt");
    await writeFile(src, "second");
    await store.put(src, "k/x.txt");
    assert.equal(await readFile(await store.fetch("k/x.txt"), "utf8"), "first");
  });
});

test("fetch 不存在的对象报 STORAGE_OBJECT_MISSING；越界 key 报 INVALID_STORAGE_KEY", async () => {
  await withStore(async (store, dir) => {
    await assert.rejects(store.fetch("nope/x.txt"), { code: "STORAGE_OBJECT_MISSING" });
    const src = path.join(dir, "a.txt");
    await writeFile(src, "x");
    await assert.rejects(store.put(src, "../escape.txt"), { code: "INVALID_STORAGE_KEY" });
    await assert.rejects(store.put(src, "/abs.txt"), { code: "INVALID_STORAGE_KEY" });
  });
});
