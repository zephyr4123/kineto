import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { makeRepo } from "./testing/fixture.ts";
import { loadConfig } from "./config.ts";

test("没有 kineto.config.yaml 时用默认值：本地存储后端", async () => {
  const fx = await makeRepo();
  try {
    const { config, source } = await loadConfig(fx.paths, {});
    assert.equal(source, "defaults");
    assert.equal(config.storage.backend, "local");
    assert.equal(config.storage.local.root, ".kineto/store");
    assert.equal(config.remotion.licenseKey, "free-license");
  } finally {
    await fx.cleanup();
  }
});

test("配置里的 ${ENV} 引用从环境变量展开；缺失时报 CONFIG_ENV_MISSING", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(
      path.join(fx.root, "kineto.config.yaml"),
      "storage:\n  backend: local\n  local:\n    root: ${KINETO_TEST_STORE}\n",
    );
    const { config, source } = await loadConfig(fx.paths, { KINETO_TEST_STORE: "/data/store" });
    assert.equal(source, "kineto.config.yaml");
    assert.equal(config.storage.local.root, "/data/store");
    await assert.rejects(loadConfig(fx.paths, {}), { code: "CONFIG_ENV_MISSING" });
  } finally {
    await fx.cleanup();
  }
});

test("未知的存储后端报 CONFIG_INVALID", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "kineto.config.yaml"), "storage:\n  backend: ftp\n");
    await assert.rejects(loadConfig(fx.paths, {}), { code: "CONFIG_INVALID" });
  } finally {
    await fx.cleanup();
  }
});

test("envFile 指向仓库外的凭据文件：${ENV} 先查进程环境变量、再查这个文件；文件不存在报 CONFIG_INVALID", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "creds.env"), "# 注释\nKINETO_TEST_STORE=/from/file\nKINETO_TEST_OTHER=x\n");
    await writeFile(
      path.join(fx.root, "kineto.config.yaml"),
      "envFile: creds.env\nstorage:\n  local:\n    root: ${KINETO_TEST_STORE}\n",
    );
    const fromFile = await loadConfig(fx.paths, {});
    assert.equal(fromFile.config.storage.local.root, "/from/file");
    assert.equal(fromFile.envFile, path.join(fx.root, "creds.env"));
    // 进程环境变量优先：CI 或临时覆盖不用改文件
    const overridden = await loadConfig(fx.paths, { KINETO_TEST_STORE: "/from/env" });
    assert.equal(overridden.config.storage.local.root, "/from/env");

    await writeFile(path.join(fx.root, "kineto.config.yaml"), "envFile: missing.env\n");
    await assert.rejects(loadConfig(fx.paths, {}), { code: "CONFIG_INVALID" });
  } finally {
    await fx.cleanup();
  }
});

const S3_CONFIG = `storage:
  backend: s3
  s3:
    endpoint: https://cos.ap-shanghai.myqcloud.com
    region: ap-shanghai
    bucket: demo-1250000000
    prefix: team/videos
    publicUrl: https://cdn.example.com/
    accessKeyId: \${KINETO_TEST_KEY_ID}
    secretAccessKey: \${KINETO_TEST_SECRET}
`;

test("s3 后端：密钥从环境变量展开，prefix 与 publicUrl 规整成统一形式", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "kineto.config.yaml"), S3_CONFIG);
    const { config } = await loadConfig(fx.paths, { KINETO_TEST_KEY_ID: "id", KINETO_TEST_SECRET: "secret" });
    assert.equal(config.storage.backend, "s3");
    assert.deepEqual(config.storage.s3, {
      endpoint: "https://cos.ap-shanghai.myqcloud.com",
      region: "ap-shanghai",
      bucket: "demo-1250000000",
      prefix: "team/videos/",
      publicUrl: "https://cdn.example.com",
      accessKeyId: "id",
      secretAccessKey: "secret",
      forcePathStyle: false,
    });
  } finally {
    await fx.cleanup();
  }
});

test("选了 s3 后端却没有 s3 配置段，或 prefix 越界，报 CONFIG_INVALID", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "kineto.config.yaml"), "storage:\n  backend: s3\n");
    await assert.rejects(loadConfig(fx.paths, {}), { code: "CONFIG_INVALID" });
    await writeFile(path.join(fx.root, "kineto.config.yaml"), S3_CONFIG.replace("team/videos", "../escape"));
    await assert.rejects(loadConfig(fx.paths, { KINETO_TEST_KEY_ID: "id", KINETO_TEST_SECRET: "s" }), {
      code: "CONFIG_INVALID",
    });
  } finally {
    await fx.cleanup();
  }
});
