import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Chapter } from "../components/Chapter";
import { Glass, Halo, Screen, type ViewKeys } from "../components/Glass";
import { Keycaps } from "../components/Keycaps";
import { Spoken } from "../components/Spoken";
import { Focus, Line, Reel } from "../components/Type";
import { Sub } from "../components/kit";
import { Chat, Mail, type Message } from "../components/windows";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS, b } from "../theme";

// 语音翻译（第 88–120 拍）：开场卡（右⌥ 空格）→ Emma 发来英文，右边说一句中文，英文落进输入框、发出去 →
// "Speak one language" / "Send another" 上下两行，各国语言的名字绕着转 → 写邮件说中文，落成西班牙文 →
// 设置 · 语音翻译 · 译成 的真截图（可设多种）；第 119 拍抽空时镜头冲进截图，第 120 拍砸下进划词翻译。
// 译文都是 App 的真实输出（混合方式整理那一步的 translate 任务，DeepSeek V4.1 Flash，2026-10-23）。
const START = 88;
const at = (n: number) => b(n - START);
export const TRANSLATE_FRAMES = b(32);

const EMMA = ["Hey! Are we still on for the demo tomorrow?", "Friday afternoon works for me too, if that's easier."];
const SAID_EN = [
  { text: "嗯，", cut: true },
  { text: "周五下午可以，三点怎么样？我提前把演示环境准备好。", cut: false },
];
const REPLY_EN = "Friday afternoon works for me. How about 3 p.m.? I'll have the demo environment ready beforehand.";
const REPLY_EN_LINES = ["Friday afternoon works for me. How about 3 p.m.?", "I'll have the demo environment ready beforehand."];
const REPLY_ES = "¡Gracias por la invitación! Llego a Madrid el próximo martes; te invito a un café cuando esté allí.";

const CHAT = { w: 1000, h: 800 };
const CHAT_VIEW: ViewKeys = [
  [at(90.4), { fx: 0.45, fy: 0.74, s: 1.16, rx: 12, ry: 16, rz: 1 }],
  [at(96), { fx: 0.5, fy: 0.64, s: 0.98, rx: 8, ry: 11 }],
  [at(102.6), { fx: 0.5, fy: 0.6, s: 0.92, rx: 6, ry: 7 }],
];
const MAIL = { w: 1060, h: 760 };
const MAIL_VIEW: ViewKeys = [
  [at(105.6), { fx: 0.3, fy: 0.3, s: 0.8, rx: 18, ry: 30 }],
  [at(107), { fx: 0.45, fy: 0.45, s: 1.08, rx: 8, ry: 10 }],
  [at(112), { fx: 0.48, fy: 0.42, s: 1.0, rx: 6, ry: 6 }],
];
const SET = { w: 1664, h: 1216 };
const SET_VIEW: ViewKeys = [
  [at(111.8), { fx: 0.6, fy: 0.6, s: 0.7, rx: 36, ry: -24 }],
  [at(113.4), { fx: 0.55, fy: 0.25, s: 1.25, rx: 14, ry: -12, rz: -1 }],
  [at(117.6), { fx: 0.5, fy: 0.3, s: 1.35, rx: 10, ry: -6 }],
  [at(120), { fx: 0.45, fy: 0.3, s: 3, rx: 4, ry: -2 }],
];

const NAMES = ["English", "日本語", "Español", "Deutsch", "Français", "Русский", "Italiano", "Português", "繁體中文", "Nederlands"];

