import { Fragment } from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { tween } from "../../../engine/motion";
import { HAIRLINE, INK, MUTED, PAPER, SERIF } from "../theme";

// 片尾：书名、一条细线、出处。背景照片作者多，按图库统一致谢；逐张的作者与许可证记在素材库里
export const CREDITS = [
  ["背景摄影", "Pexels · Unsplash 上的摄影师们"],
  ["地图", "Natural Earth"],
  ["旁白", "腾讯云语音合成"],
  ["配乐", "Scott Buckley《The Long Way Home》CC BY 4.0"],
  ["制作", "kineto"],
] as const;

export const EndCard: React.FC<{ readonly credits?: readonly (readonly [string, string])[] }> = ({ credits = CREDITS }) => {
  const f = useCurrentFrame();
  const enter = tween(f, [6, 36], [0, 1], Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SERIF, opacity: enter }}>
      {/* 片尾压在虚化的背景上：先铺一层纸，署名的小字才看得清 */}
      <AbsoluteFill style={{ backgroundColor: PAPER, opacity: 0.72 }} />
      <div style={{ fontSize: 60, fontWeight: 600, color: INK, letterSpacing: "0.14em", translate: `0px ${(1 - enter) * 10}px` }}>一杯咖啡的一生</div>
      <div style={{ position: "relative", width: 120, height: 1.5, backgroundColor: HAIRLINE, margin: "48px 0 44px" }} />
      {/* 衬底是绝对定位的，会画在普通排版的元素之上；署名放进相对定位的容器里，才落在衬底上面 */}
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "auto auto", columnGap: 28, fontSize: 27, lineHeight: 2.1, letterSpacing: "0.06em" }}>
        {credits.map(([role, who]) => (
          <Fragment key={role}>
            <span style={{ color: INK, textAlign: "right" }}>{role}</span>
            <span style={{ color: MUTED }}>{who}</span>
          </Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
