import { Audio } from "@remotion/media";
import { Sequence, interpolate, staticFile } from "remotion";
import { FPS } from "../theme";

// 一个音效：在 at 帧响起，持续 duration 帧；trim 是从素材的第几秒开始取。两端各淡入淡出几帧，不会「咔」地切进切出
export const Sfx: React.FC<{
  readonly src: string;
  readonly at: number;
  readonly duration: number;
  readonly volume: number;
  readonly trim?: number;
  readonly fade?: number;
}> = ({ src, at, duration, volume, trim = 0, fade = 6 }) => (
  <Sequence name={`sfx:${src.split("/").pop()}`} from={Math.round(at)} durationInFrames={Math.round(duration)} layout="none">
    <Audio
      src={staticFile(src)}
      trimBefore={Math.round(trim * FPS)}
      volume={(f) =>
        volume *
        interpolate(f, [0, fade, duration - fade, duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      }
    />
  </Sequence>
);
