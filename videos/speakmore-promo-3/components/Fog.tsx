import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLOR } from "../theme";

// 淡雾底：近白的底上三团极淡的光，各自慢慢漂。整片的"空气"，不抢字和界面。
const BLOBS = [
  { color: COLOR.fogIndigo, x: 0.2, y: 0.32, r: 1050, ax: 90, ay: 50, speed: 0.011, phase: 0 },
  { color: COLOR.fogCinnabar, x: 0.84, y: 0.74, r: 950, ax: 80, ay: 60, speed: 0.009, phase: 2.1 },
  { color: COLOR.fogLilac, x: 0.6, y: 0.12, r: 900, ax: 100, ay: 40, speed: 0.013, phase: 4.2 },
] as const;

export const Fog: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COLOR.paper, overflow: "hidden" }}>
      {BLOBS.map((b) => {
        const t = frame * b.speed + b.phase;
        return (
          <div
            key={b.phase}
            style={{
              position: "absolute",
              left: `calc(${b.x * 100}% + ${Math.sin(t) * b.ax}px - ${b.r}px)`,
              top: `calc(${b.y * 100}% + ${Math.cos(t * 0.8) * b.ay}px - ${b.r}px)`,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              // 三段渐隐：中心不成一块实心的圆，边缘没有一圈看得见的边
              background: `radial-gradient(closest-side, ${b.color}, color-mix(in oklab, ${b.color} 45%, transparent) 45%, transparent)`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
