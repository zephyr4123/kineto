import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outQuint } from "../../../engine/motion";
import { GHOSTTY_BODY, GhosttyApp } from "../components/apps";
import { HOLD, holdRing } from "../components/gesture";
import { MW, toPhone } from "../components/mac";
import { aim, Phone, Touch } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { cellPos, contentHeight, EARLY, GESTURE_LINE, INPUT, layout, SESSION, type Line, type Sel } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { local } from "../theme";

// 长按拖动选字：按住 0.5 秒，手指沿着那段讲手势的话拖过去，选区跟着走。位置按终端的字符格算（换行后的真实位置）。
const at = local(72);
export const SEL_LINES: Line[] = [...EARLY, ...SESSION, "", ...INPUT("")];
export const SIZE = 16;
const BODY_TOP = 62;
const LAY = layout(SEL_LINES, SIZE, MW);
/** 内容比窗口高，终端贴底显示，上面被顶出去的那一截 */
const OFF = Math.max(0, contentHeight(LAY) - GHOSTTY_BODY);
/** 第 line 行第 col 个字符的中心（Mac 点） */
export const pos = (line: number, col: number) => {
  const p = cellPos(LAY, line, col);
  return { x: p.x, y: BODY_TOP + p.y - OFF };
};
const LINE = EARLY.length + GESTURE_LINE;
const TEXT = (SESSION[GESTURE_LINE] as { t: string }[]).map((s) => s.t).join("");
// 从「单指移动…」选到「…判定为选字」
export const FROM = { line: LINE, col: [...TEXT.slice(0, TEXT.indexOf("单指"))].length };
export const TO = { line: LINE, col: [...TEXT.slice(0, TEXT.indexOf("判定为选字") + 5)].length };
export const selection = (end: number): Sel[] => [{ line: LINE, from: FROM.col, to: end }];

export const Select: React.FC = () => {
  const f = useCurrentFrame();
  const down = at(1);
  const drag0 = down + HOLD;
  const end = Math.round(interpolate(f, [drag0, at(6)], [FROM.col, TO.col], { ...clamp, easing: outQuint }));
  const sel = f >= drag0 ? selection(end) : [];
  const fp = pos(LINE, Math.max(FROM.col, end - 1));
  const finger = toPhone(fp.x, fp.y);
  const show = interpolate(f, [down - 6, down, at(6) + 6, at(6) + 14], [0, 1, 1, 0], clamp);
  const zoom = interpolate(f, [0, at(1)], [0, 1], { ...clamp, easing: inOutQuint });
  const s = HOME.s + 0.55 * zoom;
  const c = toPhone(270, pos(LINE, FROM.col).y + 30);
  const pose = aim(220 + (c.x - 220) * zoom, 478 + (c.y - 478) * zoom, s, 540, HOME.y - 60 * zoom);
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s}>
        <UUSnug>
          <GhosttyApp lines={SEL_LINES} size={SIZE} sel={sel} />
        </UUSnug>
        <Touch x={finger.x} y={finger.y} press={1} show={show} ring={f < drag0 ? holdRing(f, down) : 0} />
      </Phone>
      <Hero at={2} until={at(8) - 6} title="SELECT" sub="长按拖动 · 精准选字" />
    </AbsoluteFill>
  );
};
