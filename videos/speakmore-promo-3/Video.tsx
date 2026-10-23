import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Fog } from "./components/Fog";
import { SMOKE_FRAMES, Smoke } from "./scenes/Smoke";
import { SONG_FROM } from "./theme";

// 现在只有一段 8 秒的冒烟片，看风格用；内容和配乐定了以后再排成片。
export const VIDEO_FRAMES = SMOKE_FRAMES;
const VOLUME = 0.5;

export const Video: React.FC = () => (
  <AbsoluteFill>
    <Fog />
    <Smoke />
    <Audio
      src={staticFile(assets.song)}
      trimBefore={SONG_FROM}
      volume={(f) => interpolate(f, [0, 10, VIDEO_FRAMES - 40, VIDEO_FRAMES], [0, VOLUME, VOLUME, 0], clamp)}
    />
  </AbsoluteFill>
);
