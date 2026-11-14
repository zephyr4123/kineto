import { SF, ZH } from "../theme";
import { LH, LW, SH, SW } from "./phone";

// UU远程 弹出的键盘，排布照实机录屏：上面一条 UU 自己的输入栏（「输入法」蓝色带下划线、「电脑键盘」、关闭），
// 下面是 iOS 26 键盘（圆角面板、联想栏中间一颗胶囊、四排键、底下地球和话筒）。手机是浅色模式，键盘也用浅色。坐标是手机屏幕点。

export const KB_H = 389;
export const KB_TOP = SH - KB_H;
const BAR_H = 44;
const KEY_W = 37.6;
const KEY_H = 44;
const GAP = 5.8;
const ROW_Y = [BAR_H + 60, BAR_H + 116, BAR_H + 172, BAR_H + 228];
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
/** 数字符号层（敲 / 时切过去），照 iOS 简体中文地区的排布 */
const NUM_ROWS = ["1234567890", "-/:;()¥&@\"", ".,?!'"];

/** 每个字母键的位置（键盘内坐标），按键时用来画弹出的气泡、放手指 */
export const keyPos = (ch: string, layer: "abc" | "123" = "abc"): { x: number; y: number } | null => {
  if (layer === "123") {
    for (let r = 0; r < 2; r++) {
      const i = NUM_ROWS[r].indexOf(ch);
      if (i >= 0) return { x: 5.9 + i * (KEY_W + GAP) + KEY_W / 2, y: ROW_Y[r] + KEY_H / 2 };
    }
    const i = NUM_ROWS[2].indexOf(ch);
    if (i >= 0) return { x: 5.9 + 56 + GAP + i * (60.4 + GAP) + 30.2, y: ROW_Y[2] + KEY_H / 2 };
  }
  if (ch === "LAYER") return { x: 5.9 + 25, y: ROW_Y[3] + KEY_H / 2 };
  for (let r = 0; r < 3 && layer === "abc"; r++) {
    const i = ROWS[r].indexOf(ch);
    if (i < 0) continue;
    const left = r === 0 ? 5.9 : r === 1 ? 5.9 + (KEY_W + GAP) / 2 : 5.9 + 56 + GAP + (KEY_W + GAP) * 0.5 + 0.6;
    return { x: left + i * (KEY_W + GAP) + KEY_W / 2, y: ROW_Y[r] + KEY_H / 2 };
  }
  if (ch === " ") return { x: SW / 2, y: ROW_Y[3] + KEY_H / 2 };
  if (ch === "\n") return { x: SW - 54, y: ROW_Y[3] + KEY_H / 2 };
  return null;
};

const KEY = "#fdfdfe";
const KEY_DARK = "#c3c7cf";

const Key: React.FC<{ x: number; y: number; w: number; label: React.ReactNode; dark?: boolean; size?: number; on?: boolean }> = ({ x, y, w, label, dark, size = 23, on }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: KEY_H,
      borderRadius: 9,
      background: on ? "#b9bec8" : dark ? KEY_DARK : KEY,
      boxShadow: "0 1px 0 rgba(0,0,0,0.28)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: SF,
      fontSize: size,
      color: "#000",
    }}
  >
    {label}
  </div>
);

