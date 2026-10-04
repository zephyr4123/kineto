import { Easing, useCurrentFrame } from "remotion";
import { tween } from "../../../engine/motion";
import { CAPTION_Y, INK, MARGIN, MUTED, SERIF, W } from "../theme";

// 扉页：照片先在纸上浮现，书名落在字幕的位置上，旁白开口前淡出。duration 是扉页停留的帧数
export const Title: React.FC<{ readonly duration: number }> = ({
  duration,
}) => {
  const f = useCurrentFrame();
  const enter = tween(f, [8, 32], [0, 1], Easing.out(Easing.cubic));
  const leave = tween(f, [duration - 14, duration], [1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGIN,
        top: CAPTION_Y - 6,
        width: W - 2 * MARGIN,
        fontFamily: SERIF,
        opacity: enter * leave,
      }}
    >
      <div
        style={{
          fontSize: 66,
          fontWeight: 600,
          color: INK,
          letterSpacing: "0.14em",
          translate: `0px ${(1 - enter) * 10}px`,
        }}
      >
        一杯咖啡的一生
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 30,
          color: MUTED,
          letterSpacing: "0.3em",
        }}
      >
        从枝头，到杯中
      </div>
    </div>
  );
};
