import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { C, ZH } from "../theme";

// 转场和点缀：砸下时的白闪、冲击波、扫光，快速移动时的方向模糊，指向画面某一点的标注，贴在手机边上的小标签。
// 都是帧的纯函数，按需叠在场景里。

/** 白闪：at 起一下亮到 max，dur 帧内退掉。中间亮、四周淡 */
export const Flash: React.FC<{ at: number; dur?: number; max?: number; x?: number; y?: number }> = ({ at, dur = 16, max = 0.85, x = 50, y = 50 }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const o = max * (1 - (f - at) / dur) ** 2;
  return <AbsoluteFill style={{ background: `radial-gradient(70% 55% at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, rgba(235,245,255,${o * 0.6}) 55%, rgba(220,235,255,${o * 0.25}) 100%)`, zIndex: 20, pointerEvents: "none" }} />;
};

/** 冲击波：从 (x, y) 扩开的一圈蓝光 */
export const Shock: React.FC<{ at: number; x: number; y: number; size?: number; dur?: number; color?: string }> = ({ at, x, y, size = 900, dur = 26, color = "31,99,255" }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const p = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: outExpo });
  const r = (size / 2) * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        border: `${10 * (1 - p) + 2}px solid rgba(${color},${0.7 * (1 - p)})`,
        boxShadow: `0 0 ${60 * (1 - p)}px rgba(${color},${0.5 * (1 - p)}), inset 0 0 ${40 * (1 - p)}px rgba(${color},${0.3 * (1 - p)})`,
        zIndex: 19,
        pointerEvents: "none",
      }}
    />
  );
};

/** 扫光：一道斜着的亮带从左上扫到右下 */
export const Sweep: React.FC<{ at: number; dur?: number; strength?: number }> = ({ at, dur = 22, strength = 0.7 }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const p = interpolate(f, [at, at + dur], [-0.3, 1.3], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(115deg, transparent ${(p - 0.1) * 100}%, rgba(255,255,255,${strength}) ${p * 100}%, rgba(180,225,255,${strength * 0.5}) ${(p + 0.03) * 100}%, transparent ${(p + 0.12) * 100}%)`,
        mixBlendMode: "screen",
        zIndex: 18,
        pointerEvents: "none",
      }}
    />
  );
};

/**
 * 方向模糊：快速移动的东西沿运动方向拖一点虚影（SVG 高斯模糊分 x、y 两个方向）。sx、sy 是两个方向的模糊半径（像素），
 * 都很小时不加滤镜。id 在同一帧里要唯一。
 */
export const Smear: React.FC<{ id: string; sx: number; sy: number; children: React.ReactNode }> = ({ id, sx, sy, children }) => {
  const on = Math.abs(sx) > 0.4 || Math.abs(sy) > 0.4;
  return (
    <>
      {on ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={`${Math.abs(sx)} ${Math.abs(sy)}`} />
          </filter>
        </svg>
      ) : null}
      <AbsoluteFill style={{ filter: on ? `url(#${id})` : undefined }}>{children}</AbsoluteFill>
    </>
  );
};

/** 一段运动的速度（像素/帧），给 Smear 用：v(f) 是位置函数 */
export const speed = (v: (f: number) => number, f: number) => v(f + 0.5) - v(f - 0.5);

/**
 * 标注：画面上 (x, y) 一个点，一根细线连到标签 (tx, ty)。at 起点先亮、线再画出去、标签最后弹出；until 起退掉。
 * side：标签在线的哪一头展开（left 往左排字，right 往右）。
 */
export const Callout: React.FC<{ at: number; until?: number; x: number; y: number; tx: number; ty: number; text: string; side?: "left" | "right" }> = ({
  at,
  until = Infinity,
  x,
  y,
  tx,
  ty,
  text,
  side = tx < x ? "left" : "right",
}) => {
  const f = useCurrentFrame();
  const dot = interpolate(f, [at, at + 6], [0, 1], { ...clamp, easing: outExpo });
  const line = interpolate(f, [at + 2, at + 12], [0, 1], { ...clamp, easing: outExpo });
  const label = interpolate(f, [at + 8, at + 18], [0, 1], { ...clamp, easing: outExpo });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 8], [0, 1], clamp) : 0;
  if (dot <= 0 || out >= 1) return null;
  const ex = x + (tx - x) * line;
  const ey = y + (ty - y) * line;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, zIndex: 12, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
        <line x1={x} y1={y} x2={ex} y2={ey} stroke={C.blue} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x} cy={y} r={11 * dot} fill="rgba(31,99,255,0.18)" />
        <circle cx={x} cy={y} r={6 * dot} fill={C.blue} stroke="#fff" strokeWidth={2.5} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: ty - 30,
          left: side === "right" ? tx + 8 : undefined,
          right: side === "left" ? 1080 - tx + 8 : undefined,
          opacity: label,
          transform: `translateX(${(1 - label) * (side === "right" ? -16 : 16)}px)`,
          padding: "10px 22px",
          borderRadius: 30,
          background: "rgba(255,255,255,0.94)",
          border: "1.5px solid rgba(31,99,255,0.18)",
          boxShadow: "0 10px 30px rgba(20,40,90,0.14)",
          fontFamily: ZH,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: C.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/**
 * 小标签：贴在手机边上，说明这台是谁（「UU远程 原版」「+ Snug」）或这一下的结果。
 * tone：plain 白底灰字，snug 蓝底白字，dim 半透明。center 为 true 时 x 是标签的中心。
 */
export const Chip: React.FC<{ at: number; until?: number; x: number; y: number; text: string; tone?: "plain" | "snug" | "dim"; center?: boolean; size?: number }> = ({
  at,
  until = Infinity,
  x,
  y,
  text,
  tone = "plain",
  center = false,
  size = 30,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: outExpo });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  if (p <= 0 || out >= 1) return null;
  const bg = tone === "snug" ? `linear-gradient(135deg, ${C.blue}, ${C.cyan})` : tone === "dim" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.95)";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${center ? "-50%" : "0"}, ${(1 - p) * 12}px) scale(${0.9 + 0.1 * p})`,
        opacity: p * (1 - out),
        padding: `${size * 0.3}px ${size * 0.75}px`,
        borderRadius: size,
        background: bg,
        border: tone === "snug" ? "none" : "1.5px solid rgba(20,40,90,0.1)",
        boxShadow: tone === "snug" ? "0 10px 28px rgba(31,99,255,0.35)" : "0 8px 24px rgba(20,40,90,0.12)",
        fontFamily: ZH,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.05em",
        color: tone === "snug" ? "#fff" : tone === "dim" ? C.ink3 : C.ink2,
        whiteSpace: "nowrap",
        zIndex: 13,
      }}
    >
      {text}
    </div>
  );
};
