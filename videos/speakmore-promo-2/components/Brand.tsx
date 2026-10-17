import { Img, staticFile } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { UI } from "../icons";
import { COLOR, SANS } from "../theme";

// 各家的标志：用它们真实的彩色标志（素材登记在 assets/manifest.jsonl），放进 App 图标那样的圆角方块里。

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

/** 官网首屏那两个下载按钮的样子：深底白字（light=true 时反过来，压在深色画面上用） */
export const DownloadPill: React.FC<{
  os: "apple" | "windows";
  label: string;
  light?: boolean;
  scale?: number;
  /** 按钮上的图标和字的透明度（镜头扎进按钮时先淡掉） */
  contentOpacity?: number;
  style?: React.CSSProperties;
}> = ({ os, label, light = false, scale = 1, contentOpacity = 1, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12 * scale,
      height: 62 * scale,
      minWidth: 290 * scale,
      padding: `0 ${34 * scale}px`,
      borderRadius: 999,
      background: light ? COLOR.ink : COLOR.paperInk,
      color: light ? COLOR.paperInk : COLOR.paper,
      fontFamily: SANS,
      fontSize: 23 * scale,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <Glyph icon={os === "apple" ? UI.apple : UI.windows} size={(os === "apple" ? 26 : 22) * scale} style={{ marginTop: os === "apple" ? -2 * scale : 0, opacity: contentOpacity }} />
    <span style={{ opacity: contentOpacity }}>{label}</span>
  </div>
);
