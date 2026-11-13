import { SF, ZH } from "../theme";

// iPhone 17 Pro Max（深蓝色）：屏幕 440×956 点。机身、灵动岛、状态栏代码画；屏幕里的东西用屏幕点坐标。
// UU远程 的竖屏布局照实机录屏量：屏幕顶上 90 点是状态栏和黑边，下面 440×774 是远程画面（Snug 手机屏 540×950 点等比缩到 0.815），
// 再下面 92 点是 UU 的黑色工具栏（展开所有窗口、显示桌面、键盘、操作）和主屏指示条。

export const SW = 440;
export const SH = 956;
const RIM = 12; // 机身边框到屏幕的距离
export const BODY_W = SW + RIM * 2;
export const BODY_H = SH + RIM * 2;
export const DISPLAY_TOP = 90;
export const DISPLAY_H = 774;
export const TOOLBAR_TOP = DISPLAY_TOP + DISPLAY_H;

/** 让屏幕上的点 (px, py) 落在画面的 (cx, cy)：返回机身中心该放的位置 */
export const aim = (px: number, py: number, s: number, cx: number, cy: number) => ({
  x: cx - (px + RIM - BODY_W / 2) * s,
  y: cy - (py + RIM - BODY_H / 2) * s,
});

/** 手机放在画面上：x、y 是机身中心在画面上的位置（像素），scale 是每点多少像素 */
export const Phone: React.FC<{
  x: number;
  y: number;
  scale: number;
  rotate?: number;
  tiltY?: number;
  children?: React.ReactNode;
  glow?: number;
}> = ({ x, y, scale, rotate = 0, tiltY = 0, children, glow = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x - BODY_W / 2,
      top: y - BODY_H / 2,
      width: BODY_W,
      height: BODY_H,
      transform: `perspective(2400px) rotateY(${tiltY}deg) rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "50% 50%",
    }}
  >
    {/* 影子和机身外发的一圈光 */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 76,
        boxShadow: `0 40px 90px rgba(20,40,90,0.28), 0 10px 30px rgba(20,40,90,0.18), 0 0 ${40 + 60 * glow}px rgba(31,99,255,${0.12 + 0.3 * glow})`,
      }}
    />
    {/* 侧键：左边操作键、音量键，右边电源键和相机控制 */}
    {[
      [-2.4, 190, 32],
      [-2.4, 250, 58],
      [-2.4, 322, 58],
    ].map(([dx, top, h], i) => (
      <div key={`l${i}`} style={{ position: "absolute", left: dx, top, width: 4, height: h, borderRadius: 2, background: "linear-gradient(90deg,#2b3b5c,#4b5f86)" }} />
    ))}
    {[
      [BODY_W - 1.6, 270, 92],
      [BODY_W - 1.6, 640, 54],
    ].map(([left, top, h], i) => (
      <div key={`r${i}`} style={{ position: "absolute", left, top, width: 4, height: h, borderRadius: 2, background: "linear-gradient(90deg,#4b5f86,#2b3b5c)" }} />
    ))}
    {/* 机身：深蓝铝框，边缘一道高光 */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 76,
        background: "linear-gradient(140deg,#5b6f96 0%,#22314f 22%,#151f36 55%,#2c3d63 85%,#6b7fa6 100%)",
        boxShadow: "inset 0 0 0 1.2px rgba(255,255,255,0.28), inset 0 0 0 3px rgba(10,16,30,0.9)",
      }}
    />
    <div style={{ position: "absolute", inset: 5, borderRadius: 71, background: "#05070b" }} />
    {/* 屏幕 */}
    <div style={{ position: "absolute", left: RIM, top: RIM, width: SW, height: SH, borderRadius: 62, overflow: "hidden", background: "#000" }}>
      {children}
      <StatusBar />
      {/* 屏幕玻璃上的一道斜光 */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 28%, transparent 70%, rgba(255,255,255,0.04) 100%)", pointerEvents: "none" }} />
    </div>
  </div>
);

/** 状态栏：左边时间，中间灵动岛，右边信号、Wi-Fi、电池 */
const StatusBar: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, width: 150, top: 18, textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 17, color: "#fff", letterSpacing: "-0.01em" }}>
      9:41
    </div>
    <div style={{ position: "absolute", left: (SW - 126) / 2, top: 11, width: 126, height: 37, borderRadius: 19, background: "#000" }} />
    <svg style={{ position: "absolute", left: 318, top: 21 }} width="96" height="14" viewBox="0 0 96 14">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 5} y={10 - i * 3} width={3.2} height={3 + i * 3} rx={0.9} fill="#fff" />
      ))}
      <path d="M33 4.2a9.4 9.4 0 0 1 13 0l-1.5 1.6a7.2 7.2 0 0 0-10 0z M35.4 6.8a6 6 0 0 1 8.2 0l-1.5 1.6a3.8 3.8 0 0 0-5.2 0z M37.9 9.4a2.4 2.4 0 0 1 3.2 0L39.5 11z" fill="#fff" />
      <rect x={56} y={1.5} width={25} height={12} rx={3.6} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.1} />
      <rect x={58} y={3.5} width={18} height={8} rx={2} fill="#fff" />
      <path d="M82.6 5.6v3.8a2 2 0 0 0 0-3.8z" fill="rgba(255,255,255,0.45)" />
    </svg>
  </>
);

/** UU远程 底部工具栏，照实机录屏 */
export const UUToolbar: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const items = ["展开所有窗口", "显示桌面", "键盘", "操作"];
  return (
    <div style={{ position: "absolute", left: 0, top: TOOLBAR_TOP, width: SW, height: SH - TOOLBAR_TOP, background: "#000", opacity }}>
      {items.map((label, i) => (
        <div key={label} style={{ position: "absolute", left: i * 110, width: 110, top: 13, textAlign: "center" }}>
          <svg width="24" height="22" viewBox="0 0 24 22" style={{ display: "block", margin: "0 auto" }}>
            {i === 0 ? (
              <g fill="none" stroke="#d8d8d8" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="15" rx="2.5" />
                <path d="M3 10.5h18M12 10.5V18M9 3v7.5" />
              </g>
            ) : i === 1 ? (
              <g fill="none" stroke="#d8d8d8" strokeWidth="1.6">
                <rect x="4" y="2.5" width="16" height="13" rx="2.2" />
                <path d="M8 19.5h8M7.5 7.5h3M7.5 10.5h5" />
              </g>
            ) : i === 2 ? (
              <g fill="none" stroke="#d8d8d8" strokeWidth="1.6">
                <rect x="2.5" y="5" width="19" height="12" rx="2.2" />
                <path d="M6 9h1.2M9.4 9h1.2M12.8 9h1.2M16.2 9h1.2M8 13h8" strokeLinecap="round" />
              </g>
            ) : (
              <g fill="none" stroke="#d8d8d8" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="7" rx="3.5" />
                <rect x="3" y="12" width="18" height="7" rx="3.5" />
                <circle cx="16.5" cy="6.5" r="1.6" fill="#d8d8d8" />
                <circle cx="7.5" cy="15.5" r="1.6" fill="#d8d8d8" />
              </g>
            )}
          </svg>
          <div style={{ marginTop: 5, fontFamily: ZH, fontSize: 11.5, color: "#d0d0d0" }}>{label}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: (SW - 140) / 2, top: SH - TOOLBAR_TOP - 13, width: 140, height: 5, borderRadius: 3, background: "#fff" }} />
    </div>
  );
};

/** 手指：半透明白圈。press 0→1 按下（圈缩一点、更亮），show 控制出现和消失 */
export const Touch: React.FC<{ x: number; y: number; press?: number; show?: number; ring?: number }> = ({ x, y, press = 0, show = 1, ring = 0 }) => {
  if (show <= 0.01) return null;
  const r = 22 * (1 - 0.14 * press);
  return (
    <div style={{ position: "absolute", left: x - 40, top: y - 40, width: 80, height: 80, opacity: show, pointerEvents: "none" }}>
      {ring > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 40 - 22 - 14 * ring,
            top: 40 - 22 - 14 * ring,
            width: 44 + 28 * ring,
            height: 44 + 28 * ring,
            borderRadius: "50%",
            border: `2.5px solid rgba(40,120,255,${0.85 * (1 - ring)})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 40 - r,
          top: 40 - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: `rgba(70,80,100,${0.38 + 0.14 * press})`,
          border: "2.5px solid rgba(255,255,255,0.95)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
};
