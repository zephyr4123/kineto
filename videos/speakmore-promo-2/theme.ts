import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { inOutQuint, outExpo, outQuint } from "../../engine/motion";
import { assets } from "./assets.gen";

// SpeakMore 第二支宣传片：发布会的调子，冷静、克制，节奏比第一支快。底是真桌面（海上日落）退后虚暗，
// 字是主角；颜色只从那方印里取，朱砂点睛。字幕一律短词短句、书面语，不带人称。

export const SANS = "Noto Sans SC";
export const SERIF = "Noto Serif SC";
export const MONO = "JetBrains Mono";
await loadFont({ family: SANS, url: staticFile(assets.fontSans), weight: "100 900" });
await loadFont({ family: SERIF, url: staticFile(assets.fontSerif), weight: "200 900" });
await loadFont({ family: MONO, url: staticFile(assets.fontMono), weight: "100 800" });

export const W = 1920;
export const H = 1080;
export const FPS = 60;

// 配乐 SF阿睿《冬与你（纯音乐）》：137.2 拍/分，第一拍在 0.205 秒（整首测下来相位不漂）。
// 16 拍一句（约 7 秒）：前 7 秒是前奏，7.2 秒起底鼓进来，14.2、56.2、98.2 秒是副歌，112.2–119.2 秒收住，119.2 秒重新起。
export const BEAT = (60 / 137.2) * FPS;
const BEAT0 = 0.205 * FPS;
/** 成片里第 k 拍的那一帧 */
export const beat = (k: number) => Math.round(BEAT0 + k * BEAT);
/** 场景里第 k 拍（场景从拍点上起，所以从 0 数） */
export const b = (k: number) => Math.round(k * BEAT);

export const COLOR = {
  canvas: "oklch(0.13 0.008 255)",
  ink: "oklch(0.97 0.004 255)",
  ink2: "oklch(0.8 0.018 255)",
  faint: "oklch(0.64 0.016 255)",
  line: "oklch(1 0 0 / 0.14)",
  glass: "oklch(0.2 0.012 255 / 0.62)",
  // 朱砂：模型添的字、此刻在走的那一段
  cinnabar: "oklch(0.74 0.17 32)",
  // 深底上的靛青（官网深色段的 --color-seal）：本机这一侧
  seal: "oklch(0.8 0.07 255)",
  green: "oklch(0.8 0.15 150)",
  // 浅色的页面和窗口：和官网一致
  paper: "oklch(0.99 0.002 255)",
  paperInk: "oklch(0.21 0.02 255)",
  paperInk2: "oklch(0.45 0.02 255)",
  paperLine: "oklch(0.9 0.008 255)",
  paperSurface: "oklch(0.962 0.006 255)",
} as const;

export const EASE = { outExpo, outQuint, inOut: inOutQuint } as const;

// 字压在虚化的桌面上时，靠一层很淡的影子托住
export const SHADOW = "0 2px 16px oklch(0 0 0 / 0.4)";

export const MONO_STACK = `"${MONO}", "${SANS}", monospace`;
