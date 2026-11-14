import { SF, ZH } from "../theme";

// iPhone 17 Pro Max：屏幕 440×956 点，窄边框，灵动岛，套一只淡绿到黄绿的硅胶手机壳。机身、壳、状态栏代码画；屏幕里的东西用屏幕点坐标。
// 手机是浅色模式：状态栏（62 点）下面直接接 440×774 的远程画面（Snug 手机屏 540×950 点等比缩到 0.815），
// 再下面是 UU 的工具栏（展开所有窗口、显示桌面、键盘、操作，按钮照实机录屏）和主屏指示条，做成浅色毛玻璃，不留上下黑带。

export const SW = 440;
export const SH = 956;
const RIM = 9; // 机身边框到屏幕的距离（17 Pro Max 的边框很窄）
export const BODY_W = SW + RIM * 2;
export const BODY_H = SH + RIM * 2;
export const DISPLAY_TOP = 62;
export const DISPLAY_H = 774;
export const TOOLBAR_TOP = DISPLAY_TOP + DISPLAY_H;

/** 让屏幕上的点 (px, py) 落在画面的 (cx, cy)：返回机身中心该放的位置 */
export const aim = (px: number, py: number, s: number, cx: number, cy: number) => ({
  x: cx - (px + RIM - BODY_W / 2) * s,
  y: cy - (py + RIM - BODY_H / 2) * s,
});

/** 手机中心在 (cx, cy)、每点 s 像素时，屏幕点 (px, py) 落在画面哪里 */
export const onStage = (cx: number, cy: number, s: number, px: number, py: number) => ({ x: cx + (px - SW / 2) * s, y: cy + (py - SH / 2) * s });
/** 横屏（手机转 −90°）时，横屏屏幕点 (lx, ly) 落在画面哪里 */
export const onStageL = (cx: number, cy: number, s: number, lx: number, ly: number) => ({ x: cx + (lx - SH / 2) * s, y: cy + (ly - SW / 2) * s });
/** 横屏时让横屏屏幕点 (lx, ly) 落在画面的 (X, Y)：返回手机中心 */
export const aimL = (lx: number, ly: number, s: number, X: number, Y: number) => ({ x: X - (lx - SH / 2) * s, y: Y - (ly - SW / 2) * s });

/** 手机壳比机身每边厚多少点；壳沿压住机身边框，正面只露出黑色玻璃边和屏幕 */
const CASE = 13;
const CASE_R = 72 + CASE;
// 壳的颜色：淡绿到黄绿，左上受光偏淡，右下偏黄
const CASE_BG = "linear-gradient(150deg, #eef8d8 0%, #d6efb4 30%, #cbe9a2 55%, #dcec98 82%, #eaf0ac 100%)";
const BUMP_BG = "linear-gradient(90deg, #c4e29a, #d9ec9f)";

