import { AbsoluteFill, Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { UI_ICONS } from "../icons";
import { SANS } from "../theme";
import { Glyph } from "./Glyph";

// 一台 Mac 的桌面：底图是真屏幕的截图（壁纸连程序坞），顶上的菜单栏是画的，悬浮条和字幕都在它上面。
// 截图是 3024×1964 的 2 倍图，裁掉顶上 263 像素（真菜单栏在里面）成 16:9，四周镜像多出 63 像素，
// 按 1920 宽放就是缩成 40/63：多出的那圈正好 40 像素，留在画外给虚化垫边。
// 程序坞里抠掉了 Typeless 和三个最小化的窗口；真菜单栏有私人的状态图标和真时间，换成画的。
const K = 40 / 63;
const SHOT = { width: 3150 * K, height: 1827 * K, inset: 40 };
/** 截图里的点换成画面上的像素（截图原点在真屏幕左上角，裁掉了顶上 263 像素） */
const fromShot = (x: number, y: number) => [x * K, (y - 263) * K] as const;

const [DOCK_L, DOCK_T] = fromShot(272, 1822);
const [DOCK_R, DOCK_B] = fromShot(2751, 1955);
const DOCK = { left: DOCK_L, top: DOCK_T, width: DOCK_R - DOCK_L, height: DOCK_B - DOCK_T, radius: 26 };
const [SM_X, SM_Y] = fromShot(2040, 1887);
/** 程序坞里 SpeakMore 图标的中心和边长（画面像素），App 那章从这里把窗口打开 */
export const DOCK_SPEAKMORE = { x: SM_X, y: SM_Y, size: 74 * K };

// 菜单栏照真屏幕的点数画：1 点 = 2 个截图像素
const pt = (n: number) => n * 2 * K;
// 菜单栏的时间：周一早上 9:41，口述里"后天的会改到周五"在这一天说得通
const CLOCK = "10月12日 周一  09:41";
const MENUS = ["文件", "编辑", "显示", "前往", "窗口", "帮助"];

/** focus：字幕出来时桌面退后（虚一点、暗一点），0 是原样，1 是退到底；zoom：整块桌面连菜单栏、程序坞一起推近 */
export const Desktop: React.FC<{ focus: number; zoom?: number }> = ({ focus, zoom = 1 }) => (
  <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS, transform: zoom === 1 ? undefined : `scale(${zoom})` }}>
    <Shot style={{ filter: focus > 0.01 ? `blur(${12 * focus}px)` : undefined }} />
    {/* 桌面退后时程序坞不跟着虚：把截图里程序坞那一块原样再盖一层 */}
    {focus > 0.01 ? (
      <div style={{ position: "absolute", ...DOCK, borderRadius: DOCK.radius, overflow: "hidden" }}>
        <Shot style={{ left: -SHOT.inset - DOCK.left, top: -SHOT.inset - DOCK.top }} />
      </div>
    ) : null}
    <MenuBar />
    <AbsoluteFill style={{ background: `oklch(0.12 0.01 255 / ${0.58 * focus})` }} />
  </AbsoluteFill>
);

const Shot: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img
    src={staticFile(assets.desktop)}
    style={{ position: "absolute", left: -SHOT.inset, top: -SHOT.inset, width: SHOT.width, height: SHOT.height, maxWidth: "none", ...style }}
  />
);

// macOS 26 的菜单栏是全透明的，字直接压在壁纸上，靠一点阴影托住
const MenuBar: React.FC = () => (
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
