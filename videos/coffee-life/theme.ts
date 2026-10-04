import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// 一本会动的咖啡画册：米白纸面，代码画的几何扁平插画，宋体排字，节奏慢。
// 思源宋体（Noto Serif SC，OFL-1.1）可变字重，一个文件覆盖 200~900，作为资产入库，渲染不依赖外网
export const SERIF = "Noto Serif SC";
await loadFont({
  family: SERIF,
  url: staticFile(assets.fontSerif),
  weight: "200 900",
});

// 竖版，抖音 / 小红书 / 视频号的标准画幅
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const PAPER = "#f1eadf";
export const INK = "#2b231d";
export const MUTED = "#8c7d6e";
export const HAIRLINE = "rgba(43, 35, 29, 0.28)";
// 点睛色：熟透的咖啡樱桃那种暗红
export const CHERRY = "#9e3b2b";

// 插画用色：少而统一，全部取自咖啡本身（果实、叶子、豆子在各阶段的颜色）
export const ART = {
  ripe: "#b8402f",
  ripeDark: "#8a2a1f",
  ripeLight: "#e07a62",
  unripe: "#93ad54",
  turning: "#e0b24c",
  orange: "#d77b34",
  overripe: "#5e2a22",
  leaf: "#4d7350",
  leafDark: "#355a3c",
  branch: "#6b4f3a",
  pulp: "#f2d993",
  parchment: "#ecdcb8",
  greenBean: "#b9bf86",
  greenBeanDark: "#959b62",
  yellowBean: "#d8b66e",
  brownBean: "#7c4a2b",
  darkBean: "#3e2618",
  coffee: "#4a2c1d",
  crema: "#c8935c",
  cup: "#fbf7f0",
  steel: "#a9b0b2",
  steelDark: "#727b7e",
  burlap: "#caa978",
  burlapDark: "#a8875a",
  sea: "#7fa3ad",
  seaDark: "#5d8592",
  sun: "#e9a943",
  water: "#9cc3cf",
  shadow: "rgba(43, 35, 29, 0.12)",
} as const;

// 版心：左右各留 72px。插画画在中间的舞台上，舞台下方的纸面放字幕；
// 抖音等平台顶部约 200px、底部约 400px、右侧约 150px 会被界面盖住，正文都放在这之内
export const MARGIN = 72;
export const HEADER_Y = 214;
export const STAGE = { x: MARGIN, y: 300, w: W - 2 * MARGIN, h: 930 } as const;
export const CAPTION_Y = 1290;
