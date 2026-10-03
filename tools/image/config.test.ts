import { test } from "node:test";
import assert from "node:assert/strict";
import tool from "./index.ts";

test("配置里的尺寸写错是配置错误（schema 校验失败），不是运行时的参数错误", () => {
  assert.equal(tool.config.safeParse({ apiKey: "k", size: "1920x1080" }).success, false);
  assert.equal(tool.config.safeParse({ apiKey: "k", size: "1280x720" }).success, true);
});
