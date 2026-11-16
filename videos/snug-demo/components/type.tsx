import { interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo, outQuint, prog } from "../../../engine/motion";
import { clockAt, speedAt } from "../edl";
import { C, DISPLAY, MONO, SANS, SERIF, SLOGAN, TAGLINE } from "../theme";

// 画面上的字。分两类：
// - 跟着内容走的（标题、引线标注、打字回显）：直白地讲这一步是什么功能、有什么用，讲画面本身看不出来的东西；
//   副标题只在有信息时才写，写成一句平实的灰色说明。
// - 固定的（左上角录制时钟、倍速）随意一点：等宽小字，不加底板。

/** 逐字浮现：每个字从下往上、由虚到实；退场时反过来 */
const Chars: React.FC<{ text: string; frame: number; at: number; out: number; step?: number }> = ({ text, frame, at, out, step = 1.5 }) => {
  const chars = [...text];
  return (
    <>
      {chars.map((ch, i) => {
        const k = prog(frame, at + i * step, 20, outExpo);
        const o = prog(frame, out - 12 + i * 0.4, 12, outQuint);
        const v = k * (1 - o);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: v,
              transform: `translateY(${(1 - k) * 0.3 + o * -0.12}em)`,
              filter: `blur(${(1 - k) * 6 + o * 4}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
};

/** 灰色的一句补充说明：整句淡入、上浮一点 */
const Sub: React.FC<{ frame: number; at: number; out: number; text: string; size?: number }> = ({ frame, at, out, text, size = 30 }) => {
  const k = prog(frame, at, 22, outExpo) * (1 - prog(frame, out - 12, 12, outQuint));
  return (
    <div style={{ fontFamily: SANS, fontSize: size, fontWeight: 500, color: C.ink2, whiteSpace: "nowrap", opacity: k, transform: `translateY(${(1 - k) * 10}px)` }}>{text}</div>
  );
};

/** 标题：宋体一到两行，需要时下面一句灰色说明。x、y 是锚点，align 是对齐 */
export const Headline: React.FC<{
  frame: number;
  at: number;
  out: number;
  lines: readonly string[];
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  size?: number;
  sub?: string;
}> = ({ frame, at, out, lines, x, y, align = "left", size = 60, sub }) => {
  if (frame < at - 2 || frame > out + 2) return null;
  const shift = align === "left" ? "0" : align === "right" ? "-100%" : "-50%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${shift})`, textAlign: align }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, lineHeight: 1.22, letterSpacing: "0.02em", color: C.ink, whiteSpace: "nowrap" }}>
          <Chars text={l} frame={frame} at={at + i * 8} out={out} />
        </div>
      ))}
      {sub ? (
        <div style={{ marginTop: size * 0.32, display: "flex", justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}>
          <Sub frame={frame} at={at + 16 + lines.length * 6} out={out} text={sub} />
        </div>
      ) : null}
    </div>
  );
};

/**
 * 打字回显：手机上打的字同步放大在旁边（宋体），按录像里字出现的进度一个个冒出来，后面一根细光标。
 * from/to 是打字的起止帧（片子里），text 是最后打出来的完整内容。
 */
export const Echo: React.FC<{ frame: number; from: number; to: number; out: number; text: string; x: number; y: number; size?: number }> = ({
  frame,
  from,
  to,
  out,
  text,
  x,
  y,
  size = 80,
}) => {
  if (frame < from - 10 || frame > out) return null;
  const chars = [...text];
  const n = Math.round(interpolate(frame, [from, to], [0, chars.length], clamp));
  const show = interpolate(frame, [from - 10, from, out - 12, out], [0, 1, 1, 0], clamp);
  const caret = Math.floor(frame / 15) % 2 === 0 || frame < to;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", opacity: show, fontFamily: SERIF, fontWeight: 700, fontSize: size, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.1 }}>
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
  );
};

