import { Glyph } from "../../../engine/Glyph";
import { UI } from "../icons";
import { COLOR, SANS } from "../theme";

// 各家的标志（Logo、Tile）已提到 engine/speakmore/Logo.tsx（第三支也用），这里转出给第二支原有的引用；下载按钮仍是第二支自己的。
export { Logo, Tile } from "../../../engine/speakmore/Logo";

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
