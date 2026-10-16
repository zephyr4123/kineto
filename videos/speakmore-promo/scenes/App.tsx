import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import type { Camera } from "../components/Stage";
import { show } from "../motion";
import { BEAT, COLOR, EASE, SANS, SERIF, SHADOW } from "../theme";

// 第四章 主窗口：真的主窗口浮在桌面上——首页（字数、语速、热力图、花费）→ 点到历史 →
// 三套主题、深浅两色踩着拍子一张张换。截图是 SpeakMore 的真页面（src/renderer/hub）在 Electron 里离屏渲染的，
// 数据是造的（照官网截图脚本），耗时按本机真实记录造成 3.5 秒左右，不比真的快。
// 时间都按拍算：这一章从一个小节的第一拍起，历史在第 3 拍，换主题从第 5 拍半起、每半拍换一张。

const WIN = { width: 1080, height: 750 };
const T = {
  in: 6,
  history: Math.round(3 * BEAT),
  themes: Math.round(5 * BEAT),
  out: Math.round(7.5 * BEAT),
  end: Math.round(8 * BEAT),
};
const THEMES = [
  assets.appHomeLightInk,
  assets.appHomeDarkInk,
  assets.appHomeLightIndigo,
  assets.appHomeDarkIndigo,
  assets.appHomeDarkCinnabar,
  assets.appHomeLightCinnabar,
];
const flipAt = (i: number) => Math.round(T.themes + (i * BEAT) / 2);

export const APP_FRAMES = T.end;
export const APP_CAMERA: Camera = { focus: [[0, 0.55]], zoom: [[0, 1]] };

export const App: React.FC = () => {
  const frame = useCurrentFrame();
  // 每张截图到点后 5 帧内盖到上一张上面，下一张盖满之后再让开，换的时候不露底
  const shots = [
    { src: assets.appHomeLightCinnabar, from: 0, to: T.history },
    { src: assets.appHistory, from: T.history, to: T.themes },
    ...THEMES.map((src, i) => ({ src, from: flipAt(i), to: i === THEMES.length - 1 ? T.end : flipAt(i + 1) })),
  ];
  // 窗口一直极慢地往前推一点
  const push = 1 + 0.025 * interpolate(frame, [0, T.end], [0, 1], { ...clamp, easing: EASE.inOut });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <div style={{ position: "absolute", left: 180, top: 400, textShadow: SHADOW }}>
        <div style={{ fontSize: 120, fontWeight: 600, lineHeight: 1, letterSpacing: "0.04em", ...show(frame, T.in, T.out) }}>主窗口</div>
        {[
          { text: "字数、语速、花费，一页尽览", at: T.in + 12, out: T.history - 6 },
          { text: "每一句话，皆有记录", at: T.history + 4, out: T.themes - 6 },
          { text: "三套主题，深浅随系统", at: T.themes + 4, out: T.out },
        ].map((line) => (
          <div
            key={line.text}
            style={{
              position: "absolute",
              top: 164,
              fontFamily: SERIF,
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "oklch(0.9 0.006 255)",
              whiteSpace: "nowrap",
              ...show(frame, line.at, line.out),
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 700, top: 166, width: WIN.width, height: WIN.height, ...show(frame, T.in, T.out, 40) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            overflow: "hidden",
            transform: `scale(${push})`,
            boxShadow: "0 0 0 1px oklch(0 0 0 / 0.12), 0 34px 90px oklch(0 0 0 / 0.42), 0 10px 26px oklch(0 0 0 / 0.24)",
          }}
        >
          {shots.map(({ src, from, to }) => {
            const o = interpolate(frame, [from, from + 5, to, to + 5], [0, 1, 1, 0], clamp);
            return o > 0 ? <Img key={src} src={staticFile(src)} style={{ position: "absolute", inset: 0, width: WIN.width, height: WIN.height, opacity: o }} /> : null;
          })}
          {/* 真窗口的红绿灯在侧栏左上角（src/app/main.mjs 的 trafficLightPosition: 26, 24） */}
          <span style={{ position: "absolute", left: 26, top: 24, display: "flex", gap: 8 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <i key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, boxShadow: "inset 0 0 0 0.5px oklch(0 0 0 / 0.15)" }} />
            ))}
          </span>
        </div>
      </div>

      <Sequence from={T.in} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.22} />
      </Sequence>
      <Sequence from={T.history} layout="none" name="sfx:tick">
        <Audio src={staticFile(assets.sfxTick)} volume={0.32} />
      </Sequence>
      {THEMES.map((_, i) => (
        <Sequence key={i} from={flipAt(i)} layout="none" name="sfx:tick">
          <Audio src={staticFile(assets.sfxTick)} volume={0.26} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
