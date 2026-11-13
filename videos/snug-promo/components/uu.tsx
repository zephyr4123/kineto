import { Keyboard, keyPos, KB_TOP } from "./keyboard";
import { DH, DW, MacDesktop, SnugDisplay } from "./mac";
import { DISPLAY_H, DISPLAY_TOP, SW, UUToolbar } from "./phone";

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

/** 原版 UU远程：整块桌面等比缩到手机宽，上下黑边 */
export const DESK_K = SW / DW;
export const DESK_TOP = DISPLAY_TOP + (DISPLAY_H - DH * DESK_K) / 2;
export const UUOriginal: React.FC<{ front: React.ReactNode; back?: React.ReactNode; soft?: number }> = ({ front, back, soft = 0.7 }) => (
  <>
    <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, background: "#000" }} />
    <div style={{ position: "absolute", left: 0, top: DESK_TOP, width: DW, height: DH, transform: `scale(${DESK_K})`, transformOrigin: "0 0", filter: `blur(${soft}px)` }}>
      <MacDesktop front={front} back={back} />
    </div>
    <UUToolbar />
  </>
);

/** 桌面上的点 → 手机屏幕点 */
export const deskToPhone = (x: number, y: number) => ({ x: x * DESK_K, y: DESK_TOP + y * DESK_K });

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
