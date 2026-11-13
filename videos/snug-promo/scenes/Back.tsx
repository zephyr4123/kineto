import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { Indicator, MH, MW, toPhone } from "../components/mac";
import { aim, Phone, Touch } from "../components/phone";
import { press01, WIN, WindowList } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { UUSnug } from "../components/uu";
import { local } from "../theme";
import { OTHERS } from "./List";
import { SEL_LINES, SIZE } from "./Select";

// 底部横条：轻点一下回到窗口列表（往上滑 12 点也行）。镜头从菜单那里拉回默认机位。
const at = local(88);

export const Back: React.FC = () => {
  const f = useCurrentFrame();
  const tap = at(1);
  const bar = toPhone(MW / 2, MH - 14);
  const back = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: inOutQuint });
  const s = HOME.s + 0.65 * (1 - back);
  const pose = aim(220, 478 + 200 * (1 - back), s, 540, HOME.y - 60 * (1 - back));
  const list = interpolate(f, [tap + 6, tap + 18], [0, 1], { ...clamp, easing: outExpo });
  const show = interpolate(f, [tap - 8, tap - 2, tap + 10, tap + 16], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s}>
        <UUSnug>
          <GhosttyApp lines={SEL_LINES} size={SIZE} indicatorPress={press01(f, tap)} />
          {list > 0 ? (
            <div style={{ position: "absolute", inset: 0, opacity: list, transform: `translateY(${(1 - list) * 60}px)` }}>
              <WindowList current={WIN.ghostty} others={OTHERS} />
              <Indicator />
            </div>
          ) : null}
        </UUSnug>
        <Touch x={bar.x} y={bar.y} press={press01(f, tap)} show={show} />
      </Phone>
      <Hero at={2} until={at(4) + 30} title="HOME" sub="轻点横条 回到列表" />
    </AbsoluteFill>
  );
};
