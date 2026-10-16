import { show } from "../motion";
import { COLOR, SHADOW } from "../theme";

/** 一行字幕：左上方，进出场和全片一样 */
export const Caption: React.FC<{
  frame: number;
  at: number;
  out?: number;
  left?: number;
  top?: number;
  size?: number;
  children: React.ReactNode;
}> = ({ frame, at, out, left = 200, top = 128, size = 56, children }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      fontSize: size,
      fontWeight: 500,
      lineHeight: 1.3,
      letterSpacing: "0.02em",
      color: COLOR.ink,
      textShadow: SHADOW,
      whiteSpace: "nowrap",
      ...show(frame, at, out),
    }}
  >
    {children}
  </div>
);
