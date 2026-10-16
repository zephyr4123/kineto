import { Img, staticFile } from "remotion";

// SpeakMore 的主窗口：真页面的截图（1080×750 点的 2 倍图，src/renderer/hub 在 Electron 里离屏渲染的）
// 装进圆角窗框，左上角画上红绿灯。
export const APP_WIN = { width: 1080, height: 750, radius: 14 };

/** 一扇窗口：给中心和缩放，里面叠截图 */
export const AppWindow: React.FC<{ x: number; y: number; scale: number; opacity?: number; children: React.ReactNode }> = ({ x, y, scale, opacity = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: x - APP_WIN.width / 2,
      top: y - APP_WIN.height / 2,
      width: APP_WIN.width,
      height: APP_WIN.height,
      borderRadius: APP_WIN.radius,
      overflow: "hidden",
      opacity,
      transform: `scale(${scale})`,
      boxShadow: "0 0 0 1px oklch(0 0 0 / 0.12), 0 34px 90px oklch(0 0 0 / 0.42), 0 10px 26px oklch(0 0 0 / 0.24)",
    }}
  >
    {children}
    <TrafficLights />
  </div>
);

/** 窗口里的一张截图，铺满窗口 */
export const AppShot: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: APP_WIN.width, height: APP_WIN.height, maxWidth: "none", ...style }} />
);

/** 真窗口的红绿灯在侧栏左上角（src/app/main.mjs 的 trafficLightPosition: 26, 24） */
const TrafficLights: React.FC = () => (
  <span style={{ position: "absolute", left: 26, top: 24, display: "flex", gap: 8 }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <i key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, boxShadow: "inset 0 0 0 0.5px oklch(0 0 0 / 0.15)" }} />
    ))}
  </span>
);
