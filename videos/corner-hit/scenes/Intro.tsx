import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BACKGROUND, fontFamily, GOLD } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        color: "white",
        gap: 36,
      }}
    >
      <div
        style={{
          fontSize: 48,
          color: GOLD,
          border: `3px solid ${GOLD}`,
          borderRadius: 999,
          padding: "8px 36px",
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        实验 #001
      </div>
      <div
        style={{
          fontSize: 132,
          translate: interpolate(frame, [0.2 * fps, 0.9 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
          }),
          opacity: interpolate(frame, [0.2 * fps, 0.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        它能正好撞进角落吗？
      </div>
      <div
        style={{
          fontSize: 56,
          color: "#9a9aab",
          opacity: interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        一个困扰了人类二十年的问题
      </div>
    </AbsoluteFill>
  );
};
