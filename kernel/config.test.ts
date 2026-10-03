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
