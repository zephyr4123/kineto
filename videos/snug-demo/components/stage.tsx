import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { H, W } from "../theme";
import { Footage, IPhone, MacBook, Monitor, type Pose, type Screen, shownWidth } from "./devices";

// 舞台：三台设备的版式和镜头按关键帧走。一个镜头 = 三台设备各自的位置 + 镜头看哪、推多近；
// 关键帧之间逐项插值，所以版式之间是连贯的「变形」，设备自己滑到新位置，不是硬切。

export type Cam = { x: number; y: number; z: number };
export type Shot = { mon: Pose; mac: Pose; phone: Pose; cam?: Cam };
/** [片子里的帧, 镜头, 走到这一帧用的缓动] */
export type ShotKey = readonly [number, Shot, ((t: number) => number)?];

export const CAM0: Cam = { x: W / 2, y: H / 2, z: 1 };
/** 版式切换默认的缓动：两头慢、中间快，像摄影机摇过去 */
export const glide = Easing.bezier(0.65, 0, 0.25, 1);

const lerpPose = (frame: number, f0: number, f1: number, a: Pose, b: Pose, ease: (t: number) => number): Pose => {
  const k = (va: number, vb: number) => interpolate(frame, [f0, f1], [va, vb], { ...clamp, easing: ease });
  return {
    x: k(a.x, b.x),
    y: k(a.y, b.y),
    w: k(a.w, b.w),
    rot: k(a.rot ?? 0, b.rot ?? 0),
    ry: k(a.ry ?? 0, b.ry ?? 0),
    rx: k(a.rx ?? 0, b.rx ?? 0),
    op: k(a.op ?? 1, b.op ?? 1),
  };
};

/** 取第 frame 帧的镜头 */
export const shotAt = (keys: readonly ShotKey[], frame: number): Required<Shot> => {
  const full = (s: Shot): Required<Shot> => ({ ...s, cam: s.cam ?? CAM0 });
  if (frame <= keys[0][0]) return full(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    const [f1, b, ease = glide] = keys[i];
    const [f0, a] = keys[i - 1];
    if (frame <= f1) {
      const A = full(a);
      const B = full(b);
      const k = (va: number, vb: number) => interpolate(frame, [f0, f1], [va, vb], { ...clamp, easing: ease });
      return {
        mon: lerpPose(frame, f0, f1, A.mon, B.mon, ease),
        mac: lerpPose(frame, f0, f1, A.mac, B.mac, ease),
        phone: lerpPose(frame, f0, f1, A.phone, B.phone, ease),
        cam: { x: k(A.cam.x, B.cam.x), y: k(A.cam.y, B.cam.y), z: k(A.cam.z, B.cam.z) },
      };
    }
  }
  return full(keys[keys.length - 1][1]);
};

/** 世界坐标 → 画面坐标 */
export const toScreen = (cam: Cam, p: { x: number; y: number }) => ({
  x: (p.x - cam.x) * cam.z + W / 2,
  y: (p.y - cam.y) * cam.z + H / 2,
});

/** 世界：镜头的推拉摇移作用在这一层上，设备、飞行的图标、贴着设备的标注都放在里面 */
export const World: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <AbsoluteFill style={{ transform: `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`, transformOrigin: "0 0" }}>
    {children}
  </AbsoluteFill>
);

/**
 * 三台设备 + 各自的录像。offset/length 是场景在成片里的起止（帧）；shot 由场景按关键帧算好传进来。
 * overlays 叠在各自屏幕上：Mac 两块用百分比坐标，手机用远程画面的点坐标；hand 是手机上的手指层（不被屏幕边裁掉）。
 * 每块屏按它此刻在画面上的宽度挑清晰度档位。
 */
export const Devices: React.FC<{
  shot: Required<Shot>;
  offset: number;
  length: number;
  monOverlay?: React.ReactNode;
  macOverlay?: React.ReactNode;
  phoneOverlay?: React.ReactNode;
  phoneHand?: React.ReactNode;
  /** 换成定格画面（落版用） */
  still?: (screen: Screen, shown: number) => React.ReactNode;
}> = ({ shot, offset, length, monOverlay, macOverlay, phoneOverlay, phoneHand, still }) => {
  const z = shot.cam.z;
  const feed = (screen: Screen, shown: number) =>
    still ? still(screen, shown) : <Footage screen={screen} offset={offset} length={length} shown={shown} />;
  return (
    <>
      {shot.mon.op !== 0 ? (
        <Monitor pose={shot.mon} overlay={monOverlay}>
          {feed("external", shownWidth("mon", shot.mon, z))}
        </Monitor>
      ) : null}
      {shot.mac.op !== 0 ? (
        <MacBook pose={shot.mac} overlay={macOverlay}>
          {feed("builtin", shownWidth("mac", shot.mac, z))}
        </MacBook>
      ) : null}
      {shot.phone.op !== 0 ? (
        <IPhone pose={shot.phone} overlay={phoneOverlay} hand={phoneHand}>
          {feed("phone", shownWidth("phone", shot.phone, z))}
        </IPhone>
      ) : null}
    </>
  );
};

/** 场景里的「片子帧」：Sequence 里的 useCurrentFrame 是场景内的帧，加上场景起点就是成片的帧 */
export const useGlobalFrame = (offset: number) => useCurrentFrame() + offset;
