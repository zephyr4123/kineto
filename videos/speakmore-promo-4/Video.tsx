import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Grain, skyline } from "./components/kit";
import { Brand } from "./scenes/Brand";
import { Code } from "./scenes/Code";
import { Cost } from "./scenes/Cost";
import { Dictate } from "./scenes/Dictate";
import { Issues } from "./scenes/Issues";
import { Lookup } from "./scenes/Lookup";
import { Outro } from "./scenes/Outro";
import { Repo } from "./scenes/Repo";
import { Thanks } from "./scenes/Thanks";
import { Translate } from "./scenes/Translate";
import { Views } from "./scenes/Views";
import { b, H, LAND, MUSIC_END, VIDEO_FRAMES, W } from "./theme";

// 成片的时间线：只排卡片和配乐。每张卡在"落点"那一拍铺满：落点前两拍（LAND 帧）新卡片从五道竖条里升上来，
// 盖在上一张上面；上一张同时往上让一点、暗一点，动作都朝上，接得顺。落点都在音乐抽空后重新进来的那一拍。
export const CARDS = [
  { name: "Views", Scene: Views, land: 0 },
  { name: "Repo", Scene: Repo, land: b(20) },
  { name: "Brand", Scene: Brand, land: b(32) },
  { name: "Dictate", Scene: Dictate, land: b(44) },
  { name: "Translate", Scene: Translate, land: b(60) },
  { name: "Lookup", Scene: Lookup, land: b(76) },
  { name: "Cost", Scene: Cost, land: b(92) },
  { name: "Issues", Scene: Issues, land: b(108) },
  { name: "Code", Scene: Code, land: b(124) },
  { name: "Thanks", Scene: Thanks, land: b(140) },
  { name: "Outro", Scene: Outro, land: b(156) },
] as const;

/** 每张卡的 Sequence：从升起开始（第一张从 0 开始），到下一张铺满为止 */
export const SPANS = CARDS.map((c, i) => {
  const from = i === 0 ? 0 : c.land - LAND;
  const next = CARDS[i + 1];
  const to = next ? next.land : VIDEO_FRAMES;
  return { ...c, from, frames: to - from, leaveAt: next ? next.land - LAND - from : Number.POSITIVE_INFINITY, first: i === 0, last: !next };
});

const ease = Easing.inOut(Easing.cubic);

const Card: React.FC<{ first: boolean; last: boolean; frames: number; leaveAt: number; children: React.ReactNode }> = ({ first, last, frames, leaveAt, children }) => {
  const frame = useCurrentFrame();
  // 最后一张没有下一张来盖，不用让
  const leave = Number.isFinite(leaveAt) ? interpolate(frame, [leaveAt, leaveAt + LAND], [0, 1], { ...clamp, easing: ease }) : 0;
  const revealing = !first && frame < LAND;
  // 新卡片像一页纸叠上来：沿着升起的边有一道柔和的投影，里面的内容跟着往上浮一点
  const enter = first ? 1 : interpolate(frame, [0, LAND], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // 每张卡在自己的时长里慢慢推近一点，镜头不停；落版那张在音乐收住前推完，之后静止
  const push = last ? interpolate(frame, [0, LAND + 150], [0, 0.02], { ...clamp, easing: Easing.out(Easing.cubic) }) : (0.03 * frame) / frames;
  return (
    <AbsoluteFill style={{ filter: revealing ? "drop-shadow(0 -14px 28px oklch(0.1 0.02 260 / 0.32))" : undefined }}>
      <AbsoluteFill style={{ clipPath: revealing ? skyline(frame, LAND, W, H) : undefined, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            transform: `translateY(${(1 - enter) * 90 - 56 * leave}px) scale(${1 + push})`,
            filter: leave > 0 ? `brightness(${1 - 0.18 * leave})` : undefined,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 响度对着前几支的 -14 LUFS 上下
const VOLUME = 0.58;

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {SPANS.map(({ name, Scene, from, frames, leaveAt, first, last }) => (
      <Sequence key={name} name={name} from={from} durationInFrames={frames}>
        <Card first={first} last={last} frames={frames} leaveAt={leaveAt}>
          <Scene />
        </Card>
      </Sequence>
    ))}
    <Grain />
    <Sequence name="music" durationInFrames={MUSIC_END + 12}>
      <Audio src={staticFile(assets.song)} volume={(f) => interpolate(f, [0, 2, MUSIC_END - 18, MUSIC_END + 12], [0, VOLUME, VOLUME, 0], clamp)} />
    </Sequence>
  </AbsoluteFill>
);
