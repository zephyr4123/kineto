import { COLOR, SANS } from "../theme";

// 几样小物件：鼠标指针、键帽。

/** Mac 的箭头指针（自己画的），尖端在 (x, y) */
export const Pointer: React.FC<{ x: number; y: number; scale?: number; opacity?: number }> = ({ x, y, scale = 1.5, opacity = 1 }) => (
  <svg
    viewBox="-2 -2 26 36"
    width={26 * scale}
    height={36 * scale}
    style={{ position: "absolute", left: x - 2 * scale, top: y - 2 * scale, opacity, filter: "drop-shadow(0 3px 6px oklch(0 0 0 / 0.35))" }}
  >
    <path d="M0 0 L0 27 L6.5 20.8 L11 31 L15.2 29.2 L10.8 19.4 L19.5 19.4 Z" fill="white" stroke="black" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

/** 键帽：SpeakMore 默认的快捷键是右边的 Option；press 是按下去的深度（0–1） */
export const Keycap: React.FC<{ label: string; press: number; size?: number; style?: React.CSSProperties }> = ({ label, press, size = 1, style }) => (
  <div
    style={{
      width: 132 * size,
      height: 112 * size,
      borderRadius: 18 * size,
      background: "linear-gradient(oklch(0.3 0.01 255), oklch(0.22 0.01 255))",
      boxShadow: `0 ${(8 - 6 * press) * size}px 0 oklch(0.12 0.01 255), 0 ${(14 - 8 * press) * size}px ${24 * size}px oklch(0 0 0 / 0.45), inset 0 1px 0 oklch(1 0 0 / 0.12)`,
      transform: `translateY(${6 * press * size}px)`,
      display: "grid",
      placeItems: "center",
      color: COLOR.ink,
      fontFamily: SANS,
      fontSize: 30 * size,
      fontWeight: 500,
      ...style,
    }}
  >
    {label}
  </div>
);
