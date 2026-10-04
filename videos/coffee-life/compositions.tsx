import { Composition } from "remotion";
import { beat } from "./beat";
import { ROAST_BEATS, Roast } from "./scenes/Roast";
import { FPS, H, W } from "./theme";

// 这条视频的全部 composition：成片 + 每个场景。现在只有烘焙段（风格样片），成片等各段做完再登记。
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="coffee-life-roast" component={Roast} durationInFrames={beat(ROAST_BEATS)} fps={FPS} width={W} height={H} />
    </>
  );
};
