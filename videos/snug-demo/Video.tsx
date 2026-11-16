import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { RecBadge, Wipe } from "./components/wipe";
import { Apps, APPS_FROM, APPS_LEN } from "./scenes/Apps";
import { Create, CREATE_FROM, CREATE_LEN } from "./scenes/Create";
import { Intro, INTRO_FROM, INTRO_LEN } from "./scenes/Intro";
import { Model, MODEL_FROM, MODEL_LEN } from "./scenes/Model";
import { Outro, OUTRO_FROM, OUTRO_LEN } from "./scenes/Outro";
import { Swap, SWAP_FROM, SWAP_LEN } from "./scenes/Swap";
import { ACTS, sec, SPLICE_AT, SPLICE_SHIFT } from "./theme";

// 成片时间线：只排场景、转场和配乐。开场到第一幕是镜头连着推过去的，其余每次换幕盖一下深色转场（落在小节头上）。

export const VIDEO_FRAMES = sec(ACTS.end);

const SCENES = [
  { name: "开场", Scene: Intro, from: INTRO_FROM, len: INTRO_LEN },
  { name: "第一幕 新建窗口", Scene: Create, from: CREATE_FROM, len: CREATE_LEN },
  { name: "第二幕 两屏联动", Scene: Swap, from: SWAP_FROM, len: SWAP_LEN },
  { name: "第三幕 搜索直开", Scene: Apps, from: APPS_FROM, len: APPS_LEN },
  { name: "第四幕 机型自选", Scene: Model, from: MODEL_FROM, len: MODEL_LEN },
  { name: "落版", Scene: Outro, from: OUTRO_FROM, len: OUTRO_LEN },
] as const;

const SPLICE = sec(SPLICE_AT);
const VOLUME = 0.6;
/** 起头 0.2 秒淡入，最后 1.6 秒跟着画面淡出 */
const musicVolume = (f: number) => VOLUME * interpolate(f, [0, 12, VIDEO_FRAMES - 96, VIDEO_FRAMES], [0, 1, 1, 0], clamp);

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: "#ffffff" }}>
    {SCENES.map(({ name, Scene, from, len }) => (
      <Sequence key={name} name={name} from={from} durationInFrames={len} premountFor={60}>
        <Scene />
      </Sequence>
    ))}
    <RecBadge from={CREATE_FROM} to={OUTRO_FROM} />
    <Wipe at={SWAP_FROM} kind="sweep" title="两屏联动" en="02 / 04" />
    <Wipe at={APPS_FROM} kind="iris" title="搜索直开" en="03 / 04" />
    <Wipe at={MODEL_FROM} kind="shutter" title="机型自选" en="04 / 04" />
    <Wipe at={OUTRO_FROM} kind="slide" title="Snug" en="OPEN SOURCE" />
    {/* 配乐：歌的第 12–21 小节拿掉，接点在第 12 小节头（见 theme.ts） */}
    <Sequence name="配乐 前段" durationInFrames={SPLICE}>
      <Audio src={staticFile(assets.music)} volume={musicVolume} />
    </Sequence>
    <Sequence name="配乐 后段" from={SPLICE} durationInFrames={VIDEO_FRAMES - SPLICE}>
      <Audio src={staticFile(assets.music)} trimBefore={sec(SPLICE_AT + SPLICE_SHIFT)} volume={(f) => musicVolume(f + SPLICE)} />
    </Sequence>
  </AbsoluteFill>
);
