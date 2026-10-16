import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Glyph } from "../components/Glyph";
import { Seal } from "../components/Seal";
import type { Camera } from "../components/Stage";
import { UI_ICONS } from "../icons";
import { show } from "../motion";
import { COLOR, EASE, SANS, SERIF } from "../theme";

// 落款：印再盖一次（和开场同一个动作），名字、口号，下面官网和 GitHub 两个地址，最底下一行"本片由 kineto 制作"，淡出。
// GitHub 的图标是 Remix Icon 的 ri:github-fill（官网页脚用的同一个）。

const T = { bars: 8, impact: 38, word: 52, links: 100, credit: 130, fade: 290, end: 330 };

export const OUTRO_FRAMES = T.end;
export const OUTRO_CAMERA: Camera = { focus: [[0, 1]], zoom: [[0, 1]] };

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [8, 4, 0, 4, 8].map((d) => interpolate(frame, [T.bars + d, T.bars + d + 26], [0, 1], { ...clamp, easing: EASE.outExpo }));
  const base = interpolate(frame, [T.impact, T.impact + 16], [0, 1], { ...clamp, easing: EASE.outQuint });
  const fade = interpolate(frame, [T.fade, T.end], [0, 1], { ...clamp, easing: EASE.inOut });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "translateY(-50px)" }}>
          <Seal size={176} bars={bars} base={base} />
          <div style={{ marginTop: 50, fontSize: 76, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1, ...show(frame, T.word) }}>SpeakMore</div>
          <div
            style={{
              marginTop: 28,
              fontFamily: SERIF,
              fontSize: 34,
              fontWeight: 500,
              letterSpacing: "0.5em",
              paddingLeft: "0.5em",
              lineHeight: 1,
              color: COLOR.muted,
              ...show(frame, T.word + 12),
            }}
          >
            开口即成文
          </div>
          <div style={{ marginTop: 76, display: "flex", alignItems: "center", fontSize: 30, color: COLOR.ink, letterSpacing: "0.02em" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 14, ...show(frame, T.links) }}>
              <Glyph icon={UI_ICONS.globe} size={30} style={{ color: COLOR.muted }} />
              speakmore.zephyrxiang.com
            </span>
            <span style={{ width: 1.5, height: 30, margin: "0 40px", background: "oklch(1 0 0 / 0.3)", ...show(frame, T.links + 6) }} />
            <span style={{ display: "flex", alignItems: "center", gap: 14, ...show(frame, T.links + 10) }}>
              <Glyph icon={UI_ICONS.github} size={30} style={{ color: COLOR.muted }} />
              github.com/zephyr4123/speakmore
            </span>
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", fontSize: 22, color: COLOR.muted, letterSpacing: "0.3em", ...show(frame, T.credit) }}>
        本片由 kineto 制作
      </div>
      <AbsoluteFill style={{ background: "oklch(0.08 0.005 255)", opacity: fade }} />

      {/* 底下垫着铺底，落印这一声比开场那次轻一点，不然峰值顶到 0 dB */}
      <Sequence from={T.impact} layout="none" name="sfx:seal">
        <Audio src={staticFile(assets.sfxSeal)} volume={0.75} />
      </Sequence>
    </AbsoluteFill>
  );
};
