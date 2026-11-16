import { interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo, outQuint, prog } from "../../../engine/motion";
import { clockAt, speedAt } from "../edl";
import { C, MONO, SERIF } from "../theme";

// 画面上的字。分两类：
// - 跟着内容走的（标题、日志行、打字回显、引线标注）要讲究：宋体逐字带一点模糊浮现，日志行照 Snug 的真实日志打出来；
// - 固定的（左上角录制时钟、倍速）随意一点：等宽小字，不加底板。
// 不用英文小标、不用圆点分隔、不用胶囊，免得一看就是同一个模板里出来的。

/** 逐字浮现：每个字从下往上、由虚到实；退场时反过来 */
const Chars: React.FC<{ text: string; frame: number; at: number; out: number; step?: number }> = ({ text, frame, at, out, step = 2 }) => {
  const chars = [...text];
  return (
    <>
      {chars.map((ch, i) => {
        const k = prog(frame, at + i * step, 20, outExpo);
        const o = prog(frame, out - 12 + i * 0.6, 12, outQuint);
        const v = k * (1 - o);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: v,
              transform: `translateY(${(1 - k) * 0.32 + o * -0.12}em)`,
              filter: `blur(${(1 - k) * 7 + o * 5}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
};

/** 等宽的日志行：像终端一样一个字一个字打出来，末尾一个闪烁的块光标，打完 1 秒后光标消失 */
export const LogLine: React.FC<{ frame: number; at: number; out: number; text: string; size?: number; color?: string }> = ({
  frame,
  at,
  out,
  text,
  size = 24,
  color = C.ink2,
}) => {
  if (frame < at || frame > out) return null;
  const chars = [...text];
  const n = Math.floor(interpolate(frame, [at, at + chars.length * 1.6], [0, chars.length], clamp));
  const doneAt = at + chars.length * 1.6;
  const caret = frame < doneAt + 60 && Math.floor((frame - at) / 16) % 2 === 0;
  const o = interpolate(frame, [out - 10, out], [1, 0], clamp);
  return (
    <div style={{ fontFamily: MONO, fontSize: size, fontWeight: 500, color, opacity: o, whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
      {chars.slice(0, n).join("")}
      <span style={{ display: "inline-block", width: size * 0.55, height: size * 1.05, marginLeft: 3, verticalAlign: "-0.18em", background: caret ? color : "transparent" }} />
    </div>
  );
};

/**
 * 标题：宋体一到两行（或竖排两列），下面一道细线，再下面是一行行日志（各自在 at 那一帧打出来）。
 * x、y 是锚点；align 是横排时的对齐；vertical 时 x 是最右一列的右边。
 */
export const Headline: React.FC<{
  frame: number;
  at: number;
  out: number;
  lines: readonly string[];
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  size?: number;
  vertical?: boolean;
  logs?: readonly { at: number; text: string }[];
}> = ({ frame, at, out, lines, x, y, align = "left", size = 92, vertical = false, logs = [] }) => {
  if (frame < at - 2 || frame > out + 2) return null;
  const rule = prog(frame, at + 10, 26, outExpo) * (1 - prog(frame, out - 12, 12));
  const shift = align === "left" ? "0" : align === "right" ? "-100%" : "-50%";
  const head = vertical ? (
    <div style={{ display: "flex", flexDirection: "row-reverse", gap: size * 0.32, alignItems: "flex-start" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ writingMode: "vertical-rl", fontFamily: SERIF, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: "0.08em", color: C.ink, marginTop: i * size * 0.9 }}>
          <Chars text={l} frame={frame} at={at + i * 8} out={out} step={3} />
        </div>
      ))}
    </div>
  ) : (
    <div style={{ textAlign: align }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: size, lineHeight: 1.16, letterSpacing: "0.02em", color: C.ink, whiteSpace: "nowrap" }}>
          <Chars text={l} frame={frame} at={at + i * 7} out={out} />
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: vertical ? "translateX(-100%)" : `translateX(${shift})` }}>
      {head}
      {logs.length ? (
        <div style={{ marginTop: size * 0.3, display: "flex", flexDirection: "column", gap: 8, alignItems: vertical ? "flex-end" : align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}>
          <div style={{ width: 150 * rule, height: 2, background: "rgba(20,24,33,0.28)", marginBottom: 6 }} />
          {logs.map((l) => (
            <div key={l.text} style={{ height: 32 }}>
              <LogLine frame={frame} at={l.at} out={out} text={l.text} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/**
 * 打字回显：手机上打的字同步放大在旁边（宋体），按录像里字出现的进度一个个冒出来，后面一根细光标。
 * from/to 是打字的起止帧（片子里），text 是最后打出来的完整内容。
 */
export const Echo: React.FC<{ frame: number; from: number; to: number; out: number; text: string; x: number; y: number; size?: number; align?: "left" | "center" | "right"; note?: string }> = ({
  frame,
  from,
  to,
  out,
  text,
  x,
  y,
  size = 84,
  align = "center",
  note,
}) => {
  if (frame < from - 10 || frame > out) return null;
  const chars = [...text];
  const n = Math.round(interpolate(frame, [from, to], [0, chars.length], clamp));
  const show = interpolate(frame, [from - 10, from, out - 12, out], [0, 1, 1, 0], clamp);
  const caret = Math.floor(frame / 15) % 2 === 0 || frame < to;
  const shift = align === "left" ? "0" : align === "right" ? "-100%" : "-50%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${shift})`, opacity: show, textAlign: align }}>
      {note ? <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, color: C.ink2, marginBottom: 12 }}>{note}</div> : null}
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.1 }}>
        {chars.map((ch, i) => {
          const k = prog(frame, from + ((to - from) * i) / chars.length, 10, outExpo);
          return (
            <span key={i} style={{ display: "inline-block", opacity: i < n ? k : 0, transform: `translateY(${(1 - k) * 0.2}em)` }}>
              {ch}
            </span>
          );
        })}
        <span style={{ display: "inline-block", width: size * 0.06, height: size * 0.95, marginLeft: size * 0.08, verticalAlign: "-0.12em", background: caret ? C.blue : "transparent" }} />
      </div>
    </div>
  );
};

