import { lightLeak } from "@remotion/effects/light-leak";
import { noise } from "@remotion/effects/noise";
import { AbsoluteFill, Solid, useCurrentFrame, useVideoConfig } from "remotion";
import { tween } from "../../../engine/motion";

// 胶片颗粒：用 overlay 叠在照片上，只加质感不改颜色。
// 每帧都变的噪点 h264 几乎压不动（实测 12 秒样片 90MB 里有 70MB 是颗粒），所以两帧换一次 seed、强度收低
export const Grain: React.FC<{ readonly amount?: number }> = ({ amount = 0.2 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: amount, pointerEvents: "none" }}>
      <Solid width={width} height={height} color="#808080" effects={[noise({ amount: 0.9, seed: Math.floor(f / 2) })]} />
    </AbsoluteFill>
  );
};

// 暗角：四周压暗，视线收到中间
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 48%, transparent 40%, rgba(0,0,0,0.62) 100%)" }} />
);

// 闪白 / 闪黑：切点上 1~2 帧满屏，随后褪掉。全屏高对比闪烁每秒不超过 3 次（光敏性癫痫安全线），只放在重拍上
export const Flash: React.FC<{ readonly color?: string; readonly hold?: number; readonly fade?: number }> = ({
  color = "#fff8ec",
  hold = 1,
  fade = 4,
}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ backgroundColor: color, opacity: tween(f, [hold, hold + fade], [1, 0]) }} />;
};

// 漏光：一束暖光（默认的黄到橙）扫过画面，duration 帧内涨起再退去。峰值会把画面冲白，用 opacity 收着
export const Leak: React.FC<{ readonly duration: number; readonly seed?: number; readonly opacity?: number }> = ({
  duration,
  seed = 3,
  opacity = 0.8,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity }}>
      <Solid width={width} height={height} color="black" effects={[lightLeak({ progress: tween(f, [0, duration], [0, 1]), seed })]} />
    </AbsoluteFill>
  );
};
