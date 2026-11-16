// Snug 三屏实录演示：竖屏 1080×1920、60 帧，约 91.6 秒。
// 画面是主人 11-15 用 OBS 同一时间线录下的三块屏原画（MacBook 内建屏、外接 4K 屏、Snug 手机屏），
// 只剪、加速、推近、加字幕和标注，不改画面里发生的事。手机屏装进 snug-promo 那台 iPhone 17 Pro Max（engine/snug/phone），
// 两块 Mac 屏装进代码画的 MacBook 和显示器。
// 结构：开场（三台设备落位）→ 第一幕 新建窗口 · Claude 开工 · 单指滑读 → 第二幕 两屏联动 · 网页铺满 · 一键还原 →
// 第三幕 搜索直开 · 键盘对话 · 连点退出 → 第四幕 机型自选 → 落版。幕与幕之间用一下深色转场，其余时间底色都是浅色。

export const W = 1080;
export const H = 1920;
export const FPS = 60;

export const SF = `system-ui, "PingFang SC", sans-serif`;
export const ZH = `"PingFang SC", system-ui, sans-serif`;

// 配乐：ADTurnUp《purple sky》（SpeakMore 第一支宣传片那首），约 65.9 拍/分，一小节 3.6448 秒，
// 第一个小节头在歌的 2.28 秒，之后每小节一下低音重拍。按小节量能量：2.28–31.4 秒较轻（8 小节）→ 31.4–60.6 秒饱满 →
// 60.6–71.5 秒回落 → 71.5–115.3 秒饱满 → 115.3 秒起一小节收尾 → 118.9 秒起没有低音的柔和尾声。
// 拿掉歌的第 12–21 小节（46.02–78.82 秒，9 小节）：接点前后的两小节频谱相关 0.993，饱满段连成一整块，尾声留给落版。
// 片子第 t 秒放歌的第 t 秒（t < 46.02），之后放第 t + 32.80 秒；片子的小节网格和歌的一致：第 k 小节头在 2.28 + 3.6448k 秒。
export const BAR = 3.6448;
export const BEAT = BAR / 4;
const DOWNBEAT0 = 2.28;
/** 片子第 k 小节头（可带小数）是第几秒 */
export const bar = (k: number) => DOWNBEAT0 + k * BAR;
export const SPLICE_AT = bar(12);
export const SPLICE_SHIFT = 9 * BAR;

/** 秒 → 帧 */
export const sec = (s: number) => Math.round(s * FPS);

// 各幕的起点落在小节头上：第二幕正好是歌转饱满的那一下（第 8 小节），落版在收尾那一小节（第 22 小节）
export const ACTS = {
  intro: 0,
  create: bar(1),
  swap: bar(8),
  apps: bar(13),
  model: bar(19),
  outro: bar(22),
  end: bar(24.5),
} as const;

// 配色：整片的底都是浅色，每段换一种淡彩；深色只在转场那半秒出现。
// 字只用 ink / ink2 两种深色，压在最亮也最暗的底上都过 4.5:1。
export const C = {
  ink: "#101828",
  ink2: "#3b4660",
  white: "#ffffff",
  dark: "#0d1430",
  dark2: "#1b2550",
  blue: "#2f6bff",
  cyan: "#1fb6d9",
  coral: "#ff6a4d",
  tap: "#2f6bff",
} as const;

/** 每一段的底：两种淡彩 + 一团光的颜色 */
export type Palette = { a: string; b: string; glow: string; glow2: string };
export const PAL = {
  intro: { a: "#eef4ff", b: "#ffffff", glow: "#bcd3ff", glow2: "#c9f1fb" },
  create: { a: "#e9f8f1", b: "#f8fffb", glow: "#b9ecd6", glow2: "#d7f3c3" },
  claude: { a: "#fff1e7", b: "#fffaf5", glow: "#ffd2b8", glow2: "#ffe6c2" },
  scroll: { a: "#fff8dc", b: "#fffdf3", glow: "#ffe7a1", glow2: "#ffd8b6" },
  swap: { a: "#f0ebff", b: "#fbf9ff", glow: "#d6c9ff", glow2: "#c7dcff" },
  safari: { a: "#e7f3ff", b: "#f7fbff", glow: "#bfe0ff", glow2: "#c4f0f2" },
  restore: { a: "#ffedf2", b: "#fff8fa", glow: "#ffc9d8", glow2: "#ffdccc" },
  search: { a: "#e4f8f6", b: "#f6fffe", glow: "#b3ece6", glow2: "#cfe7ff" },
  chat: { a: "#eef6ea", b: "#fbfef9", glow: "#cfe9c2", glow2: "#e8f3b8" },
  quit: { a: "#fbf2e3", b: "#fffcf6", glow: "#f7dcb0", glow2: "#ffd1c4" },
  model: { a: "#ecefff", b: "#fafbff", glow: "#c9d1ff", glow2: "#e0ccff" },
  outro: { a: "#eaf2ff", b: "#ffffff", glow: "#b7d0ff", glow2: "#bdeefa" },
} satisfies Record<string, Palette>;
