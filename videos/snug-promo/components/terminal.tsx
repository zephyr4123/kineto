import { MONO } from "../theme";

// Ghostty 终端（浅色主题）和里面的 Claude Code。文字一行一行给，行内分段上色；选区按行内字符位置打底色。

export type Span = { t: string; c?: string; bg?: string; b?: boolean; i?: boolean };
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

const toSpans = (l: Line): Span[] => (typeof l === "string" ? [{ t: l }] : l);

/** 把一行切成选区内、选区外几段 */
const splitSel = (spans: Span[], sel?: Sel): (Span & { sel?: boolean })[] => {
  if (!sel) return spans;
  const out: (Span & { sel?: boolean })[] = [];
  let pos = 0;
  for (const s of spans) {
    const chars = [...s.t];
    const a = Math.max(0, Math.min(chars.length, sel.from - pos));
    const z = Math.max(0, Math.min(chars.length, sel.to - pos));
    if (a > 0) out.push({ ...s, t: chars.slice(0, a).join("") });
    if (z > a) out.push({ ...s, t: chars.slice(a, z).join(""), sel: true });
    if (z < chars.length) out.push({ ...s, t: chars.slice(Math.max(a, z)).join("") });
    pos += chars.length;
  }
  return out;
};

export const Terminal: React.FC<{
  lines: readonly Line[];
  size?: number;
  lineH?: number;
  pad?: number;
  scroll?: number;
  sel?: readonly Sel[];
  cursor?: boolean;
  bg?: string;
  selColor?: string;
}> = ({ lines, size = 16, lineH = 1.42, pad = 14, scroll = 0, sel = [], cursor = false, bg = "#fbfcfd", selColor = "rgba(64,140,255,0.32)" }) => (
  <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: pad, right: pad, top: pad - scroll, fontFamily: MONO, fontSize: size, lineHeight: lineH, color: INK, whiteSpace: "pre" }}>
      {lines.map((l, i) => {
        const spans = splitSel(toSpans(l), sel.find((s) => s.line === i));
        return (
          <div key={i} style={{ minHeight: size * lineH }}>
            {spans.map((s, j) => (
              <span
                key={j}
                style={{
                  color: s.c,
                  background: s.sel ? selColor : s.bg,
                  fontWeight: s.b ? 700 : undefined,
                  fontStyle: s.i ? "italic" : undefined,
                }}
              >
                {s.t}
              </span>
            ))}
            {cursor && i === lines.length - 1 ? <span style={{ display: "inline-block", width: size * 0.58, height: size * 1.1, background: INK, verticalAlign: "-0.18em", marginLeft: 1 }} /> : null}
          </div>
        );
      })}
    </div>
  </div>
);

const rule = (n = 52): Span[] => [{ t: "─".repeat(n), c: "#c9ccd2" }];
export const PROMPT: Span[] = [{ t: "snug % ", c: INK }];

/** Claude Code 启动时的横幅（v2 的样子：橙色小像素块 + 版本、模型、目录） */
export const BANNER: readonly Line[] = [
  [{ t: " ▐▛███▜▌ ", c: CC.orange }, { t: "  Claude Code ", b: true }, { t: "v2.1.323", c: DIM }],
  [{ t: "▝▜█████▛▘", c: CC.orange }, { t: "  Opus 5.5 with xhigh effort", c: DIM }],
  [{ t: "  ▘▘ ▝▝  ", c: CC.orange }, { t: "  Claude Max · ~/coding/personal/snug", c: DIM }],
];

