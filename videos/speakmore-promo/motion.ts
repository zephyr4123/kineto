import { interpolate } from "remotion";
import { clamp } from "../../engine/motion";
import { EASE } from "./theme";

// 全片的进出场都是同一个动作：从下面浮上来、由虚变实；走的时候往上虚掉。快进慢停，不回弹。

/** inAt 帧开始进场，outAt 帧开始退场（不给就一直留着）；dy 是浮动的距离 */
export const show = (frame: number, inAt: number, outAt = Number.POSITIVE_INFINITY, dy = 22): React.CSSProperties => {
  const a = interpolate(frame, [inAt, inAt + 34], [0, 1], { ...clamp, easing: EASE.outExpo });
  const b = Number.isFinite(outAt) ? interpolate(frame, [outAt, outAt + 22], [0, 1], { ...clamp, easing: EASE.outQuint }) : 0;
  const blur = 12 * (1 - a) + 12 * b;
  return {
    opacity: a * (1 - b),
    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
    transform: `translateY(${dy * (1 - a) - dy * 0.8 * b}px)`,
  };
};
