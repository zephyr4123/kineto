import { Composition } from "remotion";
import { FPS, H, W } from "./theme";
import { calculateMetadata } from "./timeline";
import { Video } from "./Video";

// 成片的时长由旁白决定：calculateMetadata 量出每句音频的时长，算出整条时间线
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
    </>
  );
};
