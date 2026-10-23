import { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";

// 封面上那一圈粒子：片子开场那道漩涡定格在暗场里——一个斜着压扁的环，绕着品牌字转，
// 每颗粒子沿着环的切线拖出一小段光（转动的方向），靠近镜头的下半圈大、亮，远处的上半圈小、暗。
// 颜色取片子里粒子在漩涡里的那几种，换成暗底上的亮色。（片子里那种离镜头很近的大虚粒子，定格以后像污点，封面不画。）

const HUES = [
  [130, 146, 236], // 亮靛
  [236, 122, 92], // 朱砂
  [228, 172, 84], // 赭黄
  [176, 152, 232], // 淡紫
  [86, 108, 190], // 深靛
  [236, 238, 250], // 近白
] as const;
const WEIGHTS = [0.3, 0.2, 0.14, 0.14, 0.12, 0.1];

const pick = (u: number) => {
  let acc = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i];
    if (u < acc) return HUES[i];
  }
  return HUES[0];
};
const rgba = (c: readonly number[], a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a.toFixed(3)})`;

export type Ring = {
  /** 环心、横竖两个半轴、斜多少度 */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tilt: number;
  /** 多少颗 */
  count: number;
};

export const Vortex: React.FC<{ width: number; height: number; ring: Ring; seed: string }> = ({ width, height, ring, seed }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const particles = useMemo(
    () =>
      Array.from({ length: ring.count }, (_, i) => {
        const u = (k: string) => random(`${seed}-${k}-${i}`);
        // 环的厚薄：大多数贴着环，少数散在里外
        const spread = u("s") < 0.85 ? (u("r") - 0.5) * 0.28 : (u("r") - 0.5) * 0.9;
        return {
          a: u("a") * Math.PI * 2,
          r: 1 + spread,
          len: 8 + u("l") ** 2 * 75,
          size: 2.2 + u("w") ** 1.6 * 7,
          hue: pick(u("h")),
          square: u("q") < 0.4,
        };
      }),
    [ring.count, seed],
  );

  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) throw new Error("Vortex: 取不到 2d canvas");
    ctx.clearRect(0, 0, width, height);
    const cos = Math.cos((ring.tilt * Math.PI) / 180);
    const sin = Math.sin((ring.tilt * Math.PI) / 180);
    const place = (a: number, r: number) => {
      const ex = ring.rx * r * Math.cos(a);
      const ey = ring.ry * r * Math.sin(a);
      return { x: ring.cx + ex * cos - ey * sin, y: ring.cy + ex * sin + ey * cos };
    };
    // 远的先画、近的后画
    const order = [...particles].sort((p, q) => Math.sin(p.a) - Math.sin(q.a));
    for (const p of order) {
      // 0 是环的最远处（上沿），1 是最近处（下沿）
      const depth = (Math.sin(p.a) + 1) / 2;
      const scale = (0.45 + 0.95 * depth) * (0.8 + 0.4 * p.r);
      const alpha = 0.2 + 0.7 * depth ** 1.3;
      // 沿切线往后拖一段：越近越长
      const da = (p.len * scale) / (ring.rx * p.r);
      const head = place(p.a, p.r);
      const tail = place(p.a + da, p.r);
      ctx.strokeStyle = rgba(p.hue, alpha);
      ctx.lineWidth = p.size * scale;
      ctx.lineCap = p.square ? "butt" : "round";
      ctx.shadowColor = rgba(p.hue, alpha * 0.8);
      ctx.shadowBlur = 10 * depth;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(head.x + 0.01, head.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }, [particles, ring, width, height]);

  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", inset: 0, width, height, pointerEvents: "none" }} />;
};
