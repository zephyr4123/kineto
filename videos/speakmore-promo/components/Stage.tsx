import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { type Camera, sampleKeys } from "../../../engine/camera";
import { COLOR, EASE } from "../theme";
import { Desktop } from "./Desktop";

// 桌面垫在整片最底下，各章只画自己的字和物件。桌面怎么动由"镜头"说了算：每章给一组关键帧，
// 成片按各章的起点接成一条，章与章之间桌面就不会跳。单独预览一章时用这一章自己的那组。

export const Stage: React.FC<{ camera: Camera; children?: React.ReactNode }> = ({ camera, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COLOR.canvas }}>
      {/* 退后要两头缓；推近是一直匀速往前蹭 */}
      <Desktop focus={sampleKeys(camera.focus, frame, EASE.inOut)} zoom={sampleKeys(camera.zoom, frame, Easing.linear)} />
      {children}
    </AbsoluteFill>
  );
};

/** 单独预览一章用：桌面照这一章自己的镜头垫在底下 */
export const staged = (Scene: React.FC, camera: Camera): React.FC => {
  const Staged: React.FC = () => (
    <Stage camera={camera}>
      <Scene />
    </Stage>
  );
  return Staged;
};

export { type Camera, type Keys, joinCameras } from "../../../engine/camera";
