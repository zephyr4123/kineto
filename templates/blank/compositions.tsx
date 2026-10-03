import { Composition } from "remotion";
import { Video } from "./Video";
import { Title } from "./scenes/Title";

// 这条视频的全部 composition 都登记在这里：成片 + 每个场景（场景可在 Studio 里单独预览、编辑）。
// id 写成字符串字面量，等于视频 id 或以 "<视频 id>-" 开头——`kineto check` 会校验。
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition
        id="KINETO-VIDEO-ID"
        component={Video}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="KINETO-VIDEO-ID-title"
        component={Title}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