/**
 * 引线标注（画面坐标）：设备上的一个点 → 一根细线 → 一行宋体，需要时下面一句灰色说明。
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
  size = 42,
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
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, color: C.ink, lineHeight: 1.2 }}>
          <Chars text={title} frame={frame} at={at + 16} out={out + 100} />
        </div>
        {sub ? (
          <div style={{ marginTop: 8 }}>
            <Sub frame={frame} at={at + 30} out={out + 100} text={sub} size={26} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

/**
 * slogan 字标：「Make / UU Remote / Native / on iPhone」分主次排 —— 虚词 Make、on iPhone 小，产品名 UU Remote 中，
 * 关键词 Native 最大、用品牌蓝；左对齐，on iPhone 右对齐到 Native 的右缘。下面一道细线、中文 tagline，可再加一行灰字。
 * 宽度随最宽的一行（Native，约 600 像素）走；head 放在 Make 上面（图标）。at 是开始入场的帧。
 */
export const SloganLockup: React.FC<{ frame: number; at: number; note?: string; head?: React.ReactNode }> = ({ frame, at, note, head }) => {
  const words = SLOGAN.split(" ");
  const line = (text: string, d: number, style: React.CSSProperties) => {
    const k = prog(frame, at + d, 30, outExpo);
    return (
      <div style={{ overflow: "hidden", paddingBottom: "0.06em", ...style }}>
        <div style={{ transform: `translateY(${(1 - k) * 110}%)` }}>{text}</div>
      </div>
    );
  };
  const nk = prog(frame, at + 12, 44, outExpo);
  const rule = prog(frame, at + 30, 30, outExpo);
  const zh = prog(frame, at + 36, 26, outExpo);
  const small = prog(frame, at + 48, 26, outExpo);
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", fontFamily: DISPLAY, color: C.ink }}>
      {head}
      {line(words[0], 0, { fontSize: 60, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em", color: C.ink2 })}
      {line(`${words[1]} ${words[2]}`, 5, { fontSize: 134, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.045em", marginTop: 6 })}
      <div style={{ overflow: "hidden", fontSize: 252, fontWeight: 800, lineHeight: 0.84, letterSpacing: `${-0.06 + (1 - nk) * 0.04}em`, color: C.blue, paddingBottom: "0.04em", marginLeft: -8 }}>
        <div style={{ transform: `translateY(${(1 - nk) * 100}%) scale(${1.04 - 0.04 * nk})`, transformOrigin: "0 100%" }}>{words[3]}</div>
      </div>
      {line(`${words[4]} ${words[5]}`, 20, { fontSize: 74, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em", textAlign: "right", marginTop: -6 })}
      <div style={{ marginTop: 34, width: 120 * rule, height: 3, background: C.ink, opacity: 0.8 }} />
      <div style={{ marginTop: 24, fontFamily: SERIF, fontWeight: 700, fontSize: 48, letterSpacing: "0.04em", color: C.ink, whiteSpace: "nowrap", opacity: zh, transform: `translateY(${(1 - zh) * 14}px)` }}>{TAGLINE}</div>
      {note ? (
        <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.ink2, whiteSpace: "nowrap", opacity: small, transform: `translateY(${(1 - small) * 10}px)` }}>{note}</div>
      ) : null}
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
    <div style={{ position: "absolute", left: 60, top: 92, display: "flex", alignItems: "center", gap: 14, opacity: o, fontFamily: MONO, fontSize: 24, fontWeight: 600, color: C.ink, textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}>
      <span style={{ width: 13, height: 13, borderRadius: 7, background: C.red, opacity: blink }} />
      <span style={{ letterSpacing: "0.12em" }}>REC</span>
      <span style={{ color: C.ink2, fontVariantNumeric: "tabular-nums" }}>{hms(clockAt(frame))}</span>
      {fast ? <span style={{ color: C.ink2 }}>▸▸ {Number.isInteger(r) ? r : r.toFixed(1)}×</span> : null}
    </div>
  );
};
