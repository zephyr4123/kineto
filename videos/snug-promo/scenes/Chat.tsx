import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { ChatgptApp, GhosttyApp, gptComposer, GPT_LEN } from "../components/apps";
import { KB_CLOSE, KB_TOP } from "../components/keyboard";
import { toPhone } from "../components/mac";
import { aim, Phone, TOOLBAR_TOP, Touch } from "../components/phone";
import { press01, switching, SWITCH, WIN } from "../components/snug";
import { Hero } from "../components/stage";
import { strokes, typingAt, UUSnug } from "../components/uu";
import { local } from "../theme";
import { SHELL_DONE } from "./Shell";

// 任意窗口 · App：点底部横条回到窗口列表，点 ChatGPT。点一下输入框，点「键盘」，敲一句 regex for a semver tag 回车；
// 收起键盘，看回复写出来（正文 + 一段代码）。窗口里的东西都是 ChatGPT 桌面版自己的界面。
const START = 104;
const at = local(START);
const STEP = 6;
const HOME = { x: 540, y: 1228, s: 1.27 };
const ASK = "regex for a semver tag";

const TAP_BOX = at(3.6);
const KB_TAP = at(4.3);
const S = strokes(`${ASK}\n`, at(5), STEP);
const SENT = S[S.length - 1].at;
const CLOSE = SENT + 10;
const SHELL = { ...WIN.shell, title: "✳ Claude Code" };

const WORDS = ["regex", "for", "a", "semver", "tag"];
const ALT: Record<string, string> = { regex: "regexes", for: "from", a: "I", semver: "server", tag: "tags" };
const suggestFor = (typed: string): readonly [string, string, string] => {
  const word = typed.split(" ").pop() ?? "";
  if (!word) return ["I", "the", "a"];
  const guess = WORDS.find((w) => w.startsWith(word)) ?? word;
  return [`“${word}”`, guess, ALT[guess] ?? guess];
};

export const Chat: React.FC = () => {
  const f = useCurrentFrame();
  const t = typingAt(S, f);
  const kb = interpolate(f, [KB_TAP + 2, KB_TAP + 16], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [CLOSE + 2, CLOSE + 14], [0, 1], { ...clamp, easing: outExpo }));
  const sent = f >= SENT;
  const reveal = sent ? Math.min(GPT_LEN, Math.max(0, Math.floor((f - SENT - 12) * 2.2))) : 0;
  const app = <ChatgptApp draft={sent ? "" : t.typed} focused={f >= TAP_BOX + 2} asked={sent ? ASK : null} reveal={reveal} />;
  const sw = switching(f, { prevScreen: <GhosttyApp lines={SHELL_DONE} size={17} title={SHELL.title} />, current: SHELL, others: [WIN.chatgpt, WIN.safari, WIN.ghostty, WIN.vscode, WIN.claude, WIN.finder], target: WIN.chatgpt });
  const fill = interpolate(f, [SWITCH.ENTER, SWITCH.ENTER + 8], [0, 1], { ...clamp, easing: outExpo });
  const screen = sw ? sw.screen : <div style={{ position: "absolute", inset: 0, opacity: fill, transform: `scale(${0.97 + 0.03 * fill})` }}>{app}</div>;

  // 镜头：换窗口时手机往后一让、侧过去一点；打字时推近；收起键盘后退回来对着回复
  const list = interpolate(f, [0, 10, SWITCH.ENTER, SWITCH.ENTER + 16], [0, 1, 1, 0], { ...clamp, easing: inOutQuint });
  const near = interpolate(f, [at(3.4), at(4.2)], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [CLOSE + 4, CLOSE + 36], [0, 1], { ...clamp, easing: inOutQuint }));
  const s = HOME.s * (1 - 0.08 * list) + 0.2 * near;
  const pose = aim(220, 478 + 170 * near, s, 540, HOME.y + 235 * near);
  const box = toPhone(gptComposer(false).x, gptComposer(false).y);
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s} tiltY={14 * list} glow={0.25 + 0.3 * near}>
        <UUSnug kb={kb} shiftY={300 * kb} pressed={t.pressed} layer={t.layer} suggest={suggestFor(t.typed)}>
          {screen}
        </UUSnug>
        {sw?.finger ? <Touch x={sw.finger.x} y={sw.finger.y} press={sw.finger.press} show={sw.finger.show} /> : null}
        <Touch x={box.x} y={box.y} press={press01(f, TAP_BOX)} show={interpolate(f, [TAP_BOX - 10, TAP_BOX - 2, TAP_BOX + 8, TAP_BOX + 14], [0, 1, 1, 0], clamp)} />
        <Touch x={275} y={TOOLBAR_TOP + 27} press={press01(f, KB_TAP)} show={interpolate(f, [KB_TAP - 10, KB_TAP - 2, KB_TAP + 10, KB_TAP + 16], [0, 1, 1, 0], clamp)} />
        {t.finger ? <Touch x={t.finger.x} y={t.finger.y} press={1} show={0.85} /> : null}
        <Touch x={KB_CLOSE.x} y={KB_TOP + KB_CLOSE.y} press={press01(f, CLOSE)} show={interpolate(f, [CLOSE - 10, CLOSE - 2, CLOSE + 8, CLOSE + 14], [0, 1, 1, 0], clamp)} />
      </Phone>
      <Hero at={4} until={at(16) - 4} y={110} eyebrow="ANY WINDOW · 02" title="APP" sub="ChatGPT · 对话输入" />
    </AbsoluteFill>
  );
};
