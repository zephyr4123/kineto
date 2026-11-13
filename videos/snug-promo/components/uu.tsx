import { Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { SF } from "../theme";
import { Keyboard, keyPos, KB_TOP } from "./keyboard";
import { DH, DW, MacDesktop, SnugDisplay } from "./mac";
import { DISPLAY_H, DISPLAY_TOP, SH, SW, UUToolbar } from "./phone";

// UU远程 在手机上的样子：上面远程画面，下面工具栏；弹键盘时键盘盖住工具栏，远程画面往上推。

/** 搭配 Snug：远程画面就是 Snug 手机屏 */
export const UUSnug: React.FC<{
  children: React.ReactNode;
  kb?: number;
  shiftY?: number;
  pressed?: string | null;
  layer?: "abc" | "123";
  suggest?: readonly [string, string, string];
}> = ({ children, kb = 0, shiftY = 0, pressed, layer, suggest }) => (
  <>
    <SnugDisplay shiftY={shiftY}>{children}</SnugDisplay>
    <UUToolbar />
    <Keyboard show={kb} pressed={pressed} layer={layer} suggest={suggest} />
  </>
);

/**
 * 原版 UU远程 里桌面的摆法：桌面点 (fx, fy) 放到屏幕点 (SW/2, sy)，每个桌面点占 DESK_K × z 个屏幕点。
 * z = 1（FIT）时整块桌面等比缩到手机宽、上下黑边；双指放大就是 z 变大、画面裁到手机屏里。
 */
export const DESK_K = SW / DW;
export type DeskView = { z: number; fx: number; fy: number; sy: number };
export const FIT: DeskView = { z: 1, fx: DW / 2, fy: DH / 2, sy: DISPLAY_TOP + DISPLAY_H / 2 };
export const mixView = (a: DeskView, b: DeskView, t: number): DeskView => ({
  z: a.z + (b.z - a.z) * t,
  fx: a.fx + (b.fx - a.fx) * t,
  fy: a.fy + (b.fy - a.fy) * t,
  sy: a.sy + (b.sy - a.sy) * t,
});
/** 桌面点 → 手机屏幕点 */
export const deskToScreen = (v: DeskView, x: number, y: number) => ({ x: SW / 2 + (x - v.fx) * DESK_K * v.z, y: v.sy + (y - v.fy) * DESK_K * v.z });
/** 手机屏幕点 → 桌面点 */
export const screenToDesk = (v: DeskView, x: number, y: number) => ({ x: v.fx + (x - SW / 2) / (DESK_K * v.z), y: v.fy + (y - v.sy) / (DESK_K * v.z) });

/** 原版 UU远程：远程画面（黑底，桌面按 view 摆）+ 底部工具栏 */
export const UUOriginal: React.FC<{ front: React.ReactNode; back?: React.ReactNode | null; soft?: number; view?: DeskView }> = ({ front, back, soft = 0.7, view = FIT }) => {
  const k = DESK_K * view.z;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, background: "#000", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: DW,
            height: DH,
            transform: `translate(${SW / 2 - view.fx * k}px, ${view.sy - DISPLAY_TOP - view.fy * k}px) scale(${k})`,
            transformOrigin: "0 0",
            filter: `blur(${soft}px)`,
          }}
        >
          <MacDesktop front={front} back={back} />
        </div>
      </div>
      <UUToolbar />
    </>
  );
};

/**
 * 打字时间表：从 at 帧起每 step 帧敲一个键。遇到 / 先按「123」切到数字层，敲完再按「ABC」切回。
 * 返回某一帧已经敲出的字、正按着的键、键盘在哪一层、手指该在哪。
 */
export type Stroke = { at: number; key: string; layer: "abc" | "123"; ch?: string };
export const strokes = (text: string, at: number, step: number): Stroke[] => {
  const out: Stroke[] = [];
  let t = at;
  for (const ch of text) {
    if (ch === "/") {
      out.push({ at: t, key: "LAYER", layer: "abc" });
      t += step;
      out.push({ at: t, key: "/", layer: "123", ch });
      t += step;
      out.push({ at: t, key: "LAYER", layer: "123" });
      t += step;
      continue;
    }
    out.push({ at: t, key: ch === "\n" ? "\n" : ch, layer: "abc", ch });
    t += step;
  }
  return out;
};
export const typingAt = (ss: readonly Stroke[], frame: number) => {
  let typed = "";
  let pressed: string | null = null;
  let layer: "abc" | "123" = "abc";
  let finger: { x: number; y: number } | null = null;
  for (const s of ss) {
    if (frame < s.at) break;
    if (s.ch && s.ch !== "\n") typed += s.ch;
    layer = s.key === "LAYER" ? (s.layer === "abc" ? "123" : "abc") : s.layer;
    if (frame < s.at + 5) {
      pressed = s.key;
      layer = s.layer;
      const p = keyPos(s.key, s.layer);
      finger = p ? { x: p.x, y: KB_TOP + p.y } : null;
    }
  }
  const last = ss[ss.length - 1];
  return { typed, pressed, layer, finger, done: last ? frame >= last.at + 5 : true };
};

