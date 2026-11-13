import { MONO } from "../theme";

// Ghostty 终端（浅色主题）和里面的 Claude Code。
// 照真终端的字符格排：英文一格（0.6 em，JetBrains Mono 的字宽）、中文和全角标点两格，按窗口宽度自动换行，
// 续行按这一行的缩进（含「● 」「- 」这类前缀）悬挂对齐，和 Claude Code 自己换行的样子一样。字号变了列数跟着变，会重新换行。
// fill 段（输入框上下的横线、方框的边）铺满到行尾。reveal 是打字机效果：只显示前 reveal 个字符。

export type Span = { t: string; c?: string; bg?: string; b?: boolean; i?: boolean; fill?: boolean };
export type Line = string | Span[];
export type Sel = { line: number; from: number; to: number };

const INK = "#1d1f24";
const DIM = "#8a8f98";
export const CC = {
  orange: "#d77757",
  purple: "#5b5bd6",
  blue: "#2f6fdd",
  green: "#2f9e57",
  brown: "#a3560b",
  dim: DIM,
  ink: INK,
};
export const LINE_H = 1.42;

const toSpans = (l: Line): Span[] => (typeof l === "string" ? [{ t: l }] : l);
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;
const cellsOf = (ch: string) => (WIDE.test(ch) ? 2 : 1);

type Cell = { ch: string; w: number; s: Span; line: number; col: number };
type Row = { cells: Cell[]; line: number };
export type Layout = { rows: Row[]; cols: number; cw: number; lh: number; pad: number };
const BLANK: Span = { t: " " };

/** 悬挂缩进：前导空格 + 行首的列表前缀 */
const hang = (text: string) => {
  const lead = text.length - text.trimStart().length;
  const m = /^(● |- |❯ |⎿ {2}|※ )/.exec(text.slice(lead));
  return Math.min(12, lead + (m ? m[0].length : 0));
};

export const layout = (lines: readonly Line[], size: number, width: number, pad = 14): Layout => {
  const cw = 0.6 * size;
  const cols = Math.floor((width - 2 * pad) / cw);
  const rows: Row[] = [];
  lines.forEach((l, li) => {
    const spans = toSpans(l);
    const fixed = spans.filter((s) => !s.fill).reduce((n, s) => n + [...s.t].reduce((m, ch) => m + cellsOf(ch), 0), 0);
    const indent = hang(spans.map((s) => s.t).join(""));
    let row: Cell[] = [];
    let used = 0;
    let col = 0;
    for (const s of spans) {
      const chars = s.fill ? Array.from({ length: Math.max(0, cols - fixed) }, () => s.t) : [...s.t];
      for (const ch of chars) {
        const w = cellsOf(ch);
        if (used + w > cols) {
          rows.push({ cells: row, line: li });
          row = Array.from({ length: indent }, () => ({ ch: " ", w: 1, s: BLANK, line: li, col: -1 }));
          used = indent;
        }
        row.push({ ch, w, s, line: li, col: s.fill ? -1 : col });
        used += w;
        if (!s.fill) col++;
      }
    }
    rows.push({ cells: row, line: li });
  });
  return { rows, cols, cw, lh: size * LINE_H, pad };
};

/** 第 line 行第 col 个字符的中心（相对终端左上角，不含滚动） */
export const cellPos = (lay: Layout, line: number, col: number) => {
  for (let r = 0; r < lay.rows.length; r++) {
    let x = 0;
    for (const c of lay.rows[r].cells) {
      if (c.line === line && c.col === col) return { x: lay.pad + (x + c.w / 2) * lay.cw, y: lay.pad + r * lay.lh + lay.lh / 2 };
      x += c.w;
    }
  }
  return { x: lay.pad, y: lay.pad };
};

/** 已经打出来的部分有几行 */
const visibleRows = (lay: Layout, reveal: number) => {
  let n = 0;
  let rows = 0;
  for (const r of lay.rows) {
    const chars = r.cells.filter((c) => c.col >= 0).length;
    if (n >= reveal && chars > 0) break;
    rows++;
    n += chars;
  }
  return rows;
};
/** 内容总高（打字机只算已经打出来的部分） */
export const contentHeight = (lay: Layout, reveal = Infinity) => visibleRows(lay, reveal) * lay.lh + 2 * lay.pad;
/** 一共有几个字符（打字机打完要多少） */
export const charCount = (lines: readonly Line[]) => lines.reduce<number>((n, l) => n + toSpans(l).filter((s) => !s.fill).reduce((m, s) => m + [...s.t].length, 0), 0);

