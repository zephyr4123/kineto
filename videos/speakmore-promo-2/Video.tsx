import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { joinCameras } from "../../engine/camera";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Stage } from "./components/Stage";
import { COST_CAMERA, COST_FRAMES, Cost } from "./scenes/Cost";
import { CUSTOM_CAMERA, CUSTOM_FRAMES, Custom } from "./scenes/Custom";
import { DEV_CAMERA, DEV_FRAMES, Dev } from "./scenes/Dev";
import { DOWNLOAD_CAMERA, DOWNLOAD_FRAMES, Download } from "./scenes/Download";
import { HARDWARE_CAMERA, HARDWARE_FRAMES, Hardware } from "./scenes/Hardware";
import { HERO_CAMERA, HERO_FRAMES, Hero } from "./scenes/Hero";
import { LONG_CAMERA, LONG_FRAMES, Long } from "./scenes/Long";
import { MODELS_CAMERA, MODELS_FRAMES, Models } from "./scenes/Models";
import { MODES_CAMERA, MODES_FRAMES, Modes } from "./scenes/Modes";
import { OUTRO_CAMERA, OUTRO_FRAMES, Outro } from "./scenes/Outro";
import { PRIVACY_CAMERA, PRIVACY_FRAMES, Privacy } from "./scenes/Privacy";
import { SPEED_CAMERA, SPEED_FRAMES, Speed } from "./scenes/Speed";
import { SYSTEMS_CAMERA, SYSTEMS_FRAMES, Systems } from "./scenes/Systems";
import { BEAT, beat } from "./theme";

// 成片的时间线：只排场景，外加贯穿全片的配乐。每章从一句（16 拍）的头上起。
// 官网首屏 → 两个系统 → 硬件 → 速度 → 三种方式 → 模型 → 自定义接口 → 长录音（两句）
// → 费用、隐私、下载（各以一句反问开头）→ 开发者 → 落款
//
// 配乐前 84 秒照原曲放；第 192 拍跳到原曲第 240 拍（最后一段副歌的后半句），跳点在拍上、两边交叉淡 9 帧。
// 这样落款正好落在原曲 112 秒那一句收住的地方，印底落在它重新起来的那一拍（成片第 224 拍）。

const SCENES = [
  { Scene: Hero, frames: HERO_FRAMES, camera: HERO_CAMERA, from: 0 },
  { Scene: Systems, frames: SYSTEMS_FRAMES, camera: SYSTEMS_CAMERA, from: beat(16) },
  { Scene: Hardware, frames: HARDWARE_FRAMES, camera: HARDWARE_CAMERA, from: beat(32) },
  { Scene: Speed, frames: SPEED_FRAMES, camera: SPEED_CAMERA, from: beat(48) },
  { Scene: Modes, frames: MODES_FRAMES, camera: MODES_CAMERA, from: beat(64) },
  { Scene: Models, frames: MODELS_FRAMES, camera: MODELS_CAMERA, from: beat(80) },
  { Scene: Custom, frames: CUSTOM_FRAMES, camera: CUSTOM_CAMERA, from: beat(96) },
  { Scene: Long, frames: LONG_FRAMES, camera: LONG_CAMERA, from: beat(112) },
  { Scene: Cost, frames: COST_FRAMES, camera: COST_CAMERA, from: beat(144) },
  { Scene: Privacy, frames: PRIVACY_FRAMES, camera: PRIVACY_CAMERA, from: beat(160) },
  { Scene: Download, frames: DOWNLOAD_FRAMES, camera: DOWNLOAD_CAMERA, from: beat(176) },
  { Scene: Dev, frames: DEV_FRAMES, camera: DEV_CAMERA, from: beat(192) },
  { Scene: Outro, frames: OUTRO_FRAMES, camera: OUTRO_CAMERA, from: beat(208) },
] as const;

const last = SCENES[SCENES.length - 1];
export const VIDEO_FRAMES = last.from + last.frames;
const CAMERA = joinCameras(SCENES.map(({ from, camera }) => ({ from, camera })));

const VOLUME = 0.45;
const CUT = beat(192);
/** 跳过去之后，成片的一帧对应原曲往后多少帧（48 拍） */
const SKIP = Math.round(48 * BEAT);
const XF = 9;

/** 每章里镜头都在极慢地往前推，画面不死 */
const Drift: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, frames], [1, 1.035], clamp)})` }}>{children}</AbsoluteFill>;
};

export const Video: React.FC = () => (
  <Stage camera={CAMERA}>
    {SCENES.map(({ Scene, frames, from }, i) => (
      <Sequence key={i} from={from} durationInFrames={frames}>
        {/* 开场的官网自己带着镜头，不再叠一层 */}
        {i === 0 ? (
          <Scene />
        ) : (
          <Drift frames={frames}>
            <Scene />
          </Drift>
        )}
      </Sequence>
    ))}
    <Sequence durationInFrames={CUT + XF}>
      <Audio src={staticFile(assets.music)} volume={(f) => interpolate(f, [0, 12, CUT - XF / 2, CUT + XF / 2], [0, VOLUME, VOLUME, 0], clamp)} />
    </Sequence>
    <Sequence from={CUT - XF}>
      <Audio
        src={staticFile(assets.music)}
        trimBefore={CUT - XF + SKIP}
        volume={(f) => interpolate(f, [XF / 2, XF * 1.5, VIDEO_FRAMES - (CUT - XF) - 100, VIDEO_FRAMES - (CUT - XF)], [0, VOLUME, VOLUME, 0], clamp)}
      />
    </Sequence>
  </Stage>
);
