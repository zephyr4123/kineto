import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Count, Head, Line, Sub } from "../components/kit";
import { b, TONE, ZH } from "../theme";

// 开场：抖音上三支宣传片的真实格子依次落下（截图带着抖音显示的播放数），左边滚出合计。
// 合计按抖音显示的三个数相加（13.7 万 + 2.1 万 + 9662），只保留一位小数、往下取，不往上凑。
const T = TONE.night;
const TILES = [
  { src: assets.douyin1, at: b(1), rot: -3 },
  { src: assets.douyin2, at: b(3), rot: 0.5 },
  { src: assets.douyin3, at: b(5), rot: 3.5 },
] as const;
const TW = 280;
const TH = Math.round((TW * 578) / 437);

export const Views: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop tone="night" />
      {TILES.map((t, i) => {
        const p = interpolate(frame, [t.at, t.at + 56], [0, 1], { ...clamp, easing: outExpo });
        return (
          <div
            key={t.src}
            style={{
              position: "absolute",
              left: 960 + i * (TW + 34),
              top: 330 - frame * 0.02,
              width: TW,
              height: TH,
              borderRadius: 22,
              overflow: "hidden",
              opacity: Math.min(1, p * 1.4),
              transform: `translateY(${(1 - p) * 90}px) rotate(${t.rot * (0.4 + 0.6 * p)}deg)`,
              boxShadow: "0 40px 80px -36px oklch(0.1 0.03 262 / 0.7), 0 0 0 1px oklch(1 0 0 / 0.08)",
            }}
          >
            <Img src={staticFile(t.src)} style={{ width: TW, height: TH, display: "block" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 116, top: 262, display: "flex", alignItems: "flex-end", gap: 10 }}>
        <Count at={b(8)} value={16.7} decimals={1} dur={120} size={330} color={T.ink} />
        <Line at={b(8) + 10}>
          <div style={{ fontFamily: ZH, fontSize: 170, lineHeight: 1, color: T.accent, paddingBottom: 6 }}>万</div>
        </Line>
      </div>
      <Head at={b(9)} text="次播放" color={T.ink} size={84} style={{ position: "absolute", left: 124, top: 588 }} />
      <Sub at={b(10)} text="三支短片 抖音合计" color={T.ink2} style={{ position: "absolute", left: 128, top: 700 }} />
    </AbsoluteFill>
  );
};
