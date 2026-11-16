import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint } from "../../../engine/motion";
import { C, H, W } from "../theme";

// 段落之间的一下深色快切：一块斜的深色面板从一边扫过去，盖住的那几帧里底下换场。不带字，也不分章，只是换口气。
// 这是全片唯一用深色的地方，前后各 12 帧。

export const WHIP = 12;

export const Whip: React.FC<{ at: number; dir?: 1 | -1 }> = ({ at, dir = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -WHIP || t > WHIP) return null;
  // 面板中心从画外一侧扫到另一侧，正中间（t = 0）时盖满全屏
  const x = interpolate(t, [-WHIP, -2, 2, WHIP], [W * 1.6, 0, 0, -W * 1.6], { ...clamp, easing: inOutQuint }) * dir;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - W * 0.6,
          top: -H * 0.2,
          width: W * 2.2,
          height: H * 1.4,
          // 斜切以后上下两头会横向错开约 200 像素，面板要比画面宽得多，盖满时才不露边
          background: `linear-gradient(90deg, ${C.dark}00 0%, ${C.dark} 12%, ${C.dark} 88%, ${C.dark}00 100%)`,
          transform: "skewX(-12deg)",
        }}
      />
    </AbsoluteFill>
  );
};
