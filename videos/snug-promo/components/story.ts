import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { b } from "../theme";
import { ANSWER, ASK, charCount, EARLY, FOLLOW_LINE, GESTURES, PRELUDE, RECAP, SESSION, streamed, type Line } from "./terminal";

// 全片贯穿的两段 Claude Code 输出，进度按片子的绝对帧算：同一个任务出现在好几个场景里（Mac 上、缩小的桌面里、手机屏上），
// 各场景拿自己的绝对帧来取，前后接得上，不会每进一个场景就从头吐字。
// 进度表是 [片子第几拍, 吐到第几个字]，相邻两点之间匀速；工具调用那一行和它的结果是「一下子出来」的（两点只隔 0.1 拍），
// 工具在跑的时候进度停住，底下转圈。

const upto = (lines: readonly Line[], k: number) => charCount(lines.slice(0, k));
const progress = (keys: readonly (readonly [number, number])[]) => {
  const frames = keys.map(([beat]) => b(beat));
  const chars = keys.map(([, n]) => n);
  return (abs: number) => Math.floor(interpolate(abs, frames, chars, clamp));
};

/** 任务一：开场时 Mac 上已经在跑的「介绍目录结构」。第 0 拍时第一段已经写完，Snap 里跑完测试收尾 */
export const TASK_BEFORE: readonly Line[] = [...PRELUDE, ...EARLY, ASK, ""];
const taskChars = progress([
  [0, upto(ANSWER, 2)],
  [5, upto(ANSWER, 5)],
  [5.6, upto(ANSWER, 5)],
  [5.7, upto(ANSWER, 7)],
  [7, upto(ANSWER, 7)],
  [7.1, upto(ANSWER, 9)],
  [10, upto(ANSWER, 9)],
  [50, upto(ANSWER, 11)],
  [50.6, upto(ANSWER, 11)],
  [50.7, upto(ANSWER, 12)],
  [56.5, upto(ANSWER, 12)],
  [56.6, upto(ANSWER, 13)],
  [57.4, upto(ANSWER, 14)],
  [61, charCount(ANSWER)],
]);
/** 片子第 abs 帧时任务一在终端里的样子 */
export const taskAt = (abs: number) => streamed(TASK_BEFORE, ANSWER, taskChars(abs), abs, "Working", 48);

/** 任务二：Resume 里接回会话、敲下 FOLLOW 回车之后，Claude Code 读代码讲手势，一路讲到出门在外（Anywhere）里讲完 */
export const FOLLOW_SENT = 144 + 27;
export const FOLLOW_BEFORE: readonly Line[] = [...EARLY, ...SESSION, "", RECAP, "", FOLLOW_LINE, ""];
const s = FOLLOW_SENT;
const followChars = progress([
  [s + 1.5, 0],
  [s + 1.6, upto(GESTURES, 1)],
  [s + 3.5, upto(GESTURES, 1)],
  [s + 3.6, upto(GESTURES, 3)],
  [s + 5, upto(GESTURES, 3)],
  [s + 5.1, upto(GESTURES, 5)],
  [s + 20, upto(GESTURES, 7)],
  [s + 33, charCount(GESTURES)],
]);
/** 转圈行上的秒数从回车那一刻起算 */
const FOLLOW_SECS = 1 - Math.floor(b(FOLLOW_SENT) / 60);
export const followAt = (abs: number) => streamed(FOLLOW_BEFORE, GESTURES, followChars(abs), abs, "Reading", FOLLOW_SECS);
