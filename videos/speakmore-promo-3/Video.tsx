import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Fog } from "./components/Fog";
import { CLIMAX_FRAMES, Climax } from "./scenes/Climax";
import { DICTATE_FRAMES, Dictate } from "./scenes/Dictate";
import { LOOKUP_FRAMES, Lookup } from "./scenes/Lookup";
import { ONEAPP_FRAMES, OneApp } from "./scenes/OneApp";
import { OPENING_FRAMES, Opening } from "./scenes/Opening";
import { OUTRO_FRAMES, Outro } from "./scenes/Outro";
import { TRANSLATE_FRAMES, Translate } from "./scenes/Translate";
import { MUSIC, VIDEO_FRAMES, b, songFrame } from "./theme";

// 成片的时间线：只排场景和配乐。三项功能平级，各占一段、各有一张一样的开场卡。
// 场景按拍起止，相邻两段在转场处叠一点，转场的动作由两段各自做（上一段推穿、下一段迎上来）。
// 配乐按 theme.ts 的 MUSIC 剪拼原曲，每个剪点在小节头上，两边各交叉 XF 帧，免得咔哒一声。
export const SCENES = [
  { name: "Opening", Scene: Opening, from: 0, frames: OPENING_FRAMES },
  { name: "Dictate", Scene: Dictate, from: b(32), frames: DICTATE_FRAMES },
  { name: "Translate", Scene: Translate, from: b(64), frames: TRANSLATE_FRAMES },
  { name: "Lookup", Scene: Lookup, from: b(95), frames: LOOKUP_FRAMES },
  { name: "OneApp", Scene: OneApp, from: b(136), frames: ONEAPP_FRAMES },
  { name: "Climax", Scene: Climax, from: b(168), frames: CLIMAX_FRAMES },
  { name: "Outro", Scene: Outro, from: b(188), frames: OUTRO_FRAMES },
] as const;

/** 暗场：第 136 拍起是夜色（上一段的夜色圆盖着切换）；高潮那一页夜色翻走时，底下的夜色用将近三拍慢慢亮回浅色，不闪白 */
const darkAt = (frame: number) => interpolate(frame, [b(135.6), b(136), b(185.6), b(189.4)], [0, 1, 1, 0], clamp);

const VOLUME = 0.55;
const XF = 3;

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return <Fog dark={darkAt(frame)} />;
};

export const Video: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {SCENES.map(({ name, Scene, from, frames }) => (
      <Sequence key={name} name={name} from={from} durationInFrames={frames}>
        <Scene />
      </Sequence>
    ))}
    {MUSIC.map(({ at, song, beats }, i) => {
      const from = Math.max(0, b(at) - XF);
      const len = b(beats) + (i === 0 ? 0 : XF) + (i === MUSIC.length - 1 ? 0 : XF);
      const last = i === MUSIC.length - 1;
      return (
        <Sequence key={at} name={`music ${song}`} from={from} durationInFrames={len}>
          <Audio
            src={staticFile(assets.song)}
            trimBefore={songFrame(song) - (i === 0 ? 0 : XF)}
            volume={(f) =>
              interpolate(f, [0, i === 0 ? 1 : XF * 2, len - (last ? 30 : XF * 2), len], [i === 0 ? 0 : 0, VOLUME, VOLUME, last ? 0 : 0], clamp)
            }
          />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

export { VIDEO_FRAMES };
