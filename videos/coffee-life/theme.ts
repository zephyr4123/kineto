import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// 得意黑（Smiley Sans，OFL-1.1）：斜切粗体，海报和卡点视频常用；作为资产入库，渲染不依赖外网
export const FONT_DISPLAY = "Smiley Sans";
await loadFont({ family: FONT_DISPLAY, url: staticFile(assets.fontDisplay) });

// 竖版，抖音 / 小红书 / 视频号的标准画幅
export const W = 1080;
export const H = 1920;
export const FPS = 30;

// 咖啡色系：深色底，奶油色字，烘焙橙做强调；生豆阶段用青绿
export const ESPRESSO = "#140b07";
export const CREMA = "#fff1dc";
export const ROAST = "#ff6a1a";
export const EMBER = "#ff3d1f";
export const BEAN_GREEN = "#b9cf6a";

// 烘焙色带：生豆 → 转黄 → 肉桂 → 中烘 → 深烘
export const ROAST_STAGES = [
  { label: "生豆", color: "#9fb35a" },
  { label: "转黄", color: "#d9b44a" },
  { label: "肉桂", color: "#b06a32" },
  { label: "中烘", color: "#6b3a1d" },
  { label: "深烘", color: "#2a160c" },
] as const;
