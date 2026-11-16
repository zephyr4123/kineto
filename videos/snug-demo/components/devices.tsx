import { Video } from "@remotion/media";
import { staticFile } from "remotion";
import { BODY_H, BODY_W, DISPLAY_H, DISPLAY_TOP, Phone, SW, UUToolbar } from "../../../engine/snug/phone";
import { assets } from "../assets.gen";
import { SEGMENTS } from "../edl";
import { FPS } from "../theme";

// 三台设备：外接显示器（照 Studio Display：铝框、细黑边、细脚架）、MacBook（黑边、刘海、铝制机身）、iPhone（engine/snug/phone）。
// 位置都用「屏幕中心 + 屏幕宽」描述（手机用机身中心 + 机身宽），镜头和版式只管这几个数。

export type Pose = {
  x: number;
  y: number;
  /** 屏幕宽（手机是机身宽），像素 */
  w: number;
  rot?: number;
  /** 绕竖轴、横轴转的角度（度），做一点立体感 */
  ry?: number;
  rx?: number;
  op?: number;
};

export const MON_RATIO = 2160 / 3840;
export const MAC_RATIO = 1964 / 3024;

type Screen = "external" | "builtin" | "phone";

/**
 * 一块屏的录像：按剪辑表每段放一个 <Video>，三块屏用同一张表，所以三块屏永远对齐。
 * offset 是这个场景在成片里的起点（帧），只放和场景重叠的段。
 */
export const Footage: React.FC<{ screen: Screen; offset: number; length: number }> = ({ screen, offset, length }) => (
  <>
    {SEGMENTS.filter((s) => s.to > offset && s.from < offset + length).map((s) => (
      <Video
        key={s.from}
        src={staticFile(assets[screen])}
        from={s.from - offset}
        trimBefore={Math.round(s.src[0] * FPS)}
        durationInFrames={Math.round((s.src[1] - s.src[0]) * FPS)}
        playbackRate={s.rate}
        muted
        premountFor={30}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        objectFit="fill"
      />
    ))}
  </>
);

/** 落版里的定格：从素材第 t 秒起以极慢的速度放，看上去是静止的最后一帧 */
export const Freeze: React.FC<{ screen: Screen; t: number }> = ({ screen, t }) => (
  <Video
    src={staticFile(assets[screen])}
    trimBefore={Math.round(t * FPS)}
    playbackRate={0.04}
    muted
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    objectFit="fill"
  />
);

const transform = (p: Pose) =>
  `perspective(2600px) rotateX(${p.rx ?? 0}deg) rotateY(${p.ry ?? 0}deg) rotate(${p.rot ?? 0}deg)`;

/** 外接显示器：children 是屏幕内容，overlay 叠在屏幕上（同一套归一化坐标：宽 100%、高 100%） */
export const Monitor: React.FC<{ pose: Pose; children: React.ReactNode; overlay?: React.ReactNode }> = ({ pose, children, overlay }) => {
  const { x, y, w } = pose;
  const h = w * MON_RATIO;
  const bezel = w * 0.016;
  const frame = w * 0.008;
  const neckW = w * 0.15;
  const neckH = w * 0.15;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: transform(pose), opacity: pose.op ?? 1 }}>
      {/* 脚架：铝制细颈 + 扁底座，影子落在底座下 */}
      <div
        style={{
          position: "absolute",
          left: (w - neckW) / 2,
          top: h + bezel,
          width: neckW,
          height: neckH,
          background: "linear-gradient(90deg, #b9bfc9 0%, #e8ebf0 45%, #cdd2da 100%)",
          clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (w - neckW * 2.1) / 2,
          top: h + bezel + neckH - 2,
          width: neckW * 2.1,
          height: w * 0.018,
          borderRadius: w * 0.006,
          background: "linear-gradient(180deg, #eef0f4 0%, #c3c8d1 100%)",
          boxShadow: "0 14px 24px rgba(30,40,70,0.22)",
        }}
      />
      {/* 机身：铝框 + 黑边 */}
      <div
        style={{
          position: "absolute",
          inset: -(bezel + frame),
          borderRadius: w * 0.014,
          background: "linear-gradient(160deg, #f1f3f6 0%, #c9ced6 100%)",
          boxShadow: "0 30px 70px rgba(25,35,70,0.22), 0 8px 20px rgba(25,35,70,0.14)",
        }}
      />
      <div style={{ position: "absolute", inset: -bezel, borderRadius: w * 0.009, background: "#0b0d12" }} />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
        {children}
        {overlay}
      </div>
    </div>
  );
};

