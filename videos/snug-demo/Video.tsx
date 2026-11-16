import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Whip } from "./components/transition";
import { Hud } from "./components/type";
import { Apps, APPS_FROM, APPS_LEN } from "./scenes/Apps";
import { Create, CREATE_FROM, CREATE_LEN } from "./scenes/Create";
import { Intro, INTRO_FROM, INTRO_LEN, LAND } from "./scenes/Intro";
import { Model, MODEL_FROM, MODEL_LEN } from "./scenes/Model";
import { Outro, OUTRO_FROM, OUTRO_LEN } from "./scenes/Outro";
import { Swap, SWAP_FROM, SWAP_LEN } from "./scenes/Swap";
import { ACTS, MUSIC_FROM, PAL, sec } from "./theme";

// 成片时间线：只排场景、转场、录制角标和配乐。不分章：开场到第一个动作、机型到落版是镜头连着推过去的，
// 中间三次换段各盖一下不带字的深色快切。配乐一刀不剪，从歌的饱满段前一小节起一直放到片尾的小节头，最后 2.7 秒随画面淡出。

export const VIDEO_FRAMES = sec(ACTS.end);

const SCENES = [
  { name: "点题", Scene: Intro, from: INTRO_FROM, len: INTRO_LEN },
  { name: "新建窗口 · Claude", Scene: Create, from: CREATE_FROM, len: CREATE_LEN },
  { name: "两屏联动 · 还原", Scene: Swap, from: SWAP_FROM, len: SWAP_LEN },
  { name: "搜索 · ChatGPT · 退出", Scene: Apps, from: APPS_FROM, len: APPS_LEN },
  { name: "机型", Scene: Model, from: MODEL_FROM, len: MODEL_LEN },
  { name: "落版", Scene: Outro, from: OUTRO_FROM, len: OUTRO_LEN },
] as const;

const VOLUME = 0.6;
const FADE = sec(2.7);
/** 起头 6 帧淡入（从歌中间的一拍起，免得咔一声），最后 2.7 秒淡出 */
const musicVolume = (f: number) => VOLUME * interpolate(f, [0, 6, VIDEO_FRAMES - FADE, VIDEO_FRAMES], [0, 1, 1, 0], clamp);

/** 片尾整幅画面淡进落版的底色 */
const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [VIDEO_FRAMES - FADE, VIDEO_FRAMES - 6], [0, 1], clamp);
  return o > 0 ? <AbsoluteFill style={{ background: PAL.outro.mid, opacity: o }} /> : null;
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.hook.mid }}>
    {SCENES.map(({ name, Scene, from, len }) => (
      <Sequence key={name} name={name} from={from} durationInFrames={len} premountFor={60}>
        <Scene />
      </Sequence>
    ))}
    <Hud from={LAND} to={OUTRO_FROM} />
    <Whip at={SWAP_FROM} />
    <Whip at={APPS_FROM} dir={-1} />
    <Whip at={MODEL_FROM} />
    <FadeOut />
    <Audio src={staticFile(assets.music)} trimBefore={sec(MUSIC_FROM)} volume={musicVolume} />
  </AbsoluteFill>
);
