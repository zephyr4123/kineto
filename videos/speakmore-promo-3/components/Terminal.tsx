import { COLOR, MONO, SANS } from "../theme";

// 终端里的 git help push（man 页原文，Git 文档）。等宽字，字的位置都能直接算：划选、光标、卡片都按格子摆。
// 选中的是 DESCRIPTION 下面第一段，和 README 里那张划词实拍是同一段。

export const FONT = 24;
export const CHAR_W = FONT * 0.6;
export const LINE_H = 36;
const COLS = 80;
const PAD_X = 40;
const PAD_Y = 28;
const TITLE_H = 52;

const LINES = [
  "GIT-PUSH(1)                     Git Manual                     GIT-PUSH(1)",
  "",
  "NAME",
  "       git-push - Update remote refs along with associated objects",
  "",
  "SYNOPSIS",
  "       git push [--all | --branches | --mirror | --tags] [--follow-tags]",
  "                [--atomic] [-n | --dry-run] [--receive-pack=<git-receive-pack>]",
  "",
  "DESCRIPTION",
  "       Updates one or more branches, tags, or other references in a remote",
  "       repository from your local repository, and sends all necessary data",
  "       that isn't already on the remote.",
  "",
  "       The simplest way to push is git push <remote> <branch>. git push",
  "       origin main will push the local main branch to the main branch on",
  "       the remote named origin.",
  "",
  ":",
] as const;
const HEADINGS = new Set(["NAME", "SYNOPSIS", "DESCRIPTION"]);

/** 划选的那一段：第 10–12 行，从第 7 列（缩进之后）起到行尾 */
const SELECT_ROWS = [10, 11, 12] as const;
const SELECT_COL = 7;
const selectLen = (row: number) => LINES[row].length - SELECT_COL;
export const SELECT_TOTAL = SELECT_ROWS.reduce((n, row) => n + selectLen(row), 0);

export const TERM_W = COLS * CHAR_W + PAD_X * 2;
export const TERM_H = TITLE_H + PAD_Y * 2 + LINES.length * LINE_H;

const rowTop = (row: number) => TITLE_H + PAD_Y + row * LINE_H;
const colLeft = (col: number) => PAD_X + col * CHAR_W;

/** 选到第 n 个字时，选区的头在窗口里的哪儿（拖选时 I 形光标跟着它） */
export const selectionHead = (n: number) => {
  let left = Math.max(0, n);
  for (const row of SELECT_ROWS) {
    const len = selectLen(row);
    if (left <= len || row === SELECT_ROWS[SELECT_ROWS.length - 1]) {
      return { x: colLeft(SELECT_COL + Math.min(left, len)), y: rowTop(row) + LINE_H / 2 };
    }
    left -= len;
  }
  return { x: colLeft(SELECT_COL), y: rowTop(SELECT_ROWS[0]) };
};

/** 划词卡片的左上角：选区下方，左边对齐选区（App 里 place.mjs 的摆法） */
export const CARD_ANCHOR = { x: colLeft(SELECT_COL), y: rowTop(SELECT_ROWS[SELECT_ROWS.length - 1]) + LINE_H + 10 };

const Line: React.FC<{ row: number; selected: number }> = ({ row, selected }) => {
  const text = LINES[row];
  const heading = HEADINGS.has(text);
  const color = row === 0 || text === ":" ? COLOR.termDim : heading ? COLOR.termBright : COLOR.termInk;
  const index = SELECT_ROWS.indexOf(row as (typeof SELECT_ROWS)[number]);
  let picked = 0;
  if (index >= 0) {
    const before = SELECT_ROWS.slice(0, index).reduce((n, r) => n + selectLen(r), 0);
    picked = Math.min(selectLen(row), Math.max(0, selected - before));
  }
  return (
    <div style={{ position: "absolute", left: PAD_X, top: rowTop(row), height: LINE_H, lineHeight: `${LINE_H}px`, whiteSpace: "pre", color, fontWeight: heading ? 700 : 400 }}>
      {picked > 0 ? (
        <>
          {text.slice(0, SELECT_COL)}
          <span style={{ background: COLOR.termSelect, color: COLOR.termBright }}>{text.slice(SELECT_COL, SELECT_COL + picked)}</span>
          {text.slice(SELECT_COL + picked)}
        </>
      ) : (
        text
      )}
    </div>
  );
};

/** I 形文本光标（拖选时显示） */
export const IBeam: React.FC<{ x: number; y: number; opacity: number }> = ({ x, y, opacity }) => (
  <svg width={22} height={44} viewBox="0 0 11 22" style={{ position: "absolute", left: x - 11, top: y - 22, opacity, overflow: "visible" }}>
    <path d="M2 1h2.5c.6 0 1 .4 1 1v18c0 .6-.4 1-1 1H2M9 1H6.5c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1H9M3.5 11h4" fill="none" stroke="oklch(0.1 0 0)" strokeWidth={2.6} strokeLinecap="round" />
    <path d="M2 1h2.5c.6 0 1 .4 1 1v18c0 .6-.4 1-1 1H2M9 1H6.5c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1H9M3.5 11h4" fill="none" stroke="oklch(1 0 0)" strokeWidth={1.1} strokeLinecap="round" />
  </svg>
);

/** 一扇深色终端窗口；selected 是已经划选了多少个字 */
export const Terminal: React.FC<{ selected: number; children?: React.ReactNode }> = ({ selected, children }) => (
  <div
    style={{
      position: "relative",
      width: TERM_W,
      height: TERM_H,
      borderRadius: 18,
      background: COLOR.term,
      boxShadow: "0 0 0 1px oklch(1 0 0 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.06), 0 50px 120px -40px oklch(0.2 0.03 260 / 0.55)",
      fontFamily: `"${MONO}", monospace`,
      fontSize: FONT,
    }}
  >
    <div
      style={{
        height: TITLE_H,
        borderRadius: "18px 18px 0 0",
        background: COLOR.termBar,
        borderBottom: "1px solid oklch(1 0 0 / 0.06)",
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        gap: 10,
      }}
    >
      {["oklch(0.68 0.17 28)", "oklch(0.8 0.14 85)", "oklch(0.72 0.15 150)"].map((c) => (
        <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
      ))}
      <span style={{ flex: 1, textAlign: "center", marginRight: 72, fontFamily: SANS, fontSize: 18, color: COLOR.termDim }}>git help push</span>
    </div>
    {LINES.map((_, row) => (
      <Line key={row} row={row} selected={selected} />
    ))}
    {children}
  </div>
);
