import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Backdrop, Grain, Pulse, Shot } from "./components/stage";
import { Browser } from "./scenes/Browser";
import { Chat } from "./scenes/Chat";
import { Duo } from "./scenes/Duo";
import { Landscape } from "./scenes/Landscape";
import { Native } from "./scenes/Native";
import { Outro } from "./scenes/Outro";
import { Plugin } from "./scenes/Plugin";
import { Portrait } from "./scenes/Portrait";
import { Shell } from "./scenes/Shell";
import { Title } from "./scenes/Title";
import { b, MUSIC, VIDEO_FRAMES, VOLUME } from "./theme";

// 成片时间线：只排场景和配乐。场景按拍排（from / to 是片子的第几拍），全片共用一块底。
// enter / exit：场景首尾要不要「快推入、切出」；手机一镜到底接着演的场景不加，直接接上。
// 段落和音乐：前奏里立题（0–12），原版的竖屏、横屏（12–40），抽空的一小节蓄力、第一次砸下 Snug 亮相（40–60），
// 手势对照，每个动作先原版、再拨到 Snug（60–88），终端、ChatGPT（88–120，第 112 拍接进第二轮），第二次砸下进浏览器（120），插件本分、落版（140–184）。
export const SCENES = [
  { name: "Title", Scene: Title, from: 0, to: 12, enter: false, exit: false },
  { name: "Portrait", Scene: Portrait, from: 12, to: 20, enter: false, exit: false },
  { name: "Landscape", Scene: Landscape, from: 20, to: 40, enter: false, exit: false },
  { name: "Native", Scene: Native, from: 40, to: 60, enter: false, exit: false },
  { name: "Duo", Scene: Duo, from: 60, to: 88, enter: false, exit: false },
  { name: "Shell", Scene: Shell, from: 88, to: 104, enter: false, exit: false },
  { name: "Chat", Scene: Chat, from: 104, to: 120, enter: false, exit: false },
  { name: "Browser", Scene: Browser, from: 120, to: 140, enter: false, exit: false },
  { name: "Plugin", Scene: Plugin, from: 140, to: 156, enter: false, exit: true },
  { name: "Outro", Scene: Outro, from: 156, to: 184, enter: true, exit: false },
] as const;

export const SPANS = SCENES.map((s) => ({ ...s, start: b(s.from), frames: b(s.to) - b(s.from) }));

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
    </Pulse>
    <Grain />
    {/* 配乐两段：先放歌的前 112 拍，第 112 拍跳到歌的第 152 拍放到收尾，接口交叉淡化 XF 帧；接法见 theme.ts */}
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
