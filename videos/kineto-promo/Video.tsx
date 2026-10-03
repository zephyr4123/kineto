import { Series } from "remotion";
import { Chaos } from "./scenes/Chaos";
import { Continue } from "./scenes/Continue";
import { Github } from "./scenes/Github";
import { Logo } from "./scenes/Logo";
import { Prompt } from "./scenes/Prompt";
import { Speedrun } from "./scenes/Speedrun";
import { SCENES } from "./timing";

// 成片时间线：只编排场景。场景之间全是硬切——转场都做在场景内部（压扁成地平线、投币擦除、冲上夜空），更有冲击力。
// 配乐之后另配：挂在这一层（跨场景），音效各自在场景里。
export const Video: React.FC = () => {
  return (
    <Series>
      <Series.Sequence name="Prompt" durationInFrames={SCENES.prompt} premountFor={60}>
        <Prompt />
      </Series.Sequence>
      <Series.Sequence name="Chaos" durationInFrames={SCENES.chaos} premountFor={60}>
        <Chaos />
      </Series.Sequence>
      <Series.Sequence name="Continue" durationInFrames={SCENES.cont} premountFor={60}>
        <Continue />
      </Series.Sequence>
      <Series.Sequence name="Speedrun" durationInFrames={SCENES.speedrun} premountFor={60}>
        <Speedrun />
      </Series.Sequence>
      <Series.Sequence name="Logo" durationInFrames={SCENES.logo} premountFor={60}>
        <Logo />
      </Series.Sequence>
      <Series.Sequence name="Github" durationInFrames={SCENES.github} premountFor={60}>
        <Github />
      </Series.Sequence>
    </Series>
  );
};
