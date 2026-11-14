import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { b } from "../theme";
import { ANSWER, ASK, CC, charCount, EARLY, PRELUDE, PROMPT, streamed, type Line } from "./terminal";

// 终端里的内容，进度按片子的绝对帧算：同一个会话出现在好几个场景里（原版竖屏、横屏的缩小桌面里，Snug 手机屏上），
// 各场景拿自己的绝对帧来取，前后接得上。进度表是 [片子第几拍, 吐到第几个字]，相邻两点之间匀速；
// 工具调用那一行和它的结果是「一下子出来」的（两点只隔 0.1 拍），工具在跑的时候进度停住，底下转圈。

const upto = (lines: readonly Line[], k: number) => charCount(lines.slice(0, k));
const progress = (keys: readonly (readonly [number, number])[]) => {
  const frames = keys.map(([beat]) => b(beat));
  const chars = keys.map(([, n]) => n);
  return (abs: number) => Math.floor(interpolate(abs, frames, chars, clamp));
};

/**
 * Mac 上开着的 Claude Code 会话（在讲 Snug 的目录结构）：原版那几场里停在讲手势那一段之后、转圈；
 * Snug 亮相（第 48 拍）以后接着往下写，跑一遍测试，第 57 拍写完。
 */
const TASK_BEFORE: readonly Line[] = [...PRELUDE, ...EARLY, ASK, ""];
const taskChars = progress([
  [0, upto(ANSWER, 10)],
  [49, upto(ANSWER, 10)],
  [51, upto(ANSWER, 11)],
  [51.5, upto(ANSWER, 11)],
  [51.6, upto(ANSWER, 12)],
  [54, upto(ANSWER, 12)],
  [54.1, upto(ANSWER, 13)],
  [54.8, upto(ANSWER, 14)],
  [57, charCount(ANSWER)],
]);
/** 片子第 abs 帧时这个会话在终端里的样子 */
export const taskAt = (abs: number) => streamed(TASK_BEFORE, ANSWER, taskChars(abs), abs, "Working", 48);
/** 写完以后的样子（手势对照那一段一直是它） */
export const TASK_DONE = streamed(TASK_BEFORE, ANSWER, charCount(ANSWER), 0);
/** 讲手势的那一段（ANSWER 第 9 行）在 TASK_DONE 里是第几行，选字、拷贝用 */
export const TASK_GESTURE_LINE = TASK_BEFORE.length + 9;

/** 终端那一段：在手机上敲 claude 启动 Claude Code，再敲一句 run the tests，它跑完测试回一句 */
export const ASK_TESTS = "run the tests";
export const TESTS: readonly Line[] = [
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(scripts/snug check)" }],
  [{ t: "  ⎿  Build complete · 136 tests passed", c: CC.dim }],
  "",
  [{ t: "● ", c: CC.ink }, { t: "构建通过，136 个测试全部通过。" }],
];

/**
 * 另一个 Ghostty 窗口：仓库目录下开了一阵的 shell（zsh 的提示符只留目录名，不露用户名和机器名）。
 * 提交是 Snug 仓库里真实的最近几条，ls 是仓库根目录真实的内容（按 zsh 的分栏排）。
 * 有这些历史，提示符落在窗口下半截，键盘升起、画面上推以后还看得见。
 */
const cmd = (text: string): Line => [...PROMPT, { t: text }];
const commit = (sha: string, msg: string): Line => [{ t: `${sha} `, c: CC.brown }, { t: msg }];
const LAST_LOGIN: Line = [{ t: "Last login: Fri Nov 13 09:12:40 on ttys002", c: CC.dim }];
export const SHELL_HISTORY: readonly Line[] = [
  LAST_LOGIN,
  cmd("git pull"),
  "Already up to date.",
  cmd("git log --oneline -6"),
  commit("58a9944", "记忆：README 图片大小上限在 GitHub 图片代理而不在 COS；动图体积与录屏打码的做法"),
  commit("e35e594", "README 演示动图：补上弹出键盘、输入命令的过程"),
  commit("53b8520", "记忆精简：删过时的、并重复的，只留代码和文档推不出来的"),
  commit("03ff608", "README 中英双语：顶部加语言切换，新增英文版 README.en.md"),
  commit("5ee3095", "记忆：对外文案用书面语，提炼意思不照抄原话"),
  commit("309a450", "README 致谢：对 UU远程 的致敬改为书面语"),
  cmd("ls"),
  "AGENTS.md       Package.swift   Tests",
  "Assets          README.en.md    Vendor",
  "CLAUDE.md       README.md       VERSION",
  "docs            scripts",
  "LICENSE         Sources",
];
export const SHELL_IDLE: readonly Line[] = [...SHELL_HISTORY, [...PROMPT]];
