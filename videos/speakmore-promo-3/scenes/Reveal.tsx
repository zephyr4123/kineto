import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { easeIn, prog, punch } from "../../../engine/motion";
import { Keycaps } from "../components/Keycaps";
import { LookupCard } from "../components/LookupCard";
import { IBeam } from "../components/Terminal";
import { Assemble } from "../components/Type";
import { Sub, rise } from "../components/kit";
import { COLOR, DISPLAY, EASE, b } from "../theme";

// SpeakMore 出场（第 24–33 拍）：砸下的那一拍从开场收成的点里炸出 SpeakMore，一圈朱砂的光漾开；
// 下面逐段出口号 "Speak it written. Select to translate."（官网英文版的首屏），中文副行"口述成文，划词即译"。
// 接着口号的后半句自己被划选：右⌥、回车，卡片弹出它的中文（App 划词的真实输出：选中即可翻译。）
// 最后镜头冲进这张卡片，下一段的终端从远处迎上来。
const START = 24;
const at = (n: number) => b(n - START);
export const REVEAL_FRAMES = b(10);

const FIRST = "Speak it written. ";
/** 口头禅：先浮起来、散掉，字母再聚拢成句（位置相对"Speak it written."的左上角） */
const FILLERS = [
  { text: "um,", x: -40, y: -90 },
  { text: "uh…", x: 260, y: -120 },
  { text: "like,", x: 420, y: 70 },
  { text: "嗯，", x: 120, y: 90 },
  { text: "so, you know", x: -260, y: 40 },
  { text: "那个…", x: 560, y: -60 },
];
const PICK = [..."Select to translate."];

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  // 推穿：冲着卡片推过去（卡片大约在画面中间偏下）
  const push = prog(frame, at(31.5), b(1.5), easeIn);
  const ring = prog(frame, 0, 40, EASE.outQuint);
  const picked = Math.round(prog(frame, at(28), b(1.3), EASE.inOut) * PICK.length);
  const beam = prog(frame, at(27.7), 6) * (1 - prog(frame, at(30), 6));

  return (
    <AbsoluteFill
      style={{
        transformOrigin: "1160px 800px",
        transform: `scale(${1 + 12 * push * push})`,
        opacity: 1 - prog(frame, at(32.4), 10),
        filter: push > 0 ? `blur(${push * 16}px)` : undefined,
      }}
    >
      {/* 一圈朱砂的光从中心漾开 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", boxShadow: `0 0 0 3px ${COLOR.cinnabar}, 0 0 60px ${COLOR.cinnabar}`, opacity: 0.6 * (1 - ring), transform: `scale(${0.2 + 5 * ring})` }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* SpeakMore：每个字母从中心那一点飞到自己的位置 */}
        <div style={{ display: "flex", fontFamily: DISPLAY, fontSize: 196, fontWeight: 650, letterSpacing: "-0.035em", color: COLOR.ink, transform: `translateY(-40px) scale(${punch(frame, 0, 0.04, 24)})` }}>
          {[..."SpeakMore"].map((ch, i) => {
            const t = prog(frame, i * 0.6, 22, EASE.outExpo);
            const dx = (4 - i) * 105; // 从中心出发：越靠两边飞得越远
            return (
              <span
                key={`${ch}-${i}`}
                style={{
                  display: "inline-block",
                  opacity: Math.min(1, t * 3),
                  transform: `translate(${dx * (1 - t)}px, ${(random(`ry-${i}`) - 0.5) * 120 * (1 - t)}px) scale(${0.3 + 0.7 * t}) rotate(${(random(`rr-${i}`) - 0.5) * 50 * (1 - t)}deg)`,
                  filter: t < 1 ? `blur(${12 * (1 - t)}px)` : undefined,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* 口号：前半句、后半句；后半句一个字母一个字母地被划选，卡片挂在后半句下面 */}
        <div style={{ display: "flex", marginTop: 8, fontFamily: DISPLAY, fontSize: 58, fontWeight: 500, letterSpacing: "-0.015em", color: COLOR.ink2 }}>
          {/* 口述成文：一堆口头禅浮起来散掉，字母从四处聚拢成"Speak it written." */}
          <span style={{ position: "relative", display: "inline-block" }}>
            {FILLERS.map((f, i) => {
              const t = frame - at(25.4) - i * 2;
              if (t < 0 || t > 40) return null;
              const a = Math.min(1, t / 6) * (1 - Math.max(0, (t - 16) / 24));
              return (
                <span key={f.text} style={{ position: "absolute", left: f.x, top: f.y, whiteSpace: "pre", fontSize: 40, color: COLOR.faint, opacity: a, transform: `translateY(${-t * 0.8}px) scale(${1 + Math.max(0, t - 16) * 0.02})`, filter: `blur(${Math.max(0, t - 14) * 0.4}px)` }}>
                  {f.text}
                </span>
              );
            })}
            <Assemble value={FIRST} at={at(26)} frames={24} spread={420} seed="speak" size={58} weight={500} color={COLOR.ink2} style={{ letterSpacing: "-0.015em" }} />
          </span>
          <span style={{ position: "relative", display: "inline-flex", color: COLOR.ink, ...rise(frame, at(27)) }}>
            {PICK.map((ch, i) => (
              <span key={`${ch}-${i}`} style={{ position: "relative", whiteSpace: "pre", background: i < picked ? "oklch(0.62 0.13 255 / 0.32)" : undefined }}>
                {ch}
                {beam > 0 && i === Math.max(0, picked - 1) ? (
                  <span style={{ position: "absolute", left: picked === 0 ? 0 : "100%", top: "50%" }}>
                    <IBeam x={0} y={0} opacity={beam} />
                  </span>
                ) : null}
              </span>
            ))}
            <div style={{ position: "absolute", left: 0, top: "100%", marginTop: 76 }}>
              <LookupCard at={at(30)} textAt={at(30) + 14} language="简体中文" text="选中即可翻译。" />
            </div>
          </span>
        </div>
        <Sub text="口述成文，划词即译" at={at(27.5)} size={34} />
      </AbsoluteFill>

      <Keycaps
        inAt={at(27.5)}
        outAt={at(31.2)}
        caps={[
          { label: "右 ⌥", presses: [[at(29.5), at(30.8)]] },
          { label: "回车", presses: [[at(30), at(30.8)]] },
        ]}
      />
    </AbsoluteFill>
  );
};