/** UU 自己的输入栏：「输入法」「电脑键盘」两个标签（选中的蓝色带下划线），右边关闭。竖屏、横屏各一套位置（横屏照实机截图） */
type BarGeo = { w: number; h: number; ime: number; pc: number; close: number };
const BAR_P: BarGeo = { w: SW, h: BAR_H, ime: 100, pc: 265, close: 403 };
const BAR_L: BarGeo = { w: LW, h: 47, ime: 248, pc: 698, close: 864 };
const UUBar: React.FC<{ tab: "ime" | "pc"; g?: BarGeo }> = ({ tab, g = BAR_P }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: g.w, height: g.h + 30, background: "#f7f7f9", borderTop: "0.5px solid rgba(0,0,0,0.12)" }}>
    {(["ime", "pc"] as const).map((k) => (
      <div key={k} style={{ position: "absolute", left: g[k] - 60, width: 120, top: g.h / 2 - 12, textAlign: "center", fontFamily: ZH, fontSize: 18, color: tab === k ? "#5a9bff" : "#1c1c1e" }}>
        {k === "ime" ? "输入法" : "电脑键盘"}
        {tab === k ? <div style={{ margin: "3px auto 0", width: k === "ime" ? 60 : 76, height: 2, background: "#5a9bff", borderRadius: 1 }} /> : null}
      </div>
    ))}
    <svg style={{ position: "absolute", left: g.close - 11, top: g.h / 2 - 11 }} width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10.5" fill="#b4b6bd" />
      <path d="M7.2 7.2l7.6 7.6M14.8 7.2l-7.6 7.6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  </div>
);
/** 输入栏上「电脑键盘」标签、关闭钮的中心（键盘内坐标） */
export const KB_CLOSE = { x: BAR_P.close, y: BAR_P.h / 2 };
export const PC_TAB_L = { x: BAR_L.pc, y: BAR_L.h / 2 };

export const Keyboard: React.FC<{ show: number; pressed?: string | null; suggest?: readonly [string, string, string]; layer?: "abc" | "123" }> = ({
  show,
  pressed = null,
  suggest = ["I", "The", "I'm"],
  layer = "abc",
}) => {
  if (show <= 0) return null;
  const pop = pressed && pressed !== "LAYER" ? keyPos(pressed, layer) : null;
  return (
    <div style={{ position: "absolute", left: 0, top: KB_TOP + (1 - show) * KB_H, width: SW, height: KB_H }}>
      <UUBar tab="ime" />
      {/* iOS 键盘面板 */}
      <div style={{ position: "absolute", left: 0, top: BAR_H, width: SW, height: KB_H - BAR_H, background: "#d9dbe1", borderRadius: "30px 30px 0 0" }}>
        <div style={{ position: "absolute", left: (SW - 146) / 2, top: 8, width: 146, height: 38, borderRadius: 19, background: "#ffffff" }} />
        {suggest.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: [20, 147, 293][i], width: 127, top: 15, textAlign: "center", fontFamily: SF, fontSize: 19, color: i === 1 ? "#000" : "#5d6068" }}>
            {s}
          </div>
        ))}
      </div>
      {layer === "abc"
        ? ROWS.map((row) =>
            [...row].map((ch) => {
              const p = keyPos(ch)!;
              return <Key key={ch} x={p.x - KEY_W / 2} y={p.y - KEY_H / 2} w={KEY_W} label={ch} on={pressed === ch} />;
            }),
          )
        : NUM_ROWS.map((row, r) =>
            [...row].map((ch) => {
              const p = keyPos(ch, "123")!;
              const w = r === 2 ? 60.4 : KEY_W;
              return <Key key={`${r}${ch}`} x={p.x - w / 2} y={p.y - KEY_H / 2} w={w} label={ch} size={r === 2 ? 23 : 22} on={pressed === ch} />;
            }),
          )}
      {layer === "abc" ? (
        <Key x={5.9} y={ROW_Y[2]} w={56} dark label={<svg width="22" height="20" viewBox="0 0 22 20"><path d="M11 2 2.5 11H7v6.5h8V11h4.5z" fill="none" stroke="#1c1c1e" strokeWidth="1.8" strokeLinejoin="round" /></svg>} />
      ) : (
        <Key x={5.9} y={ROW_Y[2]} w={56} dark size={17} label="#+=" />
      )}
      <Key x={SW - 5.9 - 56} y={ROW_Y[2]} w={56} dark label={<svg width="26" height="20" viewBox="0 0 26 20"><path d="M8 2h15a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 23 18H8L1.5 10z" fill="none" stroke="#1c1c1e" strokeWidth="1.8" strokeLinejoin="round" /><path d="M11.5 6.5l7 7M18.5 6.5l-7 7" stroke="#1c1c1e" strokeWidth="1.8" strokeLinecap="round" /></svg>} />
      <Key x={5.9} y={ROW_Y[3]} w={50} dark size={17} label={layer === "abc" ? "123" : "ABC"} on={pressed === "LAYER"} />
      <Key x={5.9 + 50 + GAP} y={ROW_Y[3]} w={50} dark label={<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1c1c1e" /><circle cx="8.6" cy="9.6" r="1.4" fill="#c3c7cf" /><circle cx="15.4" cy="9.6" r="1.4" fill="#c3c7cf" /><path d="M7.5 13.6a4.8 4.8 0 0 0 9 0z" fill="#c3c7cf" /></svg>} />
      <Key x={5.9 + 2 * (50 + GAP)} y={ROW_Y[3]} w={SW - 2 * 5.9 - 2 * (50 + GAP) - GAP - 100} label="" on={pressed === " "} />
      <Key
        x={SW - 5.9 - 100}
        y={ROW_Y[3]}
        w={100}
        dark
        on={pressed === "\n"}
        label={<svg width="26" height="18" viewBox="0 0 26 18"><path d="M22 2v6.5a2.5 2.5 0 0 1-2.5 2.5H4m0 0 4.5-4.5M4 11l4.5 4.5" fill="none" stroke="#1c1c1e" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      />
      {/* 地球和话筒 */}
      <svg style={{ position: "absolute", left: 24, top: KB_H - 52 }} width="30" height="30" viewBox="0 0 30 30">
        <g fill="none" stroke="#1c1c1e" strokeWidth="1.7">
          <circle cx="15" cy="15" r="12" />
          <ellipse cx="15" cy="15" rx="5.2" ry="12" />
          <path d="M3 15h24M5 8.5h20M5 21.5h20" />
        </g>
      </svg>
      <svg style={{ position: "absolute", left: SW - 50, top: KB_H - 54 }} width="22" height="32" viewBox="0 0 22 32">
        <g fill="none" stroke="#1c1c1e" strokeWidth="1.8" strokeLinecap="round">
          <rect x="6.5" y="2" width="9" height="17" rx="4.5" />
          <path d="M2.5 14a8.5 8.5 0 0 0 17 0M11 22.5V29M7 29h8" />
        </g>
      </svg>
      {/* 按下字母时上方弹出的放大气泡 */}
      {pop && pressed && pressed !== " " && pressed !== "\n" && pressed !== "LAYER" ? (
        <div
          style={{
            position: "absolute",
            left: pop.x - 30,
            top: pop.y - KEY_H / 2 - 62,
            width: 60,
            height: 84 + KEY_H / 2,
            borderRadius: 14,
            background: "#ffffff",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.12)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
            fontFamily: SF,
            fontSize: 38,
            color: "#000",
          }}
        >
          {pressed}
        </div>
      ) : null}
    </div>
  );
};

