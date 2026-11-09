import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// SpeakMore 第四支：上线一个月的回顾。数字卡开场（真实的抖音播放、GitHub 星标），再用真截图把产品重新讲一遍，
// 社区一段收尾、致谢名单落版。一张卡一种底色，颜色全取自 App 图标（靛青、朱砂、赭黄、米白），压低彩度让四种底能放在一支片子里。
// 字幕是书面语、短句、不带人称、不带点号；APP 大写；品牌字写小写的 speakmore。

export const ZH = "Smiley Sans"; // 得意黑：标题。斜切的笔画和图标刻痕的斜口是一路
export const NUM = "Bricolage Grotesque"; // 大数字与品牌字
export const SANS = "Noto Sans SC"; // 小字
await loadFont({ family: ZH, url: staticFile(assets.fontZh) });
await loadFont({ family: NUM, url: staticFile(assets.fontNum), weight: "200 800" });
await loadFont({ family: SANS, url: staticFile(assets.fontSans), weight: "100 900" });

export const W = 1920;
export const H = 1080;
export const FPS = 60;

// 配乐：秋成《We Never（若如初见）Vibe 氛围版》，只用开头到 85.54 秒（用户说这一段是精髓）。
// 实测约 112.8 拍/分，第 0 拍在 0.44 秒。第 32 拍（17.46 秒）鼓进来；之后每 16 拍有两拍低音抽掉，
// 第 44、60、76……156 拍重新进来，转场就放在抽空的两拍里、落在重新进来的那一拍上；第 160 拍（85.54 秒）这一段结束。
const BEAT0 = 0.44;
const BEAT_SEC = 0.531865;
/** 第 n 拍是第几帧 */
export const b = (n: number) => Math.round((BEAT0 + n * BEAT_SEC) * FPS);
export const BEAT = BEAT_SEC * FPS;
/** 转场用两拍：新卡片从这时开始升起，两拍后铺满 */
export const LAND = b(2) - b(0);
/** 音乐停在第 160 拍，之后静音落版 */
export const MUSIC_END = b(160);
export const VIDEO_FRAMES = Math.round(88.4 * FPS);

/** 四种底：同一套明度、彩度压低到 0.1 上下，靠色相区分；每种底一深一浅铺成斜向渐变 */
export const TONE = {
  night: {
    from: "oklch(0.375 0.058 255)",
    to: "oklch(0.235 0.045 262)",
    glow: "oklch(0.56 0.075 248 / 0.5)",
    ink: "oklch(0.965 0.012 85)",
    ink2: "oklch(0.8 0.025 255)",
    accent: "oklch(0.83 0.088 78)",
  },
  paper: {
    from: "oklch(0.972 0.01 85)",
    to: "oklch(0.912 0.018 78)",
    glow: "oklch(1 0 0 / 0.75)",
    ink: "oklch(0.27 0.042 258)",
    ink2: "oklch(0.47 0.03 258)",
    accent: "oklch(0.54 0.12 34)",
  },
  ochre: {
    from: "oklch(0.815 0.07 80)",
    to: "oklch(0.7 0.078 70)",
    glow: "oklch(0.93 0.045 86 / 0.6)",
    ink: "oklch(0.27 0.042 258)",
    ink2: "oklch(0.38 0.045 60)",
    accent: "oklch(0.36 0.06 258)",
  },
  cinnabar: {
    from: "oklch(0.575 0.105 36)",
    to: "oklch(0.445 0.09 30)",
    glow: "oklch(0.7 0.085 48 / 0.5)",
    ink: "oklch(0.965 0.012 85)",
    ink2: "oklch(0.88 0.035 55)",
    accent: "oklch(0.89 0.07 82)",
  },
} as const;
export type Tone = keyof typeof TONE;

/** 片子里写的版本号：SpeakMore 当前发布的版本（2026-11-08 的 0.21.0） */
export const VERSION = "v0.21.0";
