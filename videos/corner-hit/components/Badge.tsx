import { BADGE } from "../physics";
import { fontFamily } from "../theme";

export const Badge: React.FC<{ x: number; y: number; color: string; scale?: number }> = ({
  x,
  y,
  color,
  scale = 1,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: BADGE.width,
        height: BADGE.height,
        borderRadius: 36,
        backgroundColor: color,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        fontSize: 76,
        letterSpacing: 4,
        color: "#0d0d12",
        boxShadow: `0 0 60px ${color}88`,
        scale,
      }}
    >
      KINETO
    </div>
  );
};