/** 手机放在画面上：x、y 是机身中心在画面上的位置（像素），scale 是每点多少像素 */
export const Phone: React.FC<{
  x: number;
  y: number;
  scale: number;
  rotate?: number;
  tiltX?: number;
  tiltY?: number;
  children?: React.ReactNode;
  glow?: number;
  /** 状态栏上的时间和信号（横屏时 iOS 不显示，灵动岛照样在） */
  bar?: boolean;
}> = ({ x, y, scale, rotate = 0, tiltX = 0, tiltY = 0, children, glow = 0, bar = true }) => (
  <div
    style={{
      position: "absolute",
      left: x - BODY_W / 2,
      top: y - BODY_H / 2,
      width: BODY_W,
      height: BODY_H,
      transform: `perspective(2400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "50% 50%",
    }}
  >
    {/* 影子和外发的一圈光 */}
    <div
      style={{
        position: "absolute",
        inset: -CASE,
        borderRadius: CASE_R,
        boxShadow: `0 40px 90px rgba(40,70,40,0.24), 0 10px 30px rgba(30,60,40,0.16), 0 0 ${40 + 60 * glow}px rgba(31,99,255,${0.1 + 0.28 * glow})`,
      }}
    />
    {/* 壳上包住侧键的凸起：左边操作键、两个音量键，右边电源键；相机控制键处是一个开孔 */}
    {[
      [190, 34],
      [252, 60],
      [326, 60],
    ].map(([top, h], i) => (
      <div key={`l${i}`} style={{ position: "absolute", left: -CASE - 4, top, width: 8, height: h, borderRadius: 4, background: BUMP_BG, boxShadow: "inset 1px 0 1px rgba(255,255,255,0.7), 0 1px 2px rgba(60,90,30,0.25)" }} />
    ))}
    <div style={{ position: "absolute", left: BODY_W + CASE - 4, top: 270, width: 8, height: 96, borderRadius: 4, background: BUMP_BG, boxShadow: "inset -1px 0 1px rgba(255,255,255,0.6), 0 1px 2px rgba(60,90,30,0.25)" }} />
    {/* 壳身：硅胶的哑光，左上一点受光，右下一点暗，外沿一道细边 */}
    <div
      style={{
        position: "absolute",
        inset: -CASE,
        borderRadius: CASE_R,
        background: CASE_BG,
        boxShadow: "inset 0 3px 5px rgba(255,255,255,0.85), inset 0 -5px 12px rgba(120,150,50,0.3), inset 3px 0 6px rgba(255,255,255,0.4), 0 0 0 1px rgba(110,140,60,0.28)",
      }}
    />
    {/* 相机控制键的开孔：壳上挖一个圆角槽，露出里面的蓝宝石按键 */}
    <div style={{ position: "absolute", left: BODY_W + 3, top: 628, width: 7, height: 70, borderRadius: 4, background: "linear-gradient(90deg,#9fb98a,#c9dcb6)", boxShadow: "inset 1px 0 2px rgba(40,60,30,0.45)" }} />
    {/* 壳沿：比玻璃高一点的那一圈，内侧一道暗线，外侧一道高光 */}
    <div
      style={{
        position: "absolute",
        inset: -4,
        borderRadius: 76,
        boxShadow: "0 0 0 1.5px rgba(255,255,255,0.55), inset 0 0 0 1.2px rgba(70,100,40,0.35), 0 0 6px rgba(90,120,50,0.25)",
      }}
    />
    <div style={{ position: "absolute", inset: -1, borderRadius: 73, background: "#05070b" }} />
    {/* 屏幕 */}
    <div style={{ position: "absolute", left: RIM, top: RIM, width: SW, height: SH, borderRadius: 63, overflow: "hidden", background: CHROME }}>
      {children}
      <StatusBar bar={bar} />
      {/* 屏幕玻璃上的一道斜光 */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 28%, transparent 70%, rgba(255,255,255,0.04) 100%)", pointerEvents: "none" }} />
    </div>
  </div>
);

/** UU 界面的底色（状态栏后面、工具栏的毛玻璃）：浅色模式 */
export const CHROME = "#f4f5f8";

/** 状态栏（浅色模式，黑字）：左边时间，中间灵动岛，右边信号、Wi-Fi、电池 */
const StatusBar: React.FC<{ bar: boolean }> = ({ bar }) => (
  <>
    {bar ? <div style={{ position: "absolute", left: 0, width: 150, top: 19, textAlign: "center", fontFamily: SF, fontWeight: 600, fontSize: 17, color: "#000", letterSpacing: "-0.01em" }}>
      9:41
    </div> : null}
    <div style={{ position: "absolute", left: (SW - 126) / 2, top: 11, width: 126, height: 37, borderRadius: 19, background: "#000" }}>
      {/* 灵动岛里前置摄像头的一点反光 */}
      <div style={{ position: "absolute", right: 22, top: 12, width: 13, height: 13, borderRadius: 7, background: "radial-gradient(circle at 40% 35%, #2a3550 0%, #0a0d16 60%)" }} />
    </div>
    {bar ? <svg style={{ position: "absolute", left: 318, top: 22 }} width="96" height="14" viewBox="0 0 96 14">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 5} y={10 - i * 3} width={3.2} height={3 + i * 3} rx={0.9} fill="#000" />
      ))}
      <path d="M33 4.2a9.4 9.4 0 0 1 13 0l-1.5 1.6a7.2 7.2 0 0 0-10 0z M35.4 6.8a6 6 0 0 1 8.2 0l-1.5 1.6a3.8 3.8 0 0 0-5.2 0z M37.9 9.4a2.4 2.4 0 0 1 3.2 0L39.5 11z" fill="#000" />
      <rect x={56} y={1.5} width={25} height={12} rx={3.6} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={1.1} />
      <rect x={58} y={3.5} width={18} height={8} rx={2} fill="#000" />
      <path d="M82.6 5.6v3.8a2 2 0 0 0 0-3.8z" fill="rgba(0,0,0,0.4)" />
    </svg> : null}
  </>
);

/**
 * 横屏：手机整台转 −90°（灵动岛到左边）时，屏幕里放一块 956×440 的横向画面，先顺时针转 90° 抵消，看上去就是正的。
 * 里面的坐标是横屏的屏幕点：左上 (0,0)，右下 (LW, LH)。
 */
export const LW = SH;
export const LH = SW;
export const Landscape: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <div style={{ position: "absolute", left: (SW - SH) / 2, top: (SH - SW) / 2, width: SH, height: SW, transform: "rotate(90deg)", overflow: "hidden", opacity }}>{children}</div>
);

export type ToolKind = "all" | "desk" | "kb" | "op";
/** UU 工具栏的四个图标（照实机录屏）：展开所有窗口、显示桌面、键盘、操作 */
export const ToolIcon: React.FC<{ kind: ToolKind; color?: string }> = ({ kind, color = "#3a3a3c" }) => (
  <svg width="24" height="22" viewBox="0 0 24 22" style={{ display: "block", margin: "0 auto" }}>
    {kind === "all" ? (
      <g fill="none" stroke={color} strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="15" rx="2.5" />
        <path d="M3 10.5h18M12 10.5V18M9 3v7.5" />
      </g>
    ) : kind === "desk" ? (
      <g fill="none" stroke={color} strokeWidth="1.6">
        <rect x="4" y="2.5" width="16" height="13" rx="2.2" />
        <path d="M8 19.5h8M7.5 7.5h3M7.5 10.5h5" />
      </g>
    ) : kind === "kb" ? (
      <g fill="none" stroke={color} strokeWidth="1.6">
        <rect x="2.5" y="5" width="19" height="12" rx="2.2" />
        <path d="M6 9h1.2M9.4 9h1.2M12.8 9h1.2M16.2 9h1.2M8 13h8" strokeLinecap="round" />
      </g>
    ) : (
      <g fill="none" stroke={color} strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="7" rx="3.5" />
        <rect x="3" y="12" width="18" height="7" rx="3.5" />
        <circle cx="16.5" cy="6.5" r="1.6" fill={color} />
        <circle cx="7.5" cy="15.5" r="1.6" fill={color} />
      </g>
    )}
  </svg>
);

/** UU远程 底部工具栏，照实机录屏 */
export const UUToolbar: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const items = ["展开所有窗口", "显示桌面", "键盘", "操作"];
  return (
    <div style={{ position: "absolute", left: 0, top: TOOLBAR_TOP, width: SW, height: SH - TOOLBAR_TOP, background: "rgba(246,247,250,0.96)", borderTop: "0.5px solid rgba(0,0,0,0.12)", opacity }}>
      {items.map((label, i) => (
        <div key={label} style={{ position: "absolute", left: i * 110, width: 110, top: 16, textAlign: "center" }}>
          <ToolIcon kind={(["all", "desk", "kb", "op"] as const)[i]} />
          <div style={{ marginTop: 5, fontFamily: ZH, fontSize: 11.5, color: "#3a3a3c" }}>{label}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: (SW - 140) / 2, top: SH - TOOLBAR_TOP - 13, width: 140, height: 5, borderRadius: 3, background: "#111" }} />
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
