import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Cap } from "./Keycaps";
import { rise } from "./kit";
import { COLOR, DISPLAY, EASE, SANS } from "../theme";

// 每项功能的开场卡，三项一个样子（三项平级）：中间一组大键帽，按下的那一拍功能名由虚到实落下，中文名在下面一行。
// 退场时镜头冲着键帽推穿过去（参考片 8.53 秒那一下：字在几帧里放大十几倍、带运动模糊），下一段从推穿里迎上来。

const KEY = 132;

export const Chapter: React.FC<{ keys: readonly string[]; name: string; zh: string; at: number; press: number; out: number }> = ({ keys, name, zh, at, press, out }) => {
  const frame = useCurrentFrame();
  const named = prog(frame, press, 22, EASE.outExpo);
  const push = prog(frame, out, 16, easeIn);
  if (push >= 1) return null;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transformOrigin: "960px 440px",
        transform: `scale(${1 + 11 * push * push})`,
        opacity: 1 - prog(frame, out + 8, 8),
        filter: push > 0 ? `blur(${18 * push}px)` : undefined,
      }}
    >
      <div style={{ display: "flex", gap: 26, transform: "translateY(-40px)", ...rise(frame, at, undefined, 40, 20) }}>
        {keys.map((label) => (
          <Cap key={label} size={KEY} cap={{ label, presses: [[press, press + 14]] }} />
        ))}
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: DISPLAY,
          fontSize: 112,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: COLOR.ink,
          opacity: Math.min(1, named * 2),
          transform: `scale(${1.4 - 0.4 * named})`,
          filter: named < 1 ? `blur(${18 * (1 - named)}px)` : undefined,
        }}
      >
        {name}
      </div>
      <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 34, letterSpacing: "0.3em", color: COLOR.ink2, ...rise(frame, press + 8, undefined, 12) }}>{zh}</div>
    </AbsoluteFill>
  );
};
