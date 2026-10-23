import { prog } from "../../engine/motion";
import { EASE } from "./theme";

// prog、punch、typed、mix 两支片子都用，挪进了 engine/motion.ts
export { mix, prog, punch, typed } from "../../engine/motion";

// 全片的动作都是帧的纯函数。进出场比第一支快：浮上来 26 帧，走 16 帧。

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
