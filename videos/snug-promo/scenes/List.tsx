import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { CodeApp } from "../components/apps";
import { Indicator, toPhone } from "../components/mac";
import { aim, Phone, Touch } from "../components/phone";
import { Opening, press01, rowCenter, WIN, WindowList } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { UUSnug } from "../components/uu";
import { local } from "../theme";

// 窗口列表：Mac 上的窗口都在这里，轻点一行 → 「正在打开」→ 窗口铺满。
const at = local(40);
export const OTHERS = [WIN.vscode, WIN.chatgpt, WIN.safari, WIN.notion, WIN.claude, WIN.finder, WIN.settings] as const;

export const List: React.FC = () => {
  const f = useCurrentFrame();
  const tap = at(2);
  const row = toPhone(rowCenter(0, true).x, rowCenter(0, true).y);
  const opening = f >= tap + 10 && f < at(4);
  const open = f >= at(4);
  const fill = interpolate(f, [at(4), at(4) + 12], [0, 1], { ...clamp, easing: outExpo });
  const zoom = interpolate(f, [at(1), at(2), at(4), at(4) + 16], [0, 1, 1, 0], { ...clamp, easing: inOutQuint });
  const s = HOME.s + 0.22 * zoom;
  const p = aim(220, 478 + (row.y - 478) * 0.5 * zoom, s, 540, HOME.y);
  const show = interpolate(f, [tap - 8, tap - 2, tap + 12, tap + 18], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Phone x={p.x} y={p.y} scale={s}>
        <UUSnug>
          {open ? (
            <div style={{ position: "absolute", inset: 0, transform: `scale(${0.94 + 0.06 * fill})`, opacity: fill }}>
              <CodeApp />
            </div>
          ) : opening ? (
            <Opening w={WIN.vscode} frame={f} />
          ) : (
            <>
              <WindowList current={WIN.ghostty} others={OTHERS} pressRow={0} press={press01(f, tap)} />
              <Indicator />
            </>
          )}
        </UUSnug>
        <Touch x={row.x} y={row.y} press={press01(f, tap)} show={show} />
      </Phone>
      <Hero at={2} until={at(8) - 6} title="ONE TAP" sub="窗口列表 轻点即开" />
    </AbsoluteFill>
  );
};
