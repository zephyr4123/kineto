import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { FRONT } from "../components/mac";
import { Phone, Touch } from "../components/phone";
import { press01 } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { taskAt } from "../components/story";
import { Terminal } from "../components/terminal";
import { UU_ICON, UUHome, UUOriginal } from "../components/uu";
import { b, local } from "../theme";

// 先让 UU远程 当一回主角：主屏上点开 UU远程，连回 Mac，自己的桌面出现在手机上，开场那个任务还在里面跑。
const START = 8;
const at = local(START);
const TAP = at(0.6);

export const Connect: React.FC = () => {
  const f = useCurrentFrame();
  const launch = interpolate(f, [TAP + 6, at(1.7)], [0, 1], { ...clamp, easing: inOutQuint });
  // 连上以后画面从暗处亮起来
  const on = interpolate(f, [at(1.7), at(2.3)], [0, 1], { ...clamp, easing: outExpo });
  const s = HOME.s * (1 + 0.05 * interpolate(f, [at(2), at(8)], [0, 1], clamp));
  const lines = taskAt(b(START) + f);
  return (
    <AbsoluteFill>
      <Phone x={HOME.x} y={HOME.y} scale={s}>
        <UUHome launch={launch} press={press01(f, TAP)}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.25 + 0.75 * on }}>
            <UUOriginal front={<Terminal lines={lines} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} />
          </div>
        </UUHome>
        <Touch x={UU_ICON.x} y={UU_ICON.y} press={press01(f, TAP)} show={interpolate(f, [TAP - 10, TAP - 2, TAP + 8, TAP + 14], [0, 1, 1, 0], clamp)} />
      </Phone>
      <Hero at={at(0.4)} until={at(8) - 6} title="UU REMOTE" sub="随时随地 · 连回 Mac" />
    </AbsoluteFill>
  );
};
