import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// Snug 宣传片：竖屏，产品发布会式，约 2 分钟。一条任务线贯穿全片：Mac 上的 Claude Code 正在干活，人得走开，
// 想用手机接着盯，试了三条路都不行 → Snug 亮相，同一个任务在手机上原样往下跑 → 手势、切窗口 → 在手机上敲命令接回会话 →
// 出门在外照常推进 → 断开后窗口回到 Mac → 落版。
// 主角是一台代码画的 iPhone 17 Pro Max（套着淡绿到黄绿的手机壳），屏幕里是 UU远程 + Snug 手机屏，细节照实机录屏画。
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
// 第 0 拍在 −7 ms，小节头在 0、4、8…拍。整首 224 拍（105 s），是两轮一模一样的「压着 11 小节 → 抽空 1 小节 → 砸下 16 小节」：
// 砸下在第 48、160 拍；砸下段第 30 拍（歌的第 78、190 拍）有一拍几乎静音；第 109–111 拍渐弱、第 111 拍静音，接进中段；
// 第 221 拍起渐弱，第 223 拍收尾。
// 片子 256 拍 = 120 s：整首从头放，第一次砸下的后半段（歌的第 80–112 拍）多放一遍，给切窗口留出时间。
// 片子第 n 拍 = 歌的第 n 拍（n<112）、第 n−32 拍（n≥112）。接口在片子第 112 拍：歌的第 111 拍静音之后重新砸进第 80 拍，
// 两处的频谱几乎一样（第 80 拍 vs 第 48 拍相关 0.98，第 80 拍 vs 第 176 拍 1.00），听起来是又砸下一次。
// 片子里的静音拍：第 78、111、143、222 拍；片子第 255 拍是歌的收尾。
const BEAT_SEC = 60 / 128;
export const BEAT = BEAT_SEC * FPS; // 28.125 帧，两小节正好 225 帧
const SONG_BEAT0 = -0.007;
/** 歌的第 0 拍落在第 −0.42 帧 */
const OFFSET = SONG_BEAT0 * FPS;
/** 片子第 n 拍是第几帧 */
export const b = (n: number) => Math.round(n * BEAT + OFFSET);
/** 场景里用：从第 start 拍开始的场景，第 n 拍是场景里的第几帧 */
export const local = (start: number) => (n: number) => b(start + n) - b(start);
export const TOTAL_BEATS = 256;
export const VIDEO_FRAMES = Math.round(TOTAL_BEATS * BEAT); // 7200
/** 两段配乐：片子第 f 帧放歌的第 f + shift 帧（32 拍正好 900 帧） */
export const MUSIC = [
  { from: 0, shift: 0 },
  { from: b(112), shift: -Math.round(32 * BEAT) },
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
