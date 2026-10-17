
// SpeakMore 的图标（两支 SpeakMore 宣传片共用）：一方靛青的印，刻着五道声波。形状照搬 SpeakMore 仓库的 assets/icon.svg（MIT），
// 用代码画是为了能分开动：五道先立起来，印底再落下，"一段声音落成一方印"。
// 五道两头斜切、左右不完全对称，是刀刻的样子，坐标别改。
export const SEAL_COLOR = { indigo: "#29486f", paper: "#f7f4ed", cinnabar: "#c7563c", ochre: "#d69d43" } as const;

const BARS = [
  { fill: SEAL_COLOR.paper, points: "197,469 271,437 271,644 197,611" },
  { fill: SEAL_COLOR.cinnabar, points: "329,348 398,315 411,354 411,701 395,743 329,712" },
  { fill: SEAL_COLOR.paper, points: "469,219 517,187 547,226 547,814 526,842 469,811" },
  { fill: SEAL_COLOR.ochre, points: "606,372 672,342 686,359 686,674 677,720 606,685" },
  { fill: SEAL_COLOR.paper, points: "745,439 820,469 820,609 745,641" },
] as const;

/**
 * bars：每一道立起来的进度（0–1），按从左到右的顺序；base：印底出现的进度（0–1）。
 * 印底从略大落到原大，像盖下去的那一下。
 */
export const Seal: React.FC<{ size: number; bars: readonly number[]; base: number }> = ({ size, bars, base }) => (
  <svg viewBox="100 100 824 824" width={size} height={size} style={{ overflow: "visible" }}>
    <rect
      x={100}
      y={100}
      width={824}
      height={824}
      rx={186}
      fill={SEAL_COLOR.indigo}
      style={{
        opacity: base,
        transformBox: "fill-box",
        transformOrigin: "center",
        transform: `scale(${1.08 - 0.08 * base})`,
      }}
    />
    {BARS.map((bar, i) => (
      <polygon
        key={i}
        fill={bar.fill}
        points={bar.points}
        style={{
          opacity: Math.min(1, bars[i] * 3),
          transformBox: "fill-box",
          transformOrigin: "center",
          transform: `scaleY(${bars[i]})`,
        }}
      />
    ))}
  </svg>
);