/** 已经在 Mac 上进行到一半的会话（在讲 Snug 的目录结构和手势） */
export const SESSION: readonly Line[] = [
  [{ t: "❯ ", c: DIM }, { t: "介绍一下这个项目的目录结构", bg: "#eef0f3" }],
  "",
  [{ t: "● ", c: INK }, { t: "代码分三层，依赖只往下走：" }],
  [{ t: "  Snug", c: CC.blue }, { t: "（应用层）→ " }, { t: "SnugSystem", c: CC.blue }],
  [{ t: "  （系统层）→ " }, { t: "SnugCore", c: CC.blue }, { t: "（纯逻辑层）" }],
  "",
  [{ t: "  - " }, { t: "SnugCore", c: CC.blue }, { t: " 只引入 " }, { t: "Foundation", c: CC.blue }],
  "    不碰界面，也不直接调用系统功能",
  [{ t: "  - " }, { t: "SnugSystem", c: CC.blue }, { t: " 实现这些接口，所有" }],
  "    直接操作 macOS 的代码都在这一层",
  [{ t: "  - " }, { t: "Snug", c: CC.blue }, { t: " 把上面两层组装起来，" }],
  "    再加上菜单栏、设置和欢迎页",
  "",
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(SnugCore/Touch/TouchTranslator.swift)" }],
  [{ t: "  ⎿  Read 186 lines", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "手势翻译在 " }, { t: "TouchTranslator", c: CC.blue }, { t: "：" }],
  "  单指移动超过 10 点判定为滚动，",
  "  松手按速度做惯性，约 0.8 秒停下；",
  "  按住 0.5 秒再拖动判定为选字，",
  "  按住 0.5 秒直接松开调出右键菜单。",
  "",
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(scripts/snug check)" }],
  [{ t: "  ⎿  Build complete · 134 tests passed", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "构建通过，134 个测试全部通过。" }],
  "  接下来可以挑一块深入：",
  "  手机屏怎么调度窗口，或者手势怎么翻译",
];

/** Claude Code 的输入框和底部状态行 */
export const INPUT = (text: string): Line[] => [rule(), [{ t: "❯ ", c: INK }, { t: text }], rule(), [{ t: "  ▸▸ auto mode on ", c: CC.brown }, { t: "(shift+tab to cycle)", c: DIM }]];

/** /resume 的会话列表 */
export const RESUME_LIST: readonly Line[] = [
  [{ t: "Resume session", c: CC.purple, b: true }],
  [{ t: "╭──────────────────────────────────────────────╮", c: "#c9ccd2" }],
  [{ t: "│ ", c: "#c9ccd2" }, { t: "⌕ Search…", c: DIM }, { t: "                                    │", c: "#c9ccd2" }],
  [{ t: "╰──────────────────────────────────────────────╯", c: "#c9ccd2" }],
  "",
  [{ t: "❯ ", c: CC.purple }, { t: "项目目录结构", c: CC.purple, b: true }],
  [{ t: "  57 seconds ago · main · 560.6KB", c: DIM }],
  [{ t: "  PR 14 修复方案" }],
  [{ t: "  3 minutes ago · main · 49.8MB", c: DIM }],
  [{ t: "  窗口铺满的边界情况" }],
  [{ t: "  2 hours ago · main · 1.2MB", c: DIM }],
];

/** 会话更早的部分（往回翻时看到的）：读文档、看提交记录。行数是 Snug 仓库里这几个文件的真实行数 */
export const EARLY: readonly Line[] = [
  [{ t: "❯ ", c: DIM }, { t: "先读一遍仓库，了解整体设计", bg: "#eef0f3" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(README.md)" }],
  [{ t: "  ⎿  Read 197 lines", c: DIM }],
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(docs/how-it-works.md)" }],
  [{ t: "  ⎿  Read 75 lines", c: DIM }],
  [{ t: "● ", c: CC.green }, { t: "Read", b: true }, { t: "(docs/development.md)" }],
  [{ t: "  ⎿  Read 84 lines", c: DIM }],
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(git log --oneline | head -5)" }],
  [{ t: "  ⎿  58a9944 记忆：README 图片大小上限…", c: DIM }],
  [{ t: "     e35e594 README 演示动图：补上弹出键盘…", c: DIM }],
  [{ t: "     53b8520 记忆精简：删过时的、并重复的…", c: DIM }],
  "",
  [{ t: "● ", c: INK }, { t: "读完了。Snug 是一个菜单栏小工具：" }],
  "  手机连上 UU远程 时，Mac 上多出一块",
  "  540×950 点的竖屏，窗口放上去铺满，",
  "  终端和编辑器的字号随之放大；",
  "  断开以后窗口归位、字号复原。",
  "",
  "  不切到手机屏时，UU远程 和原版一样。",
  "",
];
