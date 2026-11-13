import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { KB_TOP } from "../components/keyboard";
import { aim, Phone, TOOLBAR_TOP, Touch } from "../components/phone";
import { press01, switching, SWITCH, WIN } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { FOLLOW_SENT, followAt } from "../components/story";
import { BANNER, CC, EARLY, FOLLOW, INPUT, PROMPT, RECAP, RESUME_LIST, SESSION, streamed, typedCount, type Line } from "../components/terminal";
import { strokes, typingAt, UUSnug } from "../components/uu";
import { b, local } from "../theme";
import { PR_DONE } from "./AnyApp";

// 回击三，音乐安静的中段，慢慢演完整个输入过程（全片唯一的技术点）：
// 点横条换到 Mac 上原来那个 Ghostty（Claude Code 上次已经退出）→ 点 UU 工具栏的「键盘」，键盘升起、远程画面往上推 →
// 一个键一个键敲 claude 回车 → 敲 /resume（/ 在数字层：先按 123，再按 /，再按 ABC 切回）回车 → 回车选上次的会话 →
// 会话原样接上，Claude Code 先打一段 recap → 回它一句 gestures 回车 → 点 ⊗ 收起键盘 → Claude Code 读代码、开始回答，
// 一路答到下一个场景（出门在外）里。键盘照实机录屏画，联想栏跟着敲出的字变。
const START = 144;
const at = local(START);
const SIZE = 16;
const STEP = 9;

const EXITED: Line[] = [
  ...EARLY,
  ...SESSION,
  "",
  [{ t: "❯ ", c: CC.dim }, { t: "/exit", c: CC.purple }],
  [{ t: "  ⎿  Goodbye!", c: CC.dim }],
  "",
  "Resume this session with:",
  "claude --resume 3f2a9c1e-7d41-4b8a-9e52-0c6b1d7e4a90",
];
const caret = { t: " ", bg: "#1d1f24" };

const SWITCH_AT = at(0.5);
const KB_TAP = at(7);
const KB_UP = KB_TAP + 8;
const S1 = strokes("claude\n", at(8.5), STEP);
const S2 = strokes("/resume\n", at(12), STEP);
const S3 = strokes("\n", at(17), STEP);
const SENT = b(FOLLOW_SENT) - b(START);
const S4 = strokes(`${FOLLOW}\n`, SENT - FOLLOW.length * STEP, STEP);
const CLOSE = SENT + 26;
const RECAP_FROM = S3[0].at + 10;
const end = (ss: typeof S1) => ss[ss.length - 1].at;

/** 联想栏：照 iOS 的样子，左边带引号的是原样输入，中间是首选 */
const suggestFor = (typed: string): readonly [string, string, string] => {
  if (/^claud?$/.test(typed)) return ["“claud”", "Claud", "Claude"];
  if (/^resu/.test(typed)) return ["“resu”", "result", "resume"];
  if (/^ges/.test(typed)) return [`“${typed}”`, "gesture", "gestures"];
  return ["I", "The", "I'm"];
};

