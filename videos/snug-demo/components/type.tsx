import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { backOut, clamp, outExpo, outQuint, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";
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
 * Snug 字标：图标和大号「Snug」并排居中，下面一行 slogan 当副标题（Native 用品牌蓝），再下面是中文 tagline，可再加一行灰字。
 * 整块居中排；detail 是 slogan 以下各行的透明度（开场缩到顶上时只留图标、Snug 和 slogan）。at 是开始入场的帧。
 */
export const Lockup: React.FC<{ frame: number; at: number; note?: string; detail?: number }> = ({ frame, at, note, detail = 1 }) => {
  const icon = prog(frame, at, 34, backOut);
  const iconIn = prog(frame, at, 14, outQuint);
  const words = SLOGAN.split(" ");
  const zh = prog(frame, at + 58, 26, outExpo) * detail;
  const small = prog(frame, at + 70, 26, outExpo) * detail;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: DISPLAY, color: C.ink, whiteSpace: "nowrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <Img
          src={staticFile(assets.snugIcon)}
          style={{ width: 176, height: 176, borderRadius: 40, boxShadow: "0 22px 48px rgba(31,99,255,0.24)", opacity: iconIn, transform: `scale(${0.6 + 0.4 * icon})` }}
        />
        <div style={{ display: "flex", overflow: "hidden", fontSize: 236, fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.05em", padding: "0 0.04em 0.12em 0", marginBottom: "-0.06em" }}>
          {[..."Snug"].map((ch, i) => {
            const k = prog(frame, at + 8 + i * 4, 34, outExpo);
            return (
              <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - k) * 110}%)` }}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 30, fontSize: 54, fontWeight: 600, letterSpacing: "-0.015em", display: "flex", gap: "0.26em" }}>
        {words.map((w, i) => {
          const k = prog(frame, at + 30 + i * 4, 26, outExpo);
          const key = w === "Native";
          return (
            <span key={i} style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 0.5}em)`, filter: `blur(${(1 - k) * 6}px)`, color: key ? C.blue : C.ink, fontWeight: key ? 800 : 600 }}>
              {w}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 42, fontFamily: SERIF, fontWeight: 700, fontSize: 46, letterSpacing: "0.04em", opacity: zh, transform: `translateY(${(1 - zh) * 14}px)` }}>{TAGLINE}</div>
      {note ? (
        <div style={{ marginTop: 16, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.ink2, opacity: small, transform: `translateY(${(1 - small) * 10}px)` }}>{note}</div>
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
