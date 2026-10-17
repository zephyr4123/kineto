import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Glyph } from "../../../engine/Glyph";
import type { Camera } from "../components/Stage";
import { MONO_STACK } from "../components/Window";
import { MODEL_ICONS, UI_ICONS } from "../icons";
import { show } from "../motion";
import { COLOR, EASE, SANS, SERIF } from "../theme";

// 第五章 一把密钥：三个"无需"排下来（不下载语音模型、不配运行环境、不注册账号）→
// 一个填密钥的框，字一个个打进去、打勾 → 一把密钥，即可开口。
// 录音连同提示词一次交给模型（SpeakMore 的 src/server/providers/gemini.mjs、openai.mjs），本机不装语音模型。
// 框里只显示 Gemini 密钥固定的开头 AIza，后面全是圆点，不是谁的真密钥。

const NEEDLESS = ["下载语音模型", "配置运行环境", "注册账号"];
const DOTS = 28;

const T = { lines: 6, linesOut: 178, field: 196, typing: [214, 252] as const, check: 258, line: 268, out: 417, end: 437 };

export const ONEKEY_FRAMES = T.end;
export const ONEKEY_CAMERA: Camera = { focus: [[0, 1]], zoom: [[0, 1]] };

export const OneKey: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.floor(interpolate(frame, T.typing, [0, DOTS], clamp));
  const check = interpolate(frame, [T.check, T.check + 18], [0, 1], { ...clamp, easing: EASE.outExpo });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {NEEDLESS.map((what, i) => (
        <div
          key={what}
          style={{ position: "absolute", left: 200, top: 300 + i * 132, fontSize: 84, fontWeight: 500, letterSpacing: "0.02em", lineHeight: 1, ...show(frame, T.lines + i * 14, T.linesOut + i * 4) }}
        >
          <span style={{ color: COLOR.muted, fontWeight: 400 }}>无需</span>
          {what}
        </div>
      ))}

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: "translateY(-30px)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ alignSelf: "flex-start", marginBottom: 18, fontSize: 26, color: COLOR.muted, letterSpacing: "0.04em", ...show(frame, T.field, T.out) }}>
            Gemini API Key
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              width: 900,
              height: 112,
              padding: "0 34px",
              borderRadius: 22,
              background: "oklch(0.2 0.008 255 / 0.72)",
              boxShadow: `0 0 0 1.5px oklch(1 0 0 / ${0.14 + 0.2 * check}), 0 24px 60px oklch(0 0 0 / 0.3)`,
              ...show(frame, T.field + 4, T.out),
            }}
          >
            <Glyph icon={MODEL_ICONS.geminiColor} size={44} />
            <span style={{ flex: 1, fontFamily: MONO_STACK, fontSize: 36, letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden" }}>
              {typed > 0 ? "AIza" : ""}
              <span style={{ color: COLOR.muted }}>{"•".repeat(Math.max(0, typed - 4))}</span>
            </span>
            <span style={{ color: COLOR.cinnabar, opacity: check, transform: `scale(${0.6 + 0.4 * check})` }}>
              <Glyph icon={UI_ICONS.check} size={44} />
            </span>
          </div>
          <div style={{ marginTop: 70, fontFamily: SERIF, fontSize: 88, fontWeight: 600, letterSpacing: "0.06em", ...show(frame, T.line, T.out) }}>
            一把密钥，即可开口。
          </div>
          <div style={{ marginTop: 34, fontSize: 30, color: COLOR.muted, letterSpacing: "0.1em", ...show(frame, T.line + 16, T.out) }}>
            Gemini 与 OpenAI，任选其一
          </div>
        </div>
      </AbsoluteFill>

      {NEEDLESS.map((_, i) => (
        <Sequence key={i} from={T.lines + i * 14 + 4} layout="none" name="sfx:tick">
          <Audio src={staticFile(assets.sfxTick)} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={T.typing[0]} durationInFrames={T.typing[1] - T.typing[0] + 6} layout="none" name="sfx:type">
        <Audio src={staticFile(assets.sfxType)} volume={0.4} />
      </Sequence>
      <Sequence from={T.check} layout="none" name="sfx:tick">
        <Audio src={staticFile(assets.sfxTick)} volume={0.45} />
      </Sequence>
      <Sequence from={T.line - 4} layout="none" name="sfx:gather">
        <Audio src={staticFile(assets.sfxGather)} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};
