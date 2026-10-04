import { assets } from "./assets.gen";

// 每句旁白的音频（与 script.ts 的 LINES 一一对应），由 `./kineto tool tts` 合成入库：
// 腾讯云「云大围」磁性男声（402002），语速 -0.5（约 0.9 倍），24kHz。每段前后各带约 0.33 秒静音。
// 某句还没合成时留 undefined，时间线按语速估算，只用于预览排版。
export const VOICE: readonly (string | undefined)[] = [
  assets.vo01,
  assets.vo02,
  assets.vo03,
  assets.vo04,
  assets.vo05,
  assets.vo06,
  assets.vo07,
  assets.vo08,
  assets.vo09,
  assets.vo10,
  assets.vo11,
  assets.vo12,
  assets.vo13,
  assets.vo14,
  assets.vo15,
  assets.vo16,
  assets.vo17,
  assets.vo18,
];
