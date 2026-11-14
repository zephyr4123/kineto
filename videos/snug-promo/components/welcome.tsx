import { mix } from "../../../engine/motion";
import { SF, ZH } from "../theme";

// Snug 在 Mac 上的两样界面，照 snug 仓库的 Sources/Snug/UI 和 README 里的截图画（坐标用 Mac 点）：
// 第一次打开时的欢迎页（WelcomeWindow.swift：520 点宽的标题栏窗口，标题「Snug」，只有关闭按钮可用；
// 授权后那一行的手变绿、副标题变「已授权」、按钮换成绿色对勾，右下「稍后」变成默认按钮「完成」），
// 和菜单栏图标（StatusBarController.swift：SF Symbols 的 iphone.gen3，模板图，跟菜单栏文字同色）。
// SF Symbols 不能直接用，图标换成 Phosphor（MIT）里最接近的几个，iPhone 线稿自己画。

const TITLE_H = 30;
/** 窗口内容高度：README 截图 1040×854 是两倍图 */
const BODY_H = 427;
export const WELCOME_W = 520;
export const WELCOME_H = TITLE_H + BODY_H;
/** 「授权」按钮、右下「稍后 / 完成」按钮的中心（窗口坐标），放光标用 */
export const WELCOME_GRANT = { x: 451, y: TITLE_H + 309 };
export const WELCOME_DONE = { x: 467, y: TITLE_H + 381 };

const BLUE = "#007aff";
const GREEN = "#34c759";
const ORANGE = "#ff9500";
const LABEL = "#1d1d1f";
const SECONDARY = "#808084";

// Phosphor 图标（MIT）：hand-tap-fill、hand-swipe-right-fill、hand-palm-fill、check-circle-fill
const TAP = "M64 64a48 48 0 0 1 96 0a8 8 0 0 1-16 0a32 32 0 0 0-64 0a8 8 0 0 1-16 0m143.23 56c-8.61.4-15.23 7.82-15.23 16.43v7.28a8.17 8.17 0 0 1-7.47 8.25a8 8 0 0 1-8.53-8v-23.51c0-8.61-6.62-16-15.23-16.43A16 16 0 0 0 144 120v15.73a8.17 8.17 0 0 1-7.47 8.25a8 8 0 0 1-8.53-8V64.45c0-8.61-6.62-16-15.23-16.43A16 16 0 0 0 96 64v119.74a8.19 8.19 0 0 1-6.72 8.16h-.12a6.09 6.09 0 0 1-6-3.09l-21-36.44c-4.3-7.46-13.74-10.57-21.4-6.62A16 16 0 0 0 34.15 168l30.95 60.05A8 8 0 0 0 72 232h136a8 8 0 0 0 7.16-4.42c.36-.72 8.84-15.06 8.84-40.65V136a16 16 0 0 0-16.77-16";
const SWIPE = "M216 128v50.93c0 25.59-8.48 39.93-8.84 40.65A8 8 0 0 1 200 224H64a8 8 0 0 1-6.9-3.95L26.15 160a16 16 0 0 1 6.53-22.23c7.66-4 17.1-.84 21.4 6.62l21 36.44a6.09 6.09 0 0 0 6 3.09h.12a8.19 8.19 0 0 0 6.8-8.18V56a16 16 0 0 1 16.77-16c8.61.4 15.23 7.82 15.23 16.43V128a8 8 0 0 0 8.53 8a8.17 8.17 0 0 0 7.47-8.25V112a16 16 0 0 1 16.77-16c8.61.4 15.23 7.82 15.23 16.43V136a8 8 0 0 0 8.53 8a8.18 8.18 0 0 0 7.47-8.25v-7.28c0-8.61 6.62-16 15.23-16.43A16 16 0 0 1 216 128m37.66-77.66l-32-32a8 8 0 0 0-11.32 11.32L228.69 48H176a8 8 0 0 0 0 16h52.69l-18.35 18.34a8 8 0 0 0 11.32 11.32l32-32a8 8 0 0 0 0-11.32";
const PALM = "M216 104v48a88 88 0 0 1-176 0V64a16 16 0 0 1 32 0v56a8 8 0 0 0 16 0V32a16 16 0 0 1 32 0v80a8 8 0 0 0 16 0V48a16 16 0 0 1 32 0v80.67A48.08 48.08 0 0 0 128 176a8 8 0 0 0 16 0a32 32 0 0 1 32-32a8 8 0 0 0 8-8v-32a16 16 0 0 1 32 0";
const CHECK = "M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m45.66 85.66l-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32";

const Glyph: React.FC<{ d: string; size: number; color: string }> = ({ d, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block" }}>
    <path d={d} fill={color} />
  </svg>
);

/** iphone.gen3 的样子：圆角机身线稿，顶上一颗灵动岛 */
export const PhoneGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" style={{ display: "block" }}>
    <rect x="6" y="2.2" width="10" height="17.6" rx="2.6" fill="none" stroke={color} strokeWidth="1.6" />
    <rect x="9.1" y="4" width="3.8" height="1.3" rx="0.65" fill={color} />
  </svg>
);

