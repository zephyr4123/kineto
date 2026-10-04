import { chromaticAberration } from "@remotion/effects/chromatic-aberration";
import { duotone } from "@remotion/effects/duotone";
import { zoomBlur } from "@remotion/effects/zoom-blur";
import { AbsoluteFill, CanvasImage, Easing, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { tween } from "../../../engine/motion";

type Range = readonly [number, number];

// 一个照片镜头：照片从不静止。
// - 运镜（Ken Burns）：整段时长里 scale / x / y 从起点缓到终点
// - 冲击推镜（punch）：切进来的瞬间放大一截再弹回，配合鼓点
// - 入场的缩放模糊和色差：切点那几帧最强，随后衰减，「砸」进画面的感觉
// - 出场的缩放穿越（exitZoom）：最后几帧猛推进，接下一个镜头的入场模糊，两张照片像一镜冲过去
export type ShotProps = {
  readonly src: string;
  readonly duration: number;
  readonly scale?: Range;
  readonly x?: Range;
  readonly y?: Range;
  readonly rotate?: Range;
  readonly punch?: number;
  readonly zoomIn?: number;
  readonly aberration?: number;
  readonly exitZoom?: boolean;
  readonly blurCenter?: readonly [number, number];
  readonly duotone?: readonly [string, string];
  // CSS 调色：统一几十张来源各异的照片的色调
  readonly grade?: string;
};

const WARM = "contrast(1.12) saturate(1.12) sepia(0.12) brightness(0.98)";
const EXIT_FRAMES = 4;

export const Shot: React.FC<ShotProps> = ({
  src,
  duration,
  scale = [1.08, 1.18],
  x = [0, 0],
  y = [0, 0],
  rotate = [0, 0],
  punch = 0.12,
  zoomIn = 40,
  aberration = 14,
  exitZoom = false,
  blurCenter = [0.5, 0.5],
  duotone: tones,
  grade = WARM,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = Easing.out(Easing.quad);
  const kick = 1 + punch * (1 - tween(f, [0, 7], [0, 1], Easing.out(Easing.cubic)));
  const exit = exitZoom ? tween(f, [duration - EXIT_FRAMES, duration], [0, 1], Easing.in(Easing.cubic)) : 0;
  const s = tween(f, [0, duration], scale, drift) * kick * (1 + exit * 0.9);
  const blur = Math.max(zoomIn * (1 - tween(f, [0, 5], [0, 1], Easing.out(Easing.quad))), exit * 90);
  const split = aberration * (1 - tween(f, [0, 6], [0, 1], Easing.out(Easing.quad))) + exit * 30;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          scale: String(s),
          translate: `${tween(f, [0, duration], x, drift)}px ${tween(f, [0, duration], y, drift)}px`,
          rotate: `${tween(f, [0, duration], rotate, drift)}deg`,
        }}
      >
        <CanvasImage
          src={staticFile(src)}
          fit="cover"
          width={width}
          height={height}
          style={{ filter: grade }}
          effects={[
            duotone({ darkColor: tones?.[0], lightColor: tones?.[1], disabled: tones === undefined }),
            zoomBlur({ amount: blur, center: blurCenter, disabled: blur < 0.5 }),
            chromaticAberration({ amount: split, disabled: split < 0.5 }),
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
