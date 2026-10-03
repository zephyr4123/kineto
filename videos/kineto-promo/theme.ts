import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// 三款像素字体都是 OFL-1.1，作为资产入库，渲染不依赖外网：
// 缝合像素（比例）写正文，缝合像素（等宽）写终端，Press Start 2P 写街机大字。画面文字一律英文。
export const FONT_BODY = "Fusion Pixel";
export const FONT_MONO = "Fusion Pixel Mono";
// 字体名以数字开头的单词（2P）在 CSS 里必须加引号，否则整条 font-family 失效、回落成衬线字
export const FONT_ARCADE = '"Press Start 2P"';
await Promise.all([
  loadFont({ family: FONT_BODY, url: staticFile(assets.fontBody) }),
  loadFont({ family: FONT_MONO, url: staticFile(assets.fontMono) }),
  loadFont({ family: "Press Start 2P", url: staticFile(assets.fontArcade) }),
]);

export const W = 1920;
export const H = 1080;
export const FPS = 60;

// Clawd 的官方配色：rgb(215,119,87)
export const CLAWD = "#D77757";
export const INK = "#141019";
export const CREAM = "#FFF3E0";

export const GOLD = "#ffd24a";
export const RED = "#ff4f5e";
