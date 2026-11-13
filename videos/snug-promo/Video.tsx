import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { clamp } from "../../engine/motion";
import { assets } from "./assets.gen";
import { Backdrop, Grain, Shot } from "./components/stage";
import { AnyApp } from "./scenes/AnyApp";
import { Away } from "./scenes/Away";
import { Anywhere } from "./scenes/Anywhere";
import { Back } from "./scenes/Back";
import { Menu } from "./scenes/Menu";
import { Outro } from "./scenes/Outro";
import { PainCut } from "./scenes/PainCut";
import { PainLocked } from "./scenes/PainLocked";
import { PainSmall } from "./scenes/PainSmall";
import { Restore } from "./scenes/Restore";
import { Resume } from "./scenes/Resume";
import { Reveal } from "./scenes/Reveal";
import { Scroll } from "./scenes/Scroll";
import { Select } from "./scenes/Select";
import { Snap } from "./scenes/Snap";
import { b, MUSIC, VIDEO_FRAMES, VOLUME } from "./theme";

// 成片时间线：只排场景和配乐。场景按拍排（from / to 是片子的第几拍），全片共用一块底。
// enter / exit：场景首尾要不要「快推入、切出」；手机一直在同一个机位上接着演的场景不加，直接硬切。
// 段落和音乐：前奏里交代场景、试三条路（0–48），第一次砸下 Snug 亮相、手势、切窗口（48–144，第 112 拍重新砸下一次），
// 中段安静时在手机上敲命令接回会话（144–192），第二次砸下出门、复原、落版（192–256）。
export const SCENES = [
  { name: "Away", Scene: Away, from: 0, to: 12, enter: false, exit: false },
  { name: "PainSmall", Scene: PainSmall, from: 12, to: 24, enter: false, exit: true },
  { name: "PainLocked", Scene: PainLocked, from: 24, to: 32, enter: true, exit: true },
  { name: "PainCut", Scene: PainCut, from: 32, to: 40, enter: true, exit: true },
  { name: "Reveal", Scene: Reveal, from: 40, to: 48, enter: true, exit: false },
  { name: "Snap", Scene: Snap, from: 48, to: 64, enter: true, exit: false },
  { name: "Scroll", Scene: Scroll, from: 64, to: 72, enter: true, exit: false },
  { name: "Select", Scene: Select, from: 72, to: 80, enter: false, exit: false },
  { name: "Menu", Scene: Menu, from: 80, to: 88, enter: false, exit: false },
  { name: "Back", Scene: Back, from: 88, to: 92, enter: true, exit: false },
  { name: "AnyApp", Scene: AnyApp, from: 92, to: 144, enter: false, exit: false },
  { name: "Resume", Scene: Resume, from: 144, to: 192, enter: false, exit: true },
  { name: "Anywhere", Scene: Anywhere, from: 192, to: 208, enter: true, exit: true },
  { name: "Restore", Scene: Restore, from: 208, to: 228, enter: true, exit: true },
  { name: "Outro", Scene: Outro, from: 228, to: 256, enter: true, exit: false },
] as const;

export const SPANS = SCENES.map((s) => ({ ...s, start: b(s.from), frames: b(s.to) - b(s.from) }));

/** 配乐接口处的交叉淡化（帧） */
const XF = 2;

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: "#f4f8ff" }}>
    <Backdrop />
    {SPANS.map(({ name, Scene, start, frames, enter, exit }) => (
      <Sequence key={name} name={name} from={start} durationInFrames={frames}>
        <Shot frames={frames} enter={enter} exit={exit}>
          <Scene />
        </Shot>
      </Sequence>
    ))}
    <Grain />
    {/* 配乐两段：整首从头放，第 112 拍跳回歌的第 80 拍再放一遍后半段，接口交叉淡化 XF 帧；接法见 theme.ts */}
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
