import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Camera } from "../../../engine/camera";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Seal } from "../../../engine/speakmore/Seal";
import { DownloadPill } from "../components/Brand";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { UI } from "../icons";
import { prog, show } from "../motion";
import { COLOR, EASE, SANS, SERIF, SHADOW, b } from "../theme";

// 落款：配乐收住的那一句（7 秒），桌面慢慢清楚起来，两个下载按钮、官网、GitHub；
// 配乐重新起来的那一拍，五道声波立起来、印底落下，SpeakMore · 开口即成文，最后淡出。

const IMPACT = b(16);
export const OUTRO_FRAMES = IMPACT + 290;
/** 印底落下的那一帧（配乐重新起来的那一拍） */
export const OUTRO_IMPACT = IMPACT;

export const OUTRO_CAMERA: Camera = {
  focus: [
    [0, 1],
    [b(4), 0.45],
    [b(13), 0.45],
    [IMPACT, 0.9],
  ],
  zoom: [
    [0, 1],
    [OUTRO_FRAMES, 1.06],
  ],
};

const T = { pills: b(0.5), intel: b(1.2), site: b(2), github: b(2.6), leave: b(12.5), bars: b(14), word: IMPACT + 12, slogan: IMPACT + 28, credit: IMPACT + 70, fade: OUTRO_FRAMES - 60 };

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const leave = prog(frame, T.leave, 34, EASE.inOut);
  const fade = interpolate(frame, [T.fade, OUTRO_FRAMES - 4], [0, 1], { ...clamp, easing: EASE.inOut });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - leave, filter: leave > 0.01 ? `blur(${10 * leave}px)` : undefined, textShadow: SHADOW }}>
        <div style={{ display: "flex", gap: 20, ...show(frame, T.pills, undefined, 24) }}>
          <DownloadPill os="apple" label="下载 Apple 芯片版" light scale={1.15} />
          <DownloadPill os="windows" label="下载 Windows 版" light scale={1.15} />
        </div>
        <div style={{ marginTop: 22, fontSize: 24, color: COLOR.ink2, ...show(frame, T.intel) }}>Intel 芯片 Mac 版 →</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 92, fontSize: 52, fontWeight: 600, ...show(frame, T.site) }}>
          <Glyph icon={UI.globe} size={50} />
          speakmore.zephyrxiang.com
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, fontSize: 32, color: COLOR.ink2, ...show(frame, T.github) }}>
          <Glyph icon={UI.github} size={32} />
          github.com/zephyr4123/speakmore
        </div>
      </AbsoluteFill>

      {frame >= T.bars ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ marginTop: -150 }}>
            <Seal
              size={230}
              bars={[0, 1, 2, 3, 4].map((i) => prog(frame, T.bars + i * 7, 30, EASE.outQuint))}
              base={interpolate(frame, [IMPACT - 2, IMPACT + 6], [0, 1], { ...clamp, easing: EASE.outQuint })}
            />
          </div>
          <div style={{ marginTop: 44, fontSize: 92, fontWeight: 700, letterSpacing: "0.01em", textShadow: SHADOW, ...show(frame, T.word) }}>SpeakMore</div>
          <div style={{ marginTop: 14, fontFamily: SERIF, fontSize: 56, fontWeight: 600, letterSpacing: "0.3em", color: COLOR.ink2, textShadow: SHADOW, ...show(frame, T.slogan) }}>
            开口即成文
          </div>
          <div style={{ position: "absolute", bottom: 62, fontSize: 22, color: COLOR.faint, letterSpacing: "0.08em", ...show(frame, T.credit) }}>本片由 kineto 制作</div>
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill style={{ background: `oklch(0 0 0 / ${fade})` }} />
      <Flash frame={frame} at={[IMPACT]} strength={0.3} dur={20} />
      <Sfx at={T.pills} name="sfxNote0" volume={0.2} />
      <Sfx at={T.site} name="sfxNote2" volume={0.2} />
      <Sfx at={swellBefore(IMPACT)} name="sfxSwell" volume={0.45} />
      <Sfx at={IMPACT} name="sfxSeal" volume={0.6} />
    </AbsoluteFill>
  );
};
