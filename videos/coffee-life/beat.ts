import { FPS } from "./theme";

// 卡点的时间网格：画面切点全部写成「第几拍」，由配乐的 BPM 换算成帧。换配乐只改这里。
export const BPM = 128;
// 一拍多少帧（不一定是整数，切点四舍五入到最近的帧，误差不超过半帧、不累积）
export const FRAMES_PER_BEAT = (FPS * 60) / BPM;
export const beat = (n: number) => Math.round(n * FRAMES_PER_BEAT);
