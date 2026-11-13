import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outQuint } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { HOLD, holdRing } from "../components/gesture";
import { toPhone } from "../components/mac";
import { aim, Phone, Touch } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { INPUT, SESSION, type Line, type Sel } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { local } from "../theme";

// 长按拖动选字：按住 0.5 秒，手指拖过两行半，选区跟着走。选区和手指位置按字符算（等宽字母 0.6 em、中文 1 em）。
const at = local(72);
export const SEL_LINES = [...SESSION, ...INPUT("")];
export const SIZE = 16;
const LH = SIZE * 1.42;
const BODY_TOP = 62;
const text = (l: Line) => (typeof l === "string" ? l : l.map((s) => s.t).join(""));
const wide = (ch: string) => ch.charCodeAt(0) > 0xff && ch !== "→" && ch !== "⎿";
/** 第 line 行第 col 个字符左边的位置（Mac 点） */
export const charPos = (line: number, col: number) => {
  const chars = [...text(SEL_LINES[line])].slice(0, col);
  const x = 14 + chars.reduce((w, ch) => w + (wide(ch) ? SIZE : 0.6 * SIZE), 0);
  return { x, y: BODY_TOP + 14 + line * LH + LH / 2 };
};
// 从第 17 行第 2 个字（「单指移动…」）选到第 19 行「…判定为选字」
export const FROM = { line: 17, col: 2 };
export const TO = { line: 19, col: 18 };
const LENS = [17, 18, 19].map((l) => [...text(SEL_LINES[l])].length);
/** 选区走到 p（0→1）时的终点 */
const along = (p: number) => {
  const total = LENS[0] - FROM.col + LENS[1] + TO.col;
  let n = Math.round(total * p);
  if (n <= LENS[0] - FROM.col) return { line: 17, col: FROM.col + n };
  n -= LENS[0] - FROM.col;
  if (n <= LENS[1]) return { line: 18, col: n };
  return { line: 19, col: n - LENS[1] };
};
export const selection = (end: { line: number; col: number }): Sel[] => {
  const out: Sel[] = [];
  for (let l = FROM.line; l <= end.line; l++) out.push({ line: l, from: l === FROM.line ? FROM.col : 0, to: l === end.line ? end.col : 99 });
  return out;
};

export const Select: React.FC = () => {
  const f = useCurrentFrame();
  const down = at(1);
  const drag0 = down + HOLD;
  const p = interpolate(f, [drag0, at(6)], [0, 1], { ...clamp, easing: outQuint });
  const end = along(p);
  const sel = f >= drag0 ? selection(end) : [];
  const fp = f >= drag0 ? charPos(end.line, end.col) : charPos(FROM.line, FROM.col);
  const finger = toPhone(fp.x, fp.y);
  const show = interpolate(f, [down - 6, down, at(6) + 6, at(6) + 14], [0, 1, 1, 0], clamp);
  const zoom = interpolate(f, [0, at(1)], [0, 1], { ...clamp, easing: inOutQuint });
  const s = HOME.s + 0.55 * zoom;
  const c = toPhone(200, charPos(18, 0).y);
  const pose = aim(220 + (c.x - 220) * zoom, 478 + (c.y - 478) * zoom, s, 540, HOME.y - 60 * zoom);
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s}>
        <UUSnug>
          <GhosttyApp lines={SEL_LINES} size={SIZE} sel={sel} />
        </UUSnug>
        <Touch x={finger.x} y={finger.y} press={1} show={show} ring={f < drag0 ? holdRing(f, down) : 0} />
      </Phone>
      <Hero at={2} until={at(8) - 6} title="SELECT" sub="长按拖动 精准选字" />
    </AbsoluteFill>
  );
};
