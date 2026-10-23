import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Keycaps } from "../components/Keycaps";
import { LookupCard } from "../components/LookupCard";
import { Panel } from "../components/Panel";
import { Shot } from "../components/Shot";
import { Spoken } from "../components/Spoken";
import { IBeam } from "../components/Terminal";
import { Focus, Line, Reel } from "../components/Type";
import { Sub, Tag } from "../components/kit";
import { Mail, type Message, Workspace, selHead, totalChars } from "../components/windows";
import { assets } from "../assets.gen";
import { COLOR, EASE, SANS, b } from "../theme";

// 换几种语言（第 100–136 拍）：团队工作区里同事发来日文，划词看懂、说中文回出日文；写邮件说中文落成西班牙文；
// 然后 "Speak one language. Send another."（说一种语言，写出另一种），各国语言的名字绕着转；
// 再摆上设置里"语音翻译 · 译成"那一页的真截图（可以设好几种）。最后一个夜色的圆从中间涨满画面，进暗场。
// 译文都是 App 的真实输出（DeepSeek V4.1 Flash，2026-10-23）。
const START = 100;
const at = (n: number) => b(n - START);
export const LANGUAGES_FRAMES = b(36);

const SATO = ["明日のリリース前に、最終チェックを", "お願いできますか？テスト環境はもう準備できています。"];
const SATO_ZH = "明天发布前，能麻烦你做一下最终检查吗？测试环境已经准备好了。";
const REPLY_JA = "わかりました。午後から確認を始めます。問題があればすぐにお知らせします。";
const REPLY_ES = "¡Gracias por la invitación! Llego a Madrid el próximo martes; te invito a un café cuando esté allí.";

const WIN_W = 1060;
const WIN_H = 760;
const SATO_TEXT = { x: 250 + 30 + 48 + 16, y: 52 + 524 };

const NAMES = ["English", "日本語", "Español", "Deutsch", "Français", "Русский", "Italiano", "Português", "繁體中文", "Nederlands"];

