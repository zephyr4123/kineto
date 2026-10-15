import { Composition } from "remotion";
import { Video } from "./Video";
import { HOOK_FRAMES, Hook } from "./scenes/Hook";
import { FPS, H, W } from "./theme";

// 成片 + 每个场景各一个 composition，场景可在 Studio 里单独预览
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="speakmore-promo" component={Video} durationInFrames={HOOK_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-hook" component={Hook} durationInFrames={HOOK_FRAMES} fps={FPS} width={W} height={H} />
    </>
  );
};