// iPhone 主屏：四列图标，UU远程 在第二排第二个，清楚；别的图标虚化、压淡，只当背景。
// launch 0→1 是点开以后图标放大铺满屏幕（iOS 打开 App 的样子），铺满时露出底下的 UU远程 画面。
const HOME_ICONS = ["iconSafari", "iconWechat", "iconNotion", "iconFinder", "iconChatgpt", "iconUu", "iconClaude", "iconSettings", "iconTerminal", "iconTypeless", "iconCursor", "iconVscode"] as const;
const DOCK_ICONS = ["iconSafari", "iconWechat", "iconChatgpt", "iconFinder"] as const;
const ICON = 68;
const col = (i: number) => 64 + (i % 4) * 104;
const row = (i: number) => 120 + Math.floor(i / 4) * 112;
/** UU远程 图标在主屏上的中心（屏幕点） */
export const UU_ICON = { x: col(5), y: row(5) };
export const UUHome: React.FC<{ launch?: number; press?: number; children?: React.ReactNode }> = ({ launch = 0, press = 0, children }) => {
  // 图标放大到整屏：从图标的方块插值到屏幕的方块
  const w = ICON + (SW - ICON) * launch;
  const h = ICON + (SH - ICON) * launch;
  const x = UU_ICON.x - ICON / 2 + (0 - (UU_ICON.x - ICON / 2)) * launch;
  const y = UU_ICON.y - ICON / 2 + (0 - (UU_ICON.y - ICON / 2)) * launch;
  return (
    <>
      {launch > 0 ? children : null}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - launch, background: "linear-gradient(170deg, #cfe4ff 0%, #e9e3ff 45%, #ffe6ef 100%)" }}>
        {HOME_ICONS.map((k, i) =>
          k === "iconUu" ? null : (
            <div key={k} style={{ position: "absolute", left: col(i) - ICON / 2, top: row(i) - ICON / 2, width: ICON, textAlign: "center", filter: "blur(3px)", opacity: 0.55 }}>
              <Img src={staticFile(assets[k])} style={{ width: ICON * 1.22, height: ICON * 1.22, margin: `${-ICON * 0.11}px 0 0 ${-ICON * 0.11}px` }} />
            </div>
          ),
        )}
        <div style={{ position: "absolute", left: UU_ICON.x - 50, top: UU_ICON.y + ICON / 2 + 6, width: 100, textAlign: "center", fontFamily: SF, fontSize: 13, fontWeight: 500, color: "#1c1c1e" }}>UU远程</div>
        {/* 程序坞：毛玻璃底板上四个图标，同样虚化 */}
        <div style={{ position: "absolute", left: 16, right: 16, top: SH - 112, height: 92, borderRadius: 38, background: "rgba(255,255,255,0.38)", border: "1px solid rgba(255,255,255,0.5)" }}>
          {DOCK_ICONS.map((k, i) => (
            <Img key={k} src={staticFile(assets[k])} style={{ position: "absolute", left: 48 + i * 104 - ICON * 0.61 - 16, top: 46 - ICON * 0.61, width: ICON * 1.22, height: ICON * 1.22, filter: "blur(3px)", opacity: 0.55 }} />
          ))}
        </div>
      </div>
      {/* UU远程 图标（Mac 上导出的图标四周带透明边，放大 1.22 倍裁掉，只留圆角方块） */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 16 + 47 * launch,
          overflow: "hidden",
          opacity: launch < 0.85 ? 1 : 1 - (launch - 0.85) / 0.15,
          transform: `scale(${1 - 0.08 * press})`,
          background: "#f4f6fa",
        }}
      >
        <Img src={staticFile(assets.iconUu)} style={{ position: "absolute", left: "50%", top: "50%", width: ICON * 1.22, height: ICON * 1.22, transform: `translate(-50%, -50%) scale(${1 + 1.2 * launch})` }} />
      </div>
    </>
  );
};
