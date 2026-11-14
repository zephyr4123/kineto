import { Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { SF } from "../theme";
import { DISPLAY_H, DISPLAY_TOP, SW } from "./phone";

// Snug 手机屏（Mac 上那块 540×950 点的竖屏）和整块 Mac 桌面。坐标都是 Mac 的点。

export const MW = 540;
export const MH = 950;
/** 手机屏缩进 UU 远程画面的比例 */
export const K = DISPLAY_H / MH;
export const MENU_H = 30;
export const INDICATOR_H = 28;
/** Mac 点 → 手机屏幕点 */
export const toPhone = (x: number, y: number) => ({ x: x * K, y: DISPLAY_TOP + y * K });

/** UU 远程画面里显示的 Snug 手机屏；shiftY 是键盘弹起时 UU 把画面往上推的距离（手机点） */
export const SnugDisplay: React.FC<{ children: React.ReactNode; shiftY?: number; bg?: string }> = ({ children, shiftY = 0, bg = "#fff" }) => (
  <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: -shiftY, width: MW, height: MH, transform: `scale(${K})`, transformOrigin: "0 0", background: bg, overflow: "hidden" }}>
      {children}
    </div>
  </div>
);

/** Mac 菜单栏（深色），app 是当前 App 的名字 */
export const MenuBar: React.FC<{ app: string; menus?: readonly string[]; width?: number; height?: number; size?: number }> = ({
  app,
  menus = ["File", "Edit", "View", "Window", "Help"],
  width = MW,
  height = MENU_H,
  size = 13.5,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width,
      height,
      background: "rgba(30,31,34,0.97)",
      display: "flex",
      alignItems: "center",
      fontFamily: SF,
      fontSize: size,
      color: "#f2f2f2",
      gap: size * 1.15,
      paddingLeft: size * 1.1,
      whiteSpace: "nowrap",
    }}
  >
    <Img src={staticFile(assets.appleLogo)} style={{ width: size * 1.05, height: size * 1.05 }} />
    <span style={{ fontWeight: 700 }}>{app}</span>
    {menus.map((m) => (
      <span key={m}>{m}</span>
    ))}
    <span style={{ marginLeft: "auto", display: "flex", gap: size * 1.1, alignItems: "center", paddingRight: size * 1.1 }}>
      <span style={{ letterSpacing: "-0.2em", opacity: 0.85 }}>{"‹‹"}</span>
      <svg width={size * 1.3} height={size} viewBox="0 0 18 14">
        <rect x="1" y="1" width="16" height="5" rx="2.5" fill="none" stroke="#eee" strokeWidth="1.4" />
        <rect x="1" y="8" width="16" height="5" rx="2.5" fill="none" stroke="#eee" strokeWidth="1.4" />
        <circle cx="13.5" cy="3.5" r="1.5" fill="#eee" />
        <circle cx="4.5" cy="10.5" r="1.5" fill="#eee" />
      </svg>
      <span>Fri Nov 13&nbsp;&nbsp;9:41 AM</span>
    </span>
  </div>
);

/** 窗口标题栏：红黄绿三个灯 + 标题 */
export const TitleBar: React.FC<{ title: string; top?: number; width?: number; dark?: boolean; folder?: boolean }> = ({
  title,
  top = MENU_H,
  width = MW,
  dark = false,
  folder = true,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width,
      height: 32,
      background: dark ? "#2a2b2e" : "#f4f5f7",
      borderBottom: `1px solid ${dark ? "#1a1b1d" : "#e3e4e7"}`,
      display: "flex",
      alignItems: "center",
      fontFamily: SF,
      fontSize: 13.5,
      fontWeight: 700,
      color: dark ? "#e8e8e8" : "#2b2b2e",
      whiteSpace: "nowrap",
    }}
  >
    {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
      <div key={c} style={{ position: "absolute", left: 14 + i * 20, top: 10, width: 12.5, height: 12.5, borderRadius: "50%", background: c, boxShadow: "inset 0 0 0 0.6px rgba(0,0,0,0.18)" }} />
    ))}
    <span style={{ position: "absolute", left: 82, display: "flex", alignItems: "center", gap: 6 }}>
      {folder ? (
        <svg width="16" height="13" viewBox="0 0 16 13">
          <path d="M1 2.2C1 1.5 1.5 1 2.2 1h3.6l1.6 1.6h6.4c.7 0 1.2.5 1.2 1.2v7.4c0 .7-.5 1.2-1.2 1.2H2.2C1.5 12.4 1 11.9 1 11.2z" fill="#4aa3ff" />
        </svg>
      ) : null}
      {title}
    </span>
  </div>
);

