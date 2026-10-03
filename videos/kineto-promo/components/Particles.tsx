import { random } from "remotion";

// 方块粒子爆发：落地扬尘、火花、彩纸都用它。t = frame - start，粒子按初速度 + 重力飞行并淡出。
export const Burst: React.FC<{
  frame: number;
  start: number;
  x: number;
  y: number;
  count?: number;
  seed: string;
  colors: readonly string[];
  speed?: [number, number];
  angle?: [number, number];
  gravity?: number;
  life?: number;
  size?: [number, number];
}> = ({ frame, start, x, y, count = 12, seed, colors, speed = [4, 12], angle = [-180, 0], gravity = 0.5, life = 40, size = [8, 16] }) => {
  const t = frame - start;
  if (t < 0 || t > life) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = ((angle[0] + (angle[1] - angle[0]) * r("a")) * Math.PI) / 180;
        const v = speed[0] + (speed[1] - speed[0]) * r("v");
        const lifeI = life * (0.6 + 0.4 * r("l"));
        if (t > lifeI) return null;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 0.5 * gravity * t * t;
        const s = Math.round((size[0] + (size[1] - size[0]) * r("s")) * (1 - (t / lifeI) * 0.6));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - s / 2,
              top: py - s / 2,
              width: s,
              height: s,
              backgroundColor: colors[Math.floor(r("c") * colors.length)],
              opacity: 1 - (t / lifeI) ** 2,
            }}
          />
        );
      })}
    </>
  );
};

// 十字形闪光：放大再收缩
export const Twinkle: React.FC<{ x: number; y: number; frame: number; start: number; life?: number; size?: number; color?: string }> = ({
  x,
  y,
  frame,
  start,
  life = 24,
  size = 10,
  color = "white",
}) => {
  const t = frame - start;
  if (t < 0 || t > life) return null;
  const k = Math.sin((t / life) * Math.PI);
  const arm = Math.round(size * (1 + 2 * k));
  const s = size;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: k }}>
      <div style={{ position: "absolute", left: -s / 2, top: -arm, width: s, height: arm * 2, backgroundColor: color }} />
      <div style={{ position: "absolute", left: -arm, top: -s / 2, width: arm * 2, height: s, backgroundColor: color }} />
    </div>
  );
};

// 冲击波：一圈方框向外扩散
export const Shockwave: React.FC<{ x: number; y: number; frame: number; start: number; life?: number; maxSize?: number; color?: string; thickness?: number }> = ({
  x,
  y,
  frame,
  start,
  life = 24,
  maxSize = 900,
  color = "white",
  thickness = 16,
}) => {
  const t = frame - start;
  if (t < 0 || t > life) return null;
  const p = 1 - (1 - t / life) ** 3;
  const size = maxSize * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${Math.max(2, thickness * (1 - t / life))}px solid ${color}`,
        opacity: 1 - t / life,
      }}
    />
  );
};