/**
 * 引线标注（世界坐标）：设备上的一个点 → 一根细线 → 一行宋体 + 一行等宽小字。
 * 点先冒出来，线再画过去，字最后浮现。
 */
export const Label: React.FC<{ frame: number; at: number; out: number; anchor: { x: number; y: number }; to: { x: number; y: number }; title: string; sub?: string; size?: number }> = ({
  frame,
  at,
  out,
  anchor,
  to,
  title,
  sub,
  size = 40,
}) => {
  if (frame < at || frame > out) return null;
  const dot = prog(frame, at, 14, outExpo);
  const line = prog(frame, at + 6, 18, outQuint);
  const o = interpolate(frame, [out - 12, out], [1, 0], clamp);
  const right = to.x >= anchor.x;
  const ex = anchor.x + (to.x - anchor.x) * line;
  const ey = anchor.y + (to.y - anchor.y) * line;
  return (
    <div style={{ opacity: o }}>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        <line x1={anchor.x} y1={anchor.y} x2={ex} y2={ey} stroke="rgba(20,24,33,0.55)" strokeWidth={2} />
        <circle cx={anchor.x} cy={anchor.y} r={9 * dot} fill="#fff" stroke={C.ink} strokeWidth={2.5} />
        <circle cx={anchor.x} cy={anchor.y} r={3.5 * dot} fill={C.ink} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: to.x,
          top: to.y,
          transform: `translate(${right ? "14px" : "calc(-100% - 14px)"}, -50%)`,
          textAlign: right ? "left" : "right",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, color: C.ink, lineHeight: 1.15 }}>
          <Chars text={title} frame={frame} at={at + 16} out={out + 100} step={1.5} />
        </div>
        {sub ? (
          <div style={{ marginTop: 6 }}>
            <LogLine frame={frame} at={at + 26} out={out + 100} text={sub} size={22} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const hms = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

/** 左上角的录制角标：红点 + REC + 录制当时的真实时钟（随剪辑跳、随加速快走），加速的段后面跟一个倍速 */
export const Hud: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const o = interpolate(frame, [from, from + 20, to - 20, to], [0, 1, 1, 0], clamp);
  const s = speedAt(frame);
  const fast = s > 1.15;
  const blink = Math.floor(frame / 30) % 2 === 0 ? 1 : 0.35;
  const r = Math.round(s * 10) / 10;
  return (
    <div style={{ position: "absolute", left: 60, top: 108, display: "flex", alignItems: "center", gap: 14, opacity: o, fontFamily: MONO, fontSize: 24, fontWeight: 600, color: C.ink, textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}>
      <span style={{ width: 13, height: 13, borderRadius: 7, background: C.red, opacity: blink }} />
      <span style={{ letterSpacing: "0.12em" }}>REC</span>
      <span style={{ color: C.ink2, fontVariantNumeric: "tabular-nums" }}>{hms(clockAt(frame))}</span>
      {fast ? <span style={{ color: C.ink2 }}>▸▸ {Number.isInteger(r) ? r : r.toFixed(1)}×</span> : null}
    </div>
  );
};
