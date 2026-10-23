import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { COLOR, DISPLAY, EASE, SANS, VERSION } from "../theme";

// 全片共用的小零件：进场、一句话、小标签、指针、App 图标、发光圆环。都是帧的纯函数。

/** at 帧起由虚变实、往上浮；out 帧起往上虚掉（不给就一直留着） */
export const rise = (frame: number, at: number, out = Number.POSITIVE_INFINITY, dy = 22, dur = 18): React.CSSProperties => {
  const a = prog(frame, at, dur);
  const z = Number.isFinite(out) ? prog(frame, out, 14, EASE.outQuint) : 0;
  const blur = 9 * (1 - a) + 9 * z;
  if (a <= 0) return { opacity: 0 };
  return {
    opacity: a * (1 - z),
    transform: `translateY(${dy * (1 - a) - dy * 0.8 * z}px)`,
    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
  };
};

/** 一句话里的一段：文字 + 出现的帧 + 可选的颜色 */
export type Part = { text: string; at: number; color?: string };

/** 居中的一句话：英文为主，按段逐个出现；sub 是下面一行小字的中文；out 帧整句一起虚掉 */
export const Phrase: React.FC<{
  parts: readonly Part[];
  sub?: { text: string; at: number };
  out?: number;
  size?: number;
  weight?: number;
  color?: string;
  subColor?: string;
  y?: number;
  style?: React.CSSProperties;
}> = ({ parts, sub, out, size = 96, weight = 600, color = COLOR.ink, subColor = COLOR.ink2, y = 0, style }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none", transform: `translateY(${y}px)` }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: DISPLAY, fontSize: size, fontWeight: weight, letterSpacing: "-0.025em", color, ...style }}>
        {parts.map((p) => (
          <span key={`${p.text}-${p.at}`} style={{ display: "inline-block", whiteSpace: "pre", color: p.color, ...rise(frame, p.at, out) }}>
            {p.text}
          </span>
        ))}
      </div>
      {sub ? <Sub text={sub.text} at={sub.at} out={out} size={Math.max(28, size * 0.36)} color={subColor} /> : null}
    </AbsoluteFill>
  );
};

/** 英文下面那一行中文：小、浅、字距宽 */
export const Sub: React.FC<{ text: string; at: number; out?: number; size?: number; color?: string }> = ({ text, at, out, size = 32, color = COLOR.ink2 }) => {
  const frame = useCurrentFrame();
  return <div style={{ marginTop: size * 0.7, fontFamily: SANS, fontSize: size, fontWeight: 400, letterSpacing: "0.18em", color, ...rise(frame, at, out, 12) }}>{text}</div>;
};

/** 画面角上的小标签（这是哪个应用、哪一页）：英文在前，中文小字跟在后面 */
export const Tag: React.FC<{ text: string; sub?: string; at: number; out?: number; dark?: boolean; style?: React.CSSProperties }> = ({ text, sub, at, out, dark, style }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        fontFamily: DISPLAY,
        fontSize: 40,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: dark ? COLOR.nightInk : COLOR.ink,
        ...style,
        ...rise(frame, at, out, 14),
      }}
    >
      {text}
      {sub ? <span style={{ fontFamily: SANS, fontSize: 24, fontWeight: 400, letterSpacing: "0.14em", color: dark ? COLOR.nightInk2 : COLOR.ink2 }}>{sub}</span> : null}
    </div>
  );
};

/** 系统的箭头指针；press 帧按下（缩一下） */
export const Pointer: React.FC<{ x: number; y: number; opacity?: number; press?: number }> = ({ x, y, opacity = 1, press }) => {
  const frame = useCurrentFrame();
  const t = press === undefined ? 1 : frame - press;
  const squeeze = t >= 0 && t < 10 ? 1 - 0.18 * Math.sin((t / 10) * Math.PI) : 1;
  return (
    <svg width={40} height={52} viewBox="0 0 20 26" style={{ position: "absolute", left: x - 4, top: y - 2, opacity, transform: `scale(${squeeze})`, transformOrigin: "4px 2px", overflow: "visible", filter: "drop-shadow(0 3px 6px oklch(0 0 0 / 0.35))" }}>
      <path d="M2 1.5v19.2l4.6-4.4 3 7.2 3.3-1.4-3-7h6.4z" fill="oklch(0.08 0 0)" stroke="oklch(1 0 0)" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
};

/** SpeakMore 的图标：靛青圆角方块里一方印，五道刻痕是一段声音（照 assets/icon.svg） */
export const AppIcon: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <svg width={size} height={size} viewBox="100 100 824 824" style={style}>
    <rect x="100" y="100" width="824" height="824" rx="186" fill="#29486f" />
    <polygon fill="#f7f4ed" points="197,469 271,437 271,644 197,611" />
    <polygon fill="#c7563c" points="329,348 398,315 411,354 411,701 395,743 329,712" />
    <polygon fill="#f7f4ed" points="469,219 517,187 547,226 547,814 526,842 469,811" />
    <polygon fill="#d69d43" points="606,372 672,342 686,359 686,674 677,720 606,685" />
    <polygon fill="#f7f4ed" points="745,439 820,469 820,609 745,641" />
  </svg>
);

/** 版本号的小胶囊（挂在 speakmore 字标旁边）；dark：压在暗场上 */
export const Version: React.FC<{ dark?: boolean; size?: number }> = ({ dark, size = 32 }) => (
  <span
    style={{
      display: "inline-block",
      padding: `${size * 0.22}px ${size * 0.6}px`,
      borderRadius: 999,
      fontFamily: DISPLAY,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: "0.01em",
      color: dark ? COLOR.nightInk2 : COLOR.ink2,
      boxShadow: `inset 0 0 0 1.5px ${dark ? "oklch(1 0 0 / 0.22)" : COLOR.line}`,
      background: dark ? "oklch(1 0 0 / 0.04)" : "oklch(1 0 0 / 0.7)",
      whiteSpace: "nowrap",
    }}
  >
    {VERSION}
  </span>
);

/** 发光圆环：at 帧亮起，之后每 period 帧脉动一下 */
export const Ring: React.FC<{ size: number; color: string; at: number; period?: number; style?: React.CSSProperties }> = ({ size, color, at, period = 48, style }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, at, 20);
  if (a <= 0) return null;
  const pulse = frame >= at ? Math.exp(-((frame - at) % period) / 10) : 0;
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        boxShadow: `0 0 0 ${2 + 2 * pulse}px ${color}, 0 0 ${24 + 40 * pulse}px ${color}, inset 0 0 ${20 + 30 * pulse}px color-mix(in oklab, ${color} 60%, transparent)`,
        opacity: a,
        transform: `scale(${0.7 + 0.3 * a + 0.04 * pulse})`,
        ...style,
      }}
    />
  );
};
