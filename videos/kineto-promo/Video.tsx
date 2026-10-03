import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, Series, staticFile } from "remotion";
import { assets } from "./assets.gen";
import { Chaos, FINAL, RAIN_START } from "./scenes/Chaos";
import { Continue, GO, INSERT } from "./scenes/Continue";
import { CARD, Github } from "./scenes/Github";
import { Logo, SOLID_AT } from "./scenes/Logo";
import { Prompt } from "./scenes/Prompt";
import { MUSIC_DUCK, Speedrun } from "./scenes/Speedrun";
import { SCENES, TOTAL } from "./timing";

// 成片时间线：只编排场景。场景之间全是硬切——转场都做在场景内部（压扁成地平线、投币擦除、冲上夜空），更有冲击力。
// 配乐挂在这一层（跨场景），音效各自在场景里。
export const Video: React.FC = () => {
  return (
    <AbsoluteFill>
      <Score />
      <Series>
        <Series.Sequence name="Prompt" durationInFrames={SCENES.prompt} premountFor={60}>
          <Prompt />
        </Series.Sequence>
        <Series.Sequence name="Chaos" durationInFrames={SCENES.chaos} premountFor={60}>
          <Chaos />
        </Series.Sequence>
        <Series.Sequence name="Continue" durationInFrames={SCENES.cont} premountFor={60}>
          <Continue />
        </Series.Sequence>
        <Series.Sequence name="Speedrun" durationInFrames={SCENES.speedrun} premountFor={60}>
          <Speedrun />
        </Series.Sequence>
        <Series.Sequence name="Logo" durationInFrames={SCENES.logo} premountFor={60}>
          <Logo />
        </Series.Sequence>
        <Series.Sequence name="Github" durationInFrames={SCENES.github} premountFor={60}>
          <Github />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

// 各场景在成片里的起点
const AT = {
  chaos: SCENES.prompt,
  cont: SCENES.prompt + SCENES.chaos,
  speedrun: SCENES.prompt + SCENES.chaos + SCENES.cont,
  logo: SCENES.prompt + SCENES.chaos + SCENES.cont + SCENES.speedrun,
  github: SCENES.prompt + SCENES.chaos + SCENES.cont + SCENES.speedrun + SCENES.logo,
};

// 配乐：Juhani Junkala《Stage 1》（CC0，140 BPM，41.14 秒 = 24 小节，可无缝循环）。
// - 开场放它的前奏，变天那一拍（第 10 拍）磁带骤停；第一幕只有雨声和音效
// - GO! 那一帧从第 12.0 秒（第 8 小节，能量抬升处）切进来，一路放到歌尾
// - 歌尾正好落在片尾卡片出现的那一帧，接回前奏并淡出
const FPS = 60;
const STAGE1_LOOP = 41.14288;
const HIGH_SECTION = 12.0;
const GO_ABS = AT.cont + GO;
const MAIN_FRAMES = Math.round((STAGE1_LOOP - HIGH_SECTION) * FPS);
const TAIL_AT = GO_ABS + MAIN_FRAMES;
const BEAT = (60 / 140) * FPS;

// 编排时的对拍约束：改了场景时长，这里会直接报错而不是悄悄错位
const onBar = (absFrame: number) => Math.abs((((absFrame - GO_ABS) / BEAT / 4) % 1) - 0) < 0.02;
if (!onBar(AT.logo + SOLID_AT)) throw new Error("Logo SOLID_AT 没落在小节重拍上");
if (TAIL_AT !== AT.github + CARD) throw new Error("片尾卡片没对上配乐循环点");

const ducked = (absFrame: number) => {
  let duck = 0;
  for (const [a, b] of MUSIC_DUCK) duck = Math.max(duck, interpolate(absFrame, [AT.speedrun + a, AT.speedrun + a + 8, AT.speedrun + b - 4, AT.speedrun + b + 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return 0.62 - 0.36 * duck;
};

const Score: React.FC = () => (
  <>
    <Audio src={staticFile(assets.musicOpening)} volume={0.5} />
    <Sequence from={AT.chaos + RAIN_START} durationInFrames={AT.cont + INSERT + 20 - (AT.chaos + RAIN_START)} layout="none" name="ambience:rain">
      <Audio
        src={staticFile(assets.ambRain)}
        volume={(f) => {
          const abs = f + AT.chaos + RAIN_START;
          const heavy = interpolate(abs, [AT.chaos + FINAL - 20, AT.chaos + FINAL], [0.28, 0.42], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return heavy * interpolate(f, [0, 60], [0, 1], { extrapolateRight: "clamp" }) * interpolate(abs, [AT.cont + INSERT, AT.cont + INSERT + 16], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        }}
      />
    </Sequence>
    <Sequence from={GO_ABS} durationInFrames={MAIN_FRAMES} layout="none" name="music:stage1">
      <Audio src={staticFile(assets.musicStage1)} trimBefore={HIGH_SECTION * FPS} volume={(f) => ducked(GO_ABS + f)} />
    </Sequence>
    <Sequence from={TAIL_AT} durationInFrames={TOTAL - TAIL_AT} layout="none" name="music:outro">
      <Audio src={staticFile(assets.musicStage1)} volume={(f) => interpolate(f, [0, TOTAL - TAIL_AT], [0.62, 0], { extrapolateRight: "clamp" })} />
    </Sequence>
  </>
);
