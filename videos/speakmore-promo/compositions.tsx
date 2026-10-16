import { Composition } from "remotion";
import { Stage } from "./components/Stage";
import { VIDEO_FRAMES, Video } from "./Video";
import { HOOK_CAMERA, HOOK_FRAMES, Hook } from "./scenes/Hook";
import { ORIGIN_CAMERA, ORIGIN_FRAMES, Origin } from "./scenes/Origin";
import { FPS, H, W } from "./theme";

// 单独预览一章时，桌面照这一章自己的镜头垫在底下
const HookStaged: React.FC = () => (
  <Stage camera={HOOK_CAMERA}>
    <Hook />
  </Stage>
);
const OriginStaged: React.FC = () => (
  <Stage camera={ORIGIN_CAMERA}>
    <Origin />
  </Stage>
);

// 成片 + 每个场景各一个 composition，场景可在 Studio 里单独预览
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="speakmore-promo" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-hook" component={HookStaged} durationInFrames={HOOK_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-origin" component={OriginStaged} durationInFrames={ORIGIN_FRAMES} fps={FPS} width={W} height={H} />
    </>
  );
};
