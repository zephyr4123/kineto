import { cam, MODEL, tilt, withCam } from "../components/layouts";
import { Scene } from "../components/scene";
import type { ShotKey } from "../components/stage";
import { Headline } from "../components/type";
import { at } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 右上角打开「手机型号」列表：顶上是自定义比例，下面从 Apple 一路翻到华为 Mate、P60、nova，最后点「完成」
// （Snug 按型号把手机屏的比例贴合真机屏幕）。手机居中、整段慢慢转一个角度，标题在顶上。

export const MODEL_FROM = sec(ACTS.model);
export const MODEL_LEN = sec(ACTS.outro) - MODEL_FROM;
const END = MODEL_FROM + MODEL_LEN;

const list = at(116.77);
const done = at(133.73);

const KEYS: readonly ShotKey[] = [
  [MODEL_FROM, withCam(tilt(MODEL, 18, 4), cam(540, 960, 1.0))],
  [MODEL_FROM + 220, withCam(tilt(MODEL, 8, 3), cam(540, 1030, 1.06))],
  [done - 10, withCam(tilt(MODEL, -6, 2), cam(540, 1100, 1.14))],
  [END, withCam(tilt(MODEL, 0, 0), cam(540, 1060, 1.05))],
];

export const Model: React.FC = () => (
  <Scene
    offset={MODEL_FROM}
    length={MODEL_LEN}
    bg={[[MODEL_FROM, PAL.model]]}
    keys={KEYS}
    over={({ g }) => (
      <Headline frame={g} at={list + 16} out={list + 330} lines={["按机型适配屏幕比例"]} x={540} y={210} align="center" size={60} sub="支持 Apple、华为等机型，也能自定义比例" />
    )}
  />
);
