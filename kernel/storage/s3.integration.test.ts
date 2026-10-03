// 对着真实的 S3 兼容服务跑一遍传输层（SDK 适配、错误翻译）。没配环境变量就跳过，CI 默认不跑：
//   KINETO_TEST_S3_ENDPOINT / _REGION / _BUCKET / _ACCESS_KEY_ID / _SECRET_ACCESS_KEY
// 只写一个内容固定的小对象，重复跑不会在桶里越积越多（测试用的 key 也不需要删除权限）。
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { awsTransport, S3Storage } from "./s3.ts";

const env = process.env;
const ready = ["ENDPOINT", "REGION", "BUCKET", "ACCESS_KEY_ID", "SECRET_ACCESS_KEY"].every((k) => env[`KINETO_TEST_S3_${k}`]);

test("真实 S3：put / size / fetch 往返，缺失对象返回 null 与 STORAGE_OBJECT_MISSING", { skip: !ready && "KINETO_TEST_S3_* not set" }, async () => {
  const config = {
    endpoint: env.KINETO_TEST_S3_ENDPOINT!,
    region: env.KINETO_TEST_S3_REGION!,
    bucket: env.KINETO_TEST_S3_BUCKET!,
    prefix: "_kineto-test/",
    publicUrl: undefined,
    accessKeyId: env.KINETO_TEST_S3_ACCESS_KEY_ID!,
    secretAccessKey: env.KINETO_TEST_S3_SECRET_ACCESS_KEY!,
    forcePathStyle: false,
  };
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-s3-it-"));
  try {
    const store = new S3Storage(config, path.join(dir, "cache"), awsTransport(config));
    await store.probe();
    const src = path.join(dir, "hello.txt");
    await writeFile(src, "hello from kineto\n");
    await store.put(src, "roundtrip/hello.txt");
    assert.equal(await store.size("roundtrip/hello.txt"), 18);
    // 换一个空缓存，逼它真的去下载
    const fresh = new S3Storage(config, path.join(dir, "cache2"), awsTransport(config));
    assert.equal(await readFile(await fresh.fetch("roundtrip/hello.txt"), "utf8"), "hello from kineto\n");
    assert.equal(await store.size("roundtrip/does-not-exist.txt"), null);
    await assert.rejects(fresh.fetch("roundtrip/does-not-exist.txt"), { code: "STORAGE_OBJECT_MISSING" });

    const denied = new S3Storage(config, path.join(dir, "cache3"), awsTransport({ ...config, secretAccessKey: "wrong" }));
    await assert.rejects(denied.probe(), { code: "STORAGE_ACCESS_DENIED" });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
