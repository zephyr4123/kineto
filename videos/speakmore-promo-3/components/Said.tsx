import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "../../../engine/motion";
import { COLOR, EASE, SANS } from "../theme";
import { TalkBar } from "./TalkBar";

// 语音输入时说出来的那句话（画面上方一行）和屏幕底部的悬浮条：
// 说的时候逐字出现，语气词、改口是浅灰；再按一次热键，浅灰的几段炸成碎字四散、空隙合拢，剩下的正好是 App 整理出的成品；
// 随后这一行往下沉、虚掉，成品出现在窗口的输入框里（由场景画）。
// cut 的段只能是全角字（汉字和中文标点），合拢时按一个字一个 em 收宽度。

export type SaidPart = { text: string; cut?: boolean };

export const Said: React.FC<{
  parts: readonly SaidPart[];
  /** 悬浮条浮起 */
  at: number;
  /** 开始说、再按一次热键（停）、碎字炸开、这一行沉下去交给输入框 */
  speak: number;
  stop: number;
  burst: number;
  land: number;
  size?: number;
  y?: number;
  seed: string;
}> = ({ parts, at, speak, stop, burst, land, size = 46, y = -330, seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = parts.reduce((n, p) => n + [...p.text].length, 0);
  let shown = Math.round(prog(frame, speak, stop - speak - 4, (t) => t) * total);
  const talking = frame >= speak && frame < stop;
  const level = talking ? 0.55 + 0.35 * Math.abs(Math.sin(frame / 5.3)) * (0.6 + 0.4 * Math.sin(frame / 13)) : 0;
  const e = prog(frame, burst, 26, EASE.outExpo);
  const sink = prog(frame, land, 14, EASE.inOut);
  return (
    <>
      {frame >= speak && sink < 1 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <p
            style={{
              margin: 0,
              transform: `translateY(${y + 70 * sink}px)`,
              opacity: 1 - sink,
              filter: sink > 0 ? `blur(${8 * sink}px)` : undefined,
              fontFamily: SANS,
              fontSize: size,
              lineHeight: 1.4,
              fontWeight: 500,
              color: COLOR.ink,
              whiteSpace: "nowrap",
              textShadow: `0 0 24px ${COLOR.paper}, 0 0 48px ${COLOR.paper}`,
            }}
          >
            {parts.map((part, pi) => {
              const chars = [...part.text];
              const visible = chars.slice(0, Math.max(0, shown));
              shown -= chars.length;
              if (!part.cut) return <span key={`${pi}-${part.text}`}>{visible.join("")}</span>;
              // 浅灰的这段：合拢时整段的宽度收到 0（负的右外边距），字各自往外飞散
              return (
                <span key={`${pi}-${part.text}`} style={{ display: "inline-block", marginRight: `${-visible.length * e}em`, color: COLOR.faint }}>
                  {visible.map((ch, i) => {
                    const ang = random(`${seed}-a-${pi}-${i}`) * Math.PI * 2;
                    const dist = 80 + random(`${seed}-d-${pi}-${i}`) * 160;
                    return (
                      <span
                        key={`${i}-${ch}`}
                        style={{
                          display: "inline-block",
                          opacity: 1 - e,
                          transform: `translate(${Math.cos(ang) * dist * e}px, ${Math.sin(ang) * dist * e - 40 * e}px) rotate(${(random(`${seed}-r-${pi}-${i}`) - 0.5) * 140 * e}deg) scale(${1 - 0.5 * e})`,
                          filter: e > 0 ? `blur(${5 * e}px)` : undefined,
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              );
            })}
            {talking ? <span style={{ display: "inline-block", width: 3, height: size * 0.95, marginLeft: 4, verticalAlign: `-${size * 0.16}px`, background: COLOR.cinnabar, opacity: Math.floor(frame / 15) % 2 ? 0.3 : 1 }} /> : null}
          </p>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 70, pointerEvents: "none" }}>
        <TalkBar frame={frame} fps={fps} at={at} out={land + 6} level={level} timing={{ press: stop, finishing: stop + 4, done: burst - 4 }} />
      </AbsoluteFill>
    </>
  );
};
