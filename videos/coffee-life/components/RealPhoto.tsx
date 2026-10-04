import { Img, interpolate, staticFile } from "remotion";

// 虚实对照里的「实」：一张真实照片放在插画旁边（或底下），证明「它真的长这样」。
// - 边缘出血：四周用渐变遮罩渐隐，融进背景，没有硬边；oval 是椭圆形渐隐，soft 是圆角矩形渐隐
// - 出现像对焦：由虚到实、轻微放大回落；整段可见时间里慢慢推近
// - 调色与画册统一：略降饱和、偏暖
// 只用物、不用人：选图时人和手都不能入画
export const RealPhoto: React.FC<{
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  // 可见程度 0~1（出现与退场都由调用方按旁白卡点算好）
  readonly p: number;
  // 慢推的进度 0~1
  readonly drift?: number;
  readonly focus?: readonly [number, number];
  // 放大裁切：只取 focus 周围的主体，把不要的部分（深色墙、房间的边角）挤出画面
  readonly zoom?: number;
  readonly shape?: "soft" | "oval";
  // soft 形状四边渐隐带的宽度（占边长的比例）
  readonly feather?: number;
}> = ({
  src,
  x,
  y,
  w,
  h,
  p,
  drift = 0,
  focus = [0.5, 0.5],
  zoom = 1,
  shape = "soft",
  feather = 0.2,
}) => {
  if (p <= 0) return null;
  const edge = `${feather * 100}%`;
  const far = `${100 - feather * 100}%`;
  const mask =
    shape === "oval"
      ? "radial-gradient(ellipse 50% 50% at 50% 50%, #000 52%, transparent 100%)"
      : `linear-gradient(to right, transparent 0%, #000 ${edge}, #000 ${far}, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 ${edge}, #000 ${far}, transparent 100%)`;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: p,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
          transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          scale: String(
            zoom * interpolate(p, [0, 1], [1.06, 1]) * (1 + 0.05 * drift),
          ),
          filter: `blur(${(1 - p) * 10}px) saturate(0.88) contrast(0.96) sepia(0.08)`,
        }}
      />
    </div>
  );
};
