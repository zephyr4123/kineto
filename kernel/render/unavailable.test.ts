import { test } from "node:test";
import assert from "node:assert/strict";
import { assetsUnavailable } from "./render.ts";

test("渲染时取不到素材：缺失与损坏分开报，损坏的给出能真正修好的命令", () => {
  const missing = assetsUnavailable("demo", [{ video: "demo", alias: "a", key: "assets/aa/x.wav", reason: "missing" }]);
  assert.equal(missing.code, "ASSET_UNAVAILABLE");
  const corrupt = assetsUnavailable("demo", [
    { video: "demo", alias: "a", key: "assets/aa/x.wav", reason: "missing" },
    { video: "demo", alias: "b", key: "assets/bb/y.wav", reason: "corrupt" },
  ]);
  assert.equal(corrupt.code, "STORAGE_OBJECT_CORRUPT");
  assert.match(corrupt.message, /"b"/);
  // 缺失的也一并报出来，不等修好损坏的再冒出来
  assert.match(corrupt.message, /missing: a/);
  assert.match(corrupt.hint ?? "", /--reupload/);
});
