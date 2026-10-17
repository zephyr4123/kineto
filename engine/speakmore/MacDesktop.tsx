import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { Glyph } from "../Glyph";

// SpeakMore 宣传片里的 Mac 桌面（两支共用）：底图是真屏幕的截图（壁纸连程序坞），顶上的菜单栏是画的，悬浮条和字幕都在它上面。
// 截图都照同一个办法处理过：3024×1964 的 2 倍图裁掉顶上 263 像素（真菜单栏在里面）成 16:9，四周镜像多出 63 像素，留在画外给虚化垫边。
// 放进画面时盖满、底边对齐（程序坞总在底下）：横版 1920 宽正好缩成 40/63，竖版按高度缩、左右居中裁掉两边。
const SCREEN = { width: 3024, height: 1701, cropTop: 263, pad: 63 };

/** 截图在 width×height 的画面里怎么放：缩放倍数 k，截图（不含镜像边）左上角落在 (x, y) */
export const shotLayout = (width: number, height: number) => {
  const k = Math.max(width / SCREEN.width, height / SCREEN.height);
  return { k, x: (width - SCREEN.width * k) / 2, y: height - SCREEN.height * k };
};
type Layout = ReturnType<typeof shotLayout>;
/** 真屏幕上的一点（截图像素）换成画面上的像素 */
export const fromShot = (l: Layout, x: number, y: number) => [l.x + x * l.k, l.y + (y - SCREEN.cropTop) * l.k] as const;

/** 程序坞的外框（截图像素）：桌面退后时它不跟着虚 */
export type Rect = { left: number; top: number; right: number; bottom: number };

const MENUS = ["文件", "编辑", "显示", "前往", "窗口", "帮助"];

/**
 * src：处理好的截图；dock：截图里程序坞的外框；clock：菜单栏右边的时间。
 * focus：字幕出来时桌面退后（虚一点、暗一点），0 是原样，1 是退到底；zoom：整块桌面连菜单栏、程序坞一起推近。
 * chromeFade：桌面退后时菜单栏和程序坞也跟着淡掉（默认它们一直清楚，看得出是 Mac）
 */
export const MacDesktop: React.FC<{ src: string; dock: Rect; clock: string; fontFamily: string; focus: number; zoom?: number; chromeFade?: boolean }> = ({
  src,
  dock,
  clock,
  fontFamily,
  focus,
  zoom = 1,
  chromeFade = false,
}) => {
  const { width, height } = useVideoConfig();
  const l = shotLayout(width, height);
  const [dockL, dockT] = fromShot(l, dock.left, dock.top);
  const [dockR, dockB] = fromShot(l, dock.right, dock.bottom);
  const chrome = chromeFade ? 1 - focus : 1;
  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily, transform: zoom === 1 ? undefined : `scale(${zoom})` }}>
      <Shot src={src} l={l} style={{ filter: focus > 0.01 ? `blur(${12 * focus}px)` : undefined }} />
      {focus > 0.01 && chrome > 0.01 ? (
        <div style={{ position: "absolute", left: dockL, top: dockT, width: dockR - dockL, height: dockB - dockT, borderRadius: 41 * l.k, overflow: "hidden", opacity: chromeFade ? chrome : undefined }}>
          <Shot src={src} l={{ ...l, x: l.x - dockL, y: l.y - dockT }} />
        </div>
      ) : null}
      {chrome > 0.01 ? <MenuBar k={l.k} clock={clock} opacity={chrome} /> : null}
      <AbsoluteFill style={{ background: `oklch(0.12 0.01 255 / ${0.58 * focus})` }} />
    </AbsoluteFill>
  );
};

const Shot: React.FC<{ src: string; l: Layout; style?: React.CSSProperties }> = ({ src, l, style }) => (
  <Img
    src={src}
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

// 菜单栏右边的两个小图标：Remix Icon（ri，Apache-2.0）的 wifi-line、search-line
const WIFI = { width: 24, height: 24, body: "<path fill=\"currentColor\" d=\"M.69 6.997A17.93 17.93 0 0 1 12 3c4.285 0 8.22 1.497 11.31 3.997L21.425 9.33A14.94 14.94 0 0 0 12 6C8.43 6 5.15 7.248 2.575 9.33zm3.141 3.89A12.95 12.95 0 0 1 12 8a12.95 12.95 0 0 1 8.169 2.886l-1.886 2.334A9.96 9.96 0 0 0 12 11c-2.38 0-4.567.832-6.284 2.22zm3.142 3.89A7.97 7.97 0 0 1 12 13c1.904 0 3.653.665 5.027 1.776l-1.885 2.334A4.98 4.98 0 0 0 12 16c-1.19 0-2.283.416-3.142 1.11zm3.142 3.89A3 3 0 0 1 12 18c.714 0 1.37.25 1.885.666L12 21z\"/>" };
const SEARCH = { width: 24, height: 24, body: "<path fill=\"currentColor\" d=\"m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z\"/>" };

// macOS 26 的菜单栏是全透明的，字直接压在壁纸上，靠一点阴影托住。照真屏幕的点数画：1 点 = 2 个截图像素
const MenuBar: React.FC<{ k: number; clock: string; opacity: number }> = ({ k, clock, opacity }) => {
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
        opacity: opacity < 1 ? opacity : undefined,
      }}
    >
      <span style={{ fontWeight: 700 }}>访达</span>
      {MENUS.map((menu) => (
        <span key={menu} style={{ fontWeight: 450 }}>
          {menu}
        </span>
      ))}
      <span style={{ flex: 1 }} />
      {/* SpeakMore 在菜单栏上的图标：那方印刻出来的五道（SpeakMore 仓库的 assets/tray.svg） */}
      <svg viewBox="168 174 680 680" width={pt(16)} height={pt(16)} fill="currentColor" style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" }}>
        <polygon points="197,469 271,437 271,644 197,611" />
        <polygon points="329,348 398,315 411,354 411,701 395,743 329,712" />
        <polygon points="469,219 517,187 547,226 547,814 526,842 469,811" />
        <polygon points="606,372 672,342 686,359 686,674 677,720 606,685" />
        <polygon points="745,439 820,469 820,609 745,641" />
      </svg>
      <Glyph icon={WIFI} size={pt(15)} style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" }} />
      <Glyph icon={SEARCH} size={pt(14)} style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" }} />
      <span style={{ fontWeight: 450, whiteSpace: "pre" }}>{clock}</span>
    </div>
  );
};
