import { interpolate } from "remotion";
import { clamp } from "./motion";

// 镜头：每章给一组关键帧，成片按各章的起点接成一条，章与章之间画面不跳。

/** [帧, 值]，帧要从小到大 */
export type Keys = readonly (readonly [number, number])[];
/** focus：桌面退后多少（0 原样，1 虚暗到底）；zoom：整块桌面推近多少（1 原大） */
export type Camera = { focus: Keys; zoom: Keys };

export const sampleKeys = (keys: Keys, frame: number, easing: (t: number) => number) =>
  keys.length === 1
    ? keys[0][1]
    : interpolate(
        frame,
        keys.map(([f]) => f),
        keys.map(([, v]) => v),
        { ...clamp, easing },
      );

/** 把几章的镜头按各章在成片里的起点接起来；和上一章最后一个关键帧同帧或更早的丢掉，交叠处听后一章的 */
export const joinCameras = (parts: readonly { from: number; camera: Camera }[]): Camera => {
  const join = (pick: (c: Camera) => Keys) => {
    const out: (readonly [number, number])[] = [];
    for (const { from, camera } of parts) {
      for (const [f, v] of pick(camera)) {
        const at = from + f;
        while (out.length > 0 && out[out.length - 1][0] >= at) out.pop();
        out.push([at, v]);
      }
    }
    return out;
  };
  return { focus: join((c) => c.focus), zoom: join((c) => c.zoom) };
};
