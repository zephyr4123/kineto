import { COLOR, MONO, SANS } from "../theme";

// 深色终端窗口。等宽字，字的位置都能直接算：划选、光标、卡片都按格子摆。片子里有两页：
// 划词翻译一段的 git help push（man 页原文，Git 文档），选中 DESCRIPTION 下面第一段，和 README 里那张划词实拍是同一段；
// 开场的 git pull 报错（git 的原样输出），选中 fatal 那一行。

const FONT = 24;
const CHAR_W = FONT * 0.6;
const LINE_H = 36;
const PAD_X = 40;
const PAD_Y = 28;
const TITLE_H = 52;

/** 一页终端：窗口标题、宽多少列、每行的字；dim 是暗一点的行，bold 是标题行；select 是划选的那几行，从第 col 列起到行尾 */
export type TermPage = {
  title: string;
  cols: number;
  lines: readonly string[];
  dim?: readonly number[];
  bold?: readonly number[];
  select: { rows: readonly number[]; col: number };
};

export const MAN_PUSH: TermPage = {
  title: "git help push",
  cols: 80,
  lines: [
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
  ],
  dim: [0, 18],
  bold: [2, 5, 9],
  select: { rows: [10, 11, 12], col: 7 },
};

/** 开场：拉代码时 git 报的错；下面留几行空，划词卡片挂在 fatal 那行下面 */
export const PULL_FATAL: TermPage = {
  title: "zsh",
  cols: 46,
  lines: ["$ git pull origin main", "From github.com:zephyr4123/speakmore", " * branch            main       -> FETCH_HEAD", "fatal: refusing to merge unrelated histories", "", "", "", "", "", ""],
  dim: [1, 2],
  select: { rows: [3], col: 0 },
};

export const termSize = (page: TermPage) => ({ w: page.cols * CHAR_W + PAD_X * 2, h: TITLE_H + PAD_Y * 2 + page.lines.length * LINE_H });

const rowTop = (row: number) => TITLE_H + PAD_Y + row * LINE_H;
const colLeft = (col: number) => PAD_X + col * CHAR_W;
const selectLen = (page: TermPage, row: number) => page.lines[row].length - page.select.col;

/** 一共能选多少个字 */
export const selectTotal = (page: TermPage) => page.select.rows.reduce((n, row) => n + selectLen(page, row), 0);

/** 选到第 n 个字时，选区的头在窗口里的哪儿（拖选时 I 形光标跟着它） */
export const selectionHead = (page: TermPage, n: number) => {
  const { rows, col } = page.select;
  let left = Math.max(0, n);
  for (const row of rows) {
    const len = selectLen(page, row);
    if (left <= len || row === rows[rows.length - 1]) {
      return { x: colLeft(col + Math.min(left, len)), y: rowTop(row) + LINE_H / 2 };
    }
    left -= len;
  }
  return { x: colLeft(col), y: rowTop(rows[0]) };
};

/** 划词卡片的左上角：选区下方，左边对齐选区（App 里 place.mjs 的摆法） */
export const cardAnchor = (page: TermPage) => {
  const { rows, col } = page.select;
  return { x: colLeft(col), y: rowTop(rows[rows.length - 1]) + LINE_H + 10 };
};

const Line: React.FC<{ page: TermPage; row: number; selected: number }> = ({ page, row, selected }) => {
  const text = page.lines[row];
  const bold = page.bold?.includes(row) ?? false;
  const color = page.dim?.includes(row) ? COLOR.termDim : bold ? COLOR.termBright : COLOR.termInk;
  const { rows, col } = page.select;
  const index = rows.indexOf(row);
  let picked = 0;
  if (index >= 0) {
    const before = rows.slice(0, index).reduce((n, r) => n + selectLen(page, r), 0);
    picked = Math.min(selectLen(page, row), Math.max(0, selected - before));
  }
  return (
    <div style={{ position: "absolute", left: PAD_X, top: rowTop(row), height: LINE_H, lineHeight: `${LINE_H}px`, whiteSpace: "pre", color, fontWeight: bold ? 700 : 400 }}>
      {picked > 0 ? (
        <>
          {text.slice(0, col)}
          <span style={{ background: COLOR.termSelect, color: COLOR.termBright }}>{text.slice(col, col + picked)}</span>
          {text.slice(col + picked)}
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

/** 一扇深色终端窗口，显示 page 这一页；selected 是已经划选了多少个字 */
export const Terminal: React.FC<{ page: TermPage; selected: number; children?: React.ReactNode }> = ({ page, selected, children }) => {
  const { w, h } = termSize(page);
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
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
        <span style={{ flex: 1, textAlign: "center", marginRight: 72, fontFamily: SANS, fontSize: 18, color: COLOR.termDim }}>{page.title}</span>
      </div>
      {page.lines.map((_, row) => (
        <Line key={row} page={page} row={row} selected={selected} />
      ))}
      {children}
    </div>
  );
};
