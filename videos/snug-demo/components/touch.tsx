import { interpolate } from "remotion";
import { clamp, inOutQuint, outExpo, outQuint } from "../../../engine/motion";
import { at, inCut, srcAt } from "../edl";
import { C } from "../theme";
import { TOUCH_DRAGS, TOUCH_SWIPES, TOUCH_TAPS } from "../touch";
import { phonePt } from "./devices";

// 手机上的手指：录像里 UU 的鼠标箭头已经抹掉，这里按 touch.ts 里量出来的每一次操作，画一根半透明的手指 ——
// 点按：悬停靠近 → 按下（指腹下一圈接触印 + 一道涟漪）→ 抬起离开；
// 上滑：从底部指示条往上推；拖动：在量出来的落指点按下、跟着内容走，甩动时先抬手、内容自己滑完。
// 坐标是远程画面里的点（440×774），画在 IPhone 的 hand 层里，跟着手机一起倾斜、缩放。

type State = { x: number; y: number; on: number; lift: number; press: number; ripple?: number; trail?: { x: number; y: number }[] } | null;

// 甩动时手指只跟内容走一小段就抬起，量出来的抬手帧有时只有 1–4 帧，画出来手指几乎不动：
// 保底让手指至少跟 4 帧、走出 160 像素（不超过内容实际滚动的距离），最多走 560 像素
const MIN_LIFT = 4;
const MIN_TRAVEL = 160;
const MAX_TRAVEL = 560;

/** 第 g 帧（成片）手指的状态；同一时刻只会有一个手势。落在剪掉的素材里的手势不画 */
const stateAt = (g: number): State => {
  for (const tap of TOUCH_TAPS) {
    if (!inCut(tap.t)) continue;
    const f = at(tap.t);
    if (g < f - 18 || g > f + 24) continue;
    const p = phonePt(tap.x, tap.y);
    const lift = interpolate(g, [f - 18, f - 2, f + 6, f + 16], [1, 0, 0, 0.8], { ...clamp, easing: inOutQuint });
    const on = interpolate(g, [f - 18, f - 10, f + 14, f + 24], [0, 1, 1, 0], clamp);
    const press = interpolate(g, [f - 3, f, f + 6, f + 9], [0, 1, 1, 0], clamp);
    return { x: p.x, y: p.y, on, lift, press, ripple: g - f };
  }
  for (const sw of TOUCH_SWIPES) {
    if (!inCut(sw.from)) continue;
    const f0 = at(sw.from);
    const f1 = at(sw.to);
    if (g < f0 - 16 || g > f1 + 16) continue;
    const k = interpolate(g, [f0, f1], [0, 1], { ...clamp, easing: inOutQuint });
    const a = phonePt(sw.x, 1856);
    const b = phonePt(sw.x, 1540);
    const y = a.y + (b.y - a.y) * k;
    const lift = interpolate(g, [f0 - 16, f0 - 2, f1, f1 + 12], [1, 0, 0, 0.9], { ...clamp, easing: inOutQuint });
    const on = interpolate(g, [f0 - 16, f0 - 8, f1 + 6, f1 + 16], [0, 1, 1, 0], clamp);
    const press = interpolate(g, [f0 - 3, f0, f1, f1 + 4], [0, 1, 1, 0], clamp);
    const trail = Array.from({ length: 8 }, (_, i) => {
      const kk = interpolate(g - i * 2, [f0, f1], [0, 1], { ...clamp, easing: inOutQuint });
      return { x: a.x, y: a.y + (b.y - a.y) * kk };
    });
    return { x: a.x, y, on, lift, press, trail };
  }
  for (const d of TOUCH_DRAGS) {
    if (!inCut(d.f / 30)) continue;
    const liftAt = Math.min(Math.max(d.lift, MIN_LIFT), d.cum.length - 1);
    const v0 = at(d.f / 30);
    const vLift = at((d.f + liftAt) / 30);
    if (g < v0 - 14 || g > vLift + 16) continue;
    const total = d.cum[d.cum.length - 1] ?? 0;
    const atLift = d.cum[liftAt] ?? 0;
    const want = Math.sign(total) * Math.min(MAX_TRAVEL, Math.max(Math.abs(atLift), Math.min(Math.abs(total), MIN_TRAVEL)));
    const gain = atLift !== 0 ? want / atLift : 0;
    const pos = (gg: number) => {
      const r = Math.max(0, Math.min(liftAt, srcAt(gg) * 30 - d.f));
      const i = Math.floor(r);
      const c0 = d.cum[i] ?? 0;
      const c = c0 + ((d.cum[i + 1] ?? c0) - c0) * (r - i);
      return phonePt(d.x, Math.max(40, Math.min(1860, d.y + c * gain)));
    };
    const p = pos(Math.min(g, vLift));
    const lift = interpolate(g, [v0 - 14, v0 - 2, vLift, vLift + 12], [1, 0, 0, 0.9], { ...clamp, easing: inOutQuint });
    const on = interpolate(g, [v0 - 14, v0 - 6, vLift + 6, vLift + 16], [0, 1, 1, 0], clamp);
    const press = interpolate(g, [v0 - 3, v0, vLift, vLift + 4], [0, 1, 1, 0], clamp);
    const trail = g <= vLift ? Array.from({ length: 8 }, (_, i) => pos(Math.max(v0, g - i * 2))) : undefined;
    return { x: p.x, y: p.y, on, lift, press, trail };
  }
  return null;
};