export const Translate: React.FC = () => {
  const frame = useCurrentFrame();
  const landed = frame >= at(100);
  const sent = frame >= at(101.2);
  const messages: Message[] = [
    { from: "them", lines: ["Morning! The new slides look great."], at: -100 },
    { from: "me", lines: ["Thanks! A few final tweaks tonight."], at: -100 },
    { from: "them", lines: EMMA, at: at(91) },
    { from: "me", lines: REPLY_EN_LINES, at: at(101.2) },
  ];
  const es = frame >= at(111);

  return (
    <AbsoluteFill>
      <Chapter keys={["右 ⌥", "空格"]} name="Voice translation" zh="语音翻译" at={0} press={at(89)} out={at(90.4)} />

      {/* Emma：说中文，英文落进输入框 */}
      <Glass w={CHAT.w} h={CHAT.h} keys={CHAT_VIEW} at={at(90.4)} out={at(102.6)} x={-420} y={20} fadeIn={12}>
        <Chat w={CHAT.w} h={CHAT.h} frame={frame} name="Emma" avatar="oklch(0.62 0.12 30)" messages={messages} input={landed && !sent ? REPLY_EN : ""} placeholder="发送消息" caret />
        {landed && !sent ? (
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, height: 104, borderRadius: 20, boxShadow: `0 0 0 3px oklch(0.55 0.17 33 / ${Math.exp(-(frame - at(100)) / 12)})` }} />
        ) : null}
      </Glass>
      <Spoken parts={SAID_EN} chip="英文" at={at(92)} speak={at(92.6)} stop={at(97.2)} done={at(99.4)} land={at(100)} />

      {/* 说一种语言，写出另一种：各国语言的名字在一个斜着的椭圆上转 */}
      {frame >= at(102.4) && frame < at(106)
        ? NAMES.map((name, i) => {
            const angle = (i / NAMES.length) * Math.PI * 2 + (frame - at(102.4)) * 0.02;
            const depth = (Math.sin(angle) + 1) / 2;
            const a = prog(frame, at(102.4) + i * 2, 16) * (1 - prog(frame, at(105.2), 12));
            return (
              <span
                key={name}
                style={{
                  position: "absolute",
                  left: 960 + Math.cos(angle) * 760,
                  top: 540 + Math.sin(angle) * 250 - 10,
                  transform: `translate(-50%, -50%) scale(${0.65 + 0.6 * depth})`,
                  fontFamily: SANS,
                  fontSize: 40,
                  fontWeight: 500,
                  color: COLOR.ink2,
                  opacity: a * (0.25 + 0.5 * depth),
                  filter: `blur(${(1 - depth) * 5}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </span>
            );
          })
        : null}
      {/* 两句上下两行，先后出，不加句号 */}
      <Line out={at(105.4)} y={-80}>
        <Focus value="Speak one language" at={at(102.6)} size={84} />
      </Line>
      <Line out={at(105.4)} y={30}>
        <Focus value="Send " at={at(103.6)} size={84} />
        <Reel words={["Español", "日本語", "Deutsch", "Français", "another"]} at={at(103.7)} hold={5} size={84} land={COLOR.cinnabar} />
      </Line>
      <Line out={at(105.4)} y={130}>
        <Sub text="说一种语言　写出另一种" at={at(104.2)} size={32} />
      </Line>

      {/* 写邮件：说中文，落成西班牙文 */}
      <Glass w={MAIL.w} h={MAIL.h} keys={MAIL_VIEW} at={at(105.6)} out={at(112)} x={-420} y={20} fadeIn={14}>
        <Mail w={MAIL.w} h={MAIL.h} frame={frame} to="Lucía Martín" subject="Re: Madrid" body={es ? REPLY_ES : ""} caret />
        {es ? <div style={{ position: "absolute", inset: 0, borderRadius: 18, boxShadow: `inset 0 0 0 3px oklch(0.55 0.17 33 / ${Math.exp(-(frame - at(111)) / 12)})` }} /> : null}
      </Glass>
      <Spoken parts={[{ text: "谢谢邀请！我下周二到马德里，到时候请你喝咖啡。" }]} chip="西班牙文" at={at(106)} speak={at(106.4)} stop={at(109.2)} done={at(110.6)} land={at(111)} />

      <Keycaps
        inAt={at(91.6)}
        outAt={at(110.6)}
        caps={[
          { label: "右 ⌥", presses: [[at(92.4), at(93.2)], [at(97.2), at(98)], [at(106.2), at(107)], [at(109.2), at(110)]] },
          { label: "空格", presses: [[at(92.4), at(93.2)], [at(97.2), at(98)], [at(106.2), at(107)], [at(109.2), at(110)]] },
        ]}
      />

      {/* 设置 · 语音翻译 · 译成：可以设好几种；抽空时镜头冲进去 */}
      <Glass w={SET.w} h={SET.h} keys={SET_VIEW} at={at(111.8)} out={at(119)} fadeOut={20} y={80}>
        <Screen src={assets.appSetTranslate} w={SET.w} h={SET.h} />
        <Halo x={464} y={217} w={1136} h={70} at={at(113.6)} />
        <Halo x={464} y={295} w={1136} h={78} at={at(114.4)} />
        <Halo x={464} y={400} w={136} h={55} at={at(115.2)} radius={30} />
      </Glass>
      <Line out={at(118.6)} y={-450}>
        <span style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, letterSpacing: "-0.025em", whiteSpace: "pre", color: COLOR.cinnabar, opacity: prog(frame, at(113), 10), transform: `scale(${1.3 - 0.3 * prog(frame, at(113), 16, EASE.outExpo)})`, display: "inline-block" }}>16 </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, letterSpacing: "-0.025em", whiteSpace: "pre", color: COLOR.ink, opacity: prog(frame, at(113.4), 14) }}>target languages</span>
      </Line>
      <Line out={at(118.6)} y={-375}>
        <Sub text="设置里预设多种　说话时在悬浮条上切换" at={at(114.2)} size={30} />
      </Line>
    </AbsoluteFill>
  );
};
