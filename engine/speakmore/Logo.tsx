import { Img, staticFile } from "remotion";

// 各家的标志（第二、三支共用）：用它们真实的彩色标志（素材登记在 assets/manifest.jsonl），按高度排，或放进 App 图标那样的圆角方块里。

/** 按高度放一个标志（字标宽窄不一，按高度排才一样重） */
export const Logo: React.FC<{ src: string; height: number; style?: React.CSSProperties }> = ({ src, height, style }) => (
  <Img src={staticFile(src)} style={{ height, width: "auto", display: "block", ...style }} />
);

/** 圆角方块里的标志；dark：标志本身是给深底画的（比如 Kimi 的白字） */
export const Tile: React.FC<{ src: string; size: number; dark?: boolean; style?: React.CSSProperties }> = ({ src, size, dark = false, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.235,
      display: "grid",
      placeItems: "center",
      background: dark ? "oklch(0.16 0.01 255)" : "oklch(0.995 0 0)",
      boxShadow: `0 0 0 1px ${dark ? "oklch(1 0 0 / 0.14)" : "oklch(0 0 0 / 0.06)"}, 0 ${size * 0.12}px ${size * 0.32}px oklch(0 0 0 / 0.35)`,
      ...style,
    }}
  >
    <Img src={staticFile(src)} style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }} />
  </div>
);
