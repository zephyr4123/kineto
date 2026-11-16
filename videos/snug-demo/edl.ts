import { ACTS, FPS } from "./theme";

// 剪辑表：素材时间是粗剪 rough-v2（138.25 秒）里的秒数，三块屏同一条时间线，三个文件按同一张表放，天然对齐。
// 每段给出素材起止和它在片子里占几秒；占的秒数比素材短就是加速。每段落最后一段写 null，自动填满到下一段落的起点，
// 这样段落的切换都落在小节头上。Mac 屏有变化的段（窗口飞走、飞回）一律原速。

type Part = readonly [srcFrom: number, srcTo: number, seconds: number | null];

/** 开场头 2 秒只有字标、三台设备还在画外，素材从这一秒起放 */
export const ROLL = ACTS.hook + 2;

const PLAN: readonly { from: number; to: number; parts: readonly Part[] }[] = [
  // 点题：手机连上 UU，Snug 手机屏出现、资源库读出来（7.1 秒素材占 7.09 秒，等于原速）
  { from: ROLL, to: ACTS.create, parts: [[0.4, 7.5, null]] },
  // 在 Ghostty 卡片上点「新建窗口」（原速：外接屏上新窗口出生、缩小、飞走，手机上铺满、字号 +2）→
  // 启动 Claude Code、发出「总结一下今天的提交」、跑 git log → 回复出来、单指往回翻、再翻回来（落在安静的主歌上，放慢一点）
  {
    from: ACTS.create,
    to: ACTS.swap,
    parts: [
      [7.5, 16.5, 9],
      [16.5, 25.5, 3],
      [25.5, 32, 4],
      [32, 36.5, 2.25],
      [36.5, 53, null],
    ],
  },
  // 上滑指示条回资源库、点 Safari（原速：Claude 回外接屏全屏，Safari 离开内建屏铺满手机）→ 在手机上看网页 → 点「还原」
  // （还原段放到 82.2 秒，Safari 回到原位后还能停 1.7 秒）
  {
    from: ACTS.swap,
    to: ACTS.apps,
    parts: [
      [53, 61.5, 8.5],
      [61.5, 78, null],
      [78, 82.2, 4.2],
    ],
  },
  // 「全部」里翻一翻、搜 chat、点开没在跑的 ChatGPT → 打字（粗剪里已是 4 倍速）、发出、看回复 → 连点两下退出
  {
    from: ACTS.apps,
    to: ACTS.model,
    parts: [
      [82.2, 86.9, 2],
      [86.9, 92.9, 4],
      [92.9, 98.25, 5.35],
      [98.25, 108, 3.9],
      [108, 111.5, 3.5],
      [111.5, 116, null],
    ],
  },
  // 右上角打开型号列表（116.77 秒点下，从 116 秒起放，免得这一下落在转场里）、从 Apple 一路翻到华为、点「完成」，
  // 停在 137.2 秒（之后是资源库里的一下拖动和粗剪的淡出），落版从这一帧定格
  { from: ACTS.model, to: ACTS.outro, parts: [[116, 137.2, null]] },
];

export type Segment = {
  /** 素材起止（粗剪里的秒） */
  src: readonly [number, number];
  /** 在片子里的起止（帧） */
  from: number;
  to: number;
  /** 相对粗剪的倍速 */
  rate: number;
};

const build = (): Segment[] => {
  const out: Segment[] = [];
  for (const act of PLAN) {
    const fixed = act.parts.reduce((s, [, , d]) => s + (d ?? 0), 0);
    const fill = act.to - act.from - fixed;
    let t = act.from;
    for (const [a, b, d] of act.parts) {
      const dur = d ?? fill;
      const from = Math.round(t * FPS);
      t += dur;
      const to = Math.round(t * FPS);
      out.push({ src: [a, b], from, to, rate: ((b - a) * FPS) / (to - from) });
    }
  }
  return out;
};

export const SEGMENTS = build();

/** 片子第 frame 帧放的是素材第几秒（素材开放之前算第一段的开头） */
export const srcAt = (frame: number) => {
  if (frame < SEGMENTS[0].from) return SEGMENTS[0].src[0];
  const s = SEGMENTS.find((g) => frame >= g.from && frame < g.to) ?? SEGMENTS[SEGMENTS.length - 1];
  return s.src[0] + ((frame - s.from) * s.rate) / FPS;
};

/** 素材第 t 秒在片子的第几帧（t 落在剪掉的地方时取下一段的开头） */
export const at = (t: number) => {
  for (const s of SEGMENTS) {
    if (t < s.src[0]) return s.from;
    if (t <= s.src[1]) return Math.round(s.from + ((t - s.src[0]) * FPS) / s.rate);
  }
  return SEGMENTS[SEGMENTS.length - 1].to;
};

