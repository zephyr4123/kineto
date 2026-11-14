import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { assets } from "./assets.gen";

// Snug 宣传片：竖屏，约 86 秒，只讲一件事：让 UU远程 在 iPhone 上接近原生体验。
// 立题（slogan）→ 原版的竖屏（上下黑边）和横屏（字太小，滑动、拖动都不准）→ Snug 亮相，竖屏铺满 →
// 三个动作（滚动、拷贝、切窗口）各演一遍原版、再拨到 Snug → 终端、App、浏览器各写一回（弹出键盘输入）→ Mac 端零操作、断开复原 → 落版。
// 主角是一台代码画的 iPhone 17 Pro Max（套着淡绿到黄绿的手机壳），屏幕里是 UU远程 + Snug 手机屏，细节照实机截图画。
// 字幕：中文是主角（大字号、深色），英文只做小标；说明文字用箭头从画面里引出来，不在中间一行行往下排。
// 所有字幕文字和它背后的底的对比度不低于 4.5:1（苹果的要求），配色按画面里最暗的底（#c9dcf7）选。

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
// 第 0 拍在 −7 ms，小节头在 0、4、8…拍。整首 224 拍（105 s），按拍量能量是两轮一模一样的结构：
// 低沉段（0–15、112–127）→ 压着的蓄力（15–44、127–156，持续的低音、没有鼓点）→ 抽空一小节（44–48、156–160）→
// 砸下 16 小节（48–112、160–224，重鼓；第 30 拍即歌的第 78、190 拍有一拍几乎静音；最后一小节第 109–111、221–223 拍渐弱收住）。
// 片子 184 拍 ≈ 86 s，要从歌里拿掉 40 拍，分两处在小节头上剪，剪掉的都是和接上去那一小节一样的重复小节：
// ① 片子第 84 拍：第一次砸下放到第 9 小节，接上它最后一小节（歌的第 108 拍起：重鼓一拍、渐弱、第 111 拍静音）。
//    接点前的歌的第 80–84 拍和原本接在第 108 拍前面的第 104–108 拍频谱相关 0.988；
// ② 片子第 104 拍之后：完整放第二轮的低沉段（歌的第 112–128 拍，终端那一段），蓄力起来一小节（第 128–132 拍，ChatGPT 开头），
//    第 108 拍跳到蓄力的第 148 拍（蓄力是持续的同一个音，第 128–132 拍和第 144–148 拍频谱相关 0.995），接着抽空一小节、第二次砸下，放到收尾。
// 片子第 n 拍 = 歌的第 n 拍（n<84）、第 n+24 拍（84≤n<108）、第 n+40 拍（n≥108）。
// 片子里的砸下：第 48、120 拍；静音拍：第 78、87、150 拍；低沉段第 88–104 拍，蓄力第 104–116 拍，抽空第 116–120 拍。
const BEAT_SEC = 60 / 128;
export const BEAT = BEAT_SEC * FPS; // 28.125 帧，两小节正好 225 帧
const SONG_BEAT0 = -0.007;
/** 歌的第 0 拍落在第 −0.42 帧 */
const OFFSET = SONG_BEAT0 * FPS;
/** 片子第 n 拍是第几帧 */
export const b = (n: number) => Math.round(n * BEAT + OFFSET);
/** 场景里用：从第 start 拍开始的场景，第 n 拍是场景里的第几帧 */
export const local = (start: number) => (n: number) => b(start + n) - b(start);
export const TOTAL_BEATS = 184;
export const VIDEO_FRAMES = Math.round(TOTAL_BEATS * BEAT); // 5175
/** 三段配乐：片子第 f 帧放歌的第 f + shift 帧（24 拍正好 675 帧，40 拍正好 1125 帧） */
export const MUSIC = [
  { from: 0, shift: 0 },
  { from: b(84), shift: Math.round(24 * BEAT) },
  { from: b(108), shift: Math.round(40 * BEAT) },
] as const;
/** 原曲 −6.2 LUFS，压到往期的 −14 LUFS 上下（−7.8 dB） */
export const VOLUME = 0.385;

// 配色：从 Snug 图标里取。底是图标卡片那种带一点蓝的白，青（显示器）和蓝（手机）做光和形状，字用深蓝黑。
// 青和亮蓝只用在光、形状和线条上；字只用 ink、ink2、deep，蓝底上的白字只用 deep → blue2 的渐变（白字 ≥ 6.3:1）。
export const C = {
  bg0: "#e4edfa",
  bg1: "#fbfdff",
  cyan: "#00b8ea",
  blue: "#1f63ff",
  /** 能放字的蓝：在最暗的底上 4.5:1，上面放白字 6.3:1 */
  blue2: "#1550e6",
  deep: "#0638e8",
  ink: "#0b1a33",
  ink2: "#2c3a52",
  red: "#ff4d55",
} as const;
/** 蓝底白字用的渐变 */
export const BLUE_FILL = `linear-gradient(135deg, ${C.deep} 0%, ${C.blue2} 100%)`;
