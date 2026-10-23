import { useLayoutEffect, useMemo, useRef } from "react";
import { random, useCurrentFrame } from "remotion";
import { DISPLAY, H, W } from "../theme";

// 粒子化（照参考片 13.9–15.5 秒旧名字变新名字那一下，全片只用一次）：
// 一行字从左往右碎成几百颗粒子，被卷进一个压扁的漩涡越转越快；砸下的那一拍漩涡猛地涨开；
// 然后粒子按新字的笔画从左往右落定，拼成另一行字。字本身由场景画在 DOM 里（这里只画粒子），
// 粒子的起点、终点是把同样的字画到离屏 canvas 上取的像素，所以和 DOM 里的字对得上。

/** 一行居中的字：和场景里 DOM 的写法一一对应（字体 DISPLAY、行框中心在画面中心往下 y） */
export type TextLine = { text: string; size: number; weight: number; tracking: number; y?: number };

type Pt = { x: number; y: number };

/** 把一行字画到离屏 canvas 上，每 step 像素取一个有字的点；按 x 排好 */
const sample = (line: TextLine, step: number): Pt[] => {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Particles: 取不到 2d canvas，没法采样字形");
  ctx.font = `${line.weight} ${line.size}px ${DISPLAY}`;
  ctx.letterSpacing = `${line.tracking * line.size}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(line.text);
  // DOM 里行框居中：基线在中心往下 (ascent - descent) / 2
  const baseline = H / 2 + (line.y ?? 0) + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
  ctx.fillStyle = "#000";
  ctx.fillText(line.text, W / 2, baseline);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts: Pt[] = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 140) pts.push({ x, y });
    }
  }
  if (pts.length === 0) throw new Error(`Particles: "${line.text}" 采样不到任何点（字体没加载？）`);
  return pts.sort((a, b) => a.x - b.x);
};

// 粒子的颜色：起落时是字的墨色，在漩涡里换成印上的几种颜色（靛青、亮靛、朱砂、赭黄、淡紫）
const INK = [27, 33, 44];
const HUES = [
  [41, 72, 111],
  [96, 112, 214],
  [199, 86, 60],
  [214, 157, 67],
  [150, 128, 210],
  [96, 112, 214],
] as const;
const rgba = (c: readonly number[], a: number) => `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a.toFixed(3)})`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: readonly number[], b: readonly number[], t: number) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

export type ParticleTiming = {
  /** 第一颗脱离的帧；spread 帧内从左扫到右 */
  release: number;
  releaseSpread: number;
  /** 砸下的那一帧：漩涡涨开一下 */
  burst: number;
  /** 第一颗开始落的帧；spread 帧内从左落到右，每颗飞 fly 帧 */
  arrive: number;
  arriveSpread: number;
  fly: number;
};

/** 源字的左右边（给场景做从左往右的擦除用） */
export const useTextBounds = (line: TextLine) =>
  useMemo(() => {
    const pts = sample(line, 4);
    return { left: pts[0].x, right: pts[pts.length - 1].x };
  }, [line]);

export const Particles: React.FC<{ from: TextLine; to: TextLine; timing: ParticleTiming }> = ({ from, to, timing }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);

  const particles = useMemo(() => {
    const src = sample(from, 4);
    const dst = sample(to, 6);
    const n = Math.min(1600, Math.max(src.length, dst.length));
    const sx0 = src[0].x;
    const sx1 = src[src.length - 1].x;
    const tx0 = dst[0].x;
    const tx1 = dst[dst.length - 1].x;
    return Array.from({ length: n }, (_, i) => {
      const s = src[Math.floor((i / n) * src.length)];
      const t = dst[Math.floor((i / n) * dst.length)];
      const r = (k: string) => random(`p-${k}-${i}`);
      return {
        s,
        t,
        release: timing.release + ((s.x - sx0) / Math.max(1, sx1 - sx0)) * timing.releaseSpread + r("rel") * 8,
        arrive: timing.arrive + ((t.x - tx0) / Math.max(1, tx1 - tx0)) * timing.arriveSpread + r("arr") * 10,
        band: 160 + r("band") ** 0.7 * 520,
        spin: 0.03 + r("spin") * 0.03,
        swell: 160 + r("swell") * 260,
        wobble: r("wob") * Math.PI * 2,
        hue: HUES[Math.floor(r("hue") * HUES.length)],
        size: 3 + r("size") ** 2 * 7,
        square: r("sq") < 0.4,
        // 一成的粒子离镜头近：大、虚、淡，拉出前后景深
        near: r("near") < 0.12,
      };
    });
  }, [from, to, timing]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H / 2;
    const tilt = (-10 * Math.PI) / 180;

    /** 第 i 颗在 f 帧的位置，和它此刻"在漩涡里"的程度（0 在字上，1 全在漩涡里） */
    const at = (p: (typeof particles)[number], f: number) => {
      if (f < p.release) return { x: p.s.x, y: p.s.y, swirl: 0, landed: 0 };
      const tau = f - p.release;
      const dx = (p.s.x - cx) / 1.8;
      const dy = (p.s.y - cy) / 0.6;
      const r0 = Math.hypot(dx, dy);
      const a0 = Math.atan2(dy, dx);
      const k = 1 - Math.exp(-tau / 26);
      const sinceBurst = f - timing.burst;
      const burst = sinceBurst > 0 ? (1 - Math.exp(-sinceBurst / 7)) * Math.exp(-sinceBurst / 34) : 0;
      const r = lerp(r0, p.band, k) + burst * p.swell;
      // 越转越快
      const a = a0 - p.spin * tau - 0.00035 * tau * tau;
      const ex = 1.8 * r * Math.cos(a);
      const ey = 0.6 * r * Math.sin(a) + Math.sin(tau * 0.06 + p.wobble) * 16 * k;
      const vx = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt) + k * 40;
      const vy = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      const q = clamp01((f - p.arrive) / timing.fly);
      const e = smooth(q) ** 0.8;
      return { x: lerp(vx, p.t.x, e), y: lerp(vy, p.t.y, e), swirl: k * (1 - e), landed: q };
    };

    for (const pass of ["far", "near"] as const) {
      ctx.filter = pass === "near" ? "blur(5px)" : "none";
      for (const p of particles) {
        if (p.near !== (pass === "near")) continue;
        if (frame < p.release) continue;
        const now = at(p, frame);
        const prev = at(p, frame - 0.9);
        // 落定后十几帧里淡掉，交给 DOM 里的字
        const fade = clamp01((frame - (p.arrive + timing.fly)) / 14);
        if (fade >= 1) continue;
        const color = lerp3(INK, p.hue, smooth(clamp01(now.swirl * 2.4)));
        const size = (p.near ? p.size * 3.4 : p.size) * (1 + 0.9 * now.swirl);
        const alpha = (p.near ? 0.35 : 0.92) * (1 - fade) * (p.near ? clamp01(now.swirl * 2) : 1);
        if (alpha <= 0.01) continue;
        ctx.strokeStyle = rgba(color, alpha);
        ctx.lineWidth = size;
        ctx.lineCap = p.square ? "butt" : "round";
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(now.x + 0.01, now.y);
        ctx.stroke();
      }
    }
    ctx.filter = "none";
  }, [frame, particles, timing]);

  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H, pointerEvents: "none" }} />;
};
