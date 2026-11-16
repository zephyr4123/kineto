import { ACTS, FPS } from "./theme";

// 剪辑表：素材时间是粗剪 rough-v2（138.25 秒）里的秒数，三块屏同一条时间线，三个文件按同一张表放，天然对齐。
// 每段给出素材起止和它在片子里占几秒；占的秒数比素材短就是加速。每一幕最后一段写 null，自动填满到下一幕的起点，
// 这样幕的切换都落在小节头上。Mac 屏有变化的段（窗口飞走、飞回）一律原速。

type Part = readonly [srcFrom: number, srcTo: number, seconds: number | null];

const PLAN: readonly { from: number; to: number; parts: readonly Part[] }[] = [
  // 开场：手机连上 UU，Snug 手机屏出现、资源库读出来
  { from: ACTS.intro, to: ACTS.create, parts: [[0.5, 7.5, null]] },
  // 第一幕：在 Ghostty 卡片上点「新建窗口」（原速：外接屏上新窗口出现、缩小、飞走，手机上铺满、字号 +2）→
  // 启动 Claude Code、发出「总结一下今天的提交」、跑 git log → 给出总结、单指往下翻
  {
    from: ACTS.create,
    to: ACTS.swap,
    parts: [
      [7.5, 16.5, 9],
      [16.5, 25.5, 3],
      [25.5, 32, 4],
      [32, 36.5, 2],
      [36.5, 53, null],
    ],
  },
  // 第二幕：指示条回资源库、点 Safari（原速：Claude 回外接屏全屏，Safari 离开内建屏铺满手机）→ 在手机上看网页 → 点「还原」
  {
    from: ACTS.swap,
    to: ACTS.apps,
    parts: [
      [53, 61.5, 8.5],
      [61.5, 78, null],
      [78, 81.5, 3.5],
    ],
  },
  // 第三幕：「全部」里翻一下、搜 chat、点开没在跑的 ChatGPT → 打字（粗剪里已是 4 倍速）、发出、看回复 → 连点两下退出
  {
    from: ACTS.apps,
    to: ACTS.model,
    parts: [
      [81.5, 86.9, 2],
      [86.9, 92.9, 4],
      [92.9, 98.25, 5.35],
      [98.25, 108, 3.9],
      [108, 111.5, 3.5],
      [111.5, 116.75, null],
    ],
  },
  // 第四幕：打开型号列表、翻品牌、选回 iPhone 17 Pro Max（粗剪最后半秒是淡出，不用）
  { from: ACTS.model, to: ACTS.outro, parts: [[116.75, 137.6, null]] },
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

/** 粗剪里本身加过速的段（打字 4 倍速）：倍速角标要乘上去，才是相对真实时间的快慢 */
const ROUGH_FAST: readonly (readonly [number, number, number])[] = [[94.75, 98.25, 4]];

/** 片子第 frame 帧放的是素材第几秒 */
export const srcAt = (frame: number) => {
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

/** 片子第 frame 帧相对真实时间快几倍 */
export const speedAt = (frame: number) => {
  const s = SEGMENTS.find((g) => frame >= g.from && frame < g.to);
  if (!s) return 1;
  const t = srcAt(frame);
  const rough = ROUGH_FAST.find(([a, b]) => t >= a && t < b);
  return s.rate * (rough ? rough[2] : 1);
};

// 关键时刻（粗剪里的秒）：点按的位置来自逐帧追踪手机屏里的鼠标指针（UU 每次点按先把指针移过去），
// Mac 屏的变化来自逐帧画面差和 Snug 日志。手机屏坐标是 1080×1900 的录像像素。
export const TAPS = {
  newWindow: { t: 10.4, x: 821, y: 584 },
  swipeHome: { t: 53.47, x: 711, y: 1856 },
  safari: { t: 56.57, x: 539, y: 1368 },
  // 78.7–80.0 秒手机屏换回 540 宽，指针被系统藏起来；80.1 秒指针重新出现在「还原」上，0.4 秒后 Safari 回到原位
  restore: { t: 80.1, x: 923, y: 880 },
  allApps: { t: 82.5, x: 699, y: 424 },
  search: { t: 86.57, x: 543, y: 324 },
  chatgpt: { t: 91.57, x: 539, y: 280 },
  send: { t: 98.1, x: 981, y: 1734 },
  quit: { t: 109.1, x: 975, y: 624 },
  model: { t: 116.77, x: 1017, y: 78 },
  done: { t: 133.73, x: 1023, y: 78 },
} as const;

export const EVENTS = {
  /** 外接屏：新建的全屏窗口出现、退出全屏缩小 */
  extWindowIn: 11.87,
  /** 外接屏：新窗口缩小完、停在左半边 */
  extWindowSettled: 12.45,
  /** 外接屏：缩小的窗口滑走（去了手机） */
  extWindowOut: 13.33,
  /** 手机：新窗口铺满 */
  phoneFilled: 14.1,
  /** 手机：字号 +2 */
  fontUp: 14.8,
  /** 手机：单指往下翻总结 */
  scrollFrom: 39,
  scrollTo: 47,
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
  phoneChatgpt: 92.62,
  /** 内建屏：ChatGPT 退出前回到正中、关掉 */
  macChatgptBack: 110.2,
  macChatgptGone: 110.67,
} as const;

// 窗口在内建屏上的原位（Snug 日志「原位 (x,y w×h)」，内建屏 1512×982 点），换算成屏幕的百分比，标注框照这个画
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
} as const;
