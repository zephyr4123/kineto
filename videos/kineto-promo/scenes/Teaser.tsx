import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { H, W } from "../theme";
import { Logo } from "./Logo";
import { SpeedMain } from "./Speedrun";

// README 用的无声预告（GIF 循环播放）：速通里加农炮起飞、拖着彩虹尾迹穿云，接羽毛笔写出 kineto。
// GIF 帧率过高浏览器会放慢，所以预告本身就是 15fps：每一帧用 <Freeze> 定格到 60fps 原片的对应帧，
// 原画面 1920×1080 整体缩到预告画布上，场景代码一行不改。
export const TEASER_W = 640;
export const TEASER_H = 360;
export const TEASER_FPS = 15;
const STEP = 60 / TEASER_FPS;

// 原片里截的片段（60fps 帧号）
const SEGMENTS = [
  { scene: "speedrun", from: 226, to: 400 },
  { scene: "logo", from: 20, to: 345 },
] as const;

const lengthOf = (s: (typeof SEGMENTS)[number]) => Math.ceil((s.to - s.from) / STEP);
export const TEASER_FRAMES = SEGMENTS.reduce((n, s) => n + lengthOf(s), 0);

// 预告的第 f 帧对应哪个片段的原片第几帧
const sourceAt = (f: number) => {
  let i = f;
  for (const s of SEGMENTS) {
    if (i < lengthOf(s)) return { scene: s.scene, frame: s.from + i * STEP };
    i -= lengthOf(s);
  }
  throw new Error(`Teaser frame ${f} is out of range`);
};

export const Teaser: React.FC = () => {
  const { scene, frame } = sourceAt(useCurrentFrame());
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ width: W, height: H, transform: `scale(${TEASER_W / W})`, transformOrigin: "0 0" }}>
        {scene === "speedrun" ? (
          <SpeedMain f={frame} />
        ) : (
          <Freeze frame={frame}>
            <Logo />
          </Freeze>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
