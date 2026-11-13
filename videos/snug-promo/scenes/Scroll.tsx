import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { GHOSTTY_BODY, GhosttyApp } from "../components/apps";
import { flick } from "../components/gesture";
import { MW, toPhone } from "../components/mac";
import { Phone, Touch } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { BANNER, contentHeight, EARLY, INPUT, layout, SESSION } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { local } from "../theme";

// 单指滚动：手指往下一甩，终端往回翻，松手后按 Snug 的惯性曲线减速停下；再往上一甩回到底部。
const at = local(64);
const LINES = [...BANNER, "", ...EARLY, ...SESSION, ...INPUT("")];
const SIZE = 16;
const MAX = contentHeight(layout(LINES, SIZE, MW)) - GHOSTTY_BODY;
const DRAG = 8;

export const Scroll: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = at(1);
  const t2 = at(4.5);
  // 手指往下移 120 点 → 内容往下走，看到更早的；往上移 120 点 → 回到底部
  const scroll = Math.min(MAX, Math.max(0, MAX - flick(f, t1, DRAG, 120) + flick(f, t2, DRAG, 120)));
  const finger = (t: number, dir: number) => {
    const y = interpolate(f, [t, t + DRAG], [0, 120], clamp) * dir;
    const show = interpolate(f, [t - 6, t, t + DRAG, t + DRAG + 6], [0, 1, 1, 0], clamp);
    return { y, show };
  };
  const a = finger(t1, 1);
  const c = finger(t2, -1);
  const pa = toPhone(330, 380 + a.y);
  const pc = toPhone(330, 560 + c.y);
  return (
    <AbsoluteFill>
      <Phone x={HOME.x} y={HOME.y} scale={HOME.s}>
        <UUSnug>
          <GhosttyApp lines={LINES} size={SIZE} scroll={scroll} anchor="top" />
        </UUSnug>
        {/* 手指和它身后一小段拖影 */}
        {[0.5, 0.3, 0.15].map((o, i) => (
          <Touch key={`a${i}`} x={pa.x} y={pa.y - (i + 1) * 10 * Math.min(1, a.y / 60)} show={a.show * o * Math.min(1, a.y / 30)} />
        ))}
        <Touch x={pa.x} y={pa.y} press={1} show={a.show} />
        {[0.5, 0.3, 0.15].map((o, i) => (
          <Touch key={`c${i}`} x={pc.x} y={pc.y + (i + 1) * 10 * Math.min(1, -c.y / 60)} show={c.show * o * Math.min(1, -c.y / 30)} />
        ))}
        <Touch x={pc.x} y={pc.y} press={1} show={c.show} />
      </Phone>
      <Hero at={2} until={at(8) - 6} title="SCROLL" sub="单指滚动 · 惯性滑行" />
    </AbsoluteFill>
  );
};
