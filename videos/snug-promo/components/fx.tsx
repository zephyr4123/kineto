import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { BLUE_FILL, C, ZH } from "../theme";

// 转场和点缀：砸下时的白闪、冲击波、扫光，快速移动时的方向模糊，用箭头指向画面某一点的标注，贴在手机边上的小标签。
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

type Side = "left" | "right" | "up" | "down";
/** 标签相对箭头出发点怎么摆：right 标签在点的右边（点在标签左边缘正中），up 标签在点的上面（点在标签下边缘正中），以此类推 */
const ANCHOR: Record<Side, { t: string; o: string }> = {
  right: { t: "translate(0, -50%)", o: "0% 50%" },
  left: { t: "translate(-100%, -50%)", o: "100% 50%" },
  up: { t: "translate(-50%, -100%)", o: "50% 100%" },
  down: { t: "translate(-50%, 0)", o: "50% 0%" },
};

/** 标签：白底深字（plain）或蓝底白字（snug）；note 是主文字上面一行小字，先说动作、再说结果 */
const Label: React.FC<{ text: string; note?: string; tone: "plain" | "snug"; size: number }> = ({ text, note, tone, size }) => {
  const snug = tone === "snug";
  return (
    <div
      style={{
        padding: `${Math.round(size * 0.26)}px ${Math.round(size * 0.52)}px`,
        borderRadius: Math.round(size * 0.46),
        background: snug ? BLUE_FILL : "rgba(255,255,255,0.97)",
        border: snug ? "none" : "1.5px solid rgba(6,56,232,0.14)",
        boxShadow: snug ? "0 14px 34px rgba(6,56,232,0.32)" : "0 14px 34px rgba(20,40,90,0.18)",
        fontFamily: ZH,
        fontWeight: 600,
        whiteSpace: "nowrap",
        textAlign: "center",
      }}
    >
      {note ? <div style={{ fontSize: Math.round(size * 0.64), lineHeight: 1.3, letterSpacing: "0.04em", color: snug ? "#fff" : C.ink2 }}>{note}</div> : null}
      <div style={{ fontSize: size, lineHeight: 1.25, letterSpacing: "0.04em", color: snug ? "#fff" : C.ink }}>{text}</div>
    </div>
  );
};

/**
 * 标注：一支箭头从标签指到画面上的 (x, y)。at 起标签弹出、箭头画过去、箭头落点漾开一圈；until 起退掉。
 * (tx, ty) 是箭头从标签哪一点出发，side 是标签往哪边展开（见 ANCHOR）。bend 是箭头弯多少（0 是直线，正负是往哪边弯）。
 * 箭头深蓝、外面描一圈白，落在深色的远程画面上也看得清。
 */
export const Callout: React.FC<{
  at: number;
  until?: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  text: string;
  note?: string;
  side?: Side;
  tone?: "plain" | "snug";
  size?: number;
  bend?: number;
}> = ({ at, until = Infinity, x, y, tx, ty, text, note, side = tx < x ? "left" : "right", tone = "plain", size = 46, bend = 0.18 }) => {
  const f = useCurrentFrame();
  const label = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: outExpo });
  const line = interpolate(f, [at + 4, at + 16], [0, 1], { ...clamp, easing: outExpo });
  const head = interpolate(f, [at + 13, at + 17], [0, 1], clamp);
  const ring = interpolate(f, [at + 15, at + 34], [0, 1], clamp);
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 8], [0, 1], clamp) : 0;
  if (label <= 0 || out >= 1) return null;
  // 二次曲线：控制点在中点往一侧偏 bend × 长度
  const dx = x - tx;
  const dy = y - ty;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (tx + x) / 2 - (dy / len) * bend * len;
  const cy = (ty + y) / 2 + (dx / len) * bend * len;
  const d = `M ${tx} ${ty} Q ${cx} ${cy} ${x} ${y}`;
  // 箭头朝向：曲线在终点的切线
  const ang = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  const anchor = ANCHOR[side];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, zIndex: 12, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <path d={d} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
        <path d={d} fill="none" stroke={C.deep} strokeWidth={4.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
        {ring > 0 && ring < 1 ? <circle cx={x} cy={y} r={8 + 26 * ring} fill="none" stroke={C.deep} strokeWidth={3} opacity={0.7 * (1 - ring)} /> : null}
        <g transform={`translate(${x} ${y}) rotate(${ang})`} opacity={head}>
          <path d="M 0 0 L -22 -12 L -22 12 Z" fill={C.deep} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: tx, top: ty, transform: `${anchor.t} scale(${0.86 + 0.14 * label})`, transformOrigin: anchor.o, opacity: label }}>
        <Label text={text} note={note} tone={tone} size={size} />
      </div>
    </div>
  );
};

/** 标签：贴在手机边上，说明这台是谁（「UU远程 原版」）。白底深字；center 为 true 时 x 是标签的中心 */
export const Chip: React.FC<{ at: number; until?: number; x: number; y: number; text: string; center?: boolean; size?: number }> = ({ at, until = Infinity, x, y, text, center = false, size = 40 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: outExpo });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  if (p <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${center ? "-50%" : "0"}, ${(1 - p) * 12}px) scale(${0.9 + 0.1 * p})`,
        opacity: p * (1 - out),
        padding: `${size * 0.28}px ${size * 0.7}px`,
        borderRadius: size,
        background: "rgba(255,255,255,0.97)",
        border: "1.5px solid rgba(20,40,90,0.1)",
        boxShadow: "0 8px 24px rgba(20,40,90,0.14)",
        fontFamily: ZH,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.05em",
        color: C.ink,
        whiteSpace: "nowrap",
        zIndex: 13,
      }}
    >
      {text}
    </div>
  );
};