/** 素材第 t 秒有没有放进片子（落在剪掉的地方就是 false） */
export const inCut = (t: number) => SEGMENTS.some((s) => t >= s.src[0] && t <= s.src[1]);

// 粗剪 rough-v2 的剪辑表（原始录像 2026-11-15 08:37:10 开录）：[原始起, 原始止, 倍速, 粗剪起]
const ROUGH: readonly (readonly [number, number, number, number])[] = [
  [4.5, 21, 1, 0],
  [49.5, 58.5, 1, 16.5],
  [63.5, 70, 1, 25.5],
  [73.5, 78, 1, 32],
  [85, 131, 1, 36.5],
  [132.2, 136.6, 1, 82.5],
  [139.6, 145.6, 1, 86.9],
  [155.65, 157.5, 1, 92.9],
  [157.5, 171.5, 4, 94.75],
  [171.5, 190, 1, 98.25],
  [193, 214.5, 1, 116.75],
];
const RECORD_START = 8 * 3600 + 37 * 60 + 10;

const roughAt = (t: number) => {
  let seg = ROUGH[0];
  for (const r of ROUGH) if (t >= r[3]) seg = r;
  return seg;
};

/** 片子第 frame 帧相对真实时间快几倍（粗剪本身的倍速也乘进去） */
export const speedAt = (frame: number) => {
  const s = SEGMENTS.find((g) => frame >= g.from && frame < g.to);
  if (!s) return 1;
  return s.rate * roughAt(srcAt(frame))[2];
};

/** 片子第 frame 帧对应录制时的墙上时间（秒，当天 0 点起），角标里的时钟用它 */
export const clockAt = (frame: number) => {
  const t = srcAt(frame);
  const [rawFrom, , speed, roughFrom] = roughAt(t);
  return RECORD_START + rawFrom + (t - roughFrom) * speed;
};

/** 落版定格在素材的这一秒（机型段的最后一帧） */
export const FREEZE_AT = 137.2;

// 关键时刻（粗剪里的秒）：Mac 屏的变化来自逐帧画面差和 Snug 日志；手指操作见 touch.ts
export const EVENTS = {
  /** 外接屏：新建的全屏窗口出现、退出全屏缩小 */
  extWindowIn: 11.87,
  /** 外接屏：新窗口缩小完、停在左下角 */
  extWindowSettled: 12.45,
  /** 外接屏：缩小的窗口滑走（去了手机） */
  extWindowOut: 13.33,
  /** 手机：新窗口铺满 */
  phoneFilled: 14.1,
  /** 手机：字号 +2 */
  fontUp: 14.8,
  /** 外接屏：Claude 的窗口飞回来、恢复全屏 */
  extClaudeBack: 57.2,
  extClaudeFull: 58.53,
  /** 内建屏：Safari 离开 */
  macSafariOut: 59.5,
  /** 手机：Safari 铺满（换到 580 宽） */
  phoneSafari: 60.8,
  /** 内建屏：Safari 回来 */
  macSafariBack: 80.48,
  /** 内建屏：ChatGPT 冷启动、窗口出现后被放上手机 */
  macChatgptLaunch: 91.23,
  /** 手机：打出「你好呀，你是谁」（粗剪里 4 倍速） */
  typeHello: 94.9,
  typeHelloDone: 98.0,
  /** 内建屏：ChatGPT 退出前回到正中、关掉 */
  macChatgptBack: 110.2,
  macChatgptGone: 110.67,
} as const;

// 窗口在内建屏上的原位（Snug 日志「原位 (x,y w×h)」，内建屏 1512×982 点），换算成屏幕的百分比，标注照这个画
const BUILTIN_PT = { w: 1512, h: 982 };
const pct = (x: number, y: number, w: number, h: number) => ({
  l: (x / BUILTIN_PT.w) * 100,
  t: (y / BUILTIN_PT.h) * 100,
  w: (w / BUILTIN_PT.w) * 100,
  h: (h / BUILTIN_PT.h) * 100,
});
export const WINDOWS = {
  /** Safari：原位 (93,55 1200x885) */
  safari: pct(93, 55, 1200, 885),
  /** ChatGPT：原位 (486,33 540x886) */
  chatgpt: pct(486, 33, 540, 886),
  /** 外接屏上新建的 Ghostty 窗口退出全屏后：800×632 点（外接屏 1920×1080 点），顶边在 40.8% 处 */
  ghostty: { l: 0, t: 40.8, w: 41.7, h: 58.5 },
} as const;
