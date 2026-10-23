import { useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "../../../engine/motion";
import { COLOR, EASE, SANS } from "../theme";
import { Glass, type ViewKeys } from "./Glass";
import { LookupCard } from "./LookupCard";
import { Said, type SaidPart } from "./Said";
import { TalkBar } from "./TalkBar";
import { IBeam, PULL_FATAL, Terminal, cardAnchor, selectTotal, selectionHead, termSize } from "./Terminal";
import { Chat, type Message, Notes } from "./windows";

// 开场三个主角词下面各演一小段 App 用起来的样子（只留最要紧的一步，细节留给后面的章节）：
// 语音输入（说一大段，字幕逐字出来，语气词炸散、空隙合拢，备忘录里落成编号的几条）、
// 语音翻译（说的中文以字幕逐字出现，聊天输入框里落下来的是英文）、终端里划选一行报错，卡片从选区下长出来给出译文。
// 画面上方留给主角词，窗口居中斜放，悬浮条在最下面。

const NOTES = { w: 760, h: 450 };

export type DictateTiming = {
  /** 窗口和悬浮条进场 */
  at: number;
  /** 开始说、再按一次热键、语气词炸散、字幕沉下去（成品一条条落进备忘录）、整段退场 */
  speak: number;
  stop: number;
  burst: number;
  land: number;
  out: number;
};

/** 语音输入：上面是说的话（Said：浅灰的语气词炸散、空隙合拢），下面备忘录里落成几条；lines 是 App 整理出的成品，一行一条 */
export const DictateGlimpse: React.FC<{ parts: readonly SaidPart[]; title: string; lines: readonly string[]; timing: DictateTiming }> = ({ parts, title, lines, timing: t }) => {
  const frame = useCurrentFrame();
  if (frame < t.at || frame > t.out + 20) return null;
  const keys: ViewKeys = [
    [t.at, { fx: 0.5, fy: 0.5, s: 1.2, rx: 14, ry: -14, rz: -1.2 }],
    [t.land, { fx: 0.5, fy: 0.52, s: 1.3, rx: 8, ry: -8, rz: -0.4 }],
    [t.out + 14, { fx: 0.5, fy: 0.53, s: 1.34, rx: 6, ry: -5 }],
  ];
  return (
    <>
      <Glass w={NOTES.w} h={NOTES.h} keys={keys} at={t.at} out={t.out} fadeIn={14} y={130}>
        <Notes w={NOTES.w} h={NOTES.h} frame={frame} title={title} lines={lines.map((text, i) => ({ text, at: t.land + 6 + i * 10 }))} caret />
      </Glass>
      {frame < t.out ? <Said parts={parts} at={t.at + 6} speak={t.speak} stop={t.stop} burst={t.burst} land={t.land} size={36} y={-205} seed="glimpse" /> : null}
    </>
  );
};

const CHAT = { w: 940, h: 340 };
/** 聊天窗口里输入框的位置（Chat 的输入框贴底，左右下各留 24） */
const INPUT = { inset: 24, h: 68 };

export type TranslateTiming = {
  /** 窗口和悬浮条进场 */
  at: number;
  /** 开始说、再按一次热键、打勾、成品落进输入框、整段退场 */
  speak: number;
  stop: number;
  done: number;
  land: number;
  out: number;
};

/** 语音翻译：聊天窗口 + 悬浮条，说的中文在悬浮条上方逐字出字幕，chip 是译成哪种语言，result 是落进输入框的译文 */
export const TranslateGlimpse: React.FC<{
  name: string;
  avatar: string;
  incoming: string;
  said: string;
  chip: string;
  result: string;
  timing: TranslateTiming;
}> = ({ name, avatar, incoming, said, chip, result, timing: t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < t.at || frame > t.out + 20) return null;
  const talking = frame >= t.speak && frame < t.stop;
  const level = talking ? 0.55 + 0.35 * Math.abs(Math.sin(frame / 5.3)) * (0.6 + 0.4 * Math.sin(frame / 13)) : 0;
  const landed = frame >= t.land;
  const messages: Message[] = [{ from: "them", lines: [incoming], at: t.at + 8 }];
  // 斜放的窗口慢慢转正、推近一点（和语音输入那段往反方向斜）
  const keys: ViewKeys = [
    [t.at, { fx: 0.5, fy: 0.56, s: 1.38, rx: 14, ry: 16, rz: 1.5 }],
    [t.land, { fx: 0.5, fy: 0.6, s: 1.5, rx: 8, ry: 8, rz: 0.5 }],
    [t.out + 14, { fx: 0.5, fy: 0.62, s: 1.55, rx: 6, ry: 5 }],
  ];
  return (
    <>
      <Glass w={CHAT.w} h={CHAT.h} keys={keys} at={t.at} out={t.out} fadeIn={14} y={40}>
        <Chat w={CHAT.w} h={CHAT.h} frame={frame} name={name} avatar={avatar} messages={messages} input={landed ? result : ""} placeholder="发送消息" caret />
        {landed ? (
          <div style={{ position: "absolute", left: INPUT.inset, right: INPUT.inset, bottom: INPUT.inset, height: INPUT.h, borderRadius: 20, boxShadow: `0 0 0 3px oklch(0.55 0.17 33 / ${Math.exp(-(frame - t.land) / 12)})` }} />
        ) : null}
      </Glass>
      <Caption text={said} speak={t.speak} stop={t.stop} out={t.land} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center" }}>
        <TalkBar frame={frame} fps={fps} at={t.at + 6} out={t.land + 6} chip={chip} level={level} timing={{ press: t.stop, finishing: t.stop + 4, done: t.done }} />
      </div>
    </>
  );
};

/** 字幕：说的时候一个字一个字出来，后面跟着朱砂色的光标；成品落下时虚掉 */
const Caption: React.FC<{ text: string; speak: number; stop: number; out: number }> = ({ text, speak, stop, out }) => {
  const frame = useCurrentFrame();
  const chars = [...text];
  const shown = Math.round(prog(frame, speak, stop - speak - 4, (t) => t) * chars.length);
  const z = prog(frame, out - 4, 12);
  if (frame < speak || z >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 802, display: "flex", justifyContent: "center", opacity: 1 - z, filter: z > 0 ? `blur(${6 * z}px)` : undefined, transform: `translateY(${-10 * z}px)` }}>
      <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 500, color: COLOR.ink, whiteSpace: "pre" }}>
        {chars.slice(0, shown).join("")}
        {frame < stop ? <span style={{ display: "inline-block", width: 3, height: 38, marginLeft: 4, verticalAlign: "-6px", background: COLOR.cinnabar, opacity: Math.floor(frame / 15) % 2 ? 0.3 : 1 }} /> : null}
      </span>
    </div>
  );
};

