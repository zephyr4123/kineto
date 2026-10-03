import { Composition } from "remotion";
import { Video } from "./Video";
import { Bounce } from "./scenes/Bounce";
import { Corner } from "./scenes/Corner";
import { Intro } from "./scenes/Intro";

// 成片 = 75 + 240 + 105 - 15（淡入淡出重叠）= 405 帧
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition
        id="corner-hit"
        component={Video}
        durationInFrames={405}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="corner-hit-intro"
        component={Intro}
        durationInFrames={75}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="corner-hit-bounce"
        component={Bounce}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="corner-hit-corner"
        component={Corner}
        durationInFrames={105}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
