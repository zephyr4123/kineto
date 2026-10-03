import { test } from "node:test";
import assert from "node:assert/strict";
import { hasSplitCharacters, phraseCaptions, wantsPhrases } from "./captions.ts";

test("中日韩语言直接按短语出字幕；其他语言先逐词", () => {
  for (const l of ["zh", "ja", "ko", "yue"]) assert.equal(wantsPhrases(l), true);
  for (const l of ["en", "auto", "fr"]) assert.equal(wantsPhrases(l), false);
});

test("逐词结果里有被劈开的字（U+FFFD）就判为不可用", () => {
  assert.equal(hasSplitCharacters([{ text: " hello" }, { text: " world" }]), false);
  assert.equal(hasSplitCharacters([{ text: "通" }, { text: "�" }]), true);
});

test("短语级结果转成 Caption[]：去掉空段与首尾空白，没有逐词时间戳与置信度", () => {
  const captions = phraseCaptions([
    { text: "", offsets: { from: 0, to: 10 } },
    { text: " 网上用AI 做的视频越来越多", offsets: { from: 0, to: 2560 } },
    { text: "但很多人不知道是怎么做出来的 ", offsets: { from: 2560, to: 5640 } },
  ]);
  assert.deepEqual(captions, [
    { text: "网上用AI 做的视频越来越多", startMs: 0, endMs: 2560, timestampMs: null, confidence: null },
    { text: "但很多人不知道是怎么做出来的", startMs: 2560, endMs: 5640, timestampMs: null, confidence: null },
  ]);
});
