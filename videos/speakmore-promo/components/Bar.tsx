import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { EASE } from "../theme";

// 说话时屏幕底部的悬浮条，照 SpeakMore 里的样子（src/renderer/bar/bar.css，朱砂主题）画，放大 SCALE 倍。
// 官网的同一个组件（website/src/components/Bar.jsx）靠 CSS 动画，这里全部改成帧的纯函数。
const SCALE = 2;
const SURFACE = "oklch(0.17 0.008 32)";
const EDGE = "oklch(0.34 0.012 32)";
const GHOST = "oklch(0.32 0.014 32)";
const LIVE = "oklch(0.74 0.17 32)";

// 每根竖条说话时最高到多高：中间高、两头低
const PEAKS = [0.3, 0.42, 0.55, 0.7, 0.82, 0.92, 1, 0.95, 1, 0.9, 0.8, 0.66, 0.52, 0.4, 0.28];

const px = (n: number) => n * SCALE;
const wave = (t: number) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t);

export type BarTiming = {
  /** 摁下完成键的那一帧：完成键往里一压 */
  press: number;
  /** 从这一帧起是"整理中"：一道匀速滚过去的波 */
  finishing: number;
  /** 从这一帧起打勾 */
  done: number;
};

/**
 * level：此刻说话的响度（0–1），声波跟着它起伏。
 * 声波的样子和 App 一样：从中间往两边传开，每根的周期略有不同，看起来不机械。
 */
export const Bar: React.FC<{ frame: number; fps: number; level: number; timing: BarTiming }> = ({ frame, fps, level, timing }) => {
  const t = frame / fps;
  const recording = interpolate(frame, [timing.finishing, timing.finishing + 12], [1, 0], clamp);
  const finishing = Math.min(
    interpolate(frame, [timing.finishing, timing.finishing + 12], [0, 1], clamp),
    interpolate(frame, [timing.done, timing.done + 10], [1, 0], clamp),
  );
  const done = interpolate(frame, [timing.done, timing.done + 6], [0, 1], clamp);
  const draw = interpolate(frame, [timing.done, timing.done + 23], [1, 0], { ...clamp, easing: EASE.outQuint });
  const squeeze = interpolate(frame, [timing.press, timing.press + 4, timing.press + 14], [1, 0.84, 1], clamp);
  const buttons = { opacity: recording, transform: `scale(${0.6 + 0.4 * recording})` };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: px(8),
        height: px(40),
        padding: px(6),
        borderRadius: px(20),
        background: SURFACE,
        boxShadow: `0 0 0 ${px(1)}px ${EDGE}, 0 ${px(6)}px ${px(18)}px oklch(0 0 0 / 0.3), 0 ${px(2)}px ${px(5)}px oklch(0 0 0 / 0.2)`,
      }}
    >
      <span style={{ ...round, background: GHOST, color: "oklch(0.97 0.004 32)", ...buttons }}>
        <svg viewBox="0 0 14 14" width={px(14)} height={px(14)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </span>

      <span style={{ position: "relative", width: px(76), height: px(22) }}>
        <span style={{ ...layer, gap: px(2), opacity: recording }}>
          {PEAKS.map((peak, i) => {
            const period = 0.9 + (i % 4) * 0.12;
            const talk = 0.25 + 0.75 * wave(t / period - Math.abs(i - 7) * 0.07 / period);
            const y = peak * (0.16 + 0.84 * level * talk);
            return <i key={i} style={{ ...stick, width: px(2), borderRadius: px(1), transform: `scaleY(${y})` }} />;
          })}
        </span>
        <span style={{ ...layer, gap: px(3), opacity: finishing }}>
          {Array.from({ length: 9 }, (_, i) => {
            const y = 0.2 + 0.58 * wave(t / 1.15 + (i * 0.09) / 1.15);
            return <i key={i} style={{ ...stick, width: px(3), borderRadius: px(2), transform: `scaleY(${y})` }} />;
          })}
        </span>
        <svg viewBox="0 0 76 22" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: done }}>
          <path
            d="M30 11.5l5.5 5.5L47 5.5"
            fill="none"
            stroke={LIVE}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={24}
            strokeDashoffset={24 * draw}
          />
        </svg>
      </span>

      <span style={{ ...round, background: LIVE, color: SURFACE, opacity: recording, transform: `scale(${(0.6 + 0.4 * recording) * squeeze})` }}>
        <svg viewBox="0 0 14 14" width={px(14)} height={px(14)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 7.5l3 3 6-7" />
        </svg>
      </span>
    </div>
  );
};

const round: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: px(28),
  height: px(28),
  borderRadius: "50%",
};

const layer: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const stick: React.CSSProperties = {
  display: "block",
  height: "100%",
  background: LIVE,
};
