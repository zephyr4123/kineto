// 撞角落的物理是纯函数：位置只由帧号决定（Remotion 逐帧渲染要求确定性）。
// 速度与起点是反推的：把来回反弹「展开」成一条直线，让第 LAST 帧的行程正好落在
// RANGE 的奇数倍上（= 右墙和底墙），于是最后一帧必然撞进右下角。
export const CANVAS = { width: 1920, height: 1080 };
export const BADGE = { width: 360, height: 180 };

// 与 Video.tsx 里 Bounce 场景的 durationInFrames 必须一致
export const BOUNCE_FRAMES = 240;
const LAST = BOUNCE_FRAMES - 1;

const RANGE_X = CANVAS.width - BADGE.width;
const RANGE_Y = CANVAS.height - BADGE.height;
const VX = 19;
const VY = 15;
const START_X = 3 * RANGE_X - VX * LAST;
const START_Y = 5 * RANGE_Y - VY * LAST;

const fold = (d: number, range: number) => {
  const period = 2 * range;
  const m = ((d % period) + period) % period;
  return m <= range ? m : period - m;
};

export const badgePosition = (frame: number) => ({
  x: fold(START_X + VX * frame, RANGE_X),
  y: fold(START_Y + VY * frame, RANGE_Y),
});

export const FINAL_POSITION = { x: RANGE_X, y: RANGE_Y };

// 展开行程每跨过一个 RANGE 的整数倍就是一次撞墙；同一帧撞两面墙（角落）算一次
const crossingFrames = (start: number, v: number, range: number) => {
  const frames: number[] = [];
  for (let k = Math.floor(start / range) + 1; k * range <= start + v * LAST; k++) {
    frames.push(Math.round((k * range - start) / v));
  }
  return frames;
};

export const HIT_FRAMES = [
  ...new Set([
    ...crossingFrames(START_X, VX, RANGE_X),
    ...crossingFrames(START_Y, VY, RANGE_Y),
  ]),
].sort((a, b) => a - b);

export const wallHits = (frame: number) => HIT_FRAMES.filter((f) => f <= frame).length;

export const cornerDistance = (frame: number) => {
  const { x, y } = badgePosition(frame);
  return Math.min(
    Math.hypot(x, y),
    Math.hypot(RANGE_X - x, y),
    Math.hypot(x, RANGE_Y - y),
    Math.hypot(RANGE_X - x, RANGE_Y - y),
  );
};
