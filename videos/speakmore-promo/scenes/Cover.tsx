import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { AppShot, AppWindow } from "../components/AppWindow";
import { Bar } from "../../../engine/speakmore/Bar";
import { Desktop } from "../components/Desktop";
import { Seal } from "../../../engine/speakmore/Seal";
import { COLOR, SANS, SERIF, SHADOW } from "../theme";

// 发布用的封面：真桌面压暗做底；一边是印章、SpeakMore、开口即成文和一行卖点，另一边浮着真的主窗口，
// 悬浮条正在听写。横版 16:9（B 站 / 视频号 / X），竖版 3:4（小红书）。卖点都是片子里讲过的：
// 开源（MIT）、一把 Gemini 或 OpenAI 的密钥就能用、按量计费每月约一美元。

const FULL = [1, 1, 1, 1, 1];
const POINTS = "开源 · 一把密钥即用 · 每月约一美元";
// 悬浮条停在说话的样子：完成键还没按（interpolate 不收 Infinity，给一个远在后面的帧）
const LISTENING = { press: 1e6, finishing: 1e6, done: 1e6 };

/** 品牌那一组：印章、名字、口号、卖点。size 是名字的字号，其余按它配 */
const Lockup: React.FC<{ size: number; align: "left" | "center" }> = ({ size, align }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center", textShadow: SHADOW }}>
    <Seal size={size * 1.1} bars={FULL} base={1} />
    <div style={{ marginTop: size * 0.36, fontSize: size, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1 }}>SpeakMore</div>
    <div style={{ marginTop: size * 0.32, fontFamily: SERIF, fontSize: size * 0.36, fontWeight: 500, letterSpacing: "0.5em", marginRight: align === "center" ? "-0.5em" : 0 }}>开口即成文</div>
    <div style={{ marginTop: size * 0.5, fontSize: size * 0.22, color: "oklch(0.88 0.008 255)", letterSpacing: "0.08em" }}>{POINTS}</div>
  </div>
);

const Window: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
  <AppWindow x={x} y={y} scale={scale}>
    <AppShot src={assets.appHomeLightCinnabar} />
  </AppWindow>
);

const Listening: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})` }}>
    <Bar frame={40} fps={60} level={0.85} timing={LISTENING} />
  </div>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
    <Desktop focus={0.62} />
    <div style={{ position: "absolute", left: 150, top: 236 }}>
      <Lockup size={128} align="left" />
    </div>
    <Window x={1350} y={470} scale={0.64} />
    <Listening x={1350} y={712} scale={1} />
  </AbsoluteFill>
);

export const CoverPortrait: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
    <Desktop focus={0.62} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
      <Lockup size={112} align="center" />
    </div>
    <Window x={540} y={975} scale={0.8} />
    <Listening x={540} y={1272} scale={1} />
  </AbsoluteFill>
);