const inSel = (sel: readonly Sel[], c: Cell) => c.col >= 0 && sel.some((s) => s.line === c.line && c.col >= s.from && c.col < s.to);

export const Terminal: React.FC<{
  lines: readonly Line[];
  size?: number;
  width?: number;
  height?: number;
  pad?: number;
  scroll?: number;
  sel?: readonly Sel[];
  selRows?: readonly [number, number];
  cursor?: boolean;
  reveal?: number;
  anchor?: "top" | "bottom";
  bg?: string;
  selColor?: string;
}> = ({ lines, size = 16, width = 540, height = 860, pad = 14, scroll = 0, sel = [], selRows, cursor = false, reveal = Infinity, anchor = "top", bg = "#fbfcfd", selColor = "rgba(64,140,255,0.32)" }) => {
  const lay = layout(lines, size, width, pad);
  // 打字机：数到 reveal 个字符为止，最后一行截到一半
  const shown: { cells: Cell[]; r: number }[] = [];
  let n = 0;
  for (let r = 0; r < lay.rows.length; r++) {
    const row = lay.rows[r];
    const real = row.cells.filter((c) => c.col >= 0).length;
    if (n >= reveal && real > 0) break;
    if (n + real <= reveal) {
      shown.push({ cells: row.cells, r });
      n += real;
      continue;
    }
    const cut: Cell[] = [];
    for (const c of row.cells) {
      if (c.col >= 0) {
        if (n >= reveal) break;
        n++;
      }
      cut.push(c);
    }
    shown.push({ cells: cut, r });
    break;
  }
  const total = shown.length * lay.lh + 2 * pad;
  const offset = anchor === "bottom" ? Math.max(0, total - height) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: pad, top: pad - offset - scroll, fontFamily: MONO, fontSize: size, lineHeight: `${lay.lh}px`, color: INK, whiteSpace: "pre" }}>
        {shown.map(({ cells, r }, i) => {
          const rowSel = selRows ? r >= selRows[0] && r <= selRows[1] : false;
          // 连续的一格字（同一段、同样选中状态）合成一个 span；两格字单独放进 1.2 em 宽的格子里居中
          const runs: { text: string; s: Span; sel: boolean; wide: boolean }[] = [];
          for (const c of cells) {
            const on = rowSel ? c.col >= 0 : inSel(sel, c);
            const prev = runs[runs.length - 1];
            if (c.w === 1 && prev && !prev.wide && prev.s === c.s && prev.sel === on) prev.text += c.ch;
            else runs.push({ text: c.ch, s: c.s, sel: on, wide: c.w === 2 });
          }
          return (
            <div key={r} style={{ height: lay.lh }}>
              {runs.map((u, j) => (
                <span
                  key={j}
                  style={{
                    display: u.wide ? "inline-block" : undefined,
                    width: u.wide ? 2 * lay.cw : undefined,
                    textAlign: u.wide ? "center" : undefined,
                    color: u.s.c,
                    background: u.sel ? selColor : u.s.bg,
                    fontWeight: u.s.b ? 700 : undefined,
                    fontStyle: u.s.i ? "italic" : undefined,
                  }}
                >
                  {u.text}
                </span>
              ))}
              {cursor && i === shown.length - 1 ? <span style={{ display: "inline-block", width: lay.cw, height: size * 1.1, background: INK, verticalAlign: "-0.18em" }} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** 打字机：from 帧起，每帧出 cps 个字符 */
export const typedCount = (frame: number, from: number, cps = 2.2) => Math.max(0, Math.floor((frame - from) * cps));

const RULE: Span = { t: "─", c: "#c9ccd2", fill: true };
export const PROMPT: Span[] = [{ t: "snug % ", c: INK }];

/** Claude Code 启动时的横幅（v2 的样子：橙色小像素块 + 版本、模型、目录） */
export const BANNER: readonly Line[] = [
  [{ t: " ▐▛███▜▌ ", c: CC.orange }, { t: "  Claude Code ", b: true }, { t: "v2.1.323", c: DIM }],
  [{ t: "▝▜█████▛▘", c: CC.orange }, { t: "  Opus 5.5 with xhigh effort", c: DIM }],
  [{ t: "  ▘▘ ▝▝  ", c: CC.orange }, { t: "  Claude Max · ~/coding/personal/snug", c: DIM }],
];

/** 会话最开头：启动横幅和第一轮（先跑一遍测试）。放在最前面，让终端从上到下都是内容，像一个开了一阵的会话 */
export const PRELUDE: readonly Line[] = [
  ...BANNER,
  "",
  [{ t: "❯ ", c: DIM }, { t: "先跑一遍测试，看看现在的状态", bg: "#eef0f3" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(scripts/snug check)" }],
  [{ t: "  ⎿  Build complete · 134 tests passed", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "构建和测试都正常，可以开始了。" }],
  "",
];

/** 会话更早的部分：读文档、看提交记录。行数是 Snug 仓库里这几个文件的真实行数，提交是真实的提交 */
export const EARLY: readonly Line[] = [
  [{ t: "❯ ", c: DIM }, { t: "先读一遍仓库，了解整体设计", bg: "#eef0f3" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(README.md)" }],
  [{ t: "  ⎿  Read 197 lines", c: DIM }],
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(docs/how-it-works.md)" }],
  [{ t: "  ⎿  Read 75 lines", c: DIM }],
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(git log --oneline | head -3)" }],
  [{ t: "  ⎿  58a9944 记忆：README 图片大小上限在 GitHub 图片代理而不在 COS", c: DIM }],
  [{ t: "     e35e594 README 演示动图：补上弹出键盘、输入命令的过程", c: DIM }],
  [{ t: "     53b8520 记忆精简：删过时的、并重复的，只留代码和文档推不出来的", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "读完了。Snug 是一个菜单栏小工具：手机连上 UU远程 时，Mac 上多出一块 540×950 点的竖屏，窗口放上去铺满，终端和编辑器的字号随之放大；断开以后窗口归位、字号复原。不切到手机屏时，UU远程 和原版一样。" }],
  "",
];

/** 已经在 Mac 上进行到一半的会话（在讲 Snug 的目录结构和手势） */
export const ASK: Line = [{ t: "❯ ", c: DIM }, { t: "介绍一下这个项目的目录结构", bg: "#eef0f3" }];
export const ANSWER: readonly Line[] = [
  [{ t: "● ", c: INK }, { t: "代码分三层，依赖只往下走：" }, { t: "Snug", c: CC.blue }, { t: "（应用层）→ " }, { t: "SnugSystem", c: CC.blue }, { t: "（系统层）→ " }, { t: "SnugCore", c: CC.blue }, { t: "（纯逻辑层），这个方向写在 " }, { t: "Package.swift", c: CC.blue }, { t: " 里。" }],
  "",
  [{ t: "  - " }, { t: "SnugCore", c: CC.blue }, { t: " 只引入了 " }, { t: "Foundation", c: CC.blue }, { t: " 和 " }, { t: "CoreGraphics", c: CC.blue }, { t: "，不碰界面，也不直接调用系统功能" }],
  [{ t: "  - " }, { t: "SnugSystem", c: CC.blue }, { t: " 负责实现这些接口，所有直接操作 macOS 的代码都集中在这一层" }],
  [{ t: "  - " }, { t: "Snug", c: CC.blue }, { t: " 把上面两层组装起来，再加上菜单栏、设置和欢迎页" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(SnugCore/Touch/TouchTranslator.swift)" }],
  [{ t: "  ⎿  Read 186 lines", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "手势翻译在 " }, { t: "TouchTranslator", c: CC.blue }, { t: "：单指移动超过 10 点判定为滚动，松手按速度做惯性，约 0.8 秒停下；按住 0.5 秒再拖动判定为选字，按住 0.5 秒直接松开调出右键菜单。" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(scripts/snug check)" }],
  [{ t: "  ⎿  Build complete · 134 tests passed", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "构建通过，134 个测试全部通过。接下来可以挑一块深入：手机屏怎么调度窗口，或者手势怎么翻译。" }],
];
export const SESSION: readonly Line[] = [ASK, "", ...ANSWER];
/** 手势那一段在 SESSION 里是第几行（选字用） */
export const GESTURE_LINE = 2 + 9;

/** 接回会话时 Claude Code 先打的一段摘要（实机录屏里就是这样） */
export const RECAP: Line = [
  { t: "※ recap: ", c: DIM, b: true },
  { t: "你让我介绍 Snug 的目录结构，我已经讲完了：代码分为纯逻辑、系统、应用三层，依赖只往下走，另外还有测试、文档和发版脚本。接下来请你挑一块想深入了解的，比如手机屏调度或手势翻译。", c: DIM, i: true },
  { t: " (disable recaps in /config)", c: DIM },
];

/** Claude Code 的输入框和底部状态行；caret 为 true 时在输入的字后面放一个光标块 */
export const INPUT = (text: string, caret = false): Line[] => [
  [RULE],
  [{ t: "❯ ", c: INK }, { t: text }, ...(caret ? [{ t: " ", bg: INK }] : [])],
  [RULE],
  [{ t: "  ▸▸ auto mode on ", c: CC.brown }, { t: "(shift+tab to cycle)", c: DIM }],
];

/** /resume 的会话列表 */
export const RESUME_LIST: readonly Line[] = [
  [{ t: "Resume session", c: CC.purple, b: true }],
  [{ t: "╭", c: "#c9ccd2" }, { t: "─", c: "#c9ccd2", fill: true }, { t: "╮", c: "#c9ccd2" }],
  [{ t: "│ ", c: "#c9ccd2" }, { t: "⌕ Search…", c: DIM }, { t: " ", fill: true }, { t: "│", c: "#c9ccd2" }],
  [{ t: "╰", c: "#c9ccd2" }, { t: "─", c: "#c9ccd2", fill: true }, { t: "╯", c: "#c9ccd2" }],
  "",
  [{ t: "❯ ", c: CC.purple }, { t: "项目目录结构", c: CC.purple, b: true }],
  [{ t: "  57 seconds ago · main · 560.6KB", c: DIM }],
  [{ t: "  PR 14 修复方案" }],
  [{ t: "  3 minutes ago · main · 49.8MB", c: DIM }],
  [{ t: "  窗口铺满的边界情况" }],
  [{ t: "  2 hours ago · main · 1.2MB", c: DIM }],
];

/** 把几行截到第 n 个字符为止（流式输出用：已经吐出来的部分），截断处那一行只留前半截 */
export const cut = (lines: readonly Line[], n: number): Line[] => {
  const out: Line[] = [];
  let left = n;
  for (const l of lines) {
    const spans = toSpans(l);
    const len = spans.filter((s) => !s.fill).reduce((m, s) => m + [...s.t].length, 0);
    if (left >= len) {
      out.push(l);
      left -= len;
      continue;
    }
    const part: Span[] = [];
    for (const s of spans) {
      if (left <= 0) break;
      const chars = [...s.t];
      part.push({ ...s, t: chars.slice(0, left).join("") });
      left -= chars.length;
    }
    out.push(part);
    break;
  }
  return out;
};

const SPIN = ["✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳"];
/** Claude Code 干活时那一行：转动的小星 + 动词 + 秒数 */
export const working = (frame: number, verb = "Thinking", secs = 12): Line => [
  { t: `${SPIN[Math.floor(frame / 6) % SPIN.length]} `, c: CC.orange },
  { t: `${verb}… `, c: CC.orange },
  { t: `(${secs + Math.floor(frame / 60)}s · esc to interrupt)`, c: DIM },
];

/** 流式回答：before 是已经在屏上的，stream 从 from 帧起按字吐出，吐的时候底下有转圈行，最后是输入框 */
export const streaming = (before: readonly Line[], stream: readonly Line[], frame: number, from: number, cps = 3, verb = "Thinking"): Line[] => {
  const n = typedCount(frame, from, cps);
  const done = n >= charCount(stream);
  return [...before, ...cut(stream, n), ...(done ? [] : ["", working(frame, verb)]), "", ...INPUT("")];
};
