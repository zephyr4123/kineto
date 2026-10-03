import { test } from "node:test";
import assert from "node:assert/strict";
import { compositionOwner, scanCompositionIds } from "./compositions.ts";

test("compositionOwner 取最长匹配的视频 id：w-x-intro 属于 w-x 而不是 w", () => {
  assert.equal(compositionOwner("w-x-intro", ["w", "w-x"]), "w-x");
  assert.equal(compositionOwner("w-intro", ["w", "w-x"]), "w");
  assert.equal(compositionOwner("w", ["w", "w-x"]), "w");
  assert.equal(compositionOwner("other", ["w"]), undefined);
});

test("scanCompositionIds 容忍等号两边的空白，非字面量返回 null", () => {
  assert.deepEqual(scanCompositionIds('<C id = "a" /><C id={x} /><C id=\'b\' />'), ["a", null, "b"]);
});
