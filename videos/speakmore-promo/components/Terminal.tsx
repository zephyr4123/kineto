import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { WINDOW } from "../theme";
import { MONO_STACK, Window } from "./Window";

// 终端：一行一行往下出，满了整屏往上推。敲的命令一个字一个字出来，光标停在最后一行。

export type Tone = "faint" | "green" | "bold";
export type Seg = { text: string; tone?: Tone };
/** at：这一行从哪一帧开始出现；typing：是一条命令，用多少帧敲完 */
export type Row = { at: number; segs: Seg[]; typing?: number };

const COLORS: Record<Tone, string> = { faint: WINDOW.termFaint, green: WINDOW.termGreen, bold: WINDOW.termText };

export const Terminal: React.FC<{
  frame: number;
  rows: readonly Row[];
  width: number;
  height: number;
  fontSize?: number;
  title?: string;
  style?: React.CSSProperties;
}> = ({ frame, rows, width, height, fontSize = 24, title, style }) => {
  const lh = Math.round(fontSize * 1.6);
  const pad = 30;
  const view = height - 52 - pad * 2;
  // 每一行出现时用 5 帧把画面往上推一行，满屏之后才推
  const shown = rows.reduce((sum, r) => sum + interpolate(frame, [r.at, r.at + 5], [0, 1], clamp), 0);
  const scroll = Math.max(0, shown * lh - view);
  const last = rows.reduce((found, r, i) => (frame >= r.at ? i : found), -1);
  const blink = Math.floor(frame / 28) % 2 === 0;

  return (
    <Window width={width} height={height} dark title={title} style={style}>
      <div style={{ position: "absolute", left: pad, right: pad, top: pad - scroll, fontFamily: MONO_STACK, fontSize, lineHeight: `${lh}px` }}>
        {rows.map((r, i) => {
          if (frame < r.at) return null;
          const typed = r.typing ? Math.floor(interpolate(frame, [r.at, r.at + r.typing], [0, 1], clamp) * length(r.segs)) : Number.POSITIVE_INFINITY;
          return (
            <div key={i} style={{ height: lh, whiteSpace: "pre", color: WINDOW.termText, opacity: r.typing ? 1 : interpolate(frame, [r.at, r.at + 4], [0, 1], clamp) }}>
              {r.typing ? <span style={{ color: COLORS.green }}>$ </span> : null}
              {cut(r.segs, typed).map((s, j) => (
                <span key={j} style={{ color: s.tone ? COLORS[s.tone] : undefined, fontWeight: s.tone === "bold" ? 700 : 400 }}>
                  {cells(s.text)}
                </span>
              ))}
              {i === last && r.typing ? (
                <span
                  style={{
                    display: "inline-block",
                    width: "0.6em",
                    height: "1.1em",
                    marginLeft: 2,
                    verticalAlign: "-0.2em",
                    background: WINDOW.termText,
                    opacity: blink || typed < length(r.segs) ? 0.85 : 0,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </Window>
  );
};

const length = (segs: readonly Seg[]) => segs.reduce((n, s) => n + [...s.text].length, 0);

/** 只留前 n 个字 */
const cut = (segs: readonly Seg[], n: number) => {
  const out: Seg[] = [];
  let left = n;
  for (const s of segs) {
    if (left <= 0) break;
    const chars = [...s.text];
    out.push({ ...s, text: chars.slice(0, left).join("") });
    left -= chars.length;
  }
  return out;
};

// 终端里中文和全角标点占两格：每个这样的字放进两格宽的盒子，和等宽的英文对齐，命令输出的几列才齐
const WIDE = /[\u1100-\u115f\u2e80-\u303e\u3041-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/;
const cells = (text: string) =>
  [...text].map((ch, i) =>
    WIDE.test(ch) ? (
      <span key={i} style={{ display: "inline-block", width: "1.2em", textAlign: "center" }}>
        {ch}
      </span>
    ) : (
      ch
    ),
  );