/** MacBook：黑边、刘海（压在录像的菜单栏中间，那里本来就空着）、铝制机身 */
export const MacBook: React.FC<{ pose: Pose; children: React.ReactNode; overlay?: React.ReactNode }> = ({ pose, children, overlay }) => {
  const { x, y, w } = pose;
  const h = w * MAC_RATIO;
  const side = w * 0.022;
  const top = w * 0.026;
  const bottom = w * 0.04;
  const baseW = w * 1.16;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: transform(pose), opacity: pose.op ?? 1 }}>
      {/* 机身：屏幕下面一条铝板，正面中间一个开合凹槽 */}
      <div
        style={{
          position: "absolute",
          left: (w - baseW) / 2,
          top: h + bottom - 1,
          width: baseW,
          height: w * 0.032,
          borderRadius: `${w * 0.004}px ${w * 0.004}px ${w * 0.02}px ${w * 0.02}px`,
          background: "linear-gradient(180deg, #e9ecf1 0%, #cfd4dc 55%, #a9afba 100%)",
          boxShadow: "0 16px 30px rgba(25,35,70,0.24)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (w - w * 0.16) / 2,
          top: h + bottom - 1,
          width: w * 0.16,
          height: w * 0.01,
          borderRadius: `0 0 ${w * 0.01}px ${w * 0.01}px`,
          background: "linear-gradient(180deg, #a7adb8, #c4c9d1)",
        }}
      />
      {/* 屏幕盖：一圈细铝边 + 黑边 */}
      <div
        style={{
          position: "absolute",
          left: -side - 2,
          top: -top - 2,
          right: -side - 2,
          bottom: -bottom,
          borderRadius: `${w * 0.026}px ${w * 0.026}px ${w * 0.006}px ${w * 0.006}px`,
          background: "linear-gradient(160deg, #d9dde3, #aeb4be)",
          boxShadow: "0 24px 50px rgba(25,35,70,0.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -side,
          top: -top,
          right: -side,
          bottom: -bottom + 2,
          borderRadius: `${w * 0.024}px ${w * 0.024}px ${w * 0.004}px ${w * 0.004}px`,
          background: "#07080b",
        }}
      />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: `${w * 0.012}px ${w * 0.012}px 0 0`, background: "#000" }}>
        {children}
        {overlay}
        {/* 刘海 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: w * 0.1,
            height: w * 0.022,
            transform: "translateX(-50%)",
            background: "#07080b",
            borderRadius: `0 0 ${w * 0.012}px ${w * 0.012}px`,
          }}
        />
      </div>
    </div>
  );
};

/** iPhone：机身中心 (x, y)、机身宽 w；screen 是远程画面（440×774 点），overlay 用同一套点坐标叠在远程画面上 */
export const IPhone: React.FC<{ pose: Pose; children: React.ReactNode; overlay?: React.ReactNode }> = ({ pose, children, overlay }) => (
  <div style={{ position: "absolute", left: 0, top: 0, opacity: pose.op ?? 1 }}>
    <Phone x={pose.x} y={pose.y} scale={pose.w / BODY_W} rotate={pose.rot ?? 0} tiltX={pose.rx ?? 0} tiltY={pose.ry ?? 0}>
      <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, overflow: "hidden", background: "#f4f5f8" }}>
        {children}
        {overlay}
      </div>
      <UUToolbar />
    </Phone>
  </div>
);

/** 录像像素（1080×1900）→ 远程画面里的点 */
export const phonePt = (px: number, py: number) => ({ x: (px * SW) / 1080, y: (py * DISPLAY_H) / 1900 });

/** 设备屏幕上归一化坐标 (u, v) 在世界里的位置（不计立体旋转）；手机的 (u, v) 指远程画面 */
export const screenPoint = (kind: "mon" | "mac" | "phone", p: Pose, u: number, v: number) => {
  if (kind === "phone") {
    const s = p.w / BODY_W;
    const RIM = (BODY_W - SW) / 2;
    const px = RIM + u * SW;
    const py = RIM + DISPLAY_TOP + v * DISPLAY_H;
    return { x: p.x + (px - BODY_W / 2) * s, y: p.y + (py - BODY_H / 2) * s };
  }
  const h = p.w * (kind === "mon" ? MON_RATIO : MAC_RATIO);
  return { x: p.x + (u - 0.5) * p.w, y: p.y + (v - 0.5) * h };
};
