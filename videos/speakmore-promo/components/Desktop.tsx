import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { APP_ICONS, UI_ICONS } from "../icons";
import { SANS } from "../theme";
import { Glyph } from "./Glyph";
import { Seal } from "./Seal";

// 一台 Mac 的桌面：壁纸铺满，顶上菜单栏，底下程序坞，悬浮条和字幕都在它上面。
// 画面按 1440×810 点的屏幕放大到 1920 宽来量（PT 倍），菜单栏、程序坞的尺寸照 macOS 的点数。
// 苹果自带的壁纸和苹果自家应用的图标不能用（没有授权），壁纸是 Pexels 的风景照，程序坞里是官网用过的那组应用标志。
const PT = 1920 / 1440;
const pt = (n: number) => n * PT;

const DOCK_APPS = ["wechat", "slack", "notion", "vscode", "chrome", "gmail", "obsidian", "figma", "telegram"] as const;
// 菜单栏的时间：周一早上 9:41，口述里"后天的会改到周五"在这一天说得通
const CLOCK = "10月12日 周一  09:41";
const MENUS = ["文件", "编辑", "显示", "前往", "窗口", "帮助"];

/** focus：字幕出来时桌面退后（虚一点、暗一点），0 是原样，1 是退到底；zoom：整块桌面连菜单栏、程序坞一起推近 */
export const Desktop: React.FC<{ focus: number; zoom?: number }> = ({ focus, zoom = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS, transform: zoom === 1 ? undefined : `scale(${zoom})` }}>
      <Img
        src={staticFile(assets.wallpaper)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // 虚化会从边上吃进一圈暗边，放大一点盖住
          transform: `scale(${1.04 + 0.03 * drift})`,
          filter: focus > 0.01 ? `blur(${12 * focus}px)` : undefined,
        }}
      />
      <MenuBar />
      <Dock />
      <AbsoluteFill style={{ background: `oklch(0.12 0.01 255 / ${0.58 * focus})` }} />
    </AbsoluteFill>
  );
};

const glass: React.CSSProperties = {
  backdropFilter: "blur(24px) saturate(1.6)",
  WebkitBackdropFilter: "blur(24px) saturate(1.6)",
};

const MenuBar: React.FC = () => (
  <div
    style={{
      ...glass,
      position: "absolute",
      inset: "0 0 auto",
      height: pt(24),
      display: "flex",
      alignItems: "center",
      padding: `0 ${pt(14)}px`,
      gap: pt(18),
      fontSize: pt(13),
      color: "oklch(0.99 0 0)",
      background: "oklch(0.2 0.01 255 / 0.22)",
      textShadow: "0 1px 2px oklch(0 0 0 / 0.25)",
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
    <svg viewBox="168 174 680 680" width={pt(16)} height={pt(16)} fill="currentColor">
      <polygon points="197,469 271,437 271,644 197,611" />
      <polygon points="329,348 398,315 411,354 411,701 395,743 329,712" />
      <polygon points="469,219 517,187 547,226 547,814 526,842 469,811" />
      <polygon points="606,372 672,342 686,359 686,674 677,720 606,685" />
      <polygon points="745,439 820,469 820,609 745,641" />
    </svg>
    <Glyph icon={UI_ICONS.wifi} size={pt(15)} />
    <Glyph icon={UI_ICONS.search} size={pt(14)} />
    <span style={{ fontWeight: 450, whiteSpace: "pre" }}>{CLOCK}</span>
  </div>
);

const Dock: React.FC = () => {
  const icon = pt(54);
  return (
    <div
      style={{
        ...glass,
        position: "absolute",
        left: "50%",
        bottom: pt(6),
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: pt(8),
        padding: pt(6),
        borderRadius: pt(22),
        background: "oklch(1 0 0 / 0.2)",
        boxShadow: `inset 0 0 0 1px oklch(1 0 0 / 0.28), 0 ${pt(10)}px ${pt(30)}px oklch(0 0 0 / 0.18)`,
      }}
    >
      {DOCK_APPS.map((name) => (
        <Tile key={name} size={icon}>
          <Glyph icon={APP_ICONS[name]} size={icon * 0.58} />
        </Tile>
      ))}
      <span style={{ width: 1, alignSelf: "stretch", margin: `${pt(6)}px ${pt(2)}px`, background: "oklch(1 0 0 / 0.35)" }} />
      <span style={{ position: "relative", display: "grid" }}>
        <Seal size={icon} bars={[1, 1, 1, 1, 1]} base={1} />
        {/* 在运行：图标底下一个小点 */}
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: -pt(5),
            width: pt(3.5),
            height: pt(3.5),
            borderRadius: "50%",
            transform: "translateX(-50%)",
            background: "oklch(0.98 0 0 / 0.85)",
          }}
        />
      </span>
    </div>
  );
};

/** 应用图标的底：白色的圆角方块，标志居中 */
const Tile: React.FC<{ size: number; children: React.ReactNode }> = ({ size, children }) => (
  <span
    style={{
      display: "grid",
      placeItems: "center",
      width: size,
      height: size,
      borderRadius: size * 0.225,
      background: "oklch(0.99 0.002 255)",
      boxShadow: `0 ${pt(1)}px ${pt(3)}px oklch(0 0 0 / 0.16)`,
    }}
  >
    {children}
  </span>
);
