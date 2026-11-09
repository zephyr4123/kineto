import { interpolate, random, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { SANS, UI } from "../theme";

// 悬浮条上的两样动效，都画在演示图上（原图坐标），跟着图一起推：
// 1. 声波：盖在图里那段静止的波纹上，按"有人在说话"的样子跳，按下完成键后收成一排小点。
//    演示图（README 那套出图脚本出的）里的波纹是 15 根，宽 4、间距 8，中间最高 43，颜色和底色照图取。
// 2. 完成键：说完按一下键就出字，不用鼠标点——悬浮条下面浮出键帽（和悬浮条上方提示写的键一致），按下去，同时完成钮亮一圈。
const SHAPE = [8, 11, 14, 20, 26, 32, 38, 43, 35, 30, 24, 20, 14, 10, 8];
const GREEN = "rgb(104, 217, 140)";
const PILL = "rgb(20, 24, 29)";
const STEP = 4;

/** 第 i 根在 frame 帧的起伏（0–1）：每 STEP 帧换一个随机值、中间平滑过渡，再乘一个四到五赫兹的音节包络 */
const level = (i: number, frame: number) => {
  const k = Math.floor(frame / STEP);
  const t = (frame % STEP) / STEP;
  const a = random(`w${i}-${k}`);
  const z = random(`w${i}-${k + 1}`);
  const jitter = a + (z - a) * (t * t * (3 - 2 * t));
  const syllable = 0.55 + 0.45 * Math.abs(Math.sin(frame / 7.5 + Math.sin(frame / 23) * 1.8));
  return (0.25 + 0.75 * jitter) * syllable;
};

/** x：第一根的左边；cy：波纹的中线；stop：按下完成键的那一帧，之后收成小点 */
export const Waveform: React.FC<{ x: number; cy: number; stop: number }> = ({ x, cy, stop }) => {
  const frame = useCurrentFrame();
  const live = interpolate(frame, [stop, stop + 10], [1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: x - 6, top: cy - 30, width: SHAPE.length * 8 + 8, height: 60, background: PILL }} />
      {SHAPE.map((h, i) => {
        const hh = Math.max(5, Math.min(50, h * 1.15 * level(i, frame)) * live + 5 * (1 - live));
        return <div key={i} style={{ position: "absolute", left: x + i * 8, top: cy - hh / 2, width: 4, height: hh, borderRadius: 2, background: GREEN }} />;
      })}
    </>
  );
};

/** 键帽上的字：右边的 Option 键（⌥ 用线画，字体里不一定有这个符号）、空格键 */
const OPTION = (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#2a2f37" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h5.5l7 12H21M14.5 6H21" />
  </svg>
);
export const KEY = {
  rightOption: (
    <>
      右{OPTION}
    </>
  ),
  space: "空格",
} as const;

/**
 * 完成键：一颗或几颗键帽，整组的上沿中点在 (cx, y)，at 帧一起按下。按下前半秒浮出，按下时键面沉下去、侧面变薄，
 * 同时 (doneX, doneY) 处的完成钮亮一圈；松开后再停半秒淡掉。
 */
export const FinishKey: React.FC<{ cx: number; y: number; at: number; doneX: number; doneY: number; keys: readonly React.ReactNode[] }> = ({ cx, y, at, doneX, doneY, keys }) => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [at - 30, at - 18, at + 40, at + 56], [0, 1, 1, 0], clamp);
  if (show <= 0) return null;
  const down = interpolate(frame, [at - 4, at, at + 8, at + 14], [0, 1, 1, 0], clamp);
  const rise = interpolate(frame, [at - 30, at - 18], [16, 0], clamp);
  const depth = 12 - 8 * down;
  const ring = interpolate(frame, [at, at + 24], [0, 1], clamp);
  const r = 30 + 26 * ring;
  return (
    <>
      {ring > 0 && ring < 1 ? (
        <div style={{ position: "absolute", left: doneX - r, top: doneY - r, width: r * 2, height: r * 2, borderRadius: "50%", border: "4px solid rgb(104, 217, 140)", opacity: 1 - ring }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: y + rise,
          display: "flex",
          gap: 14,
          opacity: show,
          transform: "translateX(-50%) scale(1.25)",
          transformOrigin: "50% 0",
        }}
      >
        {keys.map((label, i) => (
          <div key={i} style={{ position: "relative", height: 96, minWidth: 150 }}>
            <div style={{ position: "absolute", inset: 0, top: 12, borderRadius: 18, background: "#b9bec7", boxShadow: `0 ${18 - 10 * down}px ${34 - 14 * down}px -10px oklch(0.15 0.02 260 / 0.45)` }} />
            <div
              style={{
                position: "relative",
                top: 12 - depth,
                height: 84,
                padding: "0 34px",
                borderRadius: 18,
                background: "linear-gradient(180deg, #ffffff, #eef0f4)",
                boxShadow: "inset 0 0 0 2px oklch(0.85 0.01 260), inset 0 -3px 0 oklch(0.9 0.01 260)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontFamily: `${UI}, ${SANS}`,
                fontWeight: 600,
                fontSize: 30,
                color: "#2a2f37",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
