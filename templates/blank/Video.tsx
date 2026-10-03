import { Series, useVideoConfig } from "remotion";
import { Title } from "./scenes/Title";

// 成片时间线：只编排场景，画面细节写在 scenes/ 里，一个场景一个文件。
export const Video: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      <Series.Sequence name="Title" durationInFrames={90} premountFor={fps}>
        <Title />
      </Series.Sequence>
    </Series>
  );
};
