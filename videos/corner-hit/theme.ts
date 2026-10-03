import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// 站酷快乐体（OFL-1.1）作为资产入库：渲染只读一个本地文件，不依赖外网，来源与许可证可追溯
export const fontFamily = "ZCOOL KuaiLe";
await loadFont({ family: fontFamily, url: staticFile(assets.font) });

export const BACKGROUND = "#0d0d12";
export const PALETTE = ["#FF5D5D", "#FFB547", "#FFE45E", "#5DFFA0", "#5DC8FF", "#B57BFF"];
export const GOLD = "#FFD24A";
