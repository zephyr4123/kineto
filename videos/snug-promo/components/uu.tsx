import { ZH } from "../theme";
import { Keyboard, keyPos, KB_TOP } from "./keyboard";
import { DH, DW, MacDesktop, SnugDisplay } from "./mac";
import { DISPLAY_H, DISPLAY_TOP, LH, LW, SW, ToolIcon, UUToolbar, type ToolKind } from "./phone";

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
/** 桌面点 → 手机屏幕点 */
export const deskToScreen = (v: DeskView, x: number, y: number) => ({ x: SW / 2 + (x - v.fx) * DESK_K * v.z, y: v.sy + (y - v.fy) * DESK_K * v.z });
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

/**
 * 原版 UU远程 横屏（照实机录屏）：没有状态栏，桌面按屏高等比缩放、左右留黑；右边一列竖排工具栏，从上到下
 * 「操作」「键盘」「显示桌面」「展开所有窗口」。实机是深色模式，这里跟竖屏一样用浅色的工具栏。坐标是横屏屏幕点。
 */
export const L_TB = 96;
export const L_REMOTE_W = LW - L_TB;
export const LAND_K = LH / DH;
/** 横屏里桌面的摆法：桌面点 (fx, fy) 放到屏幕点 (sx, sy)，每个桌面点占 LAND_K × z 个屏幕点 */
export type LandView = { z: number; fx: number; fy: number; sx: number; sy: number };
export const FIT_L: LandView = { z: 1, fx: DW / 2, fy: DH / 2, sx: L_REMOTE_W / 2, sy: LH / 2 };
export const mixLand = (a: LandView, b: LandView, t: number): LandView => ({
  z: a.z + (b.z - a.z) * t,
  fx: a.fx + (b.fx - a.fx) * t,
  fy: a.fy + (b.fy - a.fy) * t,
  sx: a.sx + (b.sx - a.sx) * t,
  sy: a.sy + (b.sy - a.sy) * t,
});
export const landToScreen = (v: LandView, x: number, y: number) => ({ x: v.sx + (x - v.fx) * LAND_K * v.z, y: v.sy + (y - v.fy) * LAND_K * v.z });
export const screenToLand = (v: LandView, x: number, y: number) => ({ x: v.fx + (x - v.sx) / (LAND_K * v.z), y: v.fy + (y - v.sy) / (LAND_K * v.z) });
const L_ITEMS: { kind: ToolKind; label: string; y: number }[] = [
  { kind: "op", label: "操作", y: 50 },
  { kind: "kb", label: "键盘", y: 160 },
  { kind: "desk", label: "显示桌面", y: 270 },
  { kind: "all", label: "展开所有窗口", y: 380 },
];
/** 横屏工具栏上某个图标的中心（横屏屏幕点），放手指用 */
export const lTool = (kind: ToolKind) => ({ x: L_REMOTE_W + L_TB / 2, y: L_ITEMS.find((i) => i.kind === kind)!.y - 11 });

export const UULandscape: React.FC<{ desk: React.ReactNode; view?: LandView; kb?: React.ReactNode; press?: ToolKind | null }> = ({ desk, view = FIT_L, kb, press = null }) => {
  const k = LAND_K * view.z;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: L_REMOTE_W, height: LH, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: DW, height: DH, transform: `translate(${view.sx - view.fx * k}px, ${view.sy - view.fy * k}px) scale(${k})`, transformOrigin: "0 0", filter: "blur(0.5px)" }}>{desk}</div>
      </div>
      <div style={{ position: "absolute", left: L_REMOTE_W, top: 0, width: L_TB, height: LH, background: "rgba(246,247,250,0.97)", borderLeft: "0.5px solid rgba(0,0,0,0.12)" }}>
        {L_ITEMS.map((it) => (
          <div key={it.kind} style={{ position: "absolute", left: 0, width: L_TB, top: it.y - 22, textAlign: "center", opacity: press === it.kind ? 0.45 : 1 }}>
            <ToolIcon kind={it.kind} />
            <div style={{ margin: "5px auto 0", width: 52, fontFamily: ZH, fontSize: 11.5, lineHeight: 1.25, color: "#3a3a3c" }}>{it.label}</div>
          </div>
        ))}
      </div>
      {kb}
      <div style={{ position: "absolute", left: (LW - 160) / 2, top: LH - 9, width: 160, height: 5, borderRadius: 3, background: kb ? "#111" : "rgba(255,255,255,0.8)" }} />
    </div>
  );
};
