import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { assets } from "../assets.gen";
import { Badge } from "../components/Badge";
import { badgePosition, BOUNCE_FRAMES, cornerDistance, HIT_FRAMES, wallHits } from "../physics";
import { BACKGROUND, fontFamily, PALETTE } from "../theme";

export const Bounce: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y } = badgePosition(frame);
  const hits = wallHits(frame);
  // 最后 2 秒镜头慢慢推向右下角，制造「要来了」的紧张感
  const tension = interpolate(frame, [BOUNCE_FRAMES - 2 * fps, BOUNCE_FRAMES - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND, fontFamily, color: "white" }}>
      <AbsoluteFill style={{ scale: 1 + 0.12 * tension * tension, transformOrigin: "100% 100%" }}>
        <Badge x={x} y={y} color={PALETTE[hits % PALETTE.length]!} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 80, top: 60, fontSize: 52 }}>撞墙 {hits} 次</div>
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 60,
          fontSize: 52,
          color: "#9a9aab",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        离角落 {Math.round(cornerDistance(frame))} px
      </div>
      <div
        style={{
          position: "absolute",
          width: "100%",
          bottom: 70,
          textAlign: "center",
          fontSize: 64,
          opacity: tension,
        }}
      >
        ……要来了……
      </div>
      {HIT_FRAMES.filter((f) => f < BOUNCE_FRAMES - 1).map((f) => (
        <Audio key={f} from={f} src={staticFile(assets.boop)} />
      ))}
    </AbsoluteFill>
  );
};
