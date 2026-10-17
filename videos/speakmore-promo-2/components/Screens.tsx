import { AbsoluteFill } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { Seal } from "../../../engine/speakmore/Seal";
import { UI } from "../icons";
import { COLOR, SANS } from "../theme";

// 两个系统的桌面和窗口。Windows 那一块全部用代码画：壁纸是自己调的极光色块（不照搬系统壁纸），
// 任务栏照 Windows 11 的布局（图标居中、右边托盘和时间），图标只用通用的线性图标和 SpeakMore 自己的印。

const TASKBAR = 64;

export const WinDesktop: React.FC<{ children?: React.ReactNode; running?: boolean }> = ({ children, running = true }) => (
  <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS, background: "linear-gradient(165deg, oklch(0.36 0.1 262), oklch(0.2 0.07 280) 55%, oklch(0.14 0.05 285))" }}>
    {/* 几块大而虚的光：偏青的一道、偏紫的一团，右上角一点亮 */}
    <div style={{ ...glow, left: 760, top: 160, width: 1100, height: 520, background: "oklch(0.66 0.14 235 / 0.75)", transform: "rotate(-18deg)" }} />
    <div style={{ ...glow, left: 300, top: 520, width: 1000, height: 560, background: "oklch(0.52 0.18 300 / 0.7)", transform: "rotate(12deg)" }} />
    <div style={{ ...glow, left: 1300, top: -160, width: 700, height: 460, background: "oklch(0.86 0.08 220 / 0.45)" }} />
    {children}
    <Taskbar running={running} />
  </AbsoluteFill>
);

const glow: React.CSSProperties = { position: "absolute", borderRadius: "50%", filter: "blur(90px)" };

const Taskbar: React.FC<{ running: boolean }> = ({ running }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: TASKBAR,
      background: "oklch(0.2 0.02 270 / 0.82)",
      borderTop: "1px solid oklch(1 0 0 / 0.08)",
      backdropFilter: "blur(30px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      color: COLOR.ink,
    }}
  >
    <TaskIcon>
      <WindowsMark size={30} />
    </TaskIcon>
    <TaskIcon>
      <Glyph icon={UI.search} size={28} />
    </TaskIcon>
    <TaskIcon>
      <Glyph icon={UI.folder} size={30} style={{ color: "oklch(0.84 0.14 85)" }} />
    </TaskIcon>
    <TaskIcon>
      <Glyph icon={UI.globe} size={28} style={{ color: "oklch(0.78 0.11 230)" }} />
    </TaskIcon>
    <TaskIcon>
      <Glyph icon={UI.terminal} size={28} />
    </TaskIcon>
    <TaskIcon active={running}>
      <Seal size={34} bars={[1, 1, 1, 1, 1]} base={1} />
    </TaskIcon>
    <div style={{ position: "absolute", right: 22, display: "flex", alignItems: "center", gap: 18, fontSize: 17 }}>
      <Glyph icon={UI.chevronUp} size={20} />
      <Glyph icon={UI.wifi} size={21} />
      <Glyph icon={UI.volume} size={21} />
      <Glyph icon={UI.battery} size={22} />
      <div style={{ textAlign: "right", lineHeight: 1.25, marginLeft: 4 }}>
        <div>09:41</div>
        <div>2026/10/12</div>
      </div>
    </div>
  </div>
);

const TaskIcon: React.FC<{ children: React.ReactNode; active?: boolean }> = ({ children, active = false }) => (
  <div style={{ position: "relative", width: 52, height: 52, borderRadius: 8, display: "grid", placeItems: "center", background: active ? "oklch(1 0 0 / 0.08)" : undefined }}>
    {children}
    {active ? <i style={{ position: "absolute", bottom: 2, width: 16, height: 4, borderRadius: 2, background: "oklch(0.78 0.12 240)" }} /> : null}
  </div>
);

const WINDOWS_PATH = /d="([^"]+)"/.exec(UI.windows.body)?.[1] ?? "";

/** Windows 的四格标志，蓝色渐变（Remix Icon 的 windows-fill 形状） */
export const WindowsMark: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <defs>
      <linearGradient id="win-mark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4cc2ff" />
        <stop offset="1" stopColor="#0067c0" />
      </linearGradient>
    </defs>
    <path fill="url(#win-mark)" d={WINDOWS_PATH} />
  </svg>
);

/** Windows 11 样子的窗口：圆角、浅色标题栏、右上三个按钮 */
export const WinWindow: React.FC<{ title: string; width: number; height: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  width,
  height,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      width,
      height,
      borderRadius: 10,
      overflow: "hidden",
      background: "oklch(0.985 0.002 255)",
      boxShadow: "0 0 0 1px oklch(0 0 0 / 0.12), 0 30px 70px oklch(0 0 0 / 0.42)",
      fontFamily: SANS,
      ...style,
    }}
  >
    <div style={{ height: 46, display: "flex", alignItems: "center", gap: 12, padding: "0 0 0 18px", background: "oklch(0.95 0.008 255)", color: COLOR.paperInk, fontSize: 17 }}>
      <Glyph icon={UI.text} size={20} style={{ color: "oklch(0.55 0.12 250)" }} />
      <span style={{ flex: 1 }}>{title}</span>
      {[UI.minimize, UI.maximize, UI.close].map((icon, i) => (
        <span key={i} style={{ width: 58, height: 46, display: "grid", placeItems: "center" }}>
          <Glyph icon={icon} size={i === 1 ? 15 : 18} />
        </span>
      ))}
    </div>
    <div style={{ position: "relative", height: height - 46 }}>{children}</div>
  </div>
);

/** Mac 上的文稿窗口：左上红绿灯、标题居中 */
export const MacWindow: React.FC<{ title: string; width: number; height: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  width,
  height,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      width,
      height,
      borderRadius: 16,
      overflow: "hidden",
      background: "oklch(0.995 0.002 80)",
      boxShadow: "0 0 0 1px oklch(0 0 0 / 0.14), 0 30px 70px oklch(0 0 0 / 0.42)",
      fontFamily: SANS,
      ...style,
    }}
  >
    <div style={{ position: "relative", height: 48, display: "grid", placeItems: "center", background: "oklch(0.965 0.004 80)", borderBottom: "1px solid oklch(0.9 0.006 80)", color: "oklch(0.45 0.01 255)", fontSize: 18, fontWeight: 500 }}>
      <span style={{ position: "absolute", left: 18, display: "flex", gap: 9 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <i key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
        ))}
      </span>
      {title}
    </div>
    <div style={{ position: "relative", height: height - 48, overflow: "hidden" }}>{children}</div>
  </div>
);

/** 把一整块 1920×1080 的屏幕缩进一张卡片里：rect 是卡片在画面上的位置 */
export const ScreenCard: React.FC<{ x: number; y: number; scale: number; children: React.ReactNode; style?: React.CSSProperties; radius?: number }> = ({
  x,
  y,
  scale,
  children,
  style,
  radius = 24,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 1920 * scale,
      height: 1080 * scale,
      borderRadius: radius,
      overflow: "hidden",
      boxShadow: "0 0 0 1px oklch(1 0 0 / 0.14), 0 40px 100px oklch(0 0 0 / 0.55)",
      ...style,
    }}
  >
    <div style={{ position: "absolute", width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "0 0" }}>{children}</div>
  </div>
);