const TERM = termSize(PULL_FATAL);
const TERM_CARD = cardAnchor(PULL_FATAL);

export type SelectTiming = {
  at: number;
  /** 从这一帧起拖选，选 dur 帧 */
  select: number;
  dur: number;
  /** 卡片弹出、译文换上、整段退场 */
  card: number;
  text: number;
  out: number;
};

/** 终端里划选一行报错，卡片从选区下长出来 */
export const SelectGlimpse: React.FC<{ result: string; timing: SelectTiming }> = ({ result, timing: t }) => {
  const frame = useCurrentFrame();
  if (frame < t.at || frame > t.out + 20) return null;
  const selected = Math.round(prog(frame, t.select, t.dur, EASE.inOut) * selectTotal(PULL_FATAL));
  const head = selectionHead(PULL_FATAL, selected);
  const beam = prog(frame, t.select - 6, 6) * (1 - prog(frame, t.card, 6));
  const keys: ViewKeys = [
    [t.at, { fx: 0.42, fy: 0.42, s: 1.32, rx: 14, ry: 16, rz: 1.5 }],
    [t.card, { fx: 0.45, fy: 0.5, s: 1.4, rx: 9, ry: 9, rz: 0.5 }],
    [t.out + 14, { fx: 0.46, fy: 0.52, s: 1.44, rx: 7, ry: 6 }],
  ];
  return (
    <Glass w={TERM.w} h={TERM.h} keys={keys} at={t.at} out={t.out} radius={18} fadeIn={14} y={80}>
      <Terminal page={PULL_FATAL} selected={selected}>
        {beam > 0 ? <IBeam x={head.x} y={head.y} opacity={beam} /> : null}
        <div style={{ position: "absolute", left: TERM_CARD.x, top: TERM_CARD.y }}>
          <LookupCard at={t.card} textAt={t.text} language="简体中文" text={result} />
        </div>
      </Terminal>
    </Glass>
  );
};
