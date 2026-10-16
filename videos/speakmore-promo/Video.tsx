import { Audio } from "@remotion/media";
import { Sequence, Series, interpolate, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Stage, joinCameras } from "./components/Stage";
import { COST_CAMERA, COST_FRAMES, Cost } from "./scenes/Cost";
import { HOOK_CAMERA, HOOK_FRAMES, Hook } from "./scenes/Hook";
import { INSTALL_CAMERA, INSTALL_FRAMES, Install } from "./scenes/Install";
import { ONEKEY_CAMERA, ONEKEY_FRAMES, OneKey } from "./scenes/OneKey";
import { ORIGIN_CAMERA, ORIGIN_FRAMES, Origin } from "./scenes/Origin";
import { OUTRO_CAMERA, OUTRO_FRAMES, Outro } from "./scenes/Outro";
import { PRIVACY_CAMERA, PRIVACY_FRAMES, Privacy } from "./scenes/Privacy";
import { USAGE_CAMERA, USAGE_FRAMES, Usage } from "./scenes/Usage";
import { WEB_CAMERA, WEB_FRAMES, Web } from "./scenes/Web";

// 成片的时间线：只排场景。桌面垫在最底下贯穿全片，各章的镜头按起点接成一条。
// 顺序：开场 → 来历 → 怎么用 → 一把密钥 → 成本 → 两种装法 → 隐私 → 开源与官网 → 落款
const SCENES = [
  { Scene: Hook, frames: HOOK_FRAMES, camera: HOOK_CAMERA },
  { Scene: Origin, frames: ORIGIN_FRAMES, camera: ORIGIN_CAMERA },
  { Scene: Usage, frames: USAGE_FRAMES, camera: USAGE_CAMERA },
  { Scene: OneKey, frames: ONEKEY_FRAMES, camera: ONEKEY_CAMERA },
  { Scene: Cost, frames: COST_FRAMES, camera: COST_CAMERA },
  { Scene: Install, frames: INSTALL_FRAMES, camera: INSTALL_CAMERA },
  { Scene: Privacy, frames: PRIVACY_FRAMES, camera: PRIVACY_CAMERA },
  { Scene: Web, frames: WEB_FRAMES, camera: WEB_CAMERA },
  { Scene: Outro, frames: OUTRO_FRAMES, camera: OUTRO_CAMERA },
] as const;

const starts = SCENES.map((_, i) => SCENES.slice(0, i).reduce((sum, s) => sum + s.frames, 0));
export const VIDEO_FRAMES = SCENES.reduce((sum, s) => sum + s.frames, 0);
const CAMERA = joinCameras(SCENES.map((s, i) => ({ from: starts[i], camera: s.camera })));

// 低频铺底从开场片名落定前后进来，垫到片尾一起淡出；配乐来了就换掉它
const BED_FROM = HOOK_FRAMES - 90;
const BED_FRAMES = VIDEO_FRAMES - BED_FROM;

export const Video: React.FC = () => (
  <Stage camera={CAMERA}>
    <Series>
      {SCENES.map(({ Scene, frames }, i) => (
        <Series.Sequence key={i} durationInFrames={frames}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
    <Sequence from={BED_FROM} durationInFrames={BED_FRAMES} layout="none" name="bed">
      <Audio src={staticFile(assets.ambBed)} volume={(f) => interpolate(f, [0, 120, BED_FRAMES - 60, BED_FRAMES], [0, 0.2, 0.2, 0], clamp)} />
    </Sequence>
  </Stage>
);