/**
 * 一根手指：半透明的白色指头，指尖圆、往指根略宽，指根渐隐（不画整只手，免得挡画面）。
 * 自己的坐标里指腹中心在 (30, 32)、指尖朝上；绕指腹转个角度，从右下伸进来。lift 1 = 抬起悬空，press 1 = 按实
 */
export const Finger: React.FC<{ lift: number; press: number }> = ({ lift, press }) => {
  const sx = 1 + 0.05 * lift - 0.03 * press;
  return (
    <svg
      width={60}
      height={230}
      viewBox="0 0 60 230"
      style={{
        position: "absolute",
        left: -30,
        top: -32,
        overflow: "visible",
        transformOrigin: "30px 32px",
        transform: `translate(${10 * lift}px, ${15 * lift}px) rotate(-24deg) scale(${sx})`,
        filter: `drop-shadow(${4 + 10 * lift}px ${7 + 16 * lift}px ${9 + 10 * lift}px rgba(16,24,40,${0.22 - 0.07 * lift}))`,
      }}
    >
      <defs>
        <linearGradient id="fingerFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9edf3" />
        </linearGradient>
        <linearGradient id="fingerFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="fingerMask" maskUnits="userSpaceOnUse" x="-10" y="-10" width="80" height="250">
          <rect x="-10" y="-10" width="80" height="250" fill="url(#fingerFade)" />
        </mask>
      </defs>
      <g mask="url(#fingerMask)">
        <path d="M6 46 C6 10 54 10 54 46 L58 230 L2 230 Z" fill="url(#fingerFill)" fillOpacity={0.95} stroke="rgba(20,24,33,0.22)" strokeWidth={1.4} />
        <rect x={17} y={15} width={26} height={31} rx={12} fill="rgba(255,255,255,0.8)" stroke="rgba(20,24,33,0.13)" strokeWidth={1.2} />
        <path d="M11 116 Q30 123 49 116" fill="none" stroke="rgba(20,24,33,0.12)" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M9 172 Q30 180 51 172" fill="none" stroke="rgba(20,24,33,0.09)" strokeWidth={1.4} strokeLinecap="round" />
      </g>
    </svg>
  );
};

/** 点按的涟漪：按下后 26 帧内一圈蓝环扩开、变淡；t 是按下后的第几帧 */
export const Ripple: React.FC<{ x: number; y: number; t: number; size?: number }> = ({ x, y, t, size = 1 }) => {
  if (t < 0 || t > 26) return null;
  const k = interpolate(t, [0, 26], [0, 1], { ...clamp, easing: outExpo });
  const r = (12 + 34 * k) * size;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${(2.5 * (1 - k) + 0.3) * size}px solid ${C.blue}`,
        opacity: 1 - k,
      }}
    />
  );
};

/** 指腹压在屏幕上的接触印 */
export const Contact: React.FC<{ x: number; y: number; press: number; size?: number }> = ({ x, y, press, size = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - 17 * size,
      top: y - 17 * size,
      width: 34 * size,
      height: 34 * size,
      borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(47,107,255,0.45), rgba(47,107,255,0.12) 70%, rgba(47,107,255,0))",
      opacity: press,
      transform: `scale(${0.7 + 0.3 * press})`,
    }}
  />
);

/** 手指层：放进 IPhone 的 hand 里 */
export const Hand: React.FC<{ g: number }> = ({ g }) => {
  const s = stateAt(g);
  if (!s || s.on <= 0.001) return null;
  const rip = s.ripple ?? -1;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: s.on }}>
      {s.trail ? (
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
          <polyline points={s.trail.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(47,107,255,0.35)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={s.press} />
        </svg>
      ) : null}
      <Ripple x={s.x} y={s.y} t={rip} />
      <Contact x={s.x} y={s.y} press={s.press} />
      <div style={{ position: "absolute", left: s.x, top: s.y, opacity: interpolate(s.on, [0, 1], [0, 1], { ...clamp, easing: outQuint }) }}>
        <Finger lift={s.lift} press={s.press} />
      </div>
    </div>
  );
};
