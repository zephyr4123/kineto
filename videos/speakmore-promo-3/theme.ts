import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { inOutQuint, outExpo, outQuint } from "../../engine/motion";
import { assets } from "./assets.gen";

// SpeakMore 第三支：淡雾浅底，字是主角，界面斜放成悬浮的玻璃板；镜头一直在动，大转折踩在音乐的段落交界上。
// 颜色只取印里的靛青和朱砂，朱砂点睛。点题的字英文为主、中文作副行（他说中文当主角太 low），措辞照官网英文版；都不带人称。品牌只写 SpeakMore。

export const SANS = "Noto Sans SC";
export const MONO = "JetBrains Mono";
export const LATIN = "Inter";
/** 英文为主的大字：Inter，中文落到思源黑体 */
export const DISPLAY = `"${LATIN}", "${SANS}", sans-serif`;
await loadFont({ family: SANS, url: staticFile(assets.fontSans), weight: "100 900" });
await loadFont({ family: MONO, url: staticFile(assets.fontMono), weight: "100 800" });
await loadFont({ family: LATIN, url: staticFile(assets.fontLatin), weight: "100 900" });

export const W = 1920;
export const H = 1080;
export const FPS = 60;

// 配乐：Midnight Riot《That New Thing》，参考片（Gemini 发布片）用的就是这首。150 拍/分整，60 帧下一拍正好 24 帧，第一拍在 0.4225 秒。
// 照参考片的做法按画面剪拼原曲，剪点都在小节头上（4 拍一小节）。几处要紧的拍：
//   原曲 129–131 拍低音抽空、132 拍砸下；259 拍抽空、260 拍砸下；324–355 拍是原曲自带的过门（低音全撤）、356 拍砸下；480 拍乐队停、清唱收尾。
export const BEAT = 24;
/** 片子里第 n 拍的那一帧 */
export const b = (n: number) => Math.round(n * BEAT);
const SONG_BEAT0 = 0.4225;
/** 原曲第 k 拍在原曲里是第几帧 */
export const songFrame = (k: number) => Math.round((SONG_BEAT0 + k * 0.4) * FPS);
/** 配乐的剪法：片子第 at 拍起，接原曲第 song 拍，放 beats 拍 */
export const MUSIC = [
  { at: 0, song: 12, beats: 20 }, // 前奏
  { at: 20, song: 128, beats: 44 }, // 抽空三拍，片子第 24 拍砸下：SpeakMore 出场、划词
  { at: 64, song: 196, beats: 16 }, // 间奏：看懂只是一半
  { at: 80, song: 244, beats: 56 }, // 蓄力，片子第 95 拍抽空、96 拍砸下：译文落进输入框
  { at: 136, song: 324, beats: 52 }, // 原曲的过门（暗场），片子第 168 拍砸下：三项功能点亮
  { at: 188, song: 452, beats: 37 }, // 原曲最后一段和结尾：点星、下载、落版，片子第 216 拍乐队停
] as const;
export const TOTAL_BEATS = 225;
export const VIDEO_FRAMES = b(TOTAL_BEATS);

export const COLOR = {
  // 底：近白，往靛青偏一点点（官网浅色的 canvas）
  paper: "oklch(0.985 0.004 255)",
  ink: "oklch(0.21 0.02 255)",
  ink2: "oklch(0.45 0.02 255)",
  faint: "oklch(0.62 0.02 255)",
  line: "oklch(0.88 0.008 255)",
  cinnabar: "oklch(0.55 0.17 33)",
  // 雾里的三团光：极淡，只给底一点呼吸
  fogIndigo: "oklch(0.9 0.04 262)",
  fogCinnabar: "oklch(0.935 0.03 32)",
  fogLilac: "oklch(0.925 0.03 300)",
  // 终端：深色窗口，浮在浅底上
  term: "oklch(0.19 0.01 255)",
  termBar: "oklch(0.235 0.01 255)",
  termInk: "oklch(0.84 0.01 255)",
  termBright: "oklch(0.97 0.003 255)",
  termDim: "oklch(0.58 0.012 255)",
  termSelect: "oklch(0.5 0.12 258 / 0.62)",
  // 划词卡片：App 默认主题"墨"的浅色
  card: "oklch(1 0 0)",
  cardInk: "oklch(0.2 0 0)",
  cardInk2: "oklch(0.46 0 0)",
  cardLine: "oklch(0.9 0 0)",
  cardFill: "oklch(0.2 0 0 / 0.06)",
  // 暗场：深靛的夜色，霓虹描边用靛青和朱砂
  night: "oklch(0.15 0.025 275)",
  nightInk: "oklch(0.97 0.004 275)",
  nightInk2: "oklch(0.75 0.02 275)",
  neonIndigo: "oklch(0.72 0.14 268)",
  neonCinnabar: "oklch(0.72 0.17 32)",
  ochre: "oklch(0.74 0.12 75)",
  green: "oklch(0.62 0.15 150)",
} as const;

export const EASE = { outExpo, outQuint, inOut: inOutQuint } as const;
