import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { makeRepo, FIXED_NOW } from "../testing/fixture.ts";
import { LocalStorage } from "../storage/local.ts";
import { assetStorageKey, ingestAsset, readManifest } from "./assets.ts";

// "hello" 的 sha256
const HELLO_SHA = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

test("ingestAsset 登记本地文件：算哈希、存进存储、追加一行 manifest", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "Boop.WAV");
    await writeFile(file, "hello");
    const rec = await ingestAsset(fx.paths, store, {
      source: file,
      license: "CC0-1.0",
      author: "kineto",
      now: FIXED_NOW,
    });
    assert.equal(rec.id, `sha256:${HELLO_SHA}`);
    assert.equal(rec.ext, ".wav");
    assert.equal(rec.bytes, 5);
    assert.equal(assetStorageKey(rec), `assets/2c/${HELLO_SHA}.wav`);
    assert.equal(await store.has(assetStorageKey(rec)), true);
    const manifest = await readManifest(fx.paths);
    assert.deepEqual(manifest.get(rec.id), rec);
  } finally {
    await fx.cleanup();
  }
});

test("ingestAsset 必须带许可证、文件必须有扩展名", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "a.png");
    await writeFile(file, "x");
    await assert.rejects(ingestAsset(fx.paths, store, { source: file, license: " " }), { code: "LICENSE_REQUIRED" });
    const noExt = path.join(fx.root, "noext");
    await writeFile(noExt, "x");
    await assert.rejects(ingestAsset(fx.paths, store, { source: noExt, license: "MIT" }), {
      code: "ASSET_EXT_REQUIRED",
    });
  } finally {
    await fx.cleanup();
  }
});

test("同一文件重复登记：元数据相同不追加，元数据变了追加且后写者生效", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "a.png");
    await writeFile(file, "hello");
    await ingestAsset(fx.paths, store, { source: file, license: "MIT", now: FIXED_NOW });
    await ingestAsset(fx.paths, store, { source: file, license: "MIT", now: FIXED_NOW });
    const { readFile } = await import("node:fs/promises");
    const lines = () => readFile(fx.paths.assetsManifest, "utf8").then((s) => s.trim().split("\n").length);
    assert.equal(await lines(), 1);
    await ingestAsset(fx.paths, store, { source: file, license: "MIT", description: "logo", now: FIXED_NOW });
    assert.equal(await lines(), 2);
    assert.equal((await readManifest(fx.paths)).get(`sha256:${HELLO_SHA}`)?.description, "logo");
  } finally {
    await fx.cleanup();
  }
});

test("readManifest 遇到坏行报 MANIFEST_INVALID 并指出行号", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "a.png");
    await writeFile(file, "hello");
    await ingestAsset(fx.paths, store, { source: file, license: "MIT" });
    await appendFile(fx.paths.assetsManifest, "{not json}\n");
    await assert.rejects(readManifest(fx.paths), (err: { code: string; message: string }) => {
      assert.equal(err.code, "MANIFEST_INVALID");
      assert.match(err.message, /line 2/);
      return true;
    });
  } finally {
    await fx.cleanup();
  }
});

test("ingestAsset 支持 URL：下载后登记，sourceUrl 默认取该 URL", async () => {
  const fx = await makeRepo();
  const server = createServer((_req, res) => res.end("hello"));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/img/pic.png?size=large`;
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const rec = await ingestAsset(fx.paths, store, { source: url, license: "CC-BY-4.0" });
    assert.equal(rec.ext, ".png");
    assert.equal(rec.sourceUrl, url);
    assert.equal(rec.id, `sha256:${HELLO_SHA}`);
  } finally {
    server.close();
    await fx.cleanup();
  }
});

test("同一文件重新登记时没传的字段沿用旧值：只为链接而重新 add 不会抹掉作者与来源", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "p.png");
    await writeFile(file, "hello");
    await ingestAsset(fx.paths, store, {
      source: file,
      license: "CC-BY-4.0",
      author: "Jane Doe",
      sourceUrl: "https://example.com/p",
      now: FIXED_NOW,
    });
    const again = await ingestAsset(fx.paths, store, { source: file, license: "CC-BY-4.0" });
    assert.equal(again.author, "Jane Doe");
    assert.equal(again.sourceUrl, "https://example.com/p");
    const { readFile } = await import("node:fs/promises");
    assert.equal((await readFile(fx.paths.assetsManifest, "utf8")).trim().split("\n").length, 1);
  } finally {
    await fx.cleanup();
  }
});

test("源文件不存在报 ASSET_SOURCE_NOT_FOUND", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    await assert.rejects(ingestAsset(fx.paths, store, { source: path.join(fx.root, "nope.png"), license: "MIT" }), {
      code: "ASSET_SOURCE_NOT_FOUND",
    });
  } finally {
    await fx.cleanup();
  }
});

test("同一内容再次登记：许可证或扩展名不一致直接报错，不悄悄改写已登记的许可", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const png = path.join(fx.root, "p.png");
    await writeFile(png, "hello");
    await ingestAsset(fx.paths, store, { source: png, license: "CC-BY-4.0", author: "Alice" });
    await assert.rejects(ingestAsset(fx.paths, store, { source: png, license: "CC0-1.0" }), { code: "ASSET_LICENSE_CONFLICT" });
    const jpg = path.join(fx.root, "p.jpg");
    await writeFile(jpg, "hello");
    await assert.rejects(ingestAsset(fx.paths, store, { source: jpg, license: "CC-BY-4.0" }), {
      code: "ASSET_EXT_CONFLICT",
      hint: /\.\/kineto asset link sha256:/,
    });
    assert.equal((await readManifest(fx.paths)).get(`sha256:${HELLO_SHA}`)?.license, "CC-BY-4.0");
  } finally {
    await fx.cleanup();
  }
});

test("已存在对象被同尺寸篡改：再次登记时按 sha256 发现并修复，且恢复只读", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "a.png");
    await writeFile(file, "hello");
    const rec = await ingestAsset(fx.paths, store, { source: file, license: "MIT" });
    const stored = await store.fetch(assetStorageKey(rec));
    const { chmod, readFile, stat } = await import("node:fs/promises");
    await chmod(stored, 0o644);
    await writeFile(stored, "HELLO");
    await ingestAsset(fx.paths, store, { source: file, license: "MIT" });
    assert.equal(await readFile(stored, "utf8"), "hello");
    assert.equal((await stat(stored)).mode & 0o222, 0);
  } finally {
    await fx.cleanup();
  }
});

test("updateAsset 显式修正许可证等元数据：追加一行，后写者生效；未知 id 报 ASSET_NOT_FOUND", async () => {
  const fx = await makeRepo();
  try {
    const { updateAsset } = await import("./assets.ts");
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const file = path.join(fx.root, "a.png");
    await writeFile(file, "hello");
    const rec = await ingestAsset(fx.paths, store, { source: file, license: "CC0-1.0", author: "Al" });
    const fixed = await updateAsset(fx.paths, rec.id, { license: "CC-BY-4.0" });
    assert.equal(fixed.license, "CC-BY-4.0");
    assert.equal(fixed.author, "Al");
    assert.equal((await readManifest(fx.paths)).get(rec.id)?.license, "CC-BY-4.0");
    await assert.rejects(updateAsset(fx.paths, "sha256:" + "e".repeat(64), { license: "MIT" }), { code: "ASSET_NOT_FOUND" });
  } finally {
    await fx.cleanup();
  }
});
