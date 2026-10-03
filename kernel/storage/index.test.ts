import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRepo } from "../testing/fixture.ts";
import { createStorage } from "./index.ts";

test("存储根目录落在会被整体重建的 .kineto/public 或 .kineto/tmp 里时报 CONFIG_INVALID", async () => {
  const fx = await makeRepo();
  try {
    const config = (root: string) => ({ storage: { backend: "local" as const, local: { root } }, remotion: { licenseKey: "free-license" } });
    assert.throws(() => createStorage(config(".kineto/public/store"), fx.paths), { code: "CONFIG_INVALID" });
    assert.throws(() => createStorage(config(".kineto/tmp"), fx.paths), { code: "CONFIG_INVALID" });
    assert.equal(createStorage(config(".kineto/store"), fx.paths).name, "local");
  } finally {
    await fx.cleanup();
  }
});
