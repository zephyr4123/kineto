import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Sfx } from "../components/Fx";
import { Question } from "../components/Question";
import { Lift, type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 下载：先问"模型下载缓慢？"。设置里"本地模型下载源 · 国内源（SpeakMore 的 CDN）"（真截图），圈出、抽到左边；
// 然后 README 里那张下载速度对比（2026-10-17 在国内直连实测：国内源 1.5 分钟，Hugging Face 20 分钟）从左往右展开；
// 最后首次引导里本机模型在后台下载的那一页（真截图）。

export const DOWNLOAD_FRAMES = b(16);
export const DOWNLOAD_CAMERA = deepCamera(DOWNLOAD_FRAMES);

const T = { settle: b(2.2), settings: b(2.4), spot: b(3.8), lift: b(4.2), note: b(5.2), chart: b(6.6), faster: b(9.4), guide: b(11), guideSpot: b(12) };

// 设置里下载源那一行、它的下拉框；首次引导页上模型那一行（截图像素）
const SOURCE_ROW: Rect = { x: 780, y: 756, w: 1164, h: 92 };
const SOURCE_PICK: Rect = { x: 1470, y: 764, w: 464, h: 74 };
const MODEL_ROW: Rect = { x: 480, y: 600, w: 1364, h: 160 };

const SHOT_AT = { left: 900, top: 190, width: 960 };
const LIFT_SCALE = 1.3;
const LIFT_TO = { left: 150, top: 320 };
// 下载速度对比图：先大、居中，最后缩到左边给首次引导页让位
const CHART = { w: 1440, h: 528 };
const CHART_BIG = { left: 370, top: 300, width: 1180 };
const CHART_SMALL = { left: 120, top: 260, width: 780 };
const GUIDE_AT = { left: 940, top: 150, width: 900 };

export const Download: React.FC = () => {
  const frame = useCurrentFrame();
  const settingsIn = prog(frame, T.settings, 40);
  const stage1Out = prog(frame, T.chart - 10, 26, EASE.inOut);
  const lift = prog(frame, T.lift, 40, EASE.inOut);
  const s = SHOT_AT.width / SHOTS.settings.w;
  const from = { left: SHOT_AT.left + SOURCE_PICK.x * s, top: SHOT_AT.top + SOURCE_PICK.y * s, k: s / LIFT_SCALE };

  const chartIn = prog(frame, T.chart, 30);
  // 从左往右展开：条形图像是按真实的快慢一路画过去
  const wipe = interpolate(frame, [T.chart + 6, T.chart + b(2.4)], [0, 1], { ...clamp, easing: EASE.inOut });
  const shrink = prog(frame, T.guide, 40, EASE.inOut);
  const chart = {
    left: interpolate(shrink, [0, 1], [CHART_BIG.left, CHART_SMALL.left]),
    top: interpolate(shrink, [0, 1], [CHART_BIG.top, CHART_SMALL.top]),
    width: interpolate(shrink, [0, 1], [CHART_BIG.width, CHART_SMALL.width]),
  };
  const guideIn = prog(frame, T.guide + 8, 40);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {/* 设置：下载源 */}
      {settingsIn > 0 && stage1Out < 1 ? (
        <AbsoluteFill style={{ perspective: 2200, opacity: 1 - stage1Out, transform: `translateX(${-200 * stage1Out}px)` }}>
          <Shot
            shot={SHOTS.settings}
            width={SHOT_AT.width}
            spot={{ rect: SOURCE_ROW, k: prog(frame, T.spot, 14) }}
            style={{
              left: SHOT_AT.left,
              top: SHOT_AT.top,
              opacity: settingsIn,
              transformOrigin: "100% 50%",
              transform: `translateX(${200 * (1 - settingsIn)}px) rotateY(${-16 + 10 * settingsIn}deg)`,
            }}
          />
          {lift > 0 ? (
            <Lift
              shot={SHOTS.settings}
              rect={SOURCE_PICK}
              scale={LIFT_SCALE}
              radius={16}
              style={{
                left: interpolate(lift, [0, 1], [from.left, LIFT_TO.left]),
                top: interpolate(lift, [0, 1], [from.top, LIFT_TO.top]),
                transformOrigin: "0 0",
                transform: `scale(${interpolate(lift, [0, 1], [from.k, 1])})`,
              }}
            />
          ) : null}
          <div style={{ position: "absolute", left: LIFT_TO.left, top: LIFT_TO.top + 150, textShadow: SHADOW }}>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "0.04em", ...show(frame, T.note) }}>国内源</div>
            <div style={{ marginTop: 14, fontSize: 40, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.06em", ...show(frame, T.note + 10) }}>默认启用 · 随时切换</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* 下载速度对比 */}
      {chartIn > 0 ? (
        <div
          style={{
            position: "absolute",
            ...chart,
            height: (chart.width * CHART.h) / CHART.w,
            opacity: chartIn,
            transform: `translateY(${40 * (1 - chartIn)}px)`,
            filter: "drop-shadow(0 40px 80px oklch(0 0 0 / 0.5))",
          }}
        >
          {/* 标题和底下一行注先出来，三根条从左往右画 */}
          <Img src={staticFile(assets.downloadSpeed)} style={{ position: "absolute", inset: 0, width: "100%", clipPath: `inset(0 ${100 * (1 - Math.max(wipe, 0.27))}% 0 0 round 20px)` }} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 820,
          textAlign: "center",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textShadow: SHADOW,
          opacity: prog(frame, T.faster, 10) * (1 - prog(frame, T.guide, 20)),
          transform: `scale(${punch(frame, T.faster, 0.08)})`,
        }}
      >
        快十余倍
      </div>

      {/* 首次引导：本机模型在后台下载 */}
      {guideIn > 0 ? (
        <AbsoluteFill style={{ perspective: 2200 }}>
          <Shot
            shot={SHOTS.downloading}
            width={GUIDE_AT.width}
            spot={{ rect: MODEL_ROW, k: prog(frame, T.guideSpot, 14) }}
            style={{
              left: GUIDE_AT.left,
              top: GUIDE_AT.top,
              opacity: guideIn,
              transformOrigin: "100% 50%",
              transform: `translateX(${200 * (1 - guideIn)}px) rotateY(${-16 + 10 * guideIn}deg)`,
            }}
          />
          <div style={{ position: "absolute", left: CHART_SMALL.left + 30, top: 640, textShadow: SHADOW }}>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "0.04em", ...show(frame, T.guide + 20) }}>首次引导</div>
            <div style={{ marginTop: 12, fontSize: 40, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.06em", ...show(frame, T.guide + 30) }}>后台下载 · 可先继续</div>
          </div>
        </AbsoluteFill>
      ) : null}

      <Question frame={frame} text="模型下载缓慢？" settle={T.settle} />

      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.settings} name="sfxSwish" volume={0.35} />
      <Sfx at={T.spot} name="sfxTap" volume={0.24} />
      <Sfx at={T.lift + 30} name="sfxBlip" volume={0.26} />
      <Sfx at={T.chart} name="sfxSwish" volume={0.35} />
      <Sfx at={T.chart + b(2.4)} name="sfxDing" volume={0.42} />
      <Sfx at={T.faster} name="sfxFlash" volume={0.3} />
      <Sfx at={T.guide} name="sfxSwish" volume={0.35} />
      <Sfx at={T.guideSpot} name="sfxTap" volume={0.24} />
    </AbsoluteFill>
  );
};
