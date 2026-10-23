import { useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { COLOR, SANS } from "../theme";

// 暗场里的三项功能和它们的热键（暗场那三行、封面都用）：每项一种霓虹色，键帽是深色的、描一圈这种颜色的光。

export const TRIO = [
  { keys: ["右 ⌥"], name: "Voice input", zh: "语音输入", color: COLOR.neonCinnabar },
  { keys: ["右 ⌥", "空格"], name: "Voice translation", zh: "语音翻译", color: COLOR.neonIndigo },
  { keys: ["右 ⌥", "回车"], name: "Selection translation", zh: "划词翻译", color: COLOR.ochre },
] as const;

/** 霓虹键帽：press 帧按下（往下一沉）、光亮起来；不给 press 就一直亮着（封面） */
export const NeonKey: React.FC<{ label: string; color: string; press?: number; size?: number }> = ({ label, color, press, size = 96 }) => {
  const frame = useCurrentFrame();
  const t = press === undefined ? Number.POSITIVE_INFINITY : frame - press;
  const down = t >= 0 && t < 10 ? Math.sin((t / 10) * Math.PI) : 0;
  const lit = press === undefined ? 1 : prog(frame, press, 8);
  const k = size / 96;
  return (
    <span
      style={{
        height: size,
        minWidth: size,
        padding: `0 ${30 * k}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24 * k,
        background: "oklch(0.2 0.03 275)",
        color: COLOR.nightInk,
        fontFamily: SANS,
        fontSize: 36 * k,
        fontWeight: 500,
        transform: `translateY(${6 * k * down}px)`,
        boxShadow: `0 0 0 ${1.5 * k}px color-mix(in oklab, ${color} ${30 + 70 * lit}%, transparent), 0 0 ${(10 + 40 * lit * (1 - down * 0.3)) * k}px color-mix(in oklab, ${color} ${50 * lit}%, transparent), 0 ${(8 - 6 * down) * k}px 0 oklch(0.12 0.02 275)`,
      }}
    >
      {label}
    </span>
  );
};
