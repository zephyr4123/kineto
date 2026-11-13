import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { SF } from "../theme";
import { Indicator, MH, MW, toPhone } from "./mac";

// Snug 自己画在手机屏上的界面：窗口列表、正在打开。照 Snug 代码里的尺寸（Mac 点）：
// 浅灰底 #F2F2F7、白卡片圆角 12；大标题「窗口」40 号粗体；分组标题 15 号次要色；
// 每行 48 点图标，App 名 22 号半粗、窗口标题 18 号次要色。

export type Icon = keyof typeof assets;
export type Win = { icon: Icon; app: string; title: string };

const BLUE = "#007aff";
const GRAY = "#8e8e93";
const ROW_H = 76;

const Row: React.FC<{ w: Win; last: boolean; press?: number }> = ({ w, last, press = 0 }) => (
  <div style={{ position: "relative", height: ROW_H, background: press > 0 ? `rgba(0,0,0,${0.08 * press})` : undefined }}>
    <Img src={staticFile(assets[w.icon])} style={{ position: "absolute", left: 14, top: (ROW_H - 52) / 2, width: 52, height: 52 }} />
    <div style={{ position: "absolute", left: 80, right: 16, top: 12, fontFamily: SF, fontSize: 22, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.app}</div>
    <div style={{ position: "absolute", left: 80, right: 16, top: 42, fontFamily: SF, fontSize: 18, color: GRAY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.title}</div>
    {last ? null : <div style={{ position: "absolute", left: 80, right: 0, bottom: 0, height: 1, background: "#e5e5ea" }} />}
  </div>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ margin: "0 16px", borderRadius: 12, background: "#fff", overflow: "hidden" }}>{children}</div>
);

const Section: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ margin: "22px 32px 8px", fontFamily: SF, fontSize: 15, color: GRAY }}>{text}</div>
);

/** 字号那一行：− 圆钮、「字号 +2」、+ 圆钮，右边「还原」 */
const FontRow: React.FC<{ step: number; press?: "minus" | "plus" | null }> = ({ step, press = null }) => {
  const btn = (big: boolean, on: boolean) => (
    <div style={{ width: 44, height: 44, borderRadius: 22, background: on ? "#d8d8de" : "#f0f0f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SF, fontWeight: 600, fontSize: big ? 22 : 15, color: "#111" }}>
      A
    </div>
  );
  return (
    <div style={{ position: "relative", height: 66, display: "flex", alignItems: "center", gap: 14, padding: "0 14px", borderTop: "1px solid #e5e5ea" }}>
      {btn(false, press === "minus")}
      <div style={{ width: 96, textAlign: "center", fontFamily: SF, fontSize: 17, color: step === 0 ? GRAY : "#111" }}>{step === 0 ? "默认字号" : `字号 ${step > 0 ? "+" : ""}${step}`}</div>
      {btn(true, press === "plus")}
      <div style={{ marginLeft: "auto", height: 40, padding: "0 16px", borderRadius: 20, background: "#f0f0f4", display: "flex", alignItems: "center", gap: 6, fontFamily: SF, fontSize: 17, fontWeight: 600, color: "#111" }}>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M5.5 3.5 2.5 6.5l3 3M2.8 6.5H10a3.5 3.5 0 0 1 0 7H7" fill="none" stroke="#111" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        还原
      </div>
    </div>
  );
};

/** 窗口列表。current 是已经放上手机屏的窗口（有它时左上角出现「‹ App 名」，并多一组「当前窗口」） */
export const WindowList: React.FC<{
  current?: Win;
  others: readonly Win[];
  step?: number;
  pressRow?: number;
  press?: number;
  fontPress?: "minus" | "plus" | null;
  scroll?: number;
}> = ({ current, others, step = 2, pressRow = -1, press = 0, fontPress = null, scroll = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: MW, height: MH, background: "#f2f2f7", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: -scroll }}>
      {current ? (
        <div style={{ position: "absolute", left: 16, top: 14, height: 36, padding: "0 16px 0 12px", borderRadius: 18, background: "rgba(0,122,255,0.12)", display: "flex", alignItems: "center", gap: 4, fontFamily: SF, fontSize: 18, fontWeight: 600, color: BLUE }}>
          <svg width="11" height="18" viewBox="0 0 11 18">
            <path d="M9 2 2.5 9 9 16" fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {current.app}
        </div>
      ) : null}
      <div style={{ padding: `${current ? 64 : 26}px 20px 0`, fontFamily: SF, fontSize: 40, fontWeight: 700, color: "#000", letterSpacing: "0.01em" }}>窗口</div>
      {current ? (
        <>
          <Section text="当前窗口" />
          <Card>
            <Row w={current} last />
            <FontRow step={step} press={fontPress} />
          </Card>
        </>
      ) : null}
      <Section text={current ? "其他窗口" : "全部窗口"} />
      <Card>
        {others.map((w, i) => (
          <Row key={`${w.app}${w.title}`} w={w} last={i === others.length - 1} press={i === pressRow ? press : 0} />
        ))}
      </Card>
    </div>
  </div>
);

/** 点了窗口之后：整屏只有 App 大图标、名字、窗口标题，下面转圈加「正在打开」 */
export const Opening: React.FC<{ w: Win; frame: number }> = ({ w, frame }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: MW, height: MH, background: "#f2f2f7", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 300 }}>
    <Img src={staticFile(assets[w.icon])} style={{ width: 120, height: 120 }} />
    <div style={{ marginTop: 18, fontFamily: SF, fontSize: 28, fontWeight: 600, color: "#111" }}>{w.app}</div>
    <div style={{ marginTop: 6, fontFamily: SF, fontSize: 18, color: GRAY }}>{w.title}</div>
    <svg style={{ marginTop: 34 }} width="26" height="26" viewBox="0 0 26 26">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const lead = Math.floor(frame / 5) % 8;
        const o = 0.2 + 0.8 * (((i - lead + 8) % 8) / 7);
        return <line key={i} x1={13 + Math.cos(a) * 6} y1={13 + Math.sin(a) * 6} x2={13 + Math.cos(a) * 11} y2={13 + Math.sin(a) * 11} stroke="#8e8e93" strokeWidth="2.4" strokeLinecap="round" opacity={o} />;
      })}
    </svg>
    <div style={{ marginTop: 10, fontFamily: SF, fontSize: 15, color: GRAY }}>正在打开</div>
  </div>
);

