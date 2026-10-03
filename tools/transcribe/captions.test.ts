import { test } from "node:test";
import assert from "node:assert/strict";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { hasSplitCharacters, needsPhrases, phraseCaptions, wantsPhrases } from "./captions.ts";

test("中日韩语言按短语出字幕；其他语言先逐词", () => {
  for (const l of ["zh", "ja", "ko", "yue"]) assert.equal(wantsPhrases(l), true);
  for (const l of ["en", "auto", "fr"]) assert.equal(wantsPhrases(l), false);
});

test("逐词结果里有被劈开的字（U+FFFD）就判为不可用", () => {
  assert.equal(hasSplitCharacters([{ text: " hello" }, { text: " world" }]), false);
  assert.equal(hasSplitCharacters([{ text: "通" }, { text: "�" }]), true);
});

test("要不要按短语重转：请求的或识别出的语言是中日韩，或逐词结果里有劈坏的字", () => {
  assert.equal(needsPhrases("auto", "zh", [{ text: "你好" }]), true);
  assert.equal(needsPhrases("zh", "zh", []), true);
  assert.equal(needsPhrases("auto", "en", [{ text: " hi" }]), false);
  assert.equal(needsPhrases("auto", "en", [{ text: "�" }]), true);
});

test("短语级结果转成 Caption[]：只去掉第一条开头的空白（与官方 toCaptions 一致），每条后面分页", () => {
  const captions = phraseCaptions([
    { text: "", offsets: { from: 0, to: 10 } },
    { text: " Hello there.", offsets: { from: 0, to: 1200 } },
    { text: " How are you?", offsets: { from: 1200, to: 2400 } },
  ]);
  assert.deepEqual(captions, [
    { text: "Hello there.", startMs: 0, endMs: 1200, timestampMs: null, confidence: null, pageBreakAfter: true },
    { text: " How are you?", startMs: 1200, endMs: 2400, timestampMs: null, confidence: null, pageBreakAfter: true },
  ]);
});

test("交给 createTikTokStyleCaptions 时一个短语一页（中文没有空格也一样）", () => {
  const zh = phraseCaptions([
    { text: "网上用AI做的视频越来越多", offsets: { from: 0, to: 2600 } },
    { text: "但很多人不知道是怎么做出来的", offsets: { from: 2600, to: 5680 } },
  ]);
  const { pages } = createTikTokStyleCaptions({ captions: zh, combineTokensWithinMilliseconds: 3000 });
  assert.deepEqual(pages.map((p) => p.text), ["网上用AI做的视频越来越多", "但很多人不知道是怎么做出来的"]);
});
