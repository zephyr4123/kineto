import { Series } from "remotion";
import { Stage, joinCameras } from "./components/Stage";
import { HOOK_CAMERA, HOOK_FRAMES, Hook } from "./scenes/Hook";
import { ORIGIN_CAMERA, ORIGIN_FRAMES, Origin } from "./scenes/Origin";

// 成片的时间线：只排场景。桌面垫在最底下贯穿全片，各章的镜头按起点接成一条
const SCENES = [
  { Scene: Hook, frames: HOOK_FRAMES, camera: HOOK_CAMERA },
  { Scene: Origin, frames: ORIGIN_FRAMES, camera: ORIGIN_CAMERA },
] as const;

const starts = SCENES.map((_, i) => SCENES.slice(0, i).reduce((sum, s) => sum + s.frames, 0));
export const VIDEO_FRAMES = SCENES.reduce((sum, s) => sum + s.frames, 0);
const CAMERA = joinCameras(SCENES.map((s, i) => ({ from: starts[i], camera: s.camera })));

export const Video: React.FC = () => (
  <Stage camera={CAMERA}>
    <Series>
      {SCENES.map(({ Scene, frames }, i) => (
        <Series.Sequence key={i} durationInFrames={frames}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
  </Stage>
);
