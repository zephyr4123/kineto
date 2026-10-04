import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { tween } from "../../../engine/motion";
import { Anatomy } from "../scenes/Anatomy";
import { Belt } from "../scenes/Belt";
import { Brew } from "../scenes/Brew";
import { Climate } from "../scenes/Climate";
import { CupScene } from "../scenes/CupScene";
import { Drying } from "../scenes/Drying";
import { Harvest } from "../scenes/Harvest";
import { Hulling } from "../scenes/Hulling";
import { Journey } from "../scenes/Journey";
import { Roast } from "../scenes/Roast";
import { Shipping } from "../scenes/Shipping";
import type { SceneId } from "../script";
import { STAGE } from "../theme";
import type { TimedScene } from "../timeline";

// 每个场景拿到的时间信息：cues / ends 是场景里每句旁白的起止（相对场景起点），duration 是场景总长
export type SceneProps = {
  readonly cues: readonly number[];
  readonly ends: readonly number[];
  readonly duration: number;
};

const SCENE_VIEWS: Record<SceneId, React.FC<SceneProps>> = {
  cup: CupScene,
  climate: Climate,
  belt: Belt,
  anatomy: Anatomy,
  harvest: Harvest,
  drying: Drying,
  hulling: Hulling,
  shipping: Shipping,
  roast: Roast,
  brew: Brew,
  journey: Journey,
};

// 场景之间先淡出到纸面，再淡入下一幅：两幅插画不叠在一起
const FADE_OUT = 12;
const FADE_IN = 16;

const Fade: React.FC<{
  readonly duration: number;
  readonly first: boolean;
  readonly children: React.ReactNode;
}> = ({ duration, first, children }) => {
  const f = useCurrentFrame();
  const opacity =
    (first ? 1 : tween(f, [0, FADE_IN], [0, 1])) *
    tween(f, [duration - FADE_OUT, duration], [1, 0]);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Stage: React.FC<{ readonly scenes: readonly TimedScene[] }> = ({
  scenes,
}) => {
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.x,
        top: STAGE.y,
        width: STAGE.w,
        height: STAGE.h,
      }}
    >
      {scenes.map((s, i) => {
        const View = SCENE_VIEWS[s.scene];
        const duration = s.end - s.start;
        return (
          <Sequence
            key={s.scene}
            name={`scene:${s.scene}`}
            from={s.start}
            durationInFrames={duration}
            premountFor={fps}
          >
            <Fade duration={duration} first={i === 0}>
              <View cues={s.cues} ends={s.ends} duration={duration} />
            </Fade>
          </Sequence>
        );
      })}
    </div>
  );
};
