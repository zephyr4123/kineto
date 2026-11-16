import { AbsoluteFill } from "remotion";
import type { Palette } from "../theme";
import { Backdrop } from "./backdrop";
import type { Pose } from "./devices";
import { Devices, type Shot, type ShotKey, shotAt, toScreen, useGlobalFrame, World } from "./stage";

// 每个场景的骨架：浅色底 → 世界（三台设备 + 贴着设备的标注，跟着镜头走）→ 画面层的字幕。
// 场景只需要给关键帧和各层要叠的东西；这些东西拿到的是「成片帧」和当前镜头，方便按剪辑表的时刻对齐。

export type Ctx = {
  /** 成片里的帧 */
  g: number;
  shot: Required<Shot>;
  /** 世界坐标 → 画面坐标（字幕要指着设备时用） */
  screen: (p: { x: number; y: number }) => { x: number; y: number };
};

export const Scene: React.FC<{
  offset: number;
  length: number;
  bg: readonly (readonly [number, Palette, string?])[];
  keys: readonly ShotKey[];
  mon?: (c: Ctx) => React.ReactNode;
  mac?: (c: Ctx) => React.ReactNode;
  phone?: (c: Ctx) => React.ReactNode;
  world?: (c: Ctx) => React.ReactNode;
  over?: (c: Ctx) => React.ReactNode;
  /** 改写某一帧的版式（开场三台设备错开入场时用） */
  adjust?: (shot: Required<Shot>, g: number) => Required<Shot>;
  still?: (screen: "external" | "builtin" | "phone") => React.ReactNode;
}> = ({ offset, length, bg, keys, mon, mac, phone, world, over, adjust, still }) => {
  const g = useGlobalFrame(offset);
  const base = shotAt(keys, g);
  const shot = adjust ? adjust(base, g) : base;
  const c: Ctx = { g, shot, screen: (p) => toScreen(shot.cam, p) };
  return (
    <AbsoluteFill>
      <Backdrop frame={g} keys={bg} />
      <World cam={shot.cam}>
        <Devices
          shot={shot}
          offset={offset}
          length={length}
          monOverlay={mon?.(c)}
          macOverlay={mac?.(c)}
          phoneOverlay={phone?.(c)}
          still={still}
        />
        {world?.(c)}
      </World>
      {over?.(c)}
    </AbsoluteFill>
  );
};

export type { Pose };
