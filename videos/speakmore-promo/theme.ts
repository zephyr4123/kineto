import { loadFont } from "@remotion/fonts";
import { Easing } from "remotion";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// SpeakMore 的宣传片：发布会的调子，冷静、克制。近黑的底，字是主角，颜色只从 App 图标那方印里取。
// 不用合成人声：口述的过程用字幕表现，声音只有低频铺底和三处音效。

// 思源黑体排正文和口述，思源宋体排口号；都是 OFL-1.1 的可变字重，作为资产入库，渲染不依赖外网
export const SANS = "Noto Sans SC";
export const SERIF = "Noto Serif SC";
// 终端里的字用 JetBrains Mono（OFL-1.1）；中文落到思源黑体上
export const MONO = "JetBrains Mono";
await loadFont({ family: SANS, url: staticFile(assets.fontSans), weight: "100 900" });
await loadFont({ family: SERIF, url: staticFile(assets.fontSerif), weight: "200 900" });
await loadFont({ family: MONO, url: staticFile(assets.fontMono), weight: "100 800" });

export const W = 1920;
export const H = 1080;
export const FPS = 60;

// 颜色和官网固定深色那一段（website/src/styles.css 的 .tone-ink）一致；印章的几种颜色取自 assets/icon.svg
export const COLOR = {
  canvas: "oklch(0.13 0.008 255)",
  ink: "oklch(0.97 0.004 255)",
  // 还没整理的口述：压暗，读得出来但不抢
  spoken: "oklch(0.74 0.012 255)",
  muted: "oklch(0.72 0.016 255)",
  // 朱砂：模型添上的字先用它亮一下
  cinnabar: "oklch(0.74 0.17 32)",
  sealIndigo: "#29486f",
  sealPaper: "#f7f4ed",
  sealCinnabar: "#c7563c",
  sealOchre: "#d69d43",
} as const;

// 桌面上的窗口：浅色的偏一点暖，和截下来的官网（浅色）放在一起不打架；终端是深色
export const WINDOW = {
  paper: "oklch(0.995 0.002 80)",
  bar: "oklch(0.965 0.004 80)",
  line: "oklch(0.9 0.006 80)",
  text: "oklch(0.25 0.01 255)",
  faint: "oklch(0.55 0.012 255)",
  term: "oklch(0.17 0.006 255)",
  termBar: "oklch(0.22 0.006 255)",
  termText: "oklch(0.9 0.006 255)",
  termFaint: "oklch(0.62 0.012 255)",
  termGreen: "oklch(0.78 0.15 150)",
} as const;

// 字压在没怎么虚化的桌面上时，靠一层很淡的影子托住，读得清
export const SHADOW = "0 2px 14px oklch(0 0 0 / 0.38)";

// 先快后慢、不回弹（官网用的同一组曲线）；字在画面里挪位置用两头缓的那条
export const EASE = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  outQuint: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.7, 0, 0.2, 1),
} as const;
