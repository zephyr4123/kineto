import { test } from "node:test";
import assert from "node:assert/strict";
import { pcmToWav, splitText } from "./text.ts";

test("长文本按句切段、每段不超过上限；超长单句再按逗号、最后硬切；拼回去与原文一致", () => {
  assert.deepEqual(splitText("你好。", 150), ["你好。"]);
  const text = "第一句话。第二句话！Third sentence? 第四句；" + "很".repeat(20) + "，" + "长".repeat(20) + "。";
  const parts = splitText(text, 25);
  assert.ok(parts.every((p) => p.length <= 25), JSON.stringify(parts));
  assert.equal(parts.join(""), text);
  // 句子尽量合并（正好 25 字也算放得下），不切成一句一段
  assert.equal(parts[0], "第一句话。第二句话！Third sentence?");
  // 没有任何标点的超长文本硬切
  assert.deepEqual(splitText("啊".repeat(7), 3), ["啊啊啊", "啊啊啊", "啊"]);
  assert.deepEqual(splitText("  \n ", 10), []);
});

test("PCM 拼成标准 44 字节头的 16 位单声道 WAV", () => {
  const pcm = Buffer.from([1, 0, 2, 0, 3, 0]);
  const wav = pcmToWav(pcm, 24000);
  assert.equal(wav.length, 44 + 6);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(4), 36 + 6);
  assert.equal(wav.toString("ascii", 8, 16), "WAVEfmt ");
  assert.equal(wav.readUInt16LE(22), 1); // 单声道
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(28), 48000); // byte rate
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.toString("ascii", 36, 40), "data");
  assert.equal(wav.readUInt32LE(40), 6);
  assert.deepEqual(wav.subarray(44), pcm);
});