/** Snug 手机屏底部的横条：中间一个扁的上箭头（chevron.compact.up），点一下回到窗口列表 */
export const Indicator: React.FC<{ top?: number; press?: number }> = ({ top = MH - INDICATOR_H, press = 0 }) => (
  <div style={{ position: "absolute", left: 0, top, width: MW, height: INDICATOR_H, background: `rgb(${236 - 18 * press},${237 - 18 * press},${240 - 18 * press})` }}>
    <svg style={{ position: "absolute", left: MW / 2 - 14, top: 9 }} width="28" height="10" viewBox="0 0 28 10">
      <path d="M3 8 L14 3 L25 8" fill="none" stroke="#8e8e93" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** 后面那个 Safari 窗口里的页面（缩得很小，只看得出是一页文档） */
export const BackPage: React.FC = () => (
  <div style={{ padding: 30 }}>
    <div style={{ width: 260, height: 22, borderRadius: 4, background: "#0969da", opacity: 0.6 }} />
    {Array.from({ length: 14 }, (_, i) => (
      <div key={i} style={{ marginTop: 18, width: `${60 + ((i * 37) % 35)}%`, height: 12, borderRadius: 3, background: "#d0d7de" }} />
    ))}
  </div>
);

/** 桌面上的程序坞 */
const DOCK = ["iconFinder", "iconSafari", "iconGhostty", "iconVscode", "iconCursor", "iconChatgpt", "iconClaude", "iconNotion", "iconWechat", "iconSettings"] as const;

/**
 * 整块 Mac 桌面（1512×982 点，MacBook Pro 14 英寸的默认分辨率）：壁纸、菜单栏、两个窗口、程序坞。
 * 原版 UU远程 就是把这一整块等比缩进手机。front 是放在最前面的窗口内容（Ghostty 终端）。
 */
export const DW = 1512;
export const DH = 982;
export type Rect = { x: number; y: number; w: number; h: number };
export const FRONT: Rect = { x: 70, y: 62, w: 900, h: 700 };
export const BACK: Rect = { x: 640, y: 96, w: 820, h: 640 };
const WALLPAPER = "linear-gradient(160deg,#1b2d6b 0%,#3c3f9e 35%,#9a5bb8 62%,#f08a6c 88%,#ffb27a 100%)";
const WALL_GLOW = "radial-gradient(60% 50% at 30% 70%, rgba(255,255,255,0.18), transparent 70%), radial-gradient(50% 40% at 80% 20%, rgba(20,30,90,0.5), transparent 70%)";
/** 整块 Mac 桌面。back 是后面那个 Safari 窗口里的内容，传 null 就不放这个窗口，露出壁纸；backRect 是它的位置（断开时它从手机屏那边回来） */
export const MacDesktop: React.FC<{ front: React.ReactNode; back?: React.ReactNode | null; frontRect?: Rect; backRect?: Rect; frontTitle?: string; menuIcon?: React.ReactNode }> = ({
  front,
  back = <BackPage />,
  frontRect = FRONT,
  backRect = BACK,
  frontTitle = "✳ 项目目录结构",
  menuIcon,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: DW, height: DH, overflow: "hidden", background: WALLPAPER }}>
    <div style={{ position: "absolute", inset: 0, background: WALL_GLOW }} />
    <MenuBar app="Ghostty" width={DW} height={26} size={13} />
    {menuIcon}
    {/* 后面的窗口：Safari */}
    {back === null ? null : (
      <div style={{ position: "absolute", left: backRect.x, top: backRect.y, width: backRect.w, height: backRect.h, borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
        <TitleBar title="github.com/zephyr4123/snug" top={0} width={backRect.w} folder={false} />
        <div style={{ position: "absolute", top: 33, left: 0, right: 0, bottom: 0 }}>{back}</div>
      </div>
    )}
    {/* 前面的窗口：Ghostty */}
    <div style={{ position: "absolute", left: frontRect.x, top: frontRect.y, width: frontRect.w, height: frontRect.h, borderRadius: 12, overflow: "hidden", background: "#fbfcfd", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
      <TitleBar title={frontTitle} top={0} width={frontRect.w} folder={false} />
      <div style={{ position: "absolute", top: 33, left: 0, right: 0, bottom: 0 }}>{front}</div>
    </div>
    {/* 程序坞 */}
    <div
      style={{
        position: "absolute",
        left: DW / 2 - (DOCK.length * 64 + 20) / 2,
        top: DH - 84,
        width: DOCK.length * 64 + 20,
        height: 76,
        borderRadius: 22,
        background: "rgba(255,255,255,0.28)",
        border: "1px solid rgba(255,255,255,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {DOCK.map((k) => (
        <Img key={k} src={staticFile(assets[k])} style={{ width: 58, height: 58 }} />
      ))}
    </div>
  </div>
);

/**
 * 调度中心（Mission Control）：原版 UU远程 的「展开所有窗口」会在 Mac 上打开它。壁纸压暗，顶上一条桌面空间的名字，
 * 所有窗口缩小平铺。items 里每个窗口从 from（在桌面上的位置）飞到 to（平铺后的位置），p 是进度；node 是窗口本身（原大）。
 */
export type McItem = { from: Rect; to: Rect; w: number; h: number; node: React.ReactNode };
export const MissionControl: React.FC<{ p: number; items: readonly McItem[] }> = ({ p, items }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: DW, height: DH, overflow: "hidden", background: WALLPAPER }}>
    <div style={{ position: "absolute", inset: 0, background: WALL_GLOW }} />
    <div style={{ position: "absolute", inset: 0, background: `rgba(10,14,30,${0.32 * p})` }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 10, display: "flex", justifyContent: "center", gap: 46, fontFamily: SF, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", opacity: p }}>
      <span>Desktop 1</span>
      <span style={{ opacity: 0.6 }}>Desktop 2</span>
    </div>
    {items.map((it, i) => {
      const r = { x: it.from.x + (it.to.x - it.from.x) * p, y: it.from.y + (it.to.y - it.from.y) * p, w: it.from.w + (it.to.w - it.from.w) * p };
      return (
        <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: it.w, height: it.h, transform: `scale(${r.w / it.w})`, transformOrigin: "0 0" }}>
          {it.node}
        </div>
      );
    })}
  </div>
);

