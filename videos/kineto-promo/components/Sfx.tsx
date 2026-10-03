import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { SFX_MAP, type SfxName } from "../audio/sfx-map";
import { FPS } from "../theme";

// 音效之间会叠（满屏报错连响），整体压一点免得破音；配乐之后另加
const GAIN = 0.75;

// 一个音效：从 sfx.wav 里按起止秒数裁出来，在 at 帧响起
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 1 }) => {
  const [a, b] = SFX_MAP[name];
  return (
    <Sequence from={Math.round(at)} durationInFrames={Math.ceil((b - a) * FPS) + 2} layout="none" name={`sfx:${name}`}>
      <Audio src={staticFile(assets.sfx)} trimBefore={Math.round(a * FPS)} trimAfter={Math.round(b * FPS)} volume={volume * GAIN} />
    </Sequence>
  );
};

// 一串音效：[帧, 名字, 音量?]
export const Cues: React.FC<{ cues: readonly (readonly [number, SfxName, number?])[] }> = ({ cues }) => (
  <>
    {cues.map(([at, name, volume], i) => (
      <Sfx key={i} at={at} name={name} volume={volume} />
    ))}
  </>
);
