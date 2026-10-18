import { interpolate } from "remotion";
import { clamp } from "../../engine/motion";
import { EASE } from "./theme";

// 全片的动作都是帧的纯函数。进出场比第一支快：浮上来 26 帧，走 16 帧。

/** from 起 dur 帧内从 0 走到 1 */
export const prog = (frame: number, from: number, dur: number, easing: (t: number) => number = EASE.outExpo) =>
  interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing });

/** inAt 帧开始浮上来、由虚变实；outAt 帧开始往上虚掉（不给就一直留着） */
export const show = (frame: number, inAt: number, outAt = Number.POSITIVE_INFINITY, dy = 26): React.CSSProperties => {
  const a = prog(frame, inAt, 26);
  const z = Number.isFinite(outAt) ? prog(frame, outAt, 16, EASE.outQuint) : 0;
  const blur = 10 * (1 - a) + 10 * z;
  return {
    opacity: a * (1 - z),
    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
    transform: `translateY(${dy * (1 - a) - dy * 0.7 * z}px)`,
  };
};

/** 拍点上的一下"顶"：放大一点再回来 */
export const punch = (frame: number, at: number, amount = 0.05, dur = 20) =>
  frame < at ? 1 : 1 + amount * Math.exp(-(frame - at) / (dur / 3.5));

/** 打字：at 起 frames 帧内敲完，返回已经敲出来的那一截 */
export const typed = (text: string, frame: number, at: number, frames: number) => {
  const chars = [...text];
  return chars.slice(0, Math.floor(interpolate(frame, [at, at + frames], [0, chars.length], clamp))).join("");
};

/** 在 oklab 里混两种颜色：t=1 全是 to */
export const mix = (to: string, from: string, t: number) => `color-mix(in oklab, ${to} ${(Math.min(1, Math.max(0, t)) * 100).toFixed(1)}%, ${from})`;
