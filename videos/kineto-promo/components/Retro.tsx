import { AbsoluteFill } from "remotion";
import { FONT_ARCADE, INK } from "../theme";

// 扫描线 + 暗角，叠在每个场景最上层，统一成街机屏幕的质感
export const Crt: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.16) 3px, rgba(0,0,0,0.16) 4px)",
        opacity: strength,
      }}
    />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(10,16,48,0.38) 100%)", opacity: strength }} />
  </AbsoluteFill>
);

// 像素风方框：四条边用 box-shadow 画，四个角自然缺一格，是老游戏对话框的样子
export const PixelBox: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  border?: number;
  color?: string;
  fill?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, border = 6, color = "white", fill = INK, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: fill,
      boxShadow: `0 -${border}px 0 0 ${color}, 0 ${border}px 0 0 ${color}, -${border}px 0 0 0 ${color}, ${border}px 0 0 0 ${color}`,
      ...style,
    }}
  >
    {children}
  </div>
);

// 头顶气泡：「?」「!」之类的单字符，弹出时带回弹
export const Bubble: React.FC<{ x: number; y: number; text: string; scale: number; color?: string }> = ({ x, y, text, scale, color = "white" }) => {
  if (scale <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${scale})`, transformOrigin: "50% 100%" }}>
      <PixelBox x={0} y={0} w={92} h={92} border={6} color={INK} fill={color} style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: FONT_ARCADE,
            fontSize: 52,
            color: INK,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 6,
            paddingTop: 6,
          }}
        >
          {text}
        </div>
      </PixelBox>
      <div style={{ position: "relative", left: 34, width: 24, height: 12, backgroundColor: color, boxShadow: `-6px 0 0 0 ${INK}, 6px 0 0 0 ${INK}` }} />
      <div style={{ position: "relative", left: 40, width: 12, height: 10, backgroundColor: color, boxShadow: `-6px 0 0 0 ${INK}, 6px 0 0 0 ${INK}, 0 6px 0 0 ${INK}` }} />
    </div>
  );
};