const Step: React.FC<{ icon: React.ReactNode; title: string; detail: string; top: number }> = ({ icon, title, detail, top }) => (
  <div style={{ position: "absolute", left: 32, top, width: WELCOME_W - 64, height: 40 }}>
    <div style={{ position: "absolute", left: 0, top: 2, width: 32, display: "flex", justifyContent: "center" }}>{icon}</div>
    <div style={{ position: "absolute", left: 48, top: 0, fontFamily: ZH, fontSize: 13, fontWeight: 700, color: LABEL }}>{title}</div>
    <div style={{ position: "absolute", left: 48, top: 20, fontFamily: ZH, fontSize: 13, color: SECONDARY }}>{detail}</div>
  </div>
);

const Button: React.FC<{ label: string; prominent: number; press: number; w: number; h: number; x: number; y: number }> = ({ label, prominent, press, w, h, x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: 7,
      background: mix(BLUE, "#ffffff", prominent),
      boxShadow: "0 0.5px 1.5px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.08)",
      filter: press > 0 ? `brightness(${1 - 0.15 * press})` : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: ZH,
      fontSize: 13,
      fontWeight: 600,
      color: mix("#ffffff", LABEL, prominent),
    }}
  >
    {label}
  </div>
);

/** 欢迎页。granted 0→1 是授权前到授权后（中间交叉淡化），grantPress、donePress 是两个按钮被按下的程度 */
export const WelcomeWindow: React.FC<{ granted: number; grantPress?: number; donePress?: number }> = ({ granted, grantPress = 0, donePress = 0 }) => (
  <div style={{ position: "relative", width: WELCOME_W, height: WELCOME_H, borderRadius: 12, overflow: "hidden", background: "#ececec", boxShadow: "0 24px 70px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.2)" }}>
    {/* 标题栏：只有关闭按钮可用，最小化、缩放是灰的 */}
    <div style={{ position: "absolute", left: 0, top: 0, width: WELCOME_W, height: TITLE_H }}>
      {["#ff5f57", "#d6d6d6", "#d6d6d6"].map((c, i) => (
        <div key={i} style={{ position: "absolute", left: 13 + i * 20, top: 9, width: 12, height: 12, borderRadius: 6, background: c, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 7, textAlign: "center", fontFamily: SF, fontSize: 13, fontWeight: 700, color: "#4a4a4c" }}>Snug</div>
    </div>
    <div style={{ position: "absolute", left: 0, top: TITLE_H, width: WELCOME_W, height: BODY_H }}>
      <div style={{ position: "absolute", left: 32, top: 30, fontFamily: ZH, fontSize: 26, fontWeight: 700, color: LABEL }}>欢迎使用 Snug</div>
      <div style={{ position: "absolute", left: 32, top: 70, fontFamily: ZH, fontSize: 13, color: SECONDARY }}>手机远程 Mac 的显示与触控增强</div>
      <Step top={110} icon={<PhoneGlyph size={24} color={BLUE} />} title="选择「Snug 手机屏」" detail="UU远程 屏幕列表中切换；不切换则一切如常" />
      <Step top={162} icon={<Glyph d={TAP} size={20} color={BLUE} />} title="点选窗口" detail="铺满手机屏，字号自动放大" />
      <Step top={214} icon={<Glyph d={SWIPE} size={20} color={BLUE} />} title="触控手势" detail="单指滚动 · 长按选择 · 长按松开右键" />
      {/* 权限那一行 */}
      <div style={{ position: "absolute", left: 32, top: 275, width: WELCOME_W - 64, height: 68, borderRadius: 10, background: "#ffffff" }}>
        <div style={{ position: "absolute", left: 22, top: 24 }}>
          <Glyph d={PALM} size={20} color={mix(GREEN, ORANGE, granted)} />
        </div>
        <div style={{ position: "absolute", left: 64, top: 15, fontFamily: ZH, fontSize: 13, fontWeight: 700, color: LABEL }}>设备控制和数据访问</div>
        <div style={{ position: "absolute", left: 64, top: 35, fontFamily: ZH, fontSize: 13, color: SECONDARY }}>
          <span style={{ opacity: 1 - granted }}>用于移动窗口与转换手势</span>
          <span style={{ position: "absolute", left: 0, top: 0, opacity: granted, whiteSpace: "nowrap" }}>已授权</span>
        </div>
        <div style={{ opacity: 1 - granted }}>
          <Button label="授权" prominent={1} press={grantPress} w={42} h={28} x={WELCOME_GRANT.x - 32} y={34} />
        </div>
        <div style={{ position: "absolute", left: WELCOME_GRANT.x - 32 - 13, top: 21, opacity: granted, transform: `scale(${0.6 + 0.4 * granted})` }}>
          <Glyph d={CHECK} size={26} color={GREEN} />
        </div>
      </div>
      <Button label={granted > 0.5 ? "完成" : "稍后"} prominent={granted} press={donePress} w={42} h={28} x={WELCOME_DONE.x} y={WELCOME_DONE.y - TITLE_H} />
    </div>
  </div>
);
