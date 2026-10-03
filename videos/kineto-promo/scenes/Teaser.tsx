import { AbsoluteFill, useCurrentFrame } from "remotion";
import { H, W } from "../theme";
import { LogoMain } from "./Logo";
import { SpeedMain } from "./Speedrun";

// README 用的无声预告（GIF 循环播放）：速通里加农炮起飞、拖着彩虹尾迹穿云，接羽毛笔写出 kineto。
// GIF 帧率过高浏览器会放慢，所以预告本身就是 15fps：每一帧直接取 60fps 原片对应帧的画面
// （SpeedMain / LogoMain 都是帧号的纯函数），原画面 1920×1080 整体缩到预告画布上。
// 不能用 <Freeze>：它把帧号裁到预告自身的时长（126 帧）以内，原片第 125 帧之后就全定格了。
export const TEASER_W = 640;
export const TEASER_H = 360;
export const TEASER_FPS = 15;

// 原片里截的片段（60fps 帧号）。step 是每个预告帧前进几个原片帧：4 = 原速；
// 写字那段原速要近 4 秒、又最占 GIF 体积，按 1.5 倍速（6）播；停在标语开始打字（第 358 帧）之前，
// 否则循环前最后一帧会冒出一个孤零零的「G」
const SEGMENTS = [
  { scene: "speedrun", from: 226, to: 400, step: 4 },
  { scene: "logo", from: 30, to: 358, step: 6 },
] as const;

const lengthOf = (s: (typeof SEGMENTS)[number]) => Math.ceil((s.to - s.from) / s.step);
export const TEASER_FRAMES = SEGMENTS.reduce((n, s) => n + lengthOf(s), 0);

// 预告的第 f 帧对应哪个片段的原片第几帧
const sourceAt = (f: number) => {
  let i = f;
  for (const s of SEGMENTS) {
    if (i < lengthOf(s)) return { scene: s.scene, frame: s.from + i * s.step };
    i -= lengthOf(s);
  }
  throw new Error(`Teaser frame ${f} is out of range`);
};

export const Teaser: React.FC = () => {
  const { scene, frame } = sourceAt(useCurrentFrame());
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ width: W, height: H, transform: `scale(${TEASER_W / W})`, transformOrigin: "0 0" }}>
        {scene === "speedrun" ? <SpeedMain f={frame} /> : <LogoMain f={frame} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
