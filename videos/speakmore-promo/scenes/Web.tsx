import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import type { Camera } from "../components/Stage";
import { Browser } from "../components/Window";
import { show } from "../motion";
import { COLOR, EASE, SANS, SERIF, SHADOW } from "../theme";

// 第九章 开源与官网：GitHub 上的仓库页从顶上滑到 README → 官网的窗口叠上来，从首屏往下翻到"月均成本"。
// 两张都是 Playwright 截的真页面（浅色）：GitHub 那张裁掉了它带标志的顶栏，只留仓库自己的内容。

const SHOT_W = 1440;
const W = 1060;
const H = 700;

const T = {
  github: 6,
  ghScroll: [60, 270] as const,
  site: 290,
  out: 598,
  end: 618,
};
// 官网往下翻：首屏停一会儿 → "口述随意，成文规整" → "月均成本，约 1 美元"（截图里的像素位置）
const SITE_SCROLL = { at: [350, 410, 440, 520], to: [0, 1560, 1560, 4730] };

export const WEB_FRAMES = T.end;
export const WEB_CAMERA: Camera = { focus: [[0, 0.55]], zoom: [[0, 1]] };

export const Web: React.FC = () => {
  const frame = useCurrentFrame();
  const ghScroll = interpolate(frame, T.ghScroll, [0, 1280], { ...clamp, easing: EASE.inOut });
  const siteScroll = interpolate(frame, SITE_SCROLL.at, SITE_SCROLL.to, { ...clamp, easing: EASE.inOut });
  // 官网叠上来时 GitHub 往后退：缩一点、暗一点、虚一点
  const back = interpolate(frame, [T.site, T.site + 50], [0, 1], { ...clamp, easing: EASE.inOut });
  const siteIn = interpolate(frame, [T.site, T.site + 50], [0, 1], { ...clamp, easing: EASE.outExpo });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <Lead frame={frame} at={T.github} out={T.site - 6} name="开源" lines={["源码全部公开于 GitHub", "MIT 许可"]} />
      <Lead frame={frame} at={T.site + 10} out={T.out} name="官网" lines={["speakmore.zephyrxiang.com"]} />

      <div
        style={{
          position: "absolute",
          left: 720,
          top: 196,
          width: W,
          height: H,
          ...show(frame, T.github + 4, T.out, 40),
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-50 * back}px, ${-24 * back}px) scale(${1 - 0.06 * back})`, filter: back > 0.01 ? `brightness(${1 - 0.35 * back}) blur(${3 * back}px)` : undefined }}>
          <Browser width={W} height={H} url="github.com/zephyr4123/speakmore" shot={staticFile(assets.githubShot)} shotWidth={SHOT_W} scroll={ghScroll} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 236,
          width: W,
          height: H,
          opacity: siteIn * interpolate(frame, [T.out, T.out + 22], [1, 0], clamp),
          transform: `translate(${160 * (1 - siteIn)}px, ${-16 * interpolate(frame, [T.out, T.out + 22], [0, 1], clamp)}px)`,
          filter: `blur(${10 * (1 - siteIn) + 12 * interpolate(frame, [T.out, T.out + 22], [0, 1], clamp)}px)`,
        }}
      >
        <Browser width={W} height={H} url="speakmore.zephyrxiang.com" shot={staticFile(assets.siteShot)} shotWidth={SHOT_W} scroll={siteScroll} />
      </div>

      <Sequence from={T.github} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.24} />
      </Sequence>
      <Sequence from={T.site} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.24} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 左边定调：一个大字的名字，下面一两行小字 */
const Lead: React.FC<{ frame: number; at: number; out: number; name: string; lines: readonly string[] }> = ({ frame, at, out, name, lines }) => (
  <div style={{ position: "absolute", left: 180, top: 400, textShadow: SHADOW }}>
    <div style={{ fontSize: 130, fontWeight: 600, lineHeight: 1, letterSpacing: "0.04em", ...show(frame, at, out) }}>{name}</div>
    {lines.map((line, i) => (
      <div
        key={line}
        style={{
          marginTop: i === 0 ? 44 : 18,
          fontFamily: i === 0 ? SERIF : SANS,
          fontSize: i === 0 ? 30 : 26,
          fontWeight: i === 0 ? 500 : 400,
          letterSpacing: "0.06em",
          color: "oklch(0.9 0.006 255)",
          whiteSpace: "nowrap",
          ...show(frame, at + 12 + i * 8, out),
        }}
      >
        {line}
      </div>
    ))}
  </div>
);
