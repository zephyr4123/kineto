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
export const MacDesktop: React.FC<{ front: React.ReactNode; back?: React.ReactNode; frontRect?: Rect; menuIcon?: React.ReactNode }> = ({ front, back = <BackPage />, frontRect = FRONT, menuIcon }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: DW, height: DH, overflow: "hidden", background: "linear-gradient(160deg,#1b2d6b 0%,#3c3f9e 35%,#9a5bb8 62%,#f08a6c 88%,#ffb27a 100%)" }}>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 50% at 30% 70%, rgba(255,255,255,0.18), transparent 70%), radial-gradient(50% 40% at 80% 20%, rgba(20,30,90,0.5), transparent 70%)" }} />
    <MenuBar app="Ghostty" width={DW} height={26} size={13} />
    {menuIcon}
    {/* 后面的窗口：Safari */}
    <div style={{ position: "absolute", left: 640, top: 96, width: 820, height: 640, borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
      <TitleBar title="github.com/zephyr4123/snug" top={0} width={820} folder={false} />
      <div style={{ position: "absolute", top: 33, left: 0, right: 0, bottom: 0 }}>{back}</div>
    </div>
    {/* 前面的窗口：Ghostty */}
    <div style={{ position: "absolute", left: frontRect.x, top: frontRect.y, width: frontRect.w, height: frontRect.h, borderRadius: 12, overflow: "hidden", background: "#fbfcfd", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
      <TitleBar title="✳ 项目目录结构" top={0} width={frontRect.w} folder={false} />
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
