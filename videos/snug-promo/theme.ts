import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// Snug 宣传片：竖屏，产品发布会式。先摆三个痛点，Snug 亮相，再逐条回击，手势快剪，落版。
// 主角是一台代码画的 iPhone 17 Pro Max，屏幕里是 UU远程 + Snug 手机屏，细节照实机录屏画。
// 字幕：英文大写作主角词，中文短句作配角，不带句号。

export const W = 1080;
export const H = 1920;
export const FPS = 60;

// 字体：界面字用本机系统字（Remotion 的 Chrome 里只有 system-ui 能调到 SF，-apple-system 和 "SF Pro" 都调不到），
// 中文落到苹方；终端用 Ghostty 的默认字体 JetBrains Mono，素材库里有
export const SF = `system-ui, "PingFang SC", sans-serif`;
export const ZH = `"PingFang SC", system-ui, sans-serif`;
export const MONO = `"JetBrains Mono", "PingFang SC", monospace`;
await loadFont({ family: "JetBrains Mono", url: staticFile(assets.fontMono), weight: "100 800" });

// 配乐：ZsFlovexl、ZzzzHAO《KEYGEN (Instrumental)》，128 拍/分，速度恒定（低频起音网格扫描，各段相位偏差 ±9 ms 内），
// 第 0 拍在 −7 ms，小节头在 0、4、8…拍。整首是两轮一模一样的「压着 11 小节 → 抽空 1 小节 → 砸下 16 小节」，
// 抽空在第 12、40 小节，砸下在 22.49 s、74.99 s；砸下段第 20.3、48.3 拍各有一拍几乎静音。
// 片子 75 秒 = 160 拍，接法：歌的第 5–27 小节（7.5 s 起，含第一次抽空和砸下）接第 40–56 小节（第二次抽空、砸下、收尾）。
// 两段都对齐在小节头上，片子第 n 拍 = 歌的第 n+16 拍（n<92）、第 n+64 拍（n≥92）。
const BEAT_SEC = 60 / 128;
export const BEAT = BEAT_SEC * FPS; // 28.125 帧，两小节正好 225 帧
const SONG_BEAT0 = -0.007;
/** 片子第 0 帧放歌的第 450 帧（7.5 s），歌的第 16 拍落在片子第 −0.42 帧 */
const OFFSET = (SONG_BEAT0 + 16 * BEAT_SEC) * FPS - 450;
/** 片子第 n 拍是第几帧 */
export const b = (n: number) => Math.round(n * BEAT + OFFSET);
/** 场景里用：从第 start 拍开始的场景，第 n 拍是场景里的第几帧 */
export const local = (start: number) => (n: number) => b(start + n) - b(start);
export const TOTAL_BEATS = 160;
export const VIDEO_FRAMES = Math.round(TOTAL_BEATS * BEAT); // 4500
/** 两段配乐：片子第 f 帧放歌的第 f + shift 帧 */
export const MUSIC = [
  { from: 0, shift: 450 },
  { from: b(92), shift: 1800 },
] as const;
/** 原曲 −6.2 LUFS，压到往期的 −14 LUFS 上下（−7.8 dB） */
export const VOLUME = 0.385;

// 配色：从 Snug 图标里取。底是图标卡片那种带一点蓝的白，青（显示器）和蓝（手机）做光和形状，字用深蓝黑
export const C = {
  bg0: "#e4edfa",
  bg1: "#fbfdff",
  cyan: "#00b8ea",
  blue: "#1f63ff",
  deep: "#0638e8",
  ink: "#0b1a33",
  ink2: "#4a5a74",
  ink3: "#8592a8",
  red: "#ff4d55",
} as const;
