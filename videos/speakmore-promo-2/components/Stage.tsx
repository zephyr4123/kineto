import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from "remotion";
import { type Camera, sampleKeys } from "../../../engine/camera";
import { MacDesktop } from "../../../engine/speakmore/MacDesktop";
import { assets } from "../assets.gen";
import { COLOR, EASE, SANS } from "../theme";

// 桌面垫在整片最底下：10-17 的真屏幕截图（海上日落），程序坞里抠掉了 Typeless 和四个最小化窗口。
// 大部分章节桌面退到底（虚、暗），字和界面压在上面；各章给自己的镜头关键帧，成片按起点接成一条。

/** 程序坞的外框（截图像素） */
export const DOCK = { left: 310, top: 1824, right: 2712, bottom: 1955 };
// 菜单栏的时间：和 Windows 桌面上那块对得上
export const CLOCK = "10月12日 周一  09:41";

export const Desktop: React.FC<{ focus: number; zoom?: number }> = ({ focus, zoom }) => (
  <MacDesktop src={staticFile(assets.desktop)} dock={DOCK} clock={CLOCK} fontFamily={SANS} focus={focus} zoom={zoom} chromeFade />
);

export const Stage: React.FC<{ camera: Camera; children?: React.ReactNode }> = ({ camera, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COLOR.canvas }}>
      <Desktop focus={sampleKeys(camera.focus, frame, EASE.inOut)} zoom={sampleKeys(camera.zoom, frame, Easing.linear)} />
      {/* 四角再压暗一点，字落在中间更稳 */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 40%, oklch(0.08 0.01 300 / 0.55) 100%)" }} />
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

/** 大部分章节用的镜头：桌面退到底，极慢地往前推 */
export const deepCamera = (frames: number, from = 1, to = 1.025): Camera => ({
  focus: [[0, 1]],
  zoom: [
    [0, from],
    [frames, to],
  ],
});
