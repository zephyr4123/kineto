import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Backdrop, Grain, Pulse, Shot } from "./components/stage";
import { CARD_POST, CARD_PRE } from "./components/chapter";
import { BOX_HANDOFF_BEAT, BoxCard } from "./scenes/BoxCard";
import { Browser } from "./scenes/Browser";
import { Chat } from "./scenes/Chat";
import { Duo } from "./scenes/Duo";
import { GesturesCard } from "./scenes/GesturesCard";
import { Landscape } from "./scenes/Landscape";
import { Native } from "./scenes/Native";
import { Outro } from "./scenes/Outro";
import { Plugin } from "./scenes/Plugin";
import { Portrait } from "./scenes/Portrait";
import { Shell } from "./scenes/Shell";
import { SwitchCard } from "./scenes/SwitchCard";
import { Title } from "./scenes/Title";
import { WindowsCard } from "./scenes/WindowsCard";
import { b, MUSIC, VIDEO_FRAMES, VOLUME } from "./theme";

// 成片时间线：只排场景、章节卡和配乐。场景按拍排（from / to 是片子的第几拍），全片共用一块底。
// enter / exit：场景首尾要不要「快推入、切出」；手机一镜到底接着演的、或者首尾被章节卡盖住的场景不加，直接接上。
// 段落和音乐：前奏里立题（0–12），原版的竖屏、横屏（12–40），抽空的一小节蓄力、第一次砸下 Snug 亮相（40–60），
// 01 原生手势：章节卡（60–64）、滚动和拷贝的对照（64–84）；02 流转自如：章节卡（84–88）、切窗口的对照（88–96）；
// 03 万窗皆宜：章节卡（96–104，第一次砸下的最后一小节和渐弱收住），终端（104–120，歌的低沉段），ChatGPT（120–136，蓄力、抽空），
// 第二次砸下进浏览器（136–156）；04 开箱即用：章节卡（156 起 2.4 拍）接安装、断开即复原（156–172）；落版（172–200）。
export const SCENES = [
  { name: "Title", Scene: Title, from: 0, to: 12, enter: false, exit: false },
  { name: "Portrait", Scene: Portrait, from: 12, to: 20, enter: false, exit: false },
  { name: "Landscape", Scene: Landscape, from: 20, to: 40, enter: false, exit: false },
  { name: "Native", Scene: Native, from: 40, to: 60, enter: false, exit: false },
  { name: "Duo", Scene: Duo, from: 64, to: 96, enter: false, exit: false },
  { name: "Shell", Scene: Shell, from: 104, to: 120, enter: false, exit: false },
  { name: "Chat", Scene: Chat, from: 120, to: 136, enter: false, exit: false },
  { name: "Browser", Scene: Browser, from: 136, to: 156, enter: false, exit: false },
  { name: "Plugin", Scene: Plugin, from: 156, to: 172, enter: false, exit: true },
  { name: "Outro", Scene: Outro, from: 172, to: 200, enter: true, exit: false },
] as const;

export const SPANS = SCENES.map((s) => ({ ...s, start: b(s.from), frames: b(s.to) - b(s.from) }));

/**
 * 章节卡：叠在场景上面，比它那一段的第一拍早 CARD_PRE 帧进场（盖住上一段的结尾），段落结束后再用 post 帧退场（露出下一段的开头）。
 * 「流转自如」盖在手势对照那一段中间；「万窗皆宜」最后停在终端那一段第 0 帧的样子，「开箱即用」把图标交给安装那一段，这两张不用退场。
 */
export const CARDS = [
  { name: "GesturesCard", Card: GesturesCard, from: 60, to: 64, post: CARD_POST },
  { name: "SwitchCard", Card: SwitchCard, from: 84, to: 88, post: CARD_POST },
  { name: "WindowsCard", Card: WindowsCard, from: 96, to: 104, post: 0 },
  { name: "BoxCard", Card: BoxCard, from: 156, to: 156 + BOX_HANDOFF_BEAT, post: 0 },
] as const;

export const CARD_SPANS = CARDS.map((c) => ({ ...c, start: b(c.from) - CARD_PRE, frames: CARD_PRE + b(c.to) - b(c.from) + c.post }));

/** 配乐接口处的交叉淡化（帧） */
const XF = 2;

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: "#f4f8ff" }}>
    <Backdrop />
    <Pulse>
      {SPANS.map(({ name, Scene, start, frames, enter, exit }) => (
        <Sequence key={name} name={name} from={start} durationInFrames={frames}>
          <Shot frames={frames} enter={enter} exit={exit}>
            <Scene />
          </Shot>
        </Sequence>
      ))}
      {CARD_SPANS.map(({ name, Card, start, frames }) => (
        <Sequence key={name} name={name} from={start} durationInFrames={frames}>
          <Card />
        </Sequence>
      ))}
    </Pulse>
    <Grain />
    {/* 配乐三段，在小节头上剪掉歌里重复的小节，接口交叉淡化 XF 帧；接法见 theme.ts */}
    {MUSIC.map((m, i) => {
      const from = i === 0 ? 0 : m.from - XF;
      const to = i === MUSIC.length - 1 ? VIDEO_FRAMES : MUSIC[i + 1].from + XF;
      const len = to - from;
      const fadeIn = i === 0 ? 1 : 2 * XF;
      const fadeOut = i === MUSIC.length - 1 ? 12 : 2 * XF;
      return (
        <Sequence key={m.from} name={`music-${i + 1}`} from={from} durationInFrames={len}>
          <Audio
            src={staticFile(assets.song)}
            trimBefore={from + m.shift}
            volume={(f) => interpolate(f, [0, fadeIn, len - fadeOut, len], [0, VOLUME, VOLUME, 0], clamp)}
          />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
