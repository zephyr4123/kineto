import { Bar, type BarTiming } from "../../../engine/speakmore/Bar";
import { prog } from "../../../engine/motion";
import { SANS } from "../theme";

// 说话时的悬浮条：语音翻译时上面一枚小胶囊写着这次译成哪种语言（同 App 的 bar-ui.mjs 的 drawChip），语音输入时没有胶囊；下面是几支片子共用的悬浮条。
// 时间都是场景里的帧：at 浮起、out 沉下去；timing 交给悬浮条（完成键按下、整理中、打勾）。
const SURFACE = "oklch(0.17 0.008 32)";
const EDGE = "oklch(0.34 0.012 32)";

export const TalkBar: React.FC<{ frame: number; fps: number; at: number; out: number; chip?: string; level: number; timing: BarTiming }> = ({ frame, fps, at, out, chip, level, timing }) => {
  const a = prog(frame, at, 16);
  const z = prog(frame, out, 14);
  if (a <= 0 || z >= 1) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: a * (1 - z), transform: `translateY(${30 * (1 - a) + 20 * z}px) scale(${0.9 + 0.1 * a})` }}>
      {chip ? (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 999, background: SURFACE, boxShadow: `0 0 0 2px ${EDGE}`, color: "oklch(0.97 0.004 32)", fontFamily: SANS, fontSize: 22, fontWeight: 600 }}>
        {chip}
        <svg width={16} height={16} viewBox="0 0 10 10" fill="none" style={{ opacity: 0.7 }}>
          <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      </div>
      ) : null}
      <Bar frame={frame} fps={fps} level={level} timing={timing} />
    </div>
  );
};
