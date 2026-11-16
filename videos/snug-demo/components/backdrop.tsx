import { AbsoluteFill, interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { type Palette, SF } from "../theme";

// 浅色的底：一层淡彩渐变 + 三团慢慢漂的柔光 + 一层很淡的点阵 + 背景里一行超大的描边字（每段不同），
// 让底有层次又不抢画面。换段时两层底交叉淡入淡出。

const Layer: React.FC<{ pal: Palette; frame: number; word?: string; tilt?: number }> = ({ pal, frame, word, tilt = -8 }) => {
  const t = frame / 60;
  const blob = (cx: number, cy: number, r: number, color: string, phase: number) => {
    const x = cx + Math.sin(t * 0.35 + phase) * 60;
    const y = cy + Math.cos(t * 0.28 + phase * 1.3) * 50;
    return `radial-gradient(circle ${r}px at ${x}px ${y}px, ${color} 0%, ${color}00 100%)`;
  };
  return (
    <AbsoluteFill
      style={{
        background: [
          blob(160, 260, 620, pal.glow, 0),
          blob(940, 980, 700, pal.glow2, 2.1),
          blob(300, 1700, 560, pal.glow, 4.2),
          `linear-gradient(165deg, ${pal.a} 0%, ${pal.b} 55%, ${pal.a} 100%)`,
        ].join(", "),
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(16,24,40,0.07) 1.6px, transparent 1.6px)",
          backgroundSize: "34px 34px",
          backgroundPosition: `${(t * 6) % 34}px ${(t * 4) % 34}px`,
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 45%, #000 30%, transparent 100%)",
        }}
      />
      {word ? (
        <div
          style={{
            position: "absolute",
            left: -40,
            right: -40,
            top: 760,
            textAlign: "center",
            fontFamily: SF,
            fontWeight: 900,
            fontSize: 420,
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "2.5px rgba(16,24,40,0.06)",
            transform: `rotate(${tilt}deg) translateX(${-t * 14}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {word}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** keys：[片子里的帧, 这一段的底, 背景大字]；到下一个关键帧前 18 帧开始交叉淡入 */
export const Backdrop: React.FC<{ frame: number; keys: readonly (readonly [number, Palette, string?])[] }> = ({ frame, keys }) => {
  let i = 0;
  while (i + 1 < keys.length && frame >= keys[i + 1][0] - 18) i++;
  const [f, pal, word] = keys[i];
  const prev = i > 0 ? keys[i - 1] : null;
  const fade = prev ? interpolate(frame, [f - 18, f + 6], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill>
      {prev && fade < 1 ? <Layer pal={prev[1]} frame={frame} word={prev[2]} /> : null}
      <AbsoluteFill style={{ opacity: fade }}>
        <Layer pal={pal} frame={frame} word={word} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
