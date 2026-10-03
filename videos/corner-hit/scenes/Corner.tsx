import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { assets } from "../assets.gen";
import { Badge } from "../components/Badge";
import { Confetti } from "../components/Confetti";
import { BADGE, FINAL_POSITION } from "../physics";
import { BACKGROUND, fontFamily, GOLD } from "../theme";

export const Corner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND, fontFamily, color: "white" }}>
      {/* 接住 Bounce 结尾的推镜，再弹回全景 */}
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, 0.7 * fps], [1.12, 1], { ...clamp, easing: Easing.spring({ damping: 14 }) }),
          transformOrigin: "100% 100%",
        }}
      >
        <Badge
          x={FINAL_POSITION.x}
          y={FINAL_POSITION.y}
          color={GOLD}
          scale={interpolate(frame, [0, 0.5 * fps], [1.25, 1], { ...clamp, easing: Easing.spring({ damping: 6 }) })}
        />
        <Confetti originX={FINAL_POSITION.x + BADGE.width} originY={FINAL_POSITION.y + BADGE.height} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 28, paddingBottom: 160 }}>
        <div
          style={{
            fontSize: 220,
            color: GOLD,
            scale: interpolate(frame, [0, 0.6 * fps], [0, 1], { ...clamp, easing: Easing.spring({ damping: 9 }) }),
          }}
        >
          撞到了！！！
        </div>
        <div style={{ fontSize: 60, opacity: interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], clamp) }}>
          人类等了二十年，你只等了 8 秒
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{ backgroundColor: "white", opacity: interpolate(frame, [0, 8], [0.85, 0], clamp) }}
      />
      <Audio src={staticFile(assets.fanfare)} />
    </AbsoluteFill>
  );
};
