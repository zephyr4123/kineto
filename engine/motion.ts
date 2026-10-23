import { Easing, interpolate, random } from "remotion";

// 动效小工具：全部是帧的纯函数，渲染时每帧算一遍，结果确定。
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const tween = (
  frame: number,
  range: readonly [number, number],
  to: readonly [number, number],
  easing: (t: number) => number = Easing.linear,
) => interpolate(frame, range, to, { ...clamp, easing });

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(2.2));

// 先快后慢、不回弹（SpeakMore 官网用的同一组曲线）
export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const outQuint = Easing.bezier(0.22, 1, 0.36, 1);
export const inOutQuint = Easing.bezier(0.7, 0, 0.2, 1);

// 屏幕震动：start 起 duration 帧内线性衰减；每帧取一个确定的随机偏移
export const shake = (
  frame: number,
  start: number,
  duration: number,
  amplitude: number,
  seed = "shake",
) => {
  const t = frame - start;
  if (t < 0 || t >= duration) return { x: 0, y: 0 };
  const k = amplitude * (1 - t / duration);
  return {
    x: (random(`${seed}-x-${frame}`) * 2 - 1) * k,
    y: (random(`${seed}-y-${frame}`) * 2 - 1) * k,
  };
};

export const sumShakes = (...shakes: { x: number; y: number }[]) =>
  shakes.reduce((acc, s) => ({ x: acc.x + s.x, y: acc.y + s.y }), {
    x: 0,
    y: 0,
  });

/** from 起 dur 帧内从 0 走到 1（默认先快后慢） */
export const prog = (frame: number, from: number, dur: number, easing: (t: number) => number = outExpo) =>
  interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing });

/** 拍点上的一下"顶"：放大一点再回来 */
export const punch = (frame: number, at: number, amount = 0.05, dur = 20) =>
  frame < at ? 1 : 1 + amount * Math.exp(-(frame - at) / (dur / 3.5));

/** 打字：at 起 frames 帧内敲完，返回已经敲出来的那一截 */
export const typed = (text: string, frame: number, at: number, frames: number) => {
  const chars = [...text];
  return chars.slice(0, Math.floor(interpolate(frame, [at, at + frames], [0, chars.length], clamp))).join("");
};

/** 在 oklab 里混两种颜色：t=1 全是 to */
export const mix = (to: string, from: string, t: number) =>
  `color-mix(in oklab, ${to} ${(Math.min(1, Math.max(0, t)) * 100).toFixed(1)}%, ${from})`;
