import { random } from "remotion";
import { INK, RED } from "../theme";

// Clawd 掏出来的小电脑。screen 决定屏幕上是什么：乱（红白闪烁）、净（黑底一行绿字）、关。
// (x, y) 是电脑底座的中点；size 是屏幕宽度。
export type ScreenMode = "chaos" | "clean" | "off";

export const LAPTOP_RATIO = 0.62;

export const Laptop: React.FC<{ x: number; y: number; size: number; screen: ScreenMode; frame: number; open?: number }> = ({
  x,
  y,
  size,
  screen,
  frame,
  open = 1,
}) => {
  const sh = size * LAPTOP_RATIO;
  const bezel = Math.max(4, Math.round(size / 16));
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - sh - bezel * 2, width: size }}>
      <div
        style={{
          width: size,
          height: sh + bezel * 2,
          backgroundColor: "#2e2a3a",
          padding: bezel,
          transformOrigin: "50% 100%",
          transform: `scaleY(${open})`,
          boxShadow: `0 0 0 ${bezel / 2}px ${INK}`,
        }}
      >
        <ScreenFace mode={screen} frame={frame} w={size - bezel * 2} h={sh} />
      </div>
      <div style={{ width: size + bezel * 4, marginLeft: -bezel * 2, height: bezel * 2.4, backgroundColor: "#4a4560", boxShadow: `0 0 0 ${bezel / 2}px ${INK}` }} />
    </div>
  );
};

// 缩小版屏幕：乱的时候红白块乱闪，净的时候一条绿线
const ScreenFace: React.FC<{ mode: ScreenMode; frame: number; w: number; h: number }> = ({ mode, frame, w, h }) => {
  if (mode === "off") return <div style={{ width: w, height: h, backgroundColor: "#0d0b12" }} />;
  if (mode === "clean") {
    return (
      <div style={{ width: w, height: h, backgroundColor: "#0b0f1e", position: "relative" }}>
        <div style={{ position: "absolute", left: w * 0.1, top: h * 0.4, width: w * 0.55, height: Math.max(3, h * 0.1), backgroundColor: "#5dffa0" }} />
      </div>
    );
  }
  const cells = 6;
  return (
    <div style={{ width: w, height: h, backgroundColor: "#1a0d14", position: "relative", overflow: "hidden" }}>
      {Array.from({ length: cells * 4 }, (_, i) => {
        const r = random(`lap-${i}-${Math.floor(frame / 3)}`);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i % cells) * (w / cells),
              top: Math.floor(i / cells) * (h / 4),
              width: w / cells,
              height: h / 4,
              backgroundColor: r > 0.7 ? RED : r > 0.45 ? "#e9e3f5" : "transparent",
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
};
