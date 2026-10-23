import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog, punch } from "../../../engine/motion";
import { EASE } from "../theme";

// 代码画的窗口斜放在空间里：进场（从远处、翻过来、甩进来、从下面升上来），停着时慢慢转，退场。kick 帧在拍上顶一下。
export /** 斜放在空间里的一扇窗：进场、停着时慢慢转、退场 */
const Shot: React.FC<{
  x?: number;
  y?: number;
  w: number;
  h: number;
  enter: number;
  leave: number;
  rotY: number;
  rotX?: number;
  how: "far" | "flip" | "whip" | "below";
  kick?: number;
  children: React.ReactNode;
}> = ({ x = 0, y = 0, w, h, enter, leave, rotY, rotX = 6, how, kick, children }) => {
  const frame = useCurrentFrame();
  // 翻转进场慢一点、透明度跟着翻转一起上来：深色窗口翻成浅色窗口时亮度不跳
  const a = prog(frame, enter, how === "far" ? 44 : how === "flip" ? 26 : 16, how === "flip" ? EASE.outQuint : EASE.outExpo);
  const z = prog(frame, leave, 14, easeIn);
  if (a <= 0 || z >= 1) return null;
  const life = frame - enter;
  let t = "";
  if (how === "far") t = `translateZ(${-900 * (1 - a)}px) rotateY(${rotY - 14 * (1 - a)}deg)`;
  if (how === "flip") t = `rotateY(${rotY - 90 * (1 - a)}deg)`;
  if (how === "whip") t = `translateX(${1500 * (1 - a)}px) rotateY(${rotY + 30 * (1 - a)}deg)`;
  if (how === "below") t = `translateY(${900 * (1 - a)}px) rotateX(${rotX + 30 * (1 - a)}deg) rotateY(${rotY}deg)`;
  const out = how === "flip" ? `rotateY(${90 * z}deg)` : `translateX(${-1500 * z}px) rotateY(${-30 * z}deg)`;
  return (
    <AbsoluteFill style={{ perspective: 2600, alignItems: "center", justifyContent: "center", transform: `translate(${x}px, ${y}px)` }}>
      <div
        style={{
          width: w,
          height: h,
          transformStyle: "preserve-3d",
          transform: `${out} ${t} rotateX(${rotX}deg) rotateY(${life * 0.028}deg) scale(${(1 + Math.min(0.07, life * 0.00018)) * (kick === undefined ? 1 : punch(frame, kick, 0.025, 20))})`,
          opacity: (how === "flip" ? a : Math.min(1, a * 2.5)) * (1 - z),
          filter: a < 1 || z > 0 ? `blur(${8 * (1 - a) + 10 * z}px)` : undefined,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

