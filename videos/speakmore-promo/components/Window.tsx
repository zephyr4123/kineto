import { Img } from "remotion";
import { UI_ICONS } from "../icons";
import { MONO, SANS, WINDOW } from "../theme";
import { Glyph } from "../../../engine/Glyph";

// 桌面上的窗口：圆角、标题栏左边三个圆点，阴影压在桌面上。自己画的通用样子，不照搬哪个应用的界面。

const BAR = 52;
const DOTS = ["#ff5f57", "#febc2e", "#28c840"];

export const Window: React.FC<{
  width: number;
  height: number;
  dark?: boolean;
  /** 标题栏中间的东西：一行字，或者浏览器的地址栏 */
  title?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, dark = false, title, children, style }) => (
  <div
    style={{
      position: "absolute",
      width,
      height,
      borderRadius: 18,
      overflow: "hidden",
      background: dark ? WINDOW.term : WINDOW.paper,
      boxShadow: `0 0 0 1px ${dark ? "oklch(1 0 0 / 0.12)" : "oklch(0 0 0 / 0.1)"}, 0 30px 80px oklch(0 0 0 / 0.38), 0 8px 22px oklch(0 0 0 / 0.22)`,
      fontFamily: SANS,
      ...style,
    }}
  >
    <div
      style={{
        position: "relative",
        height: BAR,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: dark ? WINDOW.termBar : WINDOW.bar,
        borderBottom: `1px solid ${dark ? "oklch(1 0 0 / 0.08)" : WINDOW.line}`,
        color: dark ? WINDOW.termFaint : WINDOW.faint,
        fontSize: 20,
        fontWeight: 500,
      }}
    >
      <span style={{ position: "absolute", left: 20, display: "flex", gap: 9 }}>
        {DOTS.map((c) => (
          <i key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
        ))}
      </span>
      {title}
    </div>
    <div style={{ position: "relative", height: height - BAR, overflow: "hidden" }}>{children}</div>
  </div>
);

/** 浏览器：地址栏里一把锁加网址，下面是截下来的整页，scroll 是往下翻了多少（截图的像素） */
export const Browser: React.FC<{
  width: number;
  height: number;
  url: string;
  shot: string;
  /** 截图的原宽，按窗口宽缩放 */
  shotWidth: number;
  scroll: number;
  style?: React.CSSProperties;
}> = ({ width, height, url, shot, shotWidth, scroll, style }) => {
  const k = width / shotWidth;
  return (
    <Window
      width={width}
      height={height}
      style={style}
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 34,
            padding: "0 22px",
            minWidth: 460,
            justifyContent: "center",
            borderRadius: 10,
            background: "oklch(0.92 0.005 80)",
            color: WINDOW.text,
            fontSize: 19,
            fontWeight: 450,
          }}
        >
          <Glyph icon={UI_ICONS.lock} size={17} style={{ color: WINDOW.faint }} />
          {url}
        </span>
      }
    >
      <Img src={shot} style={{ position: "absolute", left: 0, top: -scroll * k, width }} />
    </Window>
  );
};

export const MONO_STACK = `"${MONO}", "${SANS}", monospace`;
