import { AbsoluteFill, interpolate, random } from "remotion";
import { clamp } from "../../../engine/motion";
import { H, type Palette, W } from "../theme";
import type { Cam } from "./stage";

// 影棚式的浅色底：上浅下略深的一整幅「无缝背景纸」+ 设备身后一团柔光 + 两块很淡的品牌形状
// （Snug 图标里的显示器和手机，圆角矩形）+ 一层细颗粒 + 很淡的暗角。
// 品牌形状和柔光跟着镜头做视差（移动幅度只有设备的三成），镜头一推一摇，底子才有前后层次，不像铺了一张纯色。

// 细颗粒：SVG 噪声做成可平铺的小图，每帧换一个偏移，像胶片的颗粒在动
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.12  0 0 0 0 0.18  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}")`;

const Layer: React.FC<{ pal: Palette; frame: number; cam: Cam }> = ({ pal, frame, cam }) => {
  const t = frame / 60;
  // 视差：镜头往哪推，背景跟着走三成
  const px = -(cam.x - W / 2) * 0.3;
  const py = -(cam.y - H / 2) * 0.3;
  const pz = 1 + (cam.z - 1) * 0.3;
  const drift = (a: number, b: number) => Math.sin(t * a + b) * 22;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.top} 0%, ${pal.mid} 52%, ${pal.floor} 100%)` }}>
      <AbsoluteFill style={{ transform: `translate(${px}px, ${py}px) scale(${pz})`, transformOrigin: "50% 50%" }}>
        {/* 设备身后的一团柔光 */}
        <div
          style={{
            position: "absolute",
            left: W / 2 - 760,
            top: H * 0.44 - 760,
            width: 1520,
            height: 1520,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${pal.glow} 0%, ${pal.glow}cc 35%, ${pal.glow}00 100%)`,
          }}
        />
        {/* 品牌形状：大的圆角「显示器」斜在左上，竖的圆角「手机」斜在右下，都只比底色深一点点 */}
        <div
          style={{
            position: "absolute",
            left: -260 + drift(0.21, 0),
            top: 120 + drift(0.17, 1),
            width: 900,
            height: 560,
            borderRadius: 80,
            background: `linear-gradient(140deg, ${pal.shape}66 0%, ${pal.shape}00 75%)`,
            transform: "rotate(-9deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 720 + drift(0.19, 2),
            top: 1120 + drift(0.23, 3),
            width: 420,
            height: 820,
            borderRadius: 96,
            background: `linear-gradient(200deg, ${pal.shape}70 0%, ${pal.shape}00 80%)`,
            transform: "rotate(8deg)",
          }}
        />
      </AbsoluteFill>
      {/* 暗角 */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 46%, rgba(20,28,52,0) 60%, rgba(20,28,52,0.07) 100%)" }} />
      {/* 颗粒 */}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN,
          backgroundPosition: `${Math.floor(random(`gx${frame}`) * 220)}px ${Math.floor(random(`gy${frame}`) * 220)}px`,
          opacity: 0.07,
          mixBlendMode: "multiply",
        }}
      />
    </AbsoluteFill>
  );
};

/** keys：[片子里的帧, 这一段的底]；到下一个关键帧前 20 帧开始交叉淡入 */
export const Backdrop: React.FC<{ frame: number; cam: Cam; keys: readonly (readonly [number, Palette])[] }> = ({ frame, cam, keys }) => {
  let i = 0;
  while (i + 1 < keys.length && frame >= keys[i + 1][0] - 20) i++;
  const [f, pal] = keys[i];
  const prev = i > 0 ? keys[i - 1] : null;
  const fade = prev ? interpolate(frame, [f - 20, f + 10], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill>
      {prev && fade < 1 ? <Layer pal={prev[1]} frame={frame} cam={cam} /> : null}
      <AbsoluteFill style={{ opacity: fade }}>
        <Layer pal={pal} frame={frame} cam={cam} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
