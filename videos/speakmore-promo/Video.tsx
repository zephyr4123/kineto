import { Audio } from "@remotion/media";
import { Sequence, interpolate, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Stage, joinCameras } from "./components/Stage";
import { APP_CAMERA, APP_FRAMES, App } from "./scenes/App";
import { COST_CAMERA, COST_FRAMES, Cost } from "./scenes/Cost";
import { HOOK_CAMERA, HOOK_FRAMES, HOOK_IMPACT, Hook } from "./scenes/Hook";
import { INSTALL_CAMERA, INSTALL_FRAMES, Install } from "./scenes/Install";
import { ONEKEY_CAMERA, ONEKEY_FRAMES, OneKey } from "./scenes/OneKey";
import { ORIGIN_CAMERA, ORIGIN_FRAMES, Origin } from "./scenes/Origin";
import { OUTRO_CAMERA, OUTRO_FRAMES, OUTRO_IMPACT, Outro } from "./scenes/Outro";
import { PRIVACY_CAMERA, PRIVACY_FRAMES, Privacy } from "./scenes/Privacy";
import { USAGE_CAMERA, USAGE_FRAMES, Usage } from "./scenes/Usage";
import { WEB_CAMERA, WEB_FRAMES, Web } from "./scenes/Web";
import { BEAT, FPS } from "./theme";

// 成片的时间线：只排场景，外加贯穿全片的配乐。桌面垫在最底下，各章的镜头按起点接成一条。
// 顺序：开场 → 来历 → 怎么用 → App → 一把密钥 → 成本 → 两种装法 → 隐私 → 开源与官网 → 落款

// 配乐 ADTurnUp《purple sky》：一小节 3.6448 秒，每小节第一拍一下重的 808（歌里 2.28 + 3.6448k 秒，测出来的）。
// 从歌的 MUSIC_FROM 帧处起放，让 9.56 秒那一下（前面空了一秒半）正好落在开场印底落下的那一帧；
// 之后各章都从半小节的拍点上起，落款的印对在歌里 86.1 秒的重拍上。
const MUSIC_FROM = Math.round(9.56 * FPS - HOOK_IMPACT);
const HALF_BAR = 2 * BEAT;
/** 开场印底之后第 k 个半小节的那一帧（k 为偶数是小节的第一拍） */
const onBeat = (k: number) => Math.round(HOOK_IMPACT + k * HALF_BAR);

const SCENES = [
  { Scene: Hook, frames: HOOK_FRAMES, camera: HOOK_CAMERA, from: 0 },
  { Scene: Origin, frames: ORIGIN_FRAMES, camera: ORIGIN_CAMERA, from: onBeat(1) },
  { Scene: Usage, frames: USAGE_FRAMES, camera: USAGE_CAMERA, from: onBeat(7) },
  { Scene: App, frames: APP_FRAMES, camera: APP_CAMERA, from: onBeat(14) },
  { Scene: OneKey, frames: ONEKEY_FRAMES, camera: ONEKEY_CAMERA, from: onBeat(18) },
  { Scene: Cost, frames: COST_FRAMES, camera: COST_CAMERA, from: onBeat(22) },
  { Scene: Install, frames: INSTALL_FRAMES, camera: INSTALL_CAMERA, from: onBeat(26) },
  { Scene: Privacy, frames: PRIVACY_FRAMES, camera: PRIVACY_CAMERA, from: onBeat(33) },
  { Scene: Web, frames: WEB_FRAMES, camera: WEB_CAMERA, from: onBeat(36) },
  { Scene: Outro, frames: OUTRO_FRAMES, camera: OUTRO_CAMERA, from: onBeat(42) - OUTRO_IMPACT },
] as const;

const last = SCENES[SCENES.length - 1];
export const VIDEO_FRAMES = last.from + last.frames;
const CAMERA = joinCameras(SCENES.map(({ from, camera }) => ({ from, camera })));

// 开场口述时压着放，印底落下那一下推到满，片尾跟着画面一起淡出
const musicVolume = (f: number) =>
  interpolate(f, [0, 24, HOOK_IMPACT - 2, HOOK_IMPACT + 4, VIDEO_FRAMES - 50, VIDEO_FRAMES], [0, 0.4, 0.4, 0.66, 0.66, 0], clamp);

export const Video: React.FC = () => (
  <Stage camera={CAMERA}>
    {SCENES.map(({ Scene, frames, from }, i) => (
      <Sequence key={i} from={from} durationInFrames={frames}>
        <Scene />
      </Sequence>
    ))}
    <Audio src={staticFile(assets.music)} trimBefore={MUSIC_FROM} volume={musicVolume} />
  </Stage>
);
