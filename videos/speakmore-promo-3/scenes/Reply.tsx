import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Keycaps } from "../components/Keycaps";
import { LookupCard } from "../components/LookupCard";
import { Shot } from "../components/Shot";
import { Spoken } from "../components/Spoken";
import { IBeam } from "../components/Terminal";
import { Typewriter } from "../components/Type";
import { Sub, rise } from "../components/kit";
import { Chat, type Message, selHead, totalChars } from "../components/windows";
import { COLOR, DISPLAY, EASE, b } from "../theme";

// 回复（第 64–100 拍）："Reading is only half."（看懂，只是一半）→ 左边一个聊天窗，Emma 发来一句英文：划选、右⌥ 回车，卡片给出中文；
// 再按右⌥ 空格，右边说一句中文（带一个"嗯"），悬浮条整理；第 96 拍砸下，英文落进输入框，随后发出去。
// 译文都是 App 的真实输出（DeepSeek V4.1 Flash，2026-10-23）：划词走 lookup 翻译器，语音翻译走混合方式整理那一步的 translate 任务。
const START = 64;
const at = (n: number) => b(n - START);
export const REPLY_FRAMES = b(36);

const EMMA = ["Hey! Are we still on for the demo tomorrow?", "Friday afternoon works for me too, if that's easier."];
const EMMA_ZH = "嘿！明天的演示还照常吗？周五下午我也方便，如果你那边更合适的话。";
const SAID = [
  { text: "嗯，", cut: true },
  { text: "周五下午可以，三点怎么样？我提前把演示环境准备好。", cut: false },
];
const REPLY = "Friday afternoon works for me. How about 3 p.m.? I'll have the demo environment ready beforehand.";
const REPLY_LINES = ["Friday afternoon works for me. How about 3 p.m.?", "I'll have the demo environment ready beforehand."];

const CHAT_W = 1000;
const CHAT_H = 800;
// Emma 那条气泡里文字的左上角（窗口坐标）：消息区贴底排，气泡在输入框上面
const EMMA_TEXT = { x: 50, y: 52 + 528 + 14 };

export const Reply: React.FC = () => {
  const frame = useCurrentFrame();
  const sel = Math.round(prog(frame, at(71.2), b(1.6), EASE.inOut) * totalChars(EMMA));
  const head = selHead(EMMA, sel, 25 * 0.53, 38);
  const beam = prog(frame, at(70.9), 5) * (1 - prog(frame, at(73.6), 5));
  const cardFade = 1 - prog(frame, at(78.4), 12);
  const landed = frame >= at(96);
  const sent = frame >= at(97.8);
  const messages: Message[] = [
    { from: "them", lines: ["Morning! The new slides look great."], at: -100 },
    { from: "me", lines: ["Thanks! A few final tweaks tonight."], at: -100 },
    { from: "them", lines: EMMA, at: at(69) },
    { from: "me", lines: REPLY_LINES, at: at(97.8) },
  ];

  // 说话、整理的这几拍里镜头一直缓缓往前推，画面不停
  const lean = 1 + 0.05 * prog(frame, at(80), at(96) - at(80), (t) => t) * (1 - prog(frame, at(96), 30, EASE.inOut));

  return (
    <AbsoluteFill style={{ transform: `scale(${lean})` }}>
      {/* Reading is only half.："half." 上下两半错开着到 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: "translateY(-10px)", opacity: 1 - prog(frame, at(67.6), 12) }}>
        <div style={{ marginRight: 320, width: 980, textAlign: "right" }}>
          <Typewriter value="Reading is only" at={2} frames={22} size={120} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: "translateY(-10px)" }}>
        <div style={{ position: "relative", marginLeft: 1010, fontFamily: DISPLAY, fontSize: 120, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.cinnabar, ...rise(frame, at(65.5), at(67.6)) }}>
          <span style={{ clipPath: "inset(0 0 50% 0)", display: "inline-block", transform: `translateY(${-30 * (1 - prog(frame, at(65.5), 14))}px)` }}>half.</span>
          <span style={{ position: "absolute", left: 0, top: 0, clipPath: "inset(50% 0 0 0)", display: "inline-block", transform: `translateY(${40 * (1 - prog(frame, at(66), 14))}px)` }}>half.</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: "translateY(110px)" }}>
        <Sub text="看懂，只是一半" at={at(66)} out={at(67.6)} size={36} />
      </AbsoluteFill>

      {/* 聊天窗 */}
      <Shot x={-330} y={-20} w={CHAT_W} h={CHAT_H} enter={at(67.6)} leave={at(99.3)} rotY={9} how="whip" kick={at(96)}>
        <Chat
          w={CHAT_W}
          h={CHAT_H}
          frame={frame}
          name="Emma"
          avatar="oklch(0.62 0.12 30)"
          messages={messages}
          selected={sel}
          selectIndex={2}
          input={landed && !sent ? REPLY : ""}
          placeholder="发送消息"
          caret
        />
        {beam > 0 ? <IBeam x={EMMA_TEXT.x + head.x} y={EMMA_TEXT.y + head.y} opacity={beam} /> : null}
        {/* 下方放不下，卡片翻到选区上方（同 App 的 place.mjs） */}
        <div style={{ position: "absolute", left: 30, bottom: CHAT_H - (52 + 528 - 12), opacity: cardFade, transform: "translateZ(40px)" }}>
          <LookupCard at={at(74)} textAt={at(74) + 16} language="简体中文" text={EMMA_ZH} />
        </div>
        {/* 译文落进输入框的那一下：输入框亮一圈 */}
        {landed && !sent ? (
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, height: 104, borderRadius: 20, pointerEvents: "none", boxShadow: `0 0 0 3px oklch(0.55 0.17 33 / ${Math.exp(-(frame - at(96)) / 12)})` }} />
        ) : null}
      </Shot>

      {/* 右边：口述的那句中文和悬浮条 */}
      <Spoken parts={SAID} chip="英文" at={at(80)} speak={at(80.6)} stop={at(89)} done={at(94.8)} land={at(96)} />

      <Keycaps inAt={at(71)} outAt={at(76)} caps={[{ label: "右 ⌥", presses: [[at(73.8), at(75)]] }, { label: "回车", presses: [[at(74), at(75)]] }]} />
      <Keycaps
        inAt={at(79)}
        outAt={at(91.5)}
        caps={[
          { label: "右 ⌥", presses: [[at(80), at(81)], [at(89), at(90)]] },
          { label: "空格", presses: [[at(80), at(81)], [at(89), at(90)]] },
        ]}
      />
    </AbsoluteFill>
  );
};
