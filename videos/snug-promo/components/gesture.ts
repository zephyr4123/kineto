import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";

// 手势的时间曲线，参数照 Snug 的代码：
// 惯性 SnugCore/Touch/Scrolling.swift（每帧速度 ×0.95，低于 40 点/秒停下，60fps 下约 0.8 秒）；长按 0.5 秒（30 帧）。

export const HOLD = 30;

/** 一次甩动：t0 起 drag 帧内手指移动 dist（点，正负表示方向），松手后按惯性继续走。返回累计位移 */
export const flick = (f: number, t0: number, drag: number, dist: number) => {
  if (f <= t0) return 0;
  if (f <= t0 + drag) return (dist * (f - t0)) / drag;
  const v0 = dist / drag;
  const stop = Math.max(0, Math.ceil(Math.log(40 / 60 / Math.abs(v0)) / Math.log(0.95)));
  const n = Math.min(f - t0 - drag, stop);
  return dist + (v0 * 0.95 * (1 - 0.95 ** n)) / 0.05;
};

/** 长按：at 按下，HOLD 帧后算长按；返回 0→1 的进度（手指外那一圈用） */
export const holdRing = (f: number, at: number) => interpolate(f, [at + 4, at + HOLD], [0, 1], clamp);
