import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, prog } from "../../../engine/motion";
import { speedAt } from "../edl";
import { C, H, SF, W, ZH } from "../theme";

// 幕与幕之间的深色转场（只在这半秒用深色）和左上角的「实录 · 倍速」角标。
// 转场以幕的起点为中心：前 16 帧盖上、中间 8 帧全黑底、后 16 帧揭开；全盖住的那几帧里底下的场景换掉。

export const WIPE_HALF = 20;

type Kind = "sweep" | "iris" | "shutter" | "slide";

export const Wipe: React.FC<{ at: number; kind: Kind; title: string; en: string; origin?: { x: number; y: number } }> = ({ at, kind, title, en, origin }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -WIPE_HALF || t > WIPE_HALF) return null;
  // 0 → 1 盖上，1 → 2 揭开
  const cover = interpolate(t, [-WIPE_HALF, -4], [0, 1], { ...clamp, easing: inOutQuint });
  const uncover = interpolate(t, [4, WIPE_HALF], [0, 1], { ...clamp, easing: inOutQuint });
  const label = interpolate(t, [-12, -4, 6, 14], [0, 1, 1, 0], clamp);
  const lift = prog(frame, at - 12, 18, outExpo);

  let shape: React.ReactNode = null;
  if (kind === "sweep") {
    // 一条斜的深色带从下往上扫：盖上时带子从下往上铺满，揭开时带子的下沿继续往上走
    shape = (
      <div
        style={{
          position: "absolute",
          left: -500,
          width: W + 1000,
          top: uncover > 0 ? interpolate(uncover, [0, 1], [-600, -H - 1400]) : interpolate(cover, [0, 1], [H + 300, -600]),
          height: H + 1300,
          background: `linear-gradient(180deg, ${C.dark2}, ${C.dark} 60%)`,
          transform: "rotate(-10deg)",
        }}
      />
    );
  } else if (kind === "iris") {
    const o = origin ?? { x: W / 2, y: H / 2 };
    const R = Math.hypot(W, H) * 1.05;
    const r = uncover > 0 ? R * (1 - uncover) : R * cover;
    shape = (
      <div
        style={{
          position: "absolute",
          left: o.x - r,
          top: o.y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.dark2} 0%, ${C.dark} 70%)`,
        }}
      />
    );
  } else if (kind === "shutter") {
    const n = 6;
    shape = (
      <>
        {Array.from({ length: n }, (_, i) => {
          const d = i * 1.6;
          const c = interpolate(t, [-WIPE_HALF + d, -4 + d * 0.3], [0, 1], { ...clamp, easing: inOutQuint });
          const u = interpolate(t, [4 + d * 0.3, WIPE_HALF + d * 0.4], [0, 1], { ...clamp, easing: inOutQuint });
          const h = (H / n) * (u > 0 ? 1 - u : c);
          return <div key={i} style={{ position: "absolute", left: 0, width: W, top: (H / n) * i, height: h + 1, background: i % 2 ? C.dark : C.dark2 }} />;
        })}
      </>
    );
  } else {
    // 深色面板从右边推进来，再往左推出去
    const x = uncover > 0 ? interpolate(uncover, [0, 1], [0, -W - 200]) : interpolate(cover, [0, 1], [W + 200, 0]);
    shape = <div style={{ position: "absolute", top: 0, left: x - 100, width: W + 200, height: H, background: `linear-gradient(90deg, ${C.dark}, ${C.dark2})`, transform: "skewX(-6deg)" }} />;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {shape}
      <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 110, textAlign: "center", opacity: label, transform: `translateY(${(1 - lift) * 40}px)` }}>
        <div style={{ fontFamily: SF, fontSize: 26, fontWeight: 700, letterSpacing: "0.32em", color: "rgba(255,255,255,0.72)" }}>{en}</div>
        <div style={{ marginTop: 18, fontFamily: ZH, fontSize: 112, fontWeight: 900, letterSpacing: "0.06em", color: "#fff" }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

const fmt = (s: number) => {
  const r = Math.round(s * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
};

/** 左上角：红点 + 「实录」；加速的段旁边多一个倍速 */
export const RecBadge: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const o = interpolate(frame, [from, from + 16, to - 16, to], [0, 1, 1, 0], clamp);
  const s = speedAt(frame);
  const fast = s > 1.15;
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin((frame / 60) * Math.PI));
  return (
    <div style={{ position: "absolute", left: 54, top: 120, display: "flex", gap: 12, opacity: o }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 22px 12px 18px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 6px 20px rgba(16,24,40,0.12), 0 0 0 1px rgba(16,24,40,0.06)",
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ff3b30", opacity: pulse, boxShadow: "0 0 10px rgba(255,59,48,0.6)" }} />
        <span style={{ fontFamily: ZH, fontSize: 30, fontWeight: 800, color: C.ink }}>实录</span>
        <span style={{ fontFamily: SF, fontSize: 20, fontWeight: 700, letterSpacing: "0.16em", color: C.ink2 }}>NO STAGING</span>
      </div>
      {fast ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 20px",
            borderRadius: 999,
            background: C.ink,
            color: "#fff",
            fontFamily: SF,
            fontSize: 28,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmt(s)}× 快进
        </div>
      ) : null}
    </div>
  );
};
