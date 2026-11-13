import { SF, ZH } from "../theme";
import { SH, SW } from "./phone";

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
      {/* UU 输入栏 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: BAR_H + 30, background: "#f7f7f9", borderTop: "0.5px solid rgba(0,0,0,0.12)" }}>
        <div style={{ position: "absolute", left: 40, width: 120, top: 10, textAlign: "center", fontFamily: ZH, fontSize: 18, color: "#5a9bff" }}>
          输入法
          <div style={{ margin: "3px auto 0", width: 60, height: 2, background: "#5a9bff", borderRadius: 1 }} />
        </div>
        <div style={{ position: "absolute", left: 205, width: 120, top: 10, textAlign: "center", fontFamily: ZH, fontSize: 18, color: "#1c1c1e" }}>电脑键盘</div>
        <svg style={{ position: "absolute", left: 392, top: 11 }} width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10.5" fill="#b4b6bd" />
          <path d="M7.2 7.2l7.6 7.6M14.8 7.2l-7.6 7.6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
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
