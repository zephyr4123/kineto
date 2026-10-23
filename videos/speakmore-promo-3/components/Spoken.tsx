import { useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "../../../engine/motion";
import { COLOR, DISPLAY, SANS } from "../theme";
import { TalkBar } from "./TalkBar";
import { rise } from "./kit";

// 语音翻译时画面右边那一栏：上面 "Spoken" 和说出来的那句中文（说的时候一个字一个字出现，整理时口头禅淡下去），下面是带语言胶囊的悬浮条。
// 时间都是场景里的帧：at 出现；speak 起说、stop 再按一次热键（悬浮条转整理）；done 打勾；land 译文落下、这一栏往左淡出。
export type SaidPart = { text: string; cut?: boolean };

export const Spoken: React.FC<{
  parts: readonly SaidPart[];
  chip: string;
  at: number;
  speak: number;
  stop: number;
  done: number;
  land: number;
  x?: number;
  y?: number;
}> = ({ parts, chip, at, speak, stop, done, land, x = 1150, y = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = parts.reduce((n, p) => n + p.text.length, 0);
  let shown = Math.round(prog(frame, speak, stop - speak - 6, (t) => t) * total);
  const talking = frame >= speak && frame < stop;
  const level = talking ? 0.55 + 0.35 * Math.abs(Math.sin(frame / 5.3)) * (0.6 + 0.4 * Math.sin(frame / 13)) : 0;
  const out = prog(frame, land - 4, 14);
  if (frame < at || out >= 1) return null;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: 620, opacity: 1 - out, transform: `translateX(${-120 * out}px)`, filter: out > 0 ? `blur(${6 * out}px)` : undefined }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, ...rise(frame, at) }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 600, color: COLOR.ink }}>Spoken</span>
        </div>
        <p style={{ margin: "22px 0 0", fontFamily: SANS, fontSize: 46, lineHeight: 1.5, fontWeight: 500, color: COLOR.ink }}>
          {parts.map((part) => {
            const visible = part.text.slice(0, Math.max(0, shown));
            shown -= part.text.length;
            const cut = part.cut ? prog(frame, stop + 30, 20) : 0;
            return (
              <span key={part.text} style={{ color: part.cut ? COLOR.ink2 : undefined, opacity: 1 - 0.75 * cut, filter: cut > 0 ? `blur(${1.5 * cut}px)` : undefined }}>
                {visible}
              </span>
            );
          })}
          {talking ? <span style={{ display: "inline-block", width: 3, height: 44, marginLeft: 4, verticalAlign: "-8px", background: COLOR.cinnabar, opacity: Math.floor(frame / 15) % 2 ? 0.3 : 1 }} /> : null}
        </p>
      </div>
      <div style={{ position: "absolute", left: x, width: 620, top: y + 400, display: "flex", justifyContent: "center", opacity: 1 - out }}>
        <TalkBar frame={frame} fps={fps} at={at + 4} out={land} chip={chip} level={level} timing={{ press: stop, finishing: stop + 4, done }} />
      </div>
    </>
  );
};
