import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Count, Head, Line, Sub } from "../components/kit";
import { b, TONE, ZH } from "../theme";

// 开场：第一帧就有东西——抖音上三支宣传片的真实格子在画面正中叠成一摞（截图带着抖音显示的播放数），
// 一开片就移到右边、展开成一排，左边的合计同时滚起来，两秒多出齐。之后三个格子按拍子依次抬一下，让人看清每支的播放数。
// 合计按抖音显示的三个数相加（13.7 万 + 2.1 万 + 9662），只保留一位小数、往下取，不往上凑。
const T = TONE.night;
const TW = 320;
const TH = Math.round((TW * 578) / 437);
const CY = 540;
const TILES = [
  { src: assets.douyin1, x: 1030, rot: -3, pile: { x: 930, y: CY + 10, rot: -8 } },
  { src: assets.douyin2, x: 1376, rot: 0.5, pile: { x: 962, y: CY - 6, rot: -1 } },
  { src: assets.douyin3, x: 1722, rot: 3.5, pile: { x: 990, y: CY + 14, rot: 6 } },
] as const;
const FAN = [0, 80] as const;
const LIFT = [b(8), b(10), b(12)];

export const Views: React.FC = () => {
  const frame = useCurrentFrame();
  const fan = interpolate(frame, FAN, [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.1, 1) });
  return (
    <AbsoluteFill>
      <Backdrop tone="night" />
      {TILES.map((t, i) => {
        const x = t.pile.x + (t.x - t.pile.x) * fan;
        const y = t.pile.y + (CY - t.pile.y) * fan + 6 * Math.sin(frame / 70 + i * 2);
        const rot = t.pile.rot + (t.rot - t.pile.rot) * fan;
        // 依次抬一下：一拍上去、一拍半回来
        const lift = interpolate(frame, [LIFT[i], LIFT[i] + 20, LIFT[i] + 80], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        return (
          <div
            key={t.src}
            style={{
              position: "absolute",
              left: x - TW / 2,
              top: y - TH / 2 - 18 * lift,
              width: TW,
              height: TH,
              borderRadius: 22,
              overflow: "hidden",
              zIndex: i === 1 ? 2 : 1,
              transform: `rotate(${rot}deg) scale(${(0.94 + 0.06 * fan) * (1 + 0.04 * lift)})`,
              boxShadow: `0 ${40 + 20 * lift}px 80px -36px oklch(0.1 0.03 262 / ${0.7 + 0.15 * lift}), 0 0 0 1px oklch(1 0 0 / 0.08)`,
            }}
          >
            <Img src={staticFile(t.src)} style={{ width: TW, height: TH, display: "block" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 116, top: 296, display: "flex", alignItems: "flex-end", gap: 10 }}>
        <Count at={4} value={16.7} decimals={1} dur={150} size={300} color={T.ink} />
        <Line at={14}>
          <div style={{ fontFamily: ZH, fontSize: 156, lineHeight: 1, color: T.accent, paddingBottom: 6 }}>万</div>
        </Line>
      </div>
      <Head at={36} text="次播放" color={T.ink} size={84} style={{ position: "absolute", left: 124, top: 592 }} />
      <Sub at={56} text="三支短片 抖音合计" color={T.ink2} style={{ position: "absolute", left: 128, top: 704 }} />
    </AbsoluteFill>
  );
};
