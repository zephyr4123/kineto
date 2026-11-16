import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// Snug 三屏实录演示：竖屏 1080×1920、60 帧，101.8 秒。
// 画面是主人 11-15 用 OBS 同一时间线录下的三块屏原画（MacBook 内建屏、外接 4K 屏、Snug 手机屏），
// 只剪、加速、推近、加字幕和标注，不改画面里发生的事。
// 结构不分章：先亮出 Snug 和 slogan（Snug 是什么），三台设备落位、逐块标明是哪块屏，讲一句屏幕数量不限，然后顺着真实使用的过程一路走完 ——
// 新建窗口、Claude 开工、单指翻看、两屏联动、网页铺满、一键还原、搜索直开、键盘对话、连点退出、机型自选 —— 最后在 GitHub 上点亮 Star。

export const W = 1080;
export const H = 1920;
export const FPS = 60;

// 字：中文标题用思源宋体（粗），英文 slogan 用 Bricolage Grotesque，日志行和角标用 JetBrains Mono，界面小字落到苹方
export const SERIF = `"Noto Serif SC", "Songti SC", serif`;
export const DISPLAY = `"Bricolage Grotesque", system-ui, sans-serif`;
export const MONO = `"JetBrains Mono", "PingFang SC", monospace`;
export const SANS = `"PingFang SC", system-ui, sans-serif`;
await Promise.all([
  loadFont({ family: "Noto Serif SC", url: staticFile(assets.fontSerif), weight: "200 900" }),
  loadFont({ family: "Bricolage Grotesque", url: staticFile(assets.fontDisplay), weight: "200 800" }),
  loadFont({ family: "JetBrains Mono", url: staticFile(assets.fontMono), weight: "100 800" }),
]);

// 配乐：ADTurnUp《purple sky》（SpeakMore 第一支宣传片那首），66 拍/分，一小节 3.6358 秒（按低音起音逐拍量，35 小节漂移不到 10 ms）。
// 整首是两轮一样的结构，每轮 16 小节：8 小节轻的主歌 + 8 小节饱满段；第二轮主歌和第一轮相似度 0.99，第 19 小节起鼓回来。
// 片子从歌的第 7 小节（27.738 秒）起放：这一小节后两拍收住、没有低音，正好垫在字标下面；
// 第一轮饱满段（第 8 小节）的头一拍落在三台设备落位的那一下。不剪歌，一直放到第 35 小节头（歌的 129.54 秒）——
// 歌在 130.4 秒是硬停，所以片尾停在小节头上、最后 2.7 秒随画面淡出。
// 片子第 k 小节 = 歌的第 k + 7 小节：1–9 饱满，9–12 第二轮主歌（安静），12 起鼓回来，17–24 饱满，24 收尾一小节，25 起没有低音的尾声。
export const BAR = 3.6358;
export const MUSIC_FROM = 31.3734 - BAR;
/** 片子第 k 小节头（可带小数）是第几秒 */
export const bar = (k: number) => k * BAR;

/** 秒 → 帧 */
export const sec = (s: number) => Math.round(s * FPS);

// 段落的起点：两屏联动那一下（Claude 飞回外接屏，素材 57.2 秒）正好踩在鼓回来的第 12 小节上；
// 落版在收尾那一小节的中间进来，点亮 Star 落在尾声的第 26 小节
export const ACTS = {
  hook: 0,
  create: bar(2.5),
  swap: bar(12) - (57.2 - 53),
  apps: bar(16),
  model: bar(22),
  outro: bar(24.5),
  end: bar(28),
} as const;

// 配色：浅色、低饱和，每段一种「影棚」底色（上浅下略深），深色只在转场那一下出现。
// 字只用 ink / ink2，压在所有底上都过 4.5:1。
export const C = {
  ink: "#141821",
  ink2: "#4a5367",
  mute: "#7a8296",
  blue: "#2f6bff",
  red: "#ff453a",
  dark: "#0c1122",
} as const;

export type Palette = { top: string; mid: string; floor: string; glow: string; shape: string };
export const PAL = {
  hook: { top: "#f3f6fb", mid: "#eef2f8", floor: "#e1e7f1", glow: "#ffffff", shape: "#c9dafc" },
  create: { top: "#f2f7f3", mid: "#ecf3ee", floor: "#dde8e0", glow: "#ffffff", shape: "#c4e3cf" },
  claude: { top: "#fbf5ef", mid: "#f7eee5", floor: "#ecdfd2", glow: "#fffaf5", shape: "#f3cdb2" },
  read: { top: "#fbf8ee", mid: "#f6f1e1", floor: "#ebe3cc", glow: "#fffdf6", shape: "#efd99a" },
  swap: { top: "#f5f3fb", mid: "#efecf8", floor: "#e1dcf0", glow: "#ffffff", shape: "#d3c8f5" },
  safari: { top: "#f1f6fb", mid: "#eaf1f9", floor: "#dae5f1", glow: "#ffffff", shape: "#bcd7f3" },
  restore: { top: "#fbf3f5", mid: "#f7ecef", floor: "#ecdde2", glow: "#ffffff", shape: "#f1c8d4" },
  search: { top: "#f0f7f6", mid: "#e9f3f2", floor: "#d8e8e6", glow: "#ffffff", shape: "#b5e1da" },
  chat: { top: "#f4f7f0", mid: "#eef3e8", floor: "#e0e8d6", glow: "#ffffff", shape: "#d0e6bd" },
  quit: { top: "#fbf6ee", mid: "#f6efe3", floor: "#ebe1cf", glow: "#fffdf8", shape: "#f0d6ae" },
  model: { top: "#f3f4fb", mid: "#eceef8", floor: "#dde0f0", glow: "#ffffff", shape: "#cad0f6" },
  outro: { top: "#f3f6fb", mid: "#edf2f9", floor: "#dee6f2", glow: "#ffffff", shape: "#c3d6fb" },
} satisfies Record<string, Palette>;

export const SLOGAN = "Make UU Remote Native on iPhone";
export const TAGLINE = "让 UU远程 在 iPhone 上更好用";
export const REPO_URL = "github.com/zephyr4123/snug";
/** 和 snug-promo 落版同一句致谢 */
export const CREDIT = "承接自 aoyamashou/UUyc-companion · 谨向 UU远程 致谢";
