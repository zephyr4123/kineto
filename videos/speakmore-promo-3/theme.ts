import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { inOutQuint, outExpo, outQuint } from "../../engine/motion";
import { assets } from "./assets.gen";

// SpeakMore 第三支：淡雾浅底，字是主角，界面斜放成悬浮的玻璃板；镜头一直在动，大转折踩在音乐的段落交界上。
// 颜色只取印里的靛青和朱砂，朱砂点睛。字幕书面语、不带人称；品牌只写 SpeakMore。

export const SANS = "Noto Sans SC";
export const MONO = "JetBrains Mono";
await loadFont({ family: SANS, url: staticFile(assets.fontSans), weight: "100 900" });
await loadFont({ family: MONO, url: staticFile(assets.fontMono), weight: "100 800" });

export const W = 1920;
export const H = 1080;
export const FPS = 60;

// 配乐：Midnight Riot《That New Thing》，参考片（Gemini 发布片）用的就是这首。150 拍/分整，一拍 24 帧，第一拍在 0.4225 秒。
// 原曲第 129–131 拍（52.0–53.2 秒）低音抽空，第 132 拍（53.22 秒）砸下、人声进——参考片 14.5 秒那一下就是它。
// 冒烟片从原曲第 122 拍起放，片子第 0 帧在拍上，砸下落在第 10 拍（第 4 秒）。
const BPM = 150;
const SONG_BEAT0 = 0.4225;
const START_BEAT = 122;
export const BEAT = (60 / BPM) * FPS;
/** 片子里第 n 拍的那一帧（第 0 拍是第 0 帧） */
export const b = (n: number) => Math.round(n * BEAT);
/** 片子第 0 帧对应原曲的哪一帧（Audio 的 trimBefore） */
export const SONG_FROM = Math.round((SONG_BEAT0 + (START_BEAT * 60) / BPM) * FPS);

export const COLOR = {
  // 底：近白，往靛青偏一点点（官网浅色的 canvas）
  paper: "oklch(0.985 0.004 255)",
  ink: "oklch(0.21 0.02 255)",
  ink2: "oklch(0.45 0.02 255)",
  faint: "oklch(0.62 0.02 255)",
  line: "oklch(0.88 0.008 255)",
  cinnabar: "oklch(0.55 0.17 33)",
  // 雾里的三团光：极淡，只给底一点呼吸
  fogIndigo: "oklch(0.9 0.04 262)",
  fogCinnabar: "oklch(0.935 0.03 32)",
  fogLilac: "oklch(0.925 0.03 300)",
  // 终端：深色窗口，浮在浅底上
  term: "oklch(0.19 0.01 255)",
  termBar: "oklch(0.235 0.01 255)",
  termInk: "oklch(0.84 0.01 255)",
  termBright: "oklch(0.97 0.003 255)",
  termDim: "oklch(0.58 0.012 255)",
  termSelect: "oklch(0.5 0.12 258 / 0.62)",
  // 划词卡片：App 默认主题"墨"的浅色
  card: "oklch(1 0 0)",
  cardInk: "oklch(0.2 0 0)",
  cardInk2: "oklch(0.46 0 0)",
  cardLine: "oklch(0.9 0 0)",
  cardFill: "oklch(0.2 0 0 / 0.06)",
} as const;

export const EASE = { outExpo, outQuint, inOut: inOutQuint } as const;