// UU 的「电脑键盘」：UU 自己画的一块键盘，不是 iOS 键盘。排布照实机截图（公开测评 ai-bot.cn/netease-uuremote-review 里的横屏截图）：
// 第一排「☐ 组合键模式」+ Control、Shift、Option、⌘，下面数字一排、字母三排，最后一排右边是 Space、Enter，最底下两个翻页点。
// 截图是深色模式；这支片子里手机是浅色模式，配色换成浅色，排布不变。横屏的尺寸照截图量（键盘占屏高的一半，两边让出安全区），
// 竖屏一排十格铺满。
type PcGeo = { bar: BarGeo; w: number; h: number; m: number; gap: number; kh: number; pitch: number; top: number; font: number; font0: number };
const PC_P: PcGeo = { bar: BAR_P, w: SW, h: KB_H, m: 8, gap: 5, kh: 40, pitch: 48, top: BAR_H + 14, font: 19, font0: 17 };
/** 横屏键盘高（横屏屏幕点） */
export const LKB_H = 226;
export const LKB_TOP = LH - LKB_H;
const PC_L: PcGeo = { bar: BAR_L, w: LW, h: LKB_H, m: 69, gap: 6.8, kh: 22, pitch: 27.5, top: 56, font: 15, font0: 14 };
type PcKey = { id: string; label: React.ReactNode; row: number; col: number; cols: number };
const PC_KEYS: PcKey[] = [
  { id: "CTRL", label: "Control", row: 0, col: 2, cols: 2 },
  { id: "SHIFT", label: "Shift", row: 0, col: 4, cols: 2 },
  { id: "OPT", label: "Option", row: 0, col: 6, cols: 2 },
  { id: "CMD", label: "⌘", row: 0, col: 8, cols: 2 },
  ...[..."1234567890"].map((ch, i) => ({ id: ch, label: ch, row: 1, col: i, cols: 1 })),
  ...[..."QWERTYUIOP"].map((ch, i) => ({ id: ch, label: ch, row: 2, col: i, cols: 1 })),
  ...[..."ASDFGHJKL"].map((ch, i) => ({ id: ch, label: ch, row: 3, col: i, cols: 1 })),
  { id: "BS", label: "←", row: 3, col: 9, cols: 1 },
  ...[..."ZXCVBNM"].map((ch, i) => ({ id: ch, label: ch, row: 4, col: i, cols: 1 })),
  // Space、Enter 平分最后三格
  { id: "SPACE", label: "Space", row: 4, col: 7, cols: 1.5 },
  { id: "ENTER", label: "Enter", row: 4, col: 8.5, cols: 1.5 },
];
const cellW = (g: PcGeo) => (g.w - 2 * g.m - 9 * g.gap) / 10;
const keyBox = (g: PcGeo, k: PcKey) => {
  const cw = cellW(g);
  const half = k.col % 1 !== 0 || k.cols % 1 !== 0;
  // 平分三格时两键之间也留一道缝
  const x = half ? g.m + 7 * (cw + g.gap) + (k.col === 7 ? 0 : (3 * cw + 2 * g.gap + g.gap) / 2) : g.m + k.col * (cw + g.gap);
  const w = half ? (3 * cw + 2 * g.gap - g.gap) / 2 : k.cols * cw + (k.cols - 1) * g.gap;
  return { x, y: g.top + k.row * g.pitch, w, h: g.kh };
};
/** 电脑键盘上某个键的中心（键盘内坐标）；COMBO 是「组合键模式」那个勾选框。land：横屏那一套 */
export const pcKeyPos = (id: string, land = false) => {
  const g = land ? PC_L : PC_P;
  if (id === "COMBO") return { x: g.m + 12, y: g.top + g.kh / 2 };
  const k = PC_KEYS.find((q) => q.id === id);
  if (!k) return null;
  const r = keyBox(g, k);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

/** UU 的电脑键盘。combo：「组合键模式」勾上了；held：组合键模式下已经按住的修饰键；pressed：正按着的键；land：横屏 */
export const PcKeyboard: React.FC<{ show: number; combo?: boolean; held?: readonly string[]; pressed?: string | null; land?: boolean }> = ({ show, combo = false, held = [], pressed = null, land = false }) => {
  if (show <= 0) return null;
  const g = land ? PC_L : PC_P;
  const screenH = land ? LH : SH;
  return (
    <div style={{ position: "absolute", left: 0, top: screenH - g.h + (1 - show) * g.h, width: g.w, height: g.h }}>
      <UUBar tab="pc" g={g.bar} />
      <div style={{ position: "absolute", left: 0, top: g.bar.h, width: g.w, height: g.h - g.bar.h, background: "#e3e5ea" }} />
      {/* 组合键模式：勾选框 + 字 */}
      <div style={{ position: "absolute", left: g.m + 2, top: g.top, height: g.kh, display: "flex", alignItems: "center", gap: 5, fontFamily: ZH, fontSize: land ? 13.5 : 12.5, color: "#1c1c1e", whiteSpace: "nowrap" }}>
        <div style={{ width: 17, height: 17, borderRadius: 4, border: combo ? "none" : "1.6px solid #3a3a3c", background: combo ? "#2f7cf6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transform: pressed === "COMBO" ? "scale(0.88)" : undefined }}>
          {combo ? (
            <svg width="11" height="9" viewBox="0 0 11 9">
              <path d="M1.2 4.6 4 7.4 9.8 1.4" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </div>
        组合键模式
      </div>
      {PC_KEYS.map((k) => {
        const on = pressed === k.id;
        const hold = held.includes(k.id);
        const r = keyBox(g, k);
        return (
          <div
            key={k.id}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              borderRadius: land ? 5 : 7,
              background: on ? "#b9bec8" : hold ? "#cfe0ff" : "#ffffff",
              border: hold ? "1.5px solid #2f7cf6" : undefined,
              boxShadow: "0 1px 0 rgba(0,0,0,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SF,
              fontSize: k.row === 0 ? g.font0 : g.font,
              color: hold ? "#1f5fd6" : "#1c1c1e",
            }}
          >
            {k.label}
          </div>
        );
      })}
      {/* 翻页点 */}
      <div style={{ position: "absolute", left: g.w / 2 - 30, top: g.top + 5 * g.pitch + (land ? 4 : 6), width: 26, height: land ? 4 : 5, borderRadius: 3, background: "#1c1c1e" }} />
      <div style={{ position: "absolute", left: g.w / 2 + 4, top: g.top + 5 * g.pitch + (land ? 4 : 6), width: 26, height: land ? 4 : 5, borderRadius: 3, background: "#a6a9b0" }} />
    </div>
  );
};

/**
 * 横屏下 UU 键盘的「输入法」页：上面同一条 UU 输入栏，下面是 iOS 横屏键盘（四排键，两边让出安全区）。
 * 片子里只亮相半秒（点「键盘」后马上切到「电脑键盘」），画出排布即可，不做按键动画。
 */
export const ImeKeyboardLand: React.FC<{ show: number }> = ({ show }) => {
  if (show <= 0) return null;
  const m = 69;
  const pitch = (LW - 2 * m) / 10;
  const w = pitch - 6.5;
  const kh = 30;
  const rowY = [BAR_L.h + 34, BAR_L.h + 70, BAR_L.h + 106, BAR_L.h + 142];
  const key = (x: number, y: number, kw: number, label: React.ReactNode, dark = false, size = 19) => (
    <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: kw, height: kh, borderRadius: 7, background: dark ? KEY_DARK : KEY, boxShadow: "0 1px 0 rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SF, fontSize: size, color: "#000" }}>
      {label}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: LH - LKB_H + (1 - show) * LKB_H, width: LW, height: LKB_H }}>
      <UUBar tab="ime" g={BAR_L} />
      <div style={{ position: "absolute", left: 0, top: BAR_L.h, width: LW, height: LKB_H - BAR_L.h, background: "#d9dbe1", borderRadius: "22px 22px 0 0" }}>
        <div style={{ position: "absolute", left: LW / 2 - 70, top: 5, width: 140, height: 24, borderRadius: 12, background: "#fff" }} />
      </div>
      {[..."qwertyuiop"].map((ch, i) => key(m + i * pitch, rowY[0], w, ch))}
      {[..."asdfghjkl"].map((ch, i) => key(m + pitch / 2 + i * pitch, rowY[1], w, ch))}
      {key(m, rowY[2], pitch * 1.4 - 6.5, "⇧", true)}
      {[..."zxcvbnm"].map((ch, i) => key(m + pitch * 1.5 + i * pitch, rowY[2], w, ch))}
      {key(m + pitch * 8.6, rowY[2], pitch * 1.4 - 6.5, "⌫", true)}
      {key(m, rowY[3], pitch * 1.4 - 6.5, "123", true, 16)}
      {key(m + pitch * 1.5, rowY[3], pitch * 6.9, "", false)}
      {key(m + pitch * 8.5, rowY[3], pitch * 1.5 - 6.5, "return", true, 16)}
    </div>
  );
};
