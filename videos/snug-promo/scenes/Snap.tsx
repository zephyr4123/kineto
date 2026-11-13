import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, punch, shake } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { FRONT } from "../components/mac";
import { aim, DISPLAY_H, DISPLAY_TOP, Phone, SW, UUToolbar } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { taskAt } from "../components/story";
import { Terminal } from "../components/terminal";
import { UUOriginal, UUSnug } from "../components/uu";
import { b, local } from "../theme";

// 回击一（全片最重的一下砸下）：缩在手机里的整块桌面一下炸开，换成 Snug 手机屏，Ghostty 窗口铺满；
// 第 8 拍字号放大，镜头推到字上。终端里还是开场那个任务，在手机上看着它跑完测试、收尾。
const START = 48;
const at = local(START);
// 原版画面里 Ghostty 那个小窗口的中心（手机屏幕点），从这里炸开
const ORIGIN = "150px 455px";

export const Snap: React.FC = () => {
  const f = useCurrentFrame();
  const m = interpolate(f, [3, 18], [0, 1], { ...clamp, easing: outExpo });
  const size = interpolate(f, [at(8), at(8) + 16], [13, 17], { ...clamp, easing: outExpo });
  const push = interpolate(f, [at(8), at(8) + 18], [0, 1], { ...clamp, easing: inOutQuint });
  const s = (HOME.s + 0.5 * push) * punch(f, 3, 0.06, 26) * punch(f, at(8), 0.03, 20);
  const lines = taskAt(b(START) + f);
  const p = aim(220 - 40 * push, 478 - 210 * push, s, 540, HOME.y + 40 * push);
  const sh = shake(f, 3, 16, 14, "snap");
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      <Phone x={p.x} y={p.y} scale={s} glow={1 - m * 0.6}>
        <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: -DISPLAY_TOP, width: SW, height: 956 }}>
            {m < 1 ? (
              <div style={{ position: "absolute", inset: 0, opacity: 1 - m, transform: `scale(${1 + 1.4 * m})`, transformOrigin: ORIGIN }}>
                <UUOriginal front={<Terminal lines={lines} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} />
              </div>
            ) : null}
            <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, m * 1.4), transform: `scale(${0.5 + 0.5 * m})`, transformOrigin: ORIGIN }}>
              <UUSnug>
                <GhosttyApp lines={lines} size={size} />
              </UUSnug>
            </div>
          </div>
        </div>
        <UUToolbar />
      </Phone>
      <Hero at={4} until={at(8) - 6} title="FULL SCREEN" sub="专属竖屏 · 窗口铺满" />
      <Hero at={at(8)} until={at(16) - 6} title="BIGGER TEXT" sub="终端 · 编辑器 · 字号放大" />
    </AbsoluteFill>
  );
};
