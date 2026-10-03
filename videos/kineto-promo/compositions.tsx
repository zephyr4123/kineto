import { Composition, Still } from "remotion";
import { Video } from "./Video";
import { Chaos } from "./scenes/Chaos";
import { Continue } from "./scenes/Continue";
import { Cover, CoverPortrait } from "./scenes/Cover";
import { Github } from "./scenes/Github";
import { Logo } from "./scenes/Logo";
import { Prompt } from "./scenes/Prompt";
import { Speedrun } from "./scenes/Speedrun";
import { SCENES, TOTAL } from "./timing";

// 成片 + 每个场景各一个 composition，场景可在 Studio 里单独预览。时长统一从 timing.ts 取。
// 最后两个是发布用的封面（横版 16:9、竖版 3:4）。
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="kineto-promo" component={Video} durationInFrames={TOTAL} fps={60} width={1920} height={1080} />
      <Composition id="kineto-promo-prompt" component={Prompt} durationInFrames={SCENES.prompt} fps={60} width={1920} height={1080} />
      <Composition id="kineto-promo-chaos" component={Chaos} durationInFrames={SCENES.chaos} fps={60} width={1920} height={1080} />
      <Composition id="kineto-promo-continue" component={Continue} durationInFrames={SCENES.cont} fps={60} width={1920} height={1080} />
      <Composition id="kineto-promo-speedrun" component={Speedrun} durationInFrames={SCENES.speedrun} fps={60} width={1920} height={1080} />
      <Composition id="kineto-promo-logo" component={Logo} durationInFrames={SCENES.logo} fps={60} width={1920} height={1080} />
      <Composition id="kineto-promo-github" component={Github} durationInFrames={SCENES.github} fps={60} width={1920} height={1080} />
      <Still id="kineto-promo-cover" component={Cover} width={1920} height={1080} />
      <Still id="kineto-promo-cover-portrait" component={CoverPortrait} width={1080} height={1440} />
    </>
  );
};
