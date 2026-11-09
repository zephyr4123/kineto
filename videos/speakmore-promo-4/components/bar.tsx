import { interpolate, random, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { UI } from "../theme";

// 悬浮条上的两样动效，都画在演示图上（原图坐标），跟着图一起推：
// 1. 声波：盖在图里那段静止的波纹上，按"有人在说话"的样子跳，按下完成键后收成一排小点。
//    演示图（README 那套出图脚本出的）里的波纹是 15 根，宽 4、间距 8，中间最高 43，颜色和底色照图取。
// 2. 完成键：说完按一下键就出字，不用鼠标点——悬浮条旁边浮出一颗键帽，按下去，同时悬浮条上的完成钮亮一圈。
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

/**
 * 完成键：键帽左上角在 (x, y)，at 帧按下。按下前 0.5 秒浮出，按下时键面沉下去、侧面变薄，
 * 同时 (doneX, doneY) 处的完成钮亮一圈；松开后再停半秒淡掉。
 */
export const FinishKey: React.FC<{ x: number; y: number; at: number; doneX: number; doneY: number; label?: string }> = ({ x, y, at, doneX, doneY, label = "Enter" }) => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [at - 30, at - 18, at + 40, at + 56], [0, 1, 1, 0], clamp);
  if (show <= 0) return null;
  const down = interpolate(frame, [at - 4, at, at + 8, at + 14], [0, 1, 1, 0], clamp);
  const rise = interpolate(frame, [at - 30, at - 18], [16, 0], clamp);
  const depth = 12 - 8 * down;
  const ring = interpolate(frame, [at, at + 24], [0, 1], clamp);
  return (
    <>
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: "absolute",
            left: doneX - (30 + 26 * ring),
            top: doneY - (30 + 26 * ring),
            width: (30 + 26 * ring) * 2,
            height: (30 + 26 * ring) * 2,
            borderRadius: "50%",
            border: "4px solid rgb(104, 217, 140)",
            opacity: 1 - ring,
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: x, top: y + rise, width: 196, height: 96, opacity: show, transform: "scale(1.25)", transformOrigin: "0 50%" }}>
        <div style={{ position: "absolute", inset: 0, top: 12, borderRadius: 18, background: "#b9bec7", boxShadow: `0 ${18 - 10 * down}px ${34 - 14 * down}px -10px oklch(0.15 0.02 260 / 0.45)` }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 12 - depth,
            height: 84,
            borderRadius: 18,
            background: "linear-gradient(180deg, #ffffff, #eef0f4)",
            boxShadow: "inset 0 0 0 2px oklch(0.85 0.01 260), inset 0 -3px 0 oklch(0.9 0.01 260)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            fontFamily: UI,
            fontWeight: 600,
            fontSize: 30,
            color: "#2a2f37",
          }}
        >
          <span>{label}</span>
          <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#2a2f37" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 5v7a3 3 0 0 1-3 3H5M9 11l-4 4 4 4" />
          </svg>
        </div>
      </div>
    </>
  );
};
