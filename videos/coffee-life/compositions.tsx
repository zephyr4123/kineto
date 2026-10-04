import { Composition, Still } from "remotion";
import { Cover, CoverPortrait } from "./scenes/Cover";
import { FPS, H, W } from "./theme";
import { calculateMetadata } from "./timeline";
import { Video } from "./Video";

// 成片的时长由旁白决定：calculateMetadata 量出每句音频的时长，算出整条时间线
// 最后是发布用的封面两张：横版 16:9、竖版 3:4
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition
        id="coffee-life"
        component={Video}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ durations: [] }}
        calculateMetadata={calculateMetadata}
      />
      <Still
        id="coffee-life-cover"
        component={Cover}
        width={1920}
        height={1080}
      />
      <Still
        id="coffee-life-cover-portrait"
        component={CoverPortrait}
        width={1080}
        height={1440}
      />
    </>
  );
};
