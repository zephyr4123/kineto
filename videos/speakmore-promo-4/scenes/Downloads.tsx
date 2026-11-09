import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Count, Head, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 下载量：作者发来的统计截图（npm run stats 的结果，按流量折算成完整下载、同一个 IP 同一种包一天最多算一次、已扣除自测，
// 10-14 到 11-09）。左边滚出合计，右边是截图本身；数字滚完，合计那一行描一圈。
// 截图 674×616，表格占左边 0–600，合计那一行在 505–586（原图像素）。
const T = TONE.ochre;
const at = (s: number) => LAND + sec(s);
const IMG = { w: 674, h: 616, crop: 600 };
const PAD = 24;
const ROW = { y: 505, h: 81 };

export const Downloads: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [at(-0.4), at(0.4)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ring = interpolate(frame, [at(1.5), at(2.1)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Backdrop tone="ochre" />
      <div style={{ position: "absolute", left: 116, top: 300 }}>
        <Count at={at(-0.3)} value={762} dur={100} size={300} color={T.ink} />
      </div>
      <Head at={at(-0.05)} text="次下载" color={T.ink} size={84} style={{ position: "absolute", left: 124, top: 592 }} />
      <Sub at={at(0.15)} text="Mac 与 Windows 已扣除自测" color={T.ink2} style={{ position: "absolute", left: 128, top: 704 }} />
      <div
        style={{
          position: "absolute",
          left: 1110,
          top: 540 - (IMG.h + PAD * 2) / 2 + 4 * Math.sin(frame / 80),
          padding: PAD,
          borderRadius: 22,
          background: "#fff",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 60}px) rotate(${1.2 - 0.6 * enter}deg)`,
          boxShadow: "0 46px 90px -40px oklch(0.25 0.05 60 / 0.55), 0 16px 34px -18px oklch(0.25 0.05 60 / 0.4)",
        }}
      >
        <div style={{ position: "relative", width: IMG.crop, height: IMG.h, overflow: "hidden" }}>
          <Img src={staticFile(assets.downloads)} style={{ width: IMG.w, height: IMG.h, display: "block" }} />
          {/* 合计那一行：从左往右描出一圈 */}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: ROW.y - 6,
              width: (IMG.crop - 28) * ring,
              height: ROW.h + 12,
              borderRadius: 14,
              border: ring > 0 ? `4px solid ${T.accent}` : undefined,
              background: `oklch(0.83 0.088 78 / ${0.22 * ring})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
