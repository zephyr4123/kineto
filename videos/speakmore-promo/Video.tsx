import { Series } from "remotion";
import { HOOK_FRAMES, Hook } from "./scenes/Hook";

// 成片的时间线：只排场景。现在只有开场这一段（先做出来定调子）
export const Video: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={HOOK_FRAMES}>
      <Hook />
    </Series.Sequence>
  </Series>
);
