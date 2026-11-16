import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { phonePt, screenPoint } from "../components/devices";
import { cam, PHONE_CENTER, tilt, withCam } from "../components/layouts";
import { Caption, Ripple, Tag } from "../components/overlays";
import { Scene } from "../components/scene";
import { type ShotKey } from "../components/stage";
import { at, TAPS } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 第四幕：右上角打开手机型号列表，从 Apple 一路翻到 iPad、华为，再选回 iPhone 17 Pro Max（Snug 按型号把手机屏贴合屏幕尺寸）。
// 手机居中，整幕慢慢转一个角度，列表一路滚。

export const MODEL_FROM = sec(ACTS.model);
export const MODEL_LEN = sec(ACTS.outro) - MODEL_FROM;
const END = MODEL_FROM + MODEL_LEN;

const tapDone = at(TAPS.done.t);
// 列表翻到的位置（粗剪里的秒）：Apple → iPad → 华为 → 回到 Apple
const BRANDS = [
  { t: 119.5, text: "iPhone" },
  { t: 123.6, text: "iPad" },
  { t: 125.6, text: "华为" },
] as const;

const KEYS: readonly ShotKey[] = [
  [MODEL_FROM, withCam(tilt(PHONE_CENTER, -16, 4), cam(540, 960, 1.0))],
  [MODEL_FROM + 190, withCam(tilt(PHONE_CENTER, -6, 3), cam(540, 980, 1.04))],
  [tapDone - 20, withCam(tilt(PHONE_CENTER, 12, 2), cam(540, 1060, 1.18))],
  [END, withCam(tilt(PHONE_CENTER, 0, 0), cam(540, 1000, 1.0))],
];

export const Model: React.FC = () => (
  <Scene
    offset={MODEL_FROM}
    length={MODEL_LEN}
    bg={[[MODEL_FROM, PAL.model, "MODELS"]]}
    keys={KEYS}
    phone={({ g }) => {
      const d = phonePt(TAPS.done.x, TAPS.done.y);
      return <Ripple frame={g} at={tapDone} x={d.x} y={d.y} />;
    }}
    world={({ g, shot }) => {
      const right = screenPoint("phone", shot.phone, 1, 0.3);
      const left = screenPoint("phone", shot.phone, 0, 0.55);
      const top = screenPoint("phone", shot.phone, 0.5, 0);
      return (
        <>
          {BRANDS.map((b, i) => {
            const f = at(b.t);
            const p = i % 2 === 0 ? { x: right.x + 110, y: right.y + i * 120 } : { x: left.x - 110, y: left.y };
            return <Tag key={b.text} frame={g} at={f} out={f + 100} x={p.x} y={p.y} text={b.text} size={38} />;
          })}
          <Tag frame={g} at={tapDone + 4} out={END} x={top.x} y={top.y - 80 * interpolate(g, [tapDone, tapDone + 20], [0.6, 1], clamp)} text="iPhone 17 Pro Max ✓" size={38} />
        </>
      );
    }}
    over={({ g }) => <Caption frame={g} at={MODEL_FROM + 24} out={MODEL_FROM + 190} zh="机型自选 · 尺寸贴合" en="PICK YOUR MODEL · PIXEL FIT" x={540} y={190} align="center" size={78} />}
  />
);
