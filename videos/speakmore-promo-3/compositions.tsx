import { Composition } from "remotion";
import { FPS, H, W } from "./theme";
import { VIDEO_FRAMES, Video } from "./Video";

// 现在只有冒烟片一个 composition
export const Compositions: React.FC = () => {
  return <Composition id="speakmore-promo-3" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />;
};
