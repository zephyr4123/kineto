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

test("工具配置段的 ${ENV} 延后到运行该工具时才展开：缺某个工具的密钥不拖垮别的命令；存储段照常立即展开", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "kineto.config.yaml"), "tools:\n  tts:\n    secretId: ${KINETO_TEST_MISSING}\n  transcribe: {}\n");
    const loaded = await loadConfig(fx.paths, {});
    assert.deepEqual(Object.keys(loaded.config.tools), ["tts", "transcribe"]);
    assert.throws(() => loaded.expand(loaded.config.tools.tts), { code: "CONFIG_ENV_MISSING" });
    assert.deepEqual(loaded.expand(loaded.config.tools.transcribe), {});
    const withEnv = await loadConfig(fx.paths, { KINETO_TEST_MISSING: "id" });
    assert.deepEqual(withEnv.expand(withEnv.config.tools.tts), { secretId: "id" });

    await writeFile(path.join(fx.root, "kineto.config.yaml"), "storage:\n  local:\n    root: ${KINETO_TEST_MISSING}\n");
    await assert.rejects(loadConfig(fx.paths, {}), { code: "CONFIG_ENV_MISSING" });
  } finally {
    await fx.cleanup();
  }
});

test("存储后端没选 s3 时，留在配置里的 s3 段不展开也不校验：缺它的密钥不拖垮本地用户", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "kineto.config.yaml"), S3_CONFIG.replace("backend: s3", "backend: local"));
    const { config } = await loadConfig(fx.paths, {});
    assert.equal(config.storage.backend, "local");
    assert.equal(config.storage.s3, undefined);
  } finally {
    await fx.cleanup();
  }
});

test("envFile 的边角：空的进程环境变量不覆盖文件里的值；路径里可以写 ${HOME}；读不了报 CONFIG_INVALID", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "creds.env"), "KINETO_TEST_STORE=/from/file\n");
    await writeFile(path.join(fx.root, "kineto.config.yaml"), "envFile: ${KINETO_TEST_DIR}/creds.env\nstorage:\n  local:\n    root: ${KINETO_TEST_STORE}\n");
    const loaded = await loadConfig(fx.paths, { KINETO_TEST_DIR: fx.root, KINETO_TEST_STORE: "" });
    assert.equal(loaded.config.storage.local.root, "/from/file");
    assert.equal(loaded.envFile, path.join(fx.root, "creds.env"));

    const { chmod } = await import("node:fs/promises");
    await chmod(path.join(fx.root, "creds.env"), 0o000);
    await assert.rejects(loadConfig(fx.paths, { KINETO_TEST_DIR: fx.root }), { code: "CONFIG_INVALID" });
    await chmod(path.join(fx.root, "creds.env"), 0o600);
  } finally {
    await fx.cleanup();
  }
});

test("存储后端可以用 ${ENV} 选择；顶层不是映射的 YAML 报 CONFIG_INVALID", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "kineto.config.yaml"), S3_CONFIG.replace("backend: s3", "backend: ${KINETO_TEST_BACKEND}"));
    const { config } = await loadConfig(fx.paths, { KINETO_TEST_BACKEND: "s3", KINETO_TEST_KEY_ID: "id", KINETO_TEST_SECRET: "s" });
    assert.equal(config.storage.backend, "s3");
    assert.equal(config.storage.s3?.bucket, "demo-1250000000");

    await writeFile(path.join(fx.root, "kineto.config.yaml"), "42\n");
    await assert.rejects(loadConfig(fx.paths, {}), { code: "CONFIG_INVALID" });
  } finally {
    await fx.cleanup();
  }
});
