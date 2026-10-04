import { Easing, interpolate, random } from "remotion";

// 动效小工具：全部是帧的纯函数，渲染时每帧算一遍，结果确定。
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

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

// 屏幕震动：start 起 duration 帧内线性衰减；每帧取一个确定的随机偏移
export const shake = (frame: number, start: number, duration: number, amplitude: number, seed = "shake") => {
  const t = frame - start;
  if (t < 0 || t >= duration) return { x: 0, y: 0 };
  const k = amplitude * (1 - t / duration);
  return { x: (random(`${seed}-x-${frame}`) * 2 - 1) * k, y: (random(`${seed}-y-${frame}`) * 2 - 1) * k };
};

export const sumShakes = (...shakes: { x: number; y: number }[]) =>
  shakes.reduce((acc, s) => ({ x: acc.x + s.x, y: acc.y + s.y }), { x: 0, y: 0 });