/** 这支片子里用到的窗口（Mac 上真实存在的 App，图标从本机导出） */
export const WIN = {
  ghostty: { icon: "iconGhostty", app: "Ghostty", title: "✳ 项目目录结构" },
  ghostty2: { icon: "iconGhostty", app: "Ghostty", title: "◐ PR 14 修复方案" },
  safari: { icon: "iconSafari", app: "Safari", title: "zephyr4123/snug: 为 UU远程 打造的 Mac 移…" },
  chatgpt: { icon: "iconChatgpt", app: "ChatGPT", title: "Codex · 修复窗口铺满的边界情况" },
  claude: { icon: "iconClaude", app: "Claude", title: "Snug 宣传文案" },
  vscode: { icon: "iconVscode", app: "Code", title: "Scrolling.swift — snug" },
  cursor: { icon: "iconCursor", app: "Cursor", title: "ZoomBook.swift — snug" },
  finder: { icon: "iconFinder", app: "Finder", title: "Downloads" },
  typeless: { icon: "iconTypeless", app: "Typeless", title: "Typeless" },
  settings: { icon: "iconSettings", app: "System Settings", title: "Login Items" },
  notion: { icon: "iconNotion", app: "Notion", title: "Snug 2.0 发布清单" },
  shell: { icon: "iconGhostty", app: "Ghostty", title: ".../coding/personal/snug" },
  wechat: { icon: "iconWechat", app: "WeChat", title: "WeChat" },
} as const satisfies Record<string, Win>;

/** 窗口列表里「其他窗口」那一组的默认内容 */
export const OTHERS = [WIN.vscode, WIN.chatgpt, WIN.safari, WIN.notion, WIN.claude, WIN.finder, WIN.settings] as const;

/** 列表里第 i 行的中心（Mac 点），用来放手指 */
export const rowCenter = (i: number, current: boolean) => {
  const top = current ? 64 + 48 + 22 + 8 + 18 + ROW_H + 66 + 22 + 8 + 18 : 26 + 48 + 22 + 8 + 18;
  return { x: 270, y: top + i * ROW_H + ROW_H / 2 };
};
export const press01 = (frame: number, at: number) => interpolate(frame, [at, at + 3, at + 10, at + 16], [0, 1, 1, 0], clamp);

/** 手指：屏幕点坐标，press 0→1 按下，show 控制出现和消失 */
export type Finger = { x: number; y: number; press: number; show: number };

/** 换窗口的时间（帧）：0 点底部横条，6–18 列表滑上来，18–38 手指移到那一行，40 点下，50 起「正在打开」，82 起铺满 */
export const SWITCH = { TAP_BAR: 0, LIST_IN: 6, MOVE: 18, TAP_ROW: 40, OPENING: 50, ENTER: 82 } as const;

/**
 * 换窗口进行到第 t 帧时屏上的样子和手指；t ≥ SWITCH.ENTER 时返回 null，表示新窗口已经铺满，由调用方画。
 * fromList：列表已经在屏上了（上一个场景点过横条），从手指移向那一行开始，t 也从 SWITCH.MOVE 起算。
 */
export const switching = (
  t: number,
  o: { prevScreen: React.ReactNode; current: Win; others: readonly Win[]; target: Win; fromList?: boolean },
): { screen: React.ReactNode; finger: Finger | null } | null => {
  const { TAP_BAR, LIST_IN, MOVE, TAP_ROW, OPENING, ENTER } = SWITCH;
  if (t >= ENTER) return null;
  if (t >= OPENING) return { screen: <Opening w={o.target} frame={t} />, finger: null };
  const bar = toPhone(MW / 2, MH - 14);
  if (t < LIST_IN) return { screen: o.prevScreen, finger: { ...bar, press: press01(t, TAP_BAR), show: interpolate(t, [-6, 0], [0, 1], clamp) } };
  const pressRow = o.others.indexOf(o.target);
  const c = rowCenter(pressRow, true);
  const row = toPhone(c.x, c.y);
  const p = o.fromList ? 1 : interpolate(t, [LIST_IN, LIST_IN + 12], [0, 1], { ...clamp, easing: outExpo });
  const start = o.fromList ? { x: row.x + 50, y: row.y + 140 } : bar;
  const ease = { ...clamp, easing: outExpo };
  return {
    screen: (
      <>
        {p < 1 ? o.prevScreen : null}
        <div style={{ position: "absolute", inset: 0, opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}>
          <WindowList current={o.current} others={o.others} pressRow={pressRow} press={press01(t, TAP_ROW)} />
          <Indicator />
        </div>
      </>
    ),
    finger: {
      x: interpolate(t, [MOVE, TAP_ROW - 2], [start.x, row.x], ease),
      y: interpolate(t, [MOVE, TAP_ROW - 2], [start.y, row.y], ease),
      press: press01(t, TAP_ROW),
      show: Math.min(o.fromList ? (t - MOVE) / 8 : 1, interpolate(t, [TAP_ROW + 6, TAP_ROW + 10], [1, 0], clamp)),
    },
  };
};
