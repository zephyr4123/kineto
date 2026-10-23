import { AbsoluteFill, Composition } from "remotion";
import { Fog } from "./components/Fog";
import { SCENES, VIDEO_FRAMES, Video } from "./Video";
import { FPS, H, W } from "./theme";

// 成片 + 每段各一个 composition（段落在 Studio 里可单独预览，垫着浅色的雾）
const staged = (Scene: React.FC) => {
  const Staged: React.FC = () => (
    <AbsoluteFill>
      <Fog />
      <Scene />
    </AbsoluteFill>
  );
  return Staged;
};
const [opening, reveal, lookup, reply, languages, oneApp, climax, outro] = SCENES;
const OpeningStaged = staged(opening.Scene);
const RevealStaged = staged(reveal.Scene);
const LookupStaged = staged(lookup.Scene);
const ReplyStaged = staged(reply.Scene);
const LanguagesStaged = staged(languages.Scene);
const OneAppStaged = staged(oneApp.Scene);
const ClimaxStaged = staged(climax.Scene);
const OutroStaged = staged(outro.Scene);

export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="speakmore-promo-3" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-opening" component={OpeningStaged} durationInFrames={opening.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-reveal" component={RevealStaged} durationInFrames={reveal.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-lookup" component={LookupStaged} durationInFrames={lookup.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-reply" component={ReplyStaged} durationInFrames={reply.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-languages" component={LanguagesStaged} durationInFrames={languages.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-oneapp" component={OneAppStaged} durationInFrames={oneApp.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-climax" component={ClimaxStaged} durationInFrames={climax.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-3-outro" component={OutroStaged} durationInFrames={outro.frames} fps={FPS} width={W} height={H} />
    </>
  );
};
