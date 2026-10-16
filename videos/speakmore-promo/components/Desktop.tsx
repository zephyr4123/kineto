import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { assets } from "../assets.gen";
import { UI_ICONS } from "../icons";
import { SANS } from "../theme";
import { Glyph } from "./Glyph";

// 一台 Mac 的桌面：底图是真屏幕的截图（壁纸连程序坞），顶上的菜单栏是画的，悬浮条和字幕都在它上面。
// 截图是 3024×1964 的 2 倍图，裁掉顶上 263 像素（真菜单栏在里面）成 16:9，四周镜像多出 63 像素，留在画外给虚化垫边。
// 放进画面时盖满、底边对齐（程序坞总在底下）：横版 1920 宽正好缩成 40/63，竖版按高度缩、左右居中裁掉两边。
// 程序坞里抠掉了 Typeless 和三个最小化的窗口；真菜单栏有私人的状态图标和真时间，换成画的。
const SCREEN = { width: 3024, height: 1701, cropTop: 263, pad: 63 };

/** 截图在 width×height 的画面里怎么放：缩放倍数 k，截图（不含镜像边）左上角落在 (x, y) */
const layout = (width: number, height: number) => {
  const k = Math.max(width / SCREEN.width, height / SCREEN.height);
  return { k, x: (width - SCREEN.width * k) / 2, y: height - SCREEN.height * k };
};
type Layout = ReturnType<typeof layout>;
/** 真屏幕上的一点（截图像素）换成画面上的像素 */
const fromShot = (l: Layout, x: number, y: number) => [l.x + x * l.k, l.y + (y - SCREEN.cropTop) * l.k] as const;

/** 程序坞的外框（截图像素） */
const DOCK = { left: 272, top: 1822, right: 2751, bottom: 1955 };
const H16x9 = layout(1920, 1080);
const [SM_X, SM_Y] = fromShot(H16x9, 2040, 1887);
/** 横版画面里程序坞上 SpeakMore 图标的中心和边长，App 那章从这里把窗口打开 */
export const DOCK_SPEAKMORE = { x: SM_X, y: SM_Y, size: 74 * H16x9.k };

// 菜单栏的时间：周一早上 9:41，口述里"后天的会改到周五"在这一天说得通
const CLOCK = "10月12日 周一  09:41";
const MENUS = ["文件", "编辑", "显示", "前往", "窗口", "帮助"];

/** focus：字幕出来时桌面退后（虚一点、暗一点），0 是原样，1 是退到底；zoom：整块桌面连菜单栏、程序坞一起推近 */
export const Desktop: React.FC<{ focus: number; zoom?: number }> = ({ focus, zoom = 1 }) => {
  const { width, height } = useVideoConfig();
  const l = layout(width, height);
  const [dockL, dockT] = fromShot(l, DOCK.left, DOCK.top);
  const [dockR, dockB] = fromShot(l, DOCK.right, DOCK.bottom);
  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS, transform: zoom === 1 ? undefined : `scale(${zoom})` }}>
      <Shot l={l} style={{ filter: focus > 0.01 ? `blur(${12 * focus}px)` : undefined }} />
      {/* 桌面退后时程序坞不跟着虚：把截图里程序坞那一块原样再盖一层 */}
      {focus > 0.01 ? (
        <div style={{ position: "absolute", left: dockL, top: dockT, width: dockR - dockL, height: dockB - dockT, borderRadius: 41 * l.k, overflow: "hidden" }}>
          <Shot l={{ ...l, x: l.x - dockL, y: l.y - dockT }} />
        </div>
      ) : null}
      <MenuBar k={l.k} />
      <AbsoluteFill style={{ background: `oklch(0.12 0.01 255 / ${0.58 * focus})` }} />
    </AbsoluteFill>
  );
};

const Shot: React.FC<{ l: Layout; style?: React.CSSProperties }> = ({ l, style }) => (
  <Img
    src={staticFile(assets.desktop)}
    style={{
      position: "absolute",
      left: l.x - SCREEN.pad * l.k,
      top: l.y - SCREEN.pad * l.k,
      width: (SCREEN.width + 2 * SCREEN.pad) * l.k,
      height: (SCREEN.height + 2 * SCREEN.pad) * l.k,
      maxWidth: "none",
      ...style,
    }}
  />
);

// macOS 26 的菜单栏是全透明的，字直接压在壁纸上，靠一点阴影托住。照真屏幕的点数画：1 点 = 2 个截图像素
const MenuBar: React.FC<{ k: number }> = ({ k }) => {
  const pt = (n: number) => n * 2 * k;
  return (
    <div
      style={{
        position: "absolute",
        inset: "0 0 auto",
        height: pt(31),
        display: "flex",
        alignItems: "center",
        padding: `0 ${pt(18)}px`,
        gap: pt(18),
        fontSize: pt(13),
        color: "oklch(0.99 0 0)",
        textShadow: "0 1px 3px oklch(0 0 0 / 0.35)",
      }}
    >
      <span style={{ fontWeight: 700 }}>访达</span>
      {MENUS.map((menu) => (
        <span key={menu} style={{ fontWeight: 450 }}>
          {menu}
        </span>
      ))}
      <span style={{ flex: 1 }} />
      {/* SpeakMore 在菜单栏上的图标：那方印刻出来的五道（assets/tray.svg） */}
      <svg viewBox="168 174 680 680" width={pt(16)} height={pt(16)} fill="currentColor" style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" }}>
        <polygon points="197,469 271,437 271,644 197,611" />
        <polygon points="329,348 398,315 411,354 411,701 395,743 329,712" />
        <polygon points="469,219 517,187 547,226 547,814 526,842 469,811" />
        <polygon points="606,372 672,342 686,359 686,674 677,720 606,685" />
        <polygon points="745,439 820,469 820,609 745,641" />
      </svg>
      <Glyph icon={UI_ICONS.wifi} size={pt(15)} style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" }} />
      <Glyph icon={UI_ICONS.search} size={pt(14)} style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" }} />
      <span style={{ fontWeight: 450, whiteSpace: "pre" }}>{CLOCK}</span>
    </div>
  );
};