/** 一个原大的 Mac 窗口：圆角、影子、标题栏，内容放在标题栏下面 */
export const MacWindow: React.FC<{ w: number; h: number; title: string; children: React.ReactNode; dark?: boolean }> = ({ w, h, title, children, dark }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: 12, overflow: "hidden", background: dark ? "#1e1e1e" : "#fff", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
    <TitleBar title={title} top={0} width={w} folder={false} dark={dark} />
    <div style={{ position: "absolute", top: 33, left: 0, right: 0, bottom: 0 }}>{children}</div>
  </div>
);

/** 一台 MacBook 的正面：屏幕 width 像素宽（里面放 DW×DH 点的桌面，按比例缩），下面一条机身 */
export const MacBook: React.FC<{ left: number; top: number; width: number; children: React.ReactNode }> = ({ left, top, width, children }) => {
  const k = width / DW;
  const h = DH * k;
  return (
    <div style={{ position: "absolute", left: left - 22, top: top - 22 }}>
      <div style={{ width: width + 44, height: h + 40, borderRadius: 30, background: "#0d0f14", border: "2px solid #3b4257", boxShadow: "0 40px 90px rgba(20,40,90,0.3)", position: "relative" }}>
        <div style={{ position: "absolute", left: 22, top: 22, width, height: h, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ width: DW, height: DH, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
        </div>
      </div>
      <div style={{ width: width + 120, height: 26, marginLeft: -38, borderRadius: "0 0 26px 26px", background: "linear-gradient(180deg,#a8b2c8,#5d667c)" }} />
    </div>
  );
};
