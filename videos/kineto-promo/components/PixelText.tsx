import { FONT_BODY, INK } from "../theme";

// 像素字：硬边描边 + 右下投影，像街机屏幕上的字。outline 是描边粗细（像素）。
export const PixelText: React.FC<{
  children: React.ReactNode;
  size: number;
  color?: string;
  font?: string;
  outline?: number;
  outlineColor?: string;
  shadow?: number;
  shadowColor?: string;
  style?: React.CSSProperties;
}> = ({ children, size, color = "white", font = FONT_BODY, outline = 0, outlineColor = INK, shadow = 0, shadowColor = INK, style }) => {
  const o = outline;
  const outlines =
    o > 0
      ? [
          [o, 0],
          [-o, 0],
          [0, o],
          [0, -o],
          [o, o],
          [-o, -o],
          [o, -o],
          [-o, o],
        ].map(([x, y]) => `${x}px ${y}px 0 ${outlineColor}`)
      : [];
  const shadows = shadow > 0 ? [`${shadow + o}px ${shadow + o}px 0 ${shadowColor}`] : [];
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        lineHeight: 1.15,
        color,
        whiteSpace: "pre",
        textShadow: [...outlines, ...shadows].join(", ") || undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
