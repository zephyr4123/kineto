// 通用的缓动与震动已提升到 engine/motion.ts（第二条视频也要用），这里转导出，场景里的引用不用改；
// 下面是宣传片自己的动作：跳跃、跑步、眨眼。
export { backOut, clamp, easeIn, easeInOut, easeOut, shake, sumShakes, tween } from "../../engine/motion";

// 抛物线跳跃：返回向上的位移（像素，>= 0），t 在 [0, duration] 之外为 0
export const jumpArc = (t: number, duration: number, height: number) => {
  if (t <= 0 || t >= duration) return 0;
  const p = t / duration;
  return 4 * height * p * (1 - p);
};

// 跑步腿：每 period 帧换一次
export const runLegs = (frame: number, period = 6) => (Math.floor(frame / period) % 2 === 0 ? "runA" : "runB");

// 眨眼：每隔约 2.5 秒闭眼 6 帧，seed 让不同角色错开
export const blinking = (frame: number, offset = 0) => (frame + offset) % 150 > 143;

export const typed = (text: string, frame: number, start: number, perChar: number) => {
  const chars = Array.from(text);
  const n = Math.max(0, Math.min(chars.length, Math.floor((frame - start) / perChar)));
  return chars.slice(0, n).join("");
};

// 落地挤压：落地瞬间压扁，再弹回
export const landSquash = (frame: number, landAt: number) => {
  const t = frame - landAt;
  if (t < 0 || t > 14) return 1;
  return 1 + 0.35 * Math.exp(-t / 4) * Math.cos(t / 2.2);
};

// 两个 #rrggbb 颜色按 t 线性混合
export function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = Math.max(0, Math.min(1, t));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}
