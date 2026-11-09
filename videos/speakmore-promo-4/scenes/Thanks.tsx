import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Count, Head, Sub, sec } from "../components/kit";
import { LAND, SANS, TONE } from "../theme";

// 致谢：合并了 PR 的三位，加上 issue 促成了新功能或修复的九位（被谢绝、没做的需求和机器人扫描的 PR 不算）。
// 头像和名字照 GitHub 原样。顺序：先 PR 作者，再按 issue 编号。
const T = TONE.cinnabar;
const at = (s: number) => LAND + sec(s);
const PEOPLE = [
  ["Kylelau339", assets.avKylelau339],
  ["reverieach", assets.avReverieach],
  ["lijunyu726", assets.avLijunyu726],
  ["gialoc668", assets.avGialoc668],
  ["ZlxmChen", assets.avZlxmChen],
  ["iceloon", assets.avIceloon],
  ["68me", assets.av68me],
  ["OiverCai", assets.avOiverCai],
  ["ShaneMike-cn", assets.avShaneMikecn],
  ["ElsieHu", assets.avElsieHu],
  ["xiaofenghaoku", assets.avXiaofenghaoku],
  ["kevin-sol", assets.avKevinsol],
] as const;

export const Thanks: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop tone="cinnabar" />
      <div style={{ position: "absolute", left: 116, top: 250 }}>
        <Count at={at(-0.1)} value={PEOPLE.length} dur={70} size={330} color={T.ink} />
      </div>
      <Head at={at(0.3)} text="位社区贡献者" color={T.ink} size={84} style={{ position: "absolute", left: 124, top: 588 }} />
      <Sub at={at(0.6)} text="提出需求 报告问题 提交代码" color={T.ink2} style={{ position: "absolute", left: 128, top: 700 }} />
      <div style={{ position: "absolute", left: 900, top: 200, width: 900, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 46 }}>
        {PEOPLE.map(([name, src], i) => {
          const p = interpolate(frame, [at(0.3) + i * 6, at(0.3) + i * 6 + 44], [0, 1], { ...clamp, easing: outExpo });
          const float = Math.sin((frame + i * 37) / 70) * 3;
          return (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: p, transform: `translateY(${(1 - p) * 36 + float}px)` }}>
              <Img
                src={staticFile(src)}
                style={{ width: 128, height: 128, borderRadius: "50%", border: `4px solid ${T.ink}`, background: T.ink, objectFit: "cover", boxShadow: "0 18px 30px -16px oklch(0.15 0.04 30 / 0.6)" }}
              />
              <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22, color: T.ink, letterSpacing: "0.02em" }}>{name}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