export const Languages: React.FC = () => {
  const frame = useCurrentFrame();
  const sel = Math.round(prog(frame, at(101.6), b(1.2), EASE.inOut) * totalChars(SATO));
  const head = selHead(SATO, sel, 24, 36);
  const beam = prog(frame, at(101.3), 5) * (1 - prog(frame, at(103.4), 5));
  const cardFade = 1 - prog(frame, at(105.2), 12);
  const ja = frame >= at(112);
  const es = frame >= at(120);
  const messages: Message[] = [{ from: "them", name: "佐藤", lines: SATO, at: at(100.8) }];
  const iris = prog(frame, at(134.2), b(1.8), EASE.inOut);

  // 说话、整理的这几拍里镜头一直缓缓往前推，画面不停
  const lean = 1 + 0.05 * prog(frame, at(105.6), at(120) - at(105.6), (t) => t) * (1 - prog(frame, at(120), 30, EASE.inOut));

  return (
    <AbsoluteFill style={{ transform: `scale(${lean})` }}>
      {/* 工作区：日文 */}
      <Shot x={-330} y={-20} w={WIN_W} h={WIN_H} enter={0} leave={at(113.6)} rotY={9} how="whip" kick={at(112)}>
        <Workspace w={WIN_W} h={WIN_H} frame={frame} channel="release" messages={messages} selected={sel} input={ja ? REPLY_JA : ""} placeholder="发送到 #release" caret />
        {beam > 0 ? <IBeam x={SATO_TEXT.x + head.x} y={SATO_TEXT.y + head.y} opacity={beam} /> : null}
        <div style={{ position: "absolute", left: 250 + 30, bottom: WIN_H - (52 + 496 - 10), opacity: cardFade, transform: "translateZ(40px)" }}>
          <LookupCard at={at(103)} textAt={at(103) + 16} language="简体中文" text={SATO_ZH} />
        </div>
      </Shot>
      <Tag text="Japanese" sub="日文" at={at(100.4)} out={at(113.4)} style={{ left: 140, top: 96 }} />
      <Spoken parts={[{ text: "好的，我下午就开始检查，有问题马上告诉你。" }]} chip="日文" at={at(105.8)} speak={at(106.4)} stop={at(110)} done={at(111.8)} land={at(112)} />

      {/* 邮件：西班牙文 */}
      <Shot x={-330} y={-20} w={WIN_W} h={WIN_H} enter={at(113.6)} leave={at(123.6)} rotY={9} how="flip" kick={at(120)}>
        <Mail w={WIN_W} h={WIN_H} frame={frame} to="Lucía Martín" subject="Re: Madrid" body={es ? REPLY_ES : ""} caret />
      </Shot>
      <Tag text="Spanish" sub="西班牙文" at={at(114)} out={at(123.4)} style={{ left: 140, top: 96 }} />
      <Spoken parts={[{ text: "谢谢邀请！我下周二到马德里，到时候请你喝咖啡。" }]} chip="西班牙文" at={at(114.2)} speak={at(114.8)} stop={at(118)} done={at(119.8)} land={at(120)} />

      <Keycaps inAt={at(101.4)} outAt={at(105)} caps={[{ label: "右 ⌥", presses: [[at(102.8), at(104)]] }, { label: "回车", presses: [[at(103), at(104)]] }]} />
      <Keycaps
        inAt={at(105.6)}
        outAt={at(119.4)}
        caps={[
          { label: "右 ⌥", presses: [[at(106), at(107)], [at(110), at(111)], [at(114.4), at(115.4)], [at(118), at(119)]] },
          { label: "空格", presses: [[at(106), at(107)], [at(110), at(111)], [at(114.4), at(115.4)], [at(118), at(119)]] },
        ]}
      />

      {/* 说一种语言，写出另一种：各国语言的名字在一个斜着的椭圆上转 */}
      {frame >= at(123.6) && frame < at(128.6)
        ? NAMES.map((name, i) => {
            const angle = (i / NAMES.length) * Math.PI * 2 + (frame - at(124)) * 0.018;
            const depth = (Math.sin(angle) + 1) / 2; // 0 远，1 近
            const a = prog(frame, at(123.8) + i * 2, 18) * (1 - prog(frame, at(127.8), 14));
            return (
              <span
                key={name}
                style={{
                  position: "absolute",
                  left: 960 + Math.cos(angle) * 760,
                  top: 540 + Math.sin(angle) * 260 - 10,
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
      {/* Speak one language. 虚实变焦；Send 后面那个词滚过几种语言，停在 another. */}
      <Line out={at(128.2)} y={-30}>
        <Focus value="Speak one language. " at={at(124)} size={116} />
        <Focus value="Send " at={at(125.5)} size={116} />
        <Reel words={["Español", "日本語", "Deutsch", "Français", "한국어", "another."]} at={at(125.6)} hold={6} size={116} land={COLOR.cinnabar} />
      </Line>
      <Line out={at(128.2)} y={90}>
        <Sub text="说一种语言，写出另一种" at={at(126.6)} size={38} />
      </Line>

      {/* 设置 · 语音翻译 · 译成：真截图，圈出目标语言那一栏 */}
      <Panel src={assets.appSetTranslate} w={1180} h={(1180 * 1500) / 2160} y={30} rotY={-10} rotX={7} at={at(128)} out={at(134.4)} zoom={{ at: at(129.4), dur: 44, rect: { x: 0.24, y: 0.04, w: 0.6, h: 0.4 } }} />
      <Tag text="Target languages" sub="译成，可设多种" at={at(128.6)} out={at(134)} style={{ left: 140, top: 96 }} />

      {/* 进暗场：夜色的圆从中间涨满 */}
      {iris > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 2400, height: 2400, borderRadius: "50%", background: COLOR.night, transform: `scale(${iris})`, boxShadow: `0 0 120px 40px ${COLOR.night}` }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
