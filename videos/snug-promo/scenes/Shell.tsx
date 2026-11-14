import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { KB_CLOSE, KB_TOP } from "../components/keyboard";
import { aim, Phone, TOOLBAR_TOP, Touch } from "../components/phone";
import { press01, WIN } from "../components/snug";
import { Hero } from "../components/stage";
import { ASK_TESTS, SHELL_HISTORY, TESTS } from "../components/story";
import { BANNER, CC, charCount, INPUT, PROMPT, streamed, type Line } from "../components/terminal";
import { strokes, typingAt, UUSnug } from "../components/uu";
import { local } from "../theme";

// 任意窗口 · 终端：刚打开的那个 Ghostty（仓库目录下的 shell）。点 UU 工具栏的「键盘」，键盘升起、远程画面往上推；
// 一个键一个键敲 claude 回车，Claude Code 启动；再敲 run the tests 回车，点 ⊗ 收起键盘，看它跑完测试、回一句。
// 键盘照实机录屏画，联想栏跟着敲出的字变。
const START = 88;
const at = local(START);
const SIZE = 17;
const STEP = 6;
const HOME = { x: 540, y: 1228, s: 1.27 };

const KB_TAP = at(1.4);
const S1 = strokes("claude\n", at(2.4), STEP);
const S2 = strokes(`${ASK_TESTS}\n`, at(4.6), STEP);
const last = (ss: typeof S1) => ss[ss.length - 1].at;
const SENT = last(S2);
const CLOSE = SENT + 14;
const caret = { t: " ", bg: CC.ink };

/** 联想栏：左边带引号的是原样输入，中间是首选（照实机：敲 claud 时是「“claud” Claud Claude」） */
const WORDS = ["claude", "run", "the", "tests"];
const ALT: Record<string, string> = { claude: "Claude", run: "running", the: "they", tests: "testing" };
export const suggestFor = (typed: string): readonly [string, string, string] => {
  const word = typed.split(" ").pop() ?? "";
  if (!word) return ["I", "The", "I'm"];
  const guess = WORDS.find((w) => w.startsWith(word)) ?? word;
  return [`“${word}”`, guess === word ? word : guess.slice(0, Math.max(word.length + 1, 3)), ALT[guess] ?? guess];
};

const ASK_LINE: Line = [{ t: "❯ ", c: CC.dim }, { t: ASK_TESTS, bg: "#eef0f3" }];
const BEFORE: Line[] = [...SHELL_HISTORY, [...PROMPT, { t: "claude" }], "", ...BANNER, "", ASK_LINE, ""];
const testChars = (t: number) => Math.floor(interpolate(t, [SENT + 14, SENT + 15, SENT + 70, SENT + 71, SENT + 76, SENT + 76 + charCount(TESTS.slice(3)) / 2.2], [0, charCount(TESTS.slice(0, 1)), charCount(TESTS.slice(0, 1)), charCount(TESTS.slice(0, 3)), charCount(TESTS.slice(0, 3)), charCount(TESTS)], clamp));
/** 跑完以后的样子（下一场从这里换窗口） */
export const SHELL_DONE = streamed(BEFORE, TESTS, charCount(TESTS), 0);

export const Shell: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = typingAt(S1, f);
  const t2 = typingAt(S2, f);
  const kb = interpolate(f, [KB_TAP + 2, KB_TAP + 16], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [CLOSE + 2, CLOSE + 14], [0, 1], { ...clamp, easing: outExpo }));
  const launched = f >= last(S1);
  const sent = f >= SENT;
  const typing = launched ? t2 : t1;
  let lines: Line[];
  if (sent) lines = streamed(BEFORE, TESTS, testChars(f), f, "Running", 1);
  else if (launched) lines = [...SHELL_HISTORY, [...PROMPT, { t: "claude" }], "", ...BANNER, "", ...INPUT(t2.typed, kb > 0.5)];
  else lines = [...SHELL_HISTORY, [...PROMPT, { t: t1.typed }, ...(kb > 0.5 ? [caret] : [])]];

  // 镜头：点键盘前推近到屏幕下半截（输入行 + 键盘），收起键盘后退回来，再轻轻转一点
  const near = interpolate(f, [at(0.6), at(1.4)], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [CLOSE + 4, CLOSE + 36], [0, 1], { ...clamp, easing: inOutQuint }));
  const s = HOME.s + 0.2 * near;
  const pose = aim(220, 478 + 170 * near, s, 540, HOME.y + 235 * near);
  const tilt = interpolate(f, [at(13), at(16)], [0, -8], { ...clamp, easing: inOutQuint });
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s} tiltY={tilt} glow={0.25 + 0.3 * near}>
        <UUSnug kb={kb} shiftY={300 * kb} pressed={typing.pressed} layer={typing.layer} suggest={suggestFor(typing.typed)}>
          <GhosttyApp lines={lines} size={SIZE} title={launched ? "✳ Claude Code" : WIN.shell.title} anchor="bottom" />
        </UUSnug>
        <Touch x={275} y={TOOLBAR_TOP + 27} press={press01(f, KB_TAP)} show={interpolate(f, [KB_TAP - 12, KB_TAP - 2, KB_TAP + 10, KB_TAP + 16], [0, 1, 1, 0], clamp)} />
        {typing.finger ? <Touch x={typing.finger.x} y={typing.finger.y} press={1} show={0.85} /> : null}
        <Touch x={KB_CLOSE.x} y={KB_TOP + KB_CLOSE.y} press={press01(f, CLOSE)} show={interpolate(f, [CLOSE - 10, CLOSE - 2, CLOSE + 8, CLOSE + 14], [0, 1, 1, 0], clamp)} />
      </Phone>
      <Hero at={4} until={at(16) - 4} y={110} eyebrow="ANY WINDOW · 01" title="TERMINAL" sub="Claude Code · 键盘直输" />
    </AbsoluteFill>
  );
};
