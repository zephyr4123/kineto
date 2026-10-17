import { Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { COLOR } from "../theme";

// App 的真截图（SpeakMore 官网和 README 用的那一套，两倍图，窗口外框和阴影画在透明底上）。
// 三样用法：整张摆进画面（Shot）、圈出其中一块并压暗其余（Shot 的 spot）、把其中一块单独抽出来放大（Lift）。
// 坐标一律是截图自己的像素。

export type ShotSpec = { src: string; w: number; h: number };
export type Rect = { x: number; y: number; w: number; h: number };

/** 外框在两倍图上占的边：四边各 80 像素透明（阴影画在里面），窗口圆角 24 */
const PAD = 80;
const RADIUS = 24;

export const SHOTS = {
  cost: { src: assets.appCost, w: 2320, h: 2000 },
  downloading: { src: assets.appDownloading, w: 2320, h: 1960 },
  history: { src: assets.appHistory, w: 2320, h: 1660 },
  keys: { src: assets.appKeys, w: 2320, h: 2160 },
  models: { src: assets.appModels, w: 2320, h: 1660 },
  modePicker: { src: assets.appModePicker, w: 2320, h: 1660 },
  polish: { src: assets.appPolish, w: 2320, h: 2160 },
  preparePrivate: { src: assets.appPreparePrivate, w: 2320, h: 1660 },
  presets: { src: assets.appPresets, w: 2320, h: 2160 },
  settings: { src: assets.appSettings, w: 2320, h: 1660 },
  transcribe: { src: assets.appTranscribe, w: 2320, h: 2160 },
  way: { src: assets.appWay, w: 2320, h: 1660 },
} as const satisfies Record<string, ShotSpec>;

/** 截图按 width 摆出来时，图上的一块落在画面上的哪里（相对于 Shot 的左上角） */
export const rectOn = (shot: ShotSpec, width: number, r: Rect) => {
  const s = width / shot.w;
  return { left: r.x * s, top: r.y * s, width: r.w * s, height: r.h * s };
};

/**
 * 一张截图。spot 给了就圈出那一块：其余压暗（k 是圈出的程度 0–1），框上一道朱砂的细线。
 * style 里放位置和动作（left、top、transform、opacity……）
 */
export const Shot: React.FC<{ shot: ShotSpec; width: number; spot?: { rect: Rect; k: number; ring?: number }; style?: React.CSSProperties }> = ({
  shot,
  width,
  spot,
  style,
}) => {
  const s = width / shot.w;
  const inset = PAD * s;
  return (
    <div style={{ position: "absolute", width, height: shot.h * s, ...style }}>
      <Img src={staticFile(shot.src)} style={{ position: "absolute", left: 0, top: 0, width }} />
      {spot && spot.k > 0.001 ? (
        <div style={{ position: "absolute", inset, borderRadius: RADIUS * s, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: (spot.rect.x - PAD) * s,
              top: (spot.rect.y - PAD) * s,
              width: spot.rect.w * s,
              height: spot.rect.h * s,
              borderRadius: 14 * s + 4,
              boxShadow: `0 0 0 4000px oklch(0.16 0.02 255 / ${0.5 * spot.k}), 0 0 0 ${3 * (spot.ring ?? spot.k)}px ${COLOR.cinnabar}, 0 0 30px ${8 * (spot.ring ?? spot.k)}px oklch(0.74 0.17 32 / 0.25)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

/**
 * 截图里的一块单独抽出来：按 scale 放大成一张浮起来的卡片（底色照截图本身，圆角、阴影）。
 * 位置、动作放 style 里；卡片大小是 rect 乘 scale
 */
export const Lift: React.FC<{ shot: ShotSpec; rect: Rect; scale: number; style?: React.CSSProperties; radius?: number }> = ({ shot, rect, scale, style, radius = 18 }) => (
  <div
    style={{
      position: "absolute",
      width: rect.w * scale,
      height: rect.h * scale,
      borderRadius: radius,
      overflow: "hidden",
      background: COLOR.paper,
      boxShadow: "0 0 0 1px oklch(0 0 0 / 0.08), 0 30px 80px oklch(0 0 0 / 0.5)",
      ...style,
    }}
  >
    <Img src={staticFile(shot.src)} style={{ position: "absolute", left: -rect.x * scale, top: -rect.y * scale, width: shot.w * scale, maxWidth: "none" }} />
  </div>
);
