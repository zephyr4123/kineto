import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { tween } from "../../../engine/motion";
import { CREMA, FONT_DISPLAY, ROAST } from "../theme";

// 动态大字：从 2.4 倍大「砸」到位，入场那几帧带红青两色的错位残影（RGB 分离），
// 字身压一层烘焙橙的立体投影。y 是字中心离画面顶部的像素。
export const Slam: React.FC<{
  readonly text: string;
  readonly size: number;
  readonly y: number;
  readonly color?: string;
  readonly shadow?: string;
  readonly tilt?: number;
}> = ({ text, size, y, color = CREMA, shadow = ROAST, tilt = -4 }) => {
  const f = useCurrentFrame();
  const s = tween(f, [0, 5], [2.4, 1], Easing.out(Easing.cubic));
  const ghost = tween(f, [0, 7], [26, 0], Easing.out(Easing.quad));
  const depth = Math.round(size / 28);
  const base: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: y - size * 0.6,
    textAlign: "center",
    fontFamily: FONT_DISPLAY,
    fontSize: size,
    lineHeight: 1.2,
    whiteSpace: "pre",
  };
  return (
    <AbsoluteFill style={{ scale: String(s), rotate: `${tilt}deg`, opacity: tween(f, [0, 1], [0, 1]) }}>
      {ghost > 0.5 ? (
        <>
          <div style={{ ...base, color: "#ff2a4f", translate: `${-ghost}px 0px`, mixBlendMode: "screen", opacity: 0.85 }}>{text}</div>
          <div style={{ ...base, color: "#21f0ff", translate: `${ghost}px 0px`, mixBlendMode: "screen", opacity: 0.85 }}>{text}</div>
        </>
      ) : null}
      <div
        style={{
          ...base,
          color,
          textShadow: Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${shadow}`).join(", "),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// 小标签：一条色块底的说明文字，从左侧切进来
export const Chip: React.FC<{ readonly text: string; readonly y: number; readonly color?: string; readonly ink?: string }> = ({
  text,
  y,
  color = ROAST,
  ink = "#140b07",
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: y,
        padding: "10px 26px 14px",
        backgroundColor: color,
        color: ink,
        fontFamily: FONT_DISPLAY,
        fontSize: 64,
        clipPath: `inset(0 ${tween(f, [0, 5], [100, 0], Easing.out(Easing.cubic))}% 0 0)`,
        translate: `${tween(f, [0, 6], [-60, 0], Easing.out(Easing.cubic))}px 0px`,
      }}
    >
      {text}
    </div>
  );
};
