import { test } from "node:test";
import { createHash } from "node:crypto";
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
  async download(key: string, dest: string): Promise<{ sha256: string | undefined } | null> {
    const o = this.objects.get(key);
    if (!o) return null;
    this.downloads.push(key);
    await writeFile(dest, o.body);
    return { sha256: o.sha256 };
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
      written: true,
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
    const pngSha = createHash("sha256").update("png!").digest("hex");
    fake.objects.set("team/assets/aa/y.png", { body: Buffer.from("png!"), contentType: "image/png", sha256: pngSha });
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

test("源文件与登记的 sha256 对不上时拒绝上传：坏内容不能带着正确的哈希混进共享存储", async () => {
  await withS3(async (store, fake, dir) => {
    const src = path.join(dir, "a.wav");
    await writeFile(src, "HELLO");
    await assert.rejects(store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA }), { code: "STORAGE_SOURCE_CORRUPT" });
    assert.deepEqual(fake.uploads, []);
    await assert.rejects(store.fetch("assets/2c/x.wav"), { code: "STORAGE_OBJECT_MISSING" });
  });
});

test("下载内容与远端记录的 sha256 对不上时报 STORAGE_OBJECT_CORRUPT，不留缓存", async () => {
  await withS3(async (store, fake) => {
    fake.objects.set("team/assets/2c/x.wav", { body: Buffer.from("HELLO"), contentType: "audio/wav", sha256: HELLO_SHA });
    await assert.rejects(store.fetch("assets/2c/x.wav"), { code: "STORAGE_OBJECT_CORRUPT" });
    fake.objects.set("team/assets/2c/x.wav", { body: Buffer.from("hello"), contentType: "audio/wav", sha256: HELLO_SHA });
    assert.equal(await readFile(await store.fetch("assets/2c/x.wav"), "utf8"), "hello");
  });
});

test("put 返回这次是否真的写入；本机缓存被改坏时强制重传（storage push --reupload）能修好它", async () => {
  await withS3(async (store, fake, dir) => {
    const src = path.join(dir, "a.wav");
    await writeFile(src, "hello");
    assert.equal((await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA })).written, true);
    assert.equal((await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA })).written, false);
    // 远端被改坏（大小相同、哈希不同）：重新上传并如实报告
    fake.objects.set("team/assets/2c/x.wav", { body: Buffer.from("HELLO"), contentType: "audio/wav", sha256: "bad" });
    assert.equal((await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA })).written, true);

    const cached = await store.fetch("assets/2c/x.wav");
    const { chmod } = await import("node:fs/promises");
    await chmod(cached, 0o644);
    await writeFile(cached, "HELLO");
    await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA, force: true });
    assert.equal(await readFile(await store.fetch("assets/2c/x.wav"), "utf8"), "hello");
  });
});

test("桶不存在时 GET 报 STORAGE_UNAVAILABLE，而不是当成对象不存在", async () => {
  const { createServer } = await import("node:http");
  const { awsTransport } = await import("./s3.ts");
  const server = createServer((req, res) => {
    res.writeHead(404, { "Content-Type": "application/xml" });
    res.end(req.method === "HEAD" ? undefined : "<?xml version='1.0'?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message></Error>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-s3-nsb-"));
  try {
    const config = {
      endpoint: `http://127.0.0.1:${port}`,
      region: "us-east-1",
      bucket: "nope",
      prefix: "",
      publicUrl: undefined,
      accessKeyId: "id",
      secretAccessKey: "secret",
      forcePathStyle: true,
    };
    const store = new S3Storage(config, path.join(dir, "cache"), awsTransport(config));
    await assert.rejects(store.fetch("assets/aa/x.wav"), { code: "STORAGE_UNAVAILABLE" });
    await assert.rejects(store.probe(), { code: "STORAGE_UNAVAILABLE" });
  } finally {
    server.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("给了登记哈希且远端完好时，put 不读源文件（push 不必把整库读一遍）；--reupload 式的 force 则一定重新上传", async () => {
  await withS3(async (store, fake, dir) => {
    const src = path.join(dir, "a.wav");
    await writeFile(src, "hello");
    await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA });
    // 本地副本已被改坏但大小没变：远端完好就直接判 present，不去读它
    await writeFile(src, "HELLO");
    assert.equal((await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA })).written, false);
    // 强制重传时照样验源文件：坏的不许传
    await assert.rejects(store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA, force: true }), { code: "STORAGE_SOURCE_CORRUPT" });
    await writeFile(src, "hello");
    assert.equal((await store.put(src, "assets/2c/x.wav", { sha256: HELLO_SHA, force: true })).written, true);
    assert.equal(fake.uploads.length, 2);
  });
});
