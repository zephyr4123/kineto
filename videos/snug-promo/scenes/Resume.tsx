import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo, punch, shake } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { KB_TOP } from "../components/keyboard";
import { Phone, Touch } from "../components/phone";
import { press01 } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { BANNER, CC, EARLY, PROMPT, RESUME_LIST, SESSION, type Line } from "../components/terminal";
import { strokes, typingAt, UUSnug } from "../components/uu";
import { C, local, ZH } from "../theme";

// 回击三（第二次抽空 → 砸下）：手机上就是 Mac 上原来那个 Ghostty。抽空时终端停在上次退出的地方；
// 砸下时点开键盘，敲 claude 回车，/resume 选上次的会话，进行到一半的对话原样接上。这是全片唯一的技术点。
// 键盘照实机：/ 在数字层，先按 123 再按 /，再按 ABC 切回。
const at = local(92);
const SIZE = 16;
const LH = SIZE * 1.42;
const VIEW = 950 - 62 - 28;
const INK = "#1d1f24";

const EXITED: Line[] = [
  ...SESSION,
  "",
  [{ t: "❯ ", c: CC.dim }, { t: "/exit", c: CC.purple }],
  [{ t: "  ⎿  Goodbye!", c: CC.dim }],
  "",
  "Resume this session with:",
  "claude --resume 3f2a9c1e-7d41-4b8a-9e52-0c6b1d7e4a90",
];
const caret = { t: " ", bg: INK };
const rule: Line = [{ t: "─".repeat(52), c: "#c9ccd2" }];

const S1 = strokes("claude\n", at(4) + 14, 6);
const S2 = strokes("/resume\n", at(7), 6);
const S3 = strokes("\n", at(10) + 8, 6);
const KB_TAP = at(3);
const CLOSE = at(11);

export const Resume: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = typingAt(S1, f);
  const t2 = typingAt(S2, f);
  const t3 = typingAt(S3, f);
  const kb = interpolate(f, [at(4), at(4) + 10], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [CLOSE + 4, CLOSE + 14], [0, 1], { ...clamp, easing: outExpo }));
  const launched = f >= S1[S1.length - 1].at;
  const picking = f >= S2[S2.length - 1].at;
  const resumed = f >= S3[0].at;
  let lines: Line[];
  if (resumed) {
    lines = [...EARLY, ...SESSION, "", rule, [{ t: "❯ ", c: INK }, caret], rule, [{ t: "  ▸▸ auto mode on ", c: CC.brown }, { t: "(shift+tab to cycle)", c: CC.dim }]];
  } else if (picking) {
    lines = [...EXITED, [...PROMPT, { t: "claude" }], "", ...BANNER, "", rule, [{ t: "❯ ", c: INK }, { t: "/resume" }], "", ...RESUME_LIST];
  } else if (launched) {
    lines = [...EXITED, [...PROMPT, { t: "claude" }], "", ...BANNER, "", rule, [{ t: "❯ ", c: INK }, { t: t2.typed }, caret], rule, [{ t: "  ? for shortcuts", c: CC.dim }]];
  } else {
    lines = [...EXITED, [...PROMPT, { t: t1.typed }, caret]];
  }
  const scroll = Math.max(0, lines.length * LH + 28 - VIEW);
  const typing = !launched ? t1 : !picking ? t2 : t3;
  const suggest: readonly [string, string, string] = /claud?$/.test(t1.typed) && !launched ? ["“claud”", "Claud", "Claude"] : /resu/.test(t2.typed) && !picking ? ["“resu”", "result", "resume"] : ["I", "The", "I'm"];
  // 抽空的一小节：画面压暗，手机退后一点；砸下时推回来
  const dim = interpolate(f, [0, 10, at(4) - 4, at(4)], [0, 1, 1, 0], clamp);
  const s = (HOME.s - 0.08 * dim) * punch(f, at(4), 0.05, 24);
  const sh = shake(f, at(4), 14, 10, "resume");
  const kbFinger = { x: 275, y: 888 };
  const closeFinger = { x: 403, y: KB_TOP + 22 };
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      <div style={{ position: "absolute", inset: 0, filter: dim > 0 ? `saturate(${1 - 0.5 * dim})` : undefined, opacity: 1 - 0.35 * dim }}>
        <Phone x={HOME.x} y={HOME.y} scale={s} glow={0.6 * (1 - dim)}>
          <UUSnug kb={kb} shiftY={300 * kb} pressed={typing.pressed} layer={typing.layer} suggest={suggest}>
            <GhosttyApp lines={lines} size={SIZE} scroll={scroll} title={resumed || launched ? "✳ 项目目录结构" : ".../coding/personal/snug"} />
          </UUSnug>
          <Touch x={kbFinger.x} y={kbFinger.y} press={press01(f, KB_TAP)} show={interpolate(f, [KB_TAP - 8, KB_TAP - 2, KB_TAP + 10, KB_TAP + 16], [0, 1, 1, 0], clamp)} />
          {typing.finger ? <Touch x={typing.finger.x} y={typing.finger.y} press={1} show={0.85} /> : null}
          <Touch x={closeFinger.x} y={closeFinger.y} press={press01(f, CLOSE)} show={interpolate(f, [CLOSE - 8, CLOSE - 2, CLOSE + 8, CLOSE + 14], [0, 1, 1, 0], clamp)} />
        </Phone>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: ZH, fontSize: 52, fontWeight: 600, letterSpacing: "0.1em", color: C.ink2, opacity: interpolate(f, [6, 20, at(4) - 8, at(4) - 2], [0, 1, 1, 0], clamp) }}>
        Mac 上的终端 仍在原处
      </div>
      <Hero at={at(4)} until={at(12) - 6} title="KEEP GOING" sub="Mac 上原有的终端 原样接续" />
      <Hero at={at(12)} until={at(20) - 6} title="RESUMED" sub="进行中的会话 原样接上" />
    </AbsoluteFill>
  );
};
