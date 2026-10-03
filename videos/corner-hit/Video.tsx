import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import { Bounce } from "./scenes/Bounce";
import { Corner } from "./scenes/Corner";
import { Intro } from "./scenes/Intro";

// 成片时间线：只编排场景。Bounce 的时长与 physics.ts 的 BOUNCE_FRAMES 绑定（撞角帧由它反推）。
// Bounce → Corner 是硬切：撞上的那一帧直接切庆祝，不要转场冲淡。
export const Video: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={75} premountFor={fps}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
      <TransitionSeries.Sequence name="Bounce" durationInFrames={240} premountFor={fps}>
        <Bounce />
      </TransitionSeries.Sequence>
      <TransitionSeries.Sequence name="Corner" durationInFrames={105} premountFor={fps}>
        <Corner />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
