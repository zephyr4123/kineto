import { noise } from "@remotion/effects/noise";
import { AbsoluteFill, Img, Sequence, Solid, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { tween } from "../../../engine/motion";
import { assets } from "../assets.gen";
import type { SceneId } from "../script";
import { PAPER } from "../theme";
import type { TimedScene } from "../timeline";

// 背景：每个场景一张自然照片，强虚化、慢慢漂移，上面盖一层纸色——照片只给光影和色彩氛围，不当主角，
// 前景的插画始终清楚。场景切换时背景溶接；有的场景里背景还跟着动画变（烘焙越来越暖、晒场随太阳明暗）。

type Look = {
  readonly src: string;
  // 纸色罩层的浓度：越大越接近纸面
  readonly veil: number;
  // 场景内的变化：p 是场景进度（0~1），返回额外的暖色罩与亮度
  readonly mood?: (p: number) => { readonly warm?: number; readonly bright?: number };
};

const LOOKS: Record<SceneId, Look> = {
  cup: { src: assets.cupHands, veil: 0.62 },
  climate: { src: assets.bgMountains, veil: 0.5 },
  belt: { src: assets.bgOcean, veil: 0.55 },
  anatomy: { src: assets.cherryBranch, veil: 0.56 },
  harvest: { src: assets.pickBranch, veil: 0.52 },
  drying: { src: assets.dryingBeds, veil: 0.5, mood: (p) => ({ bright: 0.94 + 0.18 * Math.sin(p * Math.PI) }) },
  hulling: { src: assets.greenSort, veil: 0.58 },
  shipping: { src: assets.cargoShip, veil: 0.48 },
  roast: { src: assets.goldenDrum, veil: 0.6, mood: (p) => ({ warm: 0.42 * p, bright: 1 - 0.12 * p }) },
  brew: { src: assets.kettlePour, veil: 0.6 },
  journey: { src: assets.cupHands, veil: 0.55, mood: (p) => ({ warm: 0.18 * p }) },
};

// 背景溶接比前景的场景切换更长、更缓
const BLEND = 30;

const Layer: React.FC<{ readonly look: Look; readonly duration: number; readonly first: boolean }> = ({ look, duration, first }) => {
  const f = useCurrentFrame();
  const p = tween(f, [BLEND, duration - BLEND], [0, 1]);
  const mood = look.mood?.(p) ?? {};
  return (
    <AbsoluteFill style={{ opacity: first ? 1 : tween(f, [0, BLEND], [0, 1]) }}>
      <Img
        src={staticFile(look.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `blur(26px) saturate(0.85) brightness(${mood.bright ?? 1})`,
          scale: String(interpolate(f, [0, duration], [1.18, 1.26])),
          translate: `${interpolate(f, [0, duration], [-18, 18])}px 0px`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: PAPER, opacity: look.veil }} />
      {mood.warm ? <AbsoluteFill style={{ backgroundColor: "#b5562a", mixBlendMode: "multiply", opacity: mood.warm }} /> : null}
    </AbsoluteFill>
  );
};

export const Backdrop: React.FC<{ readonly scenes: readonly TimedScene[]; readonly total: number }> = ({ scenes, total }) => {
  const { fps, width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      {scenes.map((s, i) => {
        const from = i === 0 ? 0 : s.start - BLEND / 2;
        const until = i === scenes.length - 1 ? total : scenes[i + 1]!.start + BLEND / 2;
        return (
          <Sequence key={s.scene} name={`backdrop:${s.scene}`} from={from} durationInFrames={until - from} premountFor={fps}>
            <Layer look={LOOKS[s.scene]} duration={until - from} first={i === 0} />
          </Sequence>
        );
      })}
      {/* 书眉和字幕所在的纸面再提亮一层，字始终看得清 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(241,234,223,0.55) 0px, rgba(241,234,223,0) 330px, rgba(241,234,223,0) 1180px, rgba(241,234,223,0.78) 1300px, rgba(241,234,223,0.6) 1920px)`,
        }}
      />
      {/* 纸纹：静止的颗粒，几乎不占码率 */}
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.08 }}>
        <Solid width={width} height={height} color="#9a9a9a" effects={[noise({ amount: 1, seed: 7 })]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
