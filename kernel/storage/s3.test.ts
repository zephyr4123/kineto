import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { S3Storage, type ObjectHead, type S3Transport } from "./s3.ts";

// 内存里的假对象存储：记下每次上传 / 下载，断言缓存与幂等行为
class FakeTransport implements S3Transport {
  objects = new Map<string, { body: Buffer; contentType: string; sha256: string }>();
  uploads: string[] = [];
  downloads: string[] = [];
  async head(key: string): Promise<ObjectHead | null> {
    const o = this.objects.get(key);
    return o ? { size: o.body.length, sha256: o.sha256 } : null;
  }
  async download(key: string, dest: string): Promise<boolean> {
    const o = this.objects.get(key);
    if (!o) return false;
    this.downloads.push(key);
    await writeFile(dest, o.body);
    return true;
  }
  async upload(file: string, key: string, meta: { contentType: string; sha256: string }): Promise<void> {
    this.uploads.push(key);
    this.objects.set(key, { body: await readFile(file), ...meta });
  }
  async probe(): Promise<void> {}
}

const SETTINGS = {
  endpoint: "https://cos.ap-shanghai.myqcloud.com",
  region: "ap-shanghai",
  bucket: "demo-1250000000",
  prefix: "team/",
  publicUrl: "https://cdn.example.com",
};
const HELLO_SHA = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

async function withS3(
  fn: (store: S3Storage, fake: FakeTransport, dir: string) => Promise<void>,
  settings: ConstructorParameters<typeof S3Storage>[0] = SETTINGS,
) {
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-s3-"));
  const fake = new FakeTransport();
  try {
    await fn(new S3Storage(settings, path.join(dir, "cache"), fake), fake, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("put 带前缀上传、按扩展名设 Content-Type、记下 sha256；返回公开 URL", async () => {
  await withS3(async (store, fake, dir) => {
    const src = path.join(dir, "a.mp4");
    await writeFile(src, "hello");
    const obj = await store.put(src, "renders/demo/demo-abc.mp4");
    assert.deepEqual(obj, {
      backend: "s3",
      key: "renders/demo/demo-abc.mp4",
      url: "https://cdn.example.com/team/renders/demo/demo-abc.mp4",
    });
    assert.deepEqual(fake.uploads, ["team/renders/demo/demo-abc.mp4"]);
    const stored = fake.objects.get("team/renders/demo/demo-abc.mp4");
    assert.equal(stored?.contentType, "video/mp4");
    assert.equal(stored?.sha256, HELLO_SHA);
    assert.equal(await store.size("renders/demo/demo-abc.mp4"), 5);
  });
});

test("没配 publicUrl 时 url 为 null", async () => {
  await withS3(
    async (store, _fake, dir) => {
      const src = path.join(dir, "a.wav");
      await writeFile(src, "hello");
      assert.equal((await store.put(src, "assets/2c/x.wav")).url, null);
    },
    { ...SETTINGS, publicUrl: undefined },
  );
});

test("远端已有同大小同哈希的对象时 put 不重复上传；哈希对不上（被改坏）时重新上传", async () => {
  await withS3(async (store, fake, dir) => {
    const src = path.join(dir, "a.wav");
    await writeFile(src, "hello");
    await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA });
    await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA });
    assert.equal(fake.uploads.length, 1);
    fake.objects.set("team/assets/2c/x.wav", { body: Buffer.from("HELLO"), contentType: "audio/wav", sha256: "bad" });
    await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA });
    assert.equal(fake.uploads.length, 2);
    assert.equal(fake.objects.get("team/assets/2c/x.wav")?.body.toString(), "hello");
  });
});

test("fetch 下载进本机缓存只下一次，缓存文件只读；put 过的对象直接命中缓存不下载", async () => {
  await withS3(async (store, fake, dir) => {
    fake.objects.set("team/assets/aa/y.png", { body: Buffer.from("png!"), contentType: "image/png", sha256: "s" });
    const first = await store.fetch("assets/aa/y.png");
    const second = await store.fetch("assets/aa/y.png");
    assert.equal(first, second);
    assert.equal(await readFile(first, "utf8"), "png!");
    assert.deepEqual(fake.downloads, ["team/assets/aa/y.png"]);
    assert.equal((await stat(first)).mode & 0o222, 0);

    const src = path.join(dir, "z.wav");
    await writeFile(src, "hello");
    await store.put(src, "assets/2c/z.wav");
    assert.equal(await readFile(await store.fetch("assets/2c/z.wav"), "utf8"), "hello");
    assert.deepEqual(fake.downloads, ["team/assets/aa/y.png"]);
    // 缓存是独立副本：源文件的权限不受影响
    assert.notEqual((await stat(src)).mode & 0o200, 0);
  });
});

test("对象不存在：fetch 报 STORAGE_OBJECT_MISSING、size 为 null；越界 key 报 INVALID_STORAGE_KEY", async () => {
  await withS3(async (store, _fake, dir) => {
    await assert.rejects(store.fetch("assets/no/pe.wav"), { code: "STORAGE_OBJECT_MISSING" });
    assert.equal(await store.size("assets/no/pe.wav"), null);
    assert.equal(await store.has("assets/no/pe.wav"), false);
    const src = path.join(dir, "a.wav");
    await writeFile(src, "x");
    await assert.rejects(store.put(src, "../escape.wav"), { code: "INVALID_STORAGE_KEY" });
    await assert.rejects(store.fetch("/abs.wav"), { code: "INVALID_STORAGE_KEY" });
  });
});

test("describe 不含密钥", async () => {
  await withS3(async (store) => {
    const info = store.describe();
    assert.equal(info.backend, "s3");
    assert.equal(info.bucket, "demo-1250000000");
    assert.ok(!JSON.stringify(info).includes("secret"));
  });
});
