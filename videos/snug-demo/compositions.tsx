import { Composition } from "remotion";
import { Apps, APPS_LEN } from "./scenes/Apps";
import { CoverLandscape, CoverPortrait } from "./scenes/Cover";
import { Create, CREATE_LEN } from "./scenes/Create";
import { Intro, INTRO_LEN } from "./scenes/Intro";
import { Model, MODEL_LEN } from "./scenes/Model";
import { Outro, OUTRO_LEN } from "./scenes/Outro";
import { Swap, SWAP_LEN } from "./scenes/Swap";
import { FPS, H, W } from "./theme";
import { Video, VIDEO_FRAMES } from "./Video";

// 这条视频的全部 composition 都登记在这里：成片 + 每个场景（场景可在 Studio 里单独预览、编辑）+ 横竖两张封面。
// id 写成字符串字面量，等于视频 id 或以 "<视频 id>-" 开头——`kineto check` 会校验。
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="snug-demo" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="snug-demo-intro" component={Intro} durationInFrames={INTRO_LEN} fps={FPS} width={W} height={H} />
      <Composition id="snug-demo-create" component={Create} durationInFrames={CREATE_LEN} fps={FPS} width={W} height={H} />
      <Composition id="snug-demo-swap" component={Swap} durationInFrames={SWAP_LEN} fps={FPS} width={W} height={H} />
      <Composition id="snug-demo-apps" component={Apps} durationInFrames={APPS_LEN} fps={FPS} width={W} height={H} />
      <Composition id="snug-demo-model" component={Model} durationInFrames={MODEL_LEN} fps={FPS} width={W} height={H} />
      <Composition id="snug-demo-outro" component={Outro} durationInFrames={OUTRO_LEN} fps={FPS} width={W} height={H} />
      {/* 封面是只有一帧的 composition（kineto render 照样出 PNG）。不用 <Still>：它的帧率固定为 1，定格画面要按 60 帧取素材里的那一帧 */}
      <Composition id="snug-demo-cover" component={CoverLandscape} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="snug-demo-cover-portrait" component={CoverPortrait} durationInFrames={1} fps={FPS} width={W} height={H} />
    </>
  );
};