export const Resume: React.FC = () => {
  const f = useCurrentFrame();
  const abs = b(START) + f;
  const t1 = typingAt(S1, f);
  const t2 = typingAt(S2, f);
  const t3 = typingAt(S3, f);
  const t4 = typingAt(S4, f);
  const kb = interpolate(f, [KB_TAP + 2, KB_UP + 8], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [CLOSE + 2, CLOSE + 14], [0, 1], { ...clamp, easing: outExpo }));
  const launched = f >= end(S1);
  const picking = f >= end(S2);
  const resumed = f >= S3[0].at;
  const sent = f >= SENT;
  const typing = !launched ? t1 : !picking ? t2 : !resumed ? t3 : t4;

  let lines: Line[];
  if (sent) {
    lines = followAt(abs);
  } else if (resumed) {
    // 接回会话：之前的对话原样摆回来，再逐字打一段 recap；打完以后在输入框里敲 FOLLOW
    lines = streamed([...EARLY, ...SESSION, ""], [RECAP], typedCount(f, RECAP_FROM, 0.9), f, "Recapping", 2, INPUT(t4.typed, kb > 0.5));
  } else if (picking) {
    lines = [...EXITED, [...PROMPT, { t: "claude" }], "", ...BANNER, "", ...INPUT("/resume").slice(0, 2), "", ...RESUME_LIST];
  } else if (launched) {
    lines = [...EXITED, [...PROMPT, { t: "claude" }], "", ...BANNER, "", ...INPUT(t2.typed, true)];
  } else {
    lines = [...EXITED, [...PROMPT, { t: t1.typed }, ...(kb > 0.5 ? [caret] : [])]];
  }
  const title = launched ? "✳ 项目目录结构" : WIN.shell.title;
  const terminal = <GhosttyApp lines={lines} size={SIZE} title={title} />;

  // 开头：从 PR 那个终端点横条，换到这个终端
  const sw = switching(f - SWITCH_AT, { prevScreen: <GhosttyApp title={WIN.ghostty2.title} lines={PR_DONE} />, current: WIN.ghostty2, others: [WIN.shell, WIN.ghostty, WIN.safari, WIN.notion, WIN.chatgpt, WIN.claude], target: WIN.shell });
  const fill = interpolate(f - SWITCH_AT, [SWITCH.ENTER, SWITCH.ENTER + 8], [0, 1], { ...clamp, easing: outExpo });
  const screen = sw ? sw.screen : <div style={{ position: "absolute", inset: 0, opacity: fill, transform: `scale(${0.97 + 0.03 * fill})` }}>{terminal}</div>;

  // 镜头：点键盘前推近到屏幕下半截（输入行 + 键盘），收起键盘后退回来；最后一小节音乐抽空，手机往后退一点
  const near = interpolate(f, [at(6), at(7)], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [CLOSE + 6, CLOSE + 40], [0, 1], { ...clamp, easing: inOutQuint }));
  const away = interpolate(f, [at(44), at(48)], [0, 1], { ...clamp, easing: inOutQuint });
  const s = HOME.s + 0.36 * near - 0.12 * away;
  const pose = aim(220, 478 + 170 * near, s, 540, HOME.y + 110 * near);

  const kbFinger = { x: 275, y: TOOLBAR_TOP + 27 };
  const closeFinger = { x: 403, y: KB_TOP + 22 };
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s} glow={0.3 + 0.3 * near}>
        <UUSnug kb={kb} shiftY={300 * kb} pressed={typing.pressed} layer={typing.layer} suggest={suggestFor(typing === t4 ? t4.typed : typing === t2 ? t2.typed.replace("/", "") : t1.typed)}>
          {screen}
        </UUSnug>
        {sw?.finger ? <Touch x={sw.finger.x} y={sw.finger.y} press={sw.finger.press} show={sw.finger.show} /> : null}
        <Touch x={kbFinger.x} y={kbFinger.y} press={press01(f, KB_TAP)} show={interpolate(f, [KB_TAP - 12, KB_TAP - 2, KB_TAP + 10, KB_TAP + 16], [0, 1, 1, 0], clamp)} />
        {typing.finger ? <Touch x={typing.finger.x} y={typing.finger.y} press={1} show={0.85} /> : null}
        <Touch x={closeFinger.x} y={closeFinger.y} press={press01(f, CLOSE)} show={interpolate(f, [CLOSE - 10, CLOSE - 2, CLOSE + 8, CLOSE + 14], [0, 1, 1, 0], clamp)} />
      </Phone>
      <Hero at={6} until={at(7) - 6} title="KEEP GOING" sub="Mac 原有终端 · 无缝接续" />
      <Hero at={at(7)} until={at(17) - 6} title="KEYBOARD" sub="UU 键盘 · 直接输入" />
      <Hero at={at(17)} until={at(44) - 6} title="RESUMED" sub="会话恢复 · 上下文完整" />
    </AbsoluteFill>
  );
};
