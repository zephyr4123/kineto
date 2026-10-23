import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, prog } from "../../../engine/motion";
import { EASE } from "../theme";

// 镜头贴着一块斜放的界面飞（照参考片 17.8–19.4、26.2–27.4 秒：界面斜躺在空间里，镜头从一角滑到另一角、推近又拉远）。
// 界面是一块 w×h 的平板（真截图或代码画的窗口）；每个关键帧说镜头此刻对着平板上哪一点（fx、fy，占宽高的比例）、
// 推多近（s）、平板怎么斜（rx、ry、rz 度）。被对着的那一点永远在画面中心往 (x, y) 偏的地方，相邻关键帧之间先快后慢地过渡。

export type View = { fx: number; fy: number; s: number; rx: number; ry: number; rz?: number };
export type ViewKeys = readonly (readonly [number, View])[];

const sampleView = (keys: ViewKeys, frame: number): View => {
  if (keys.length === 1) return keys[0][1];
  const frames = keys.map(([f]) => f);
  const pick = (get: (v: View) => number) => interpolate(frame, frames, keys.map(([, v]) => get(v)), { ...clamp, easing: EASE.inOut });
  return { fx: pick((v) => v.fx), fy: pick((v) => v.fy), s: pick((v) => v.s), rx: pick((v) => v.rx), ry: pick((v) => v.ry), rz: pick((v) => v.rz ?? 0) };
};

export const Glass: React.FC<{
  w: number;
  h: number;
  keys: ViewKeys;
  at: number;
  out?: number;
  /** 进场、退场各用多少帧（由虚变实 / 由实变虚） */
  fadeIn?: number;
  fadeOut?: number;
  x?: number;
  y?: number;
  radius?: number;
  /** 暗场里的霓虹描边 */
  neon?: string;
  /** 不加框和阴影（图本身带窗框的实拍） */
  bare?: boolean;
  children: React.ReactNode;
}> = ({ w, h, keys, at, out, fadeIn = 16, fadeOut = 14, x = 0, y = 0, radius = 28, neon, bare, children }) => {
  const frame = useCurrentFrame();
  const a = fadeIn === 0 ? (frame >= at ? 1 : 0) : prog(frame, at, fadeIn);
  const z = out === undefined ? 0 : prog(frame, out, fadeOut, EASE.inOut);
  if (a <= 0 || z >= 1) return null;
  const v = sampleView(keys, frame);
  const blur = 10 * (1 - a) + 14 * z;
  return (
    <AbsoluteFill style={{ perspective: 1900, opacity: Math.min(1, a * 1.6) * (1 - z), filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      <div
        style={{
          position: "absolute",
          left: 960 + x - v.fx * w,
          top: 540 + y - v.fy * h,
          width: w,
          height: h,
          transformOrigin: `${v.fx * w}px ${v.fy * h}px`,
          transform: `scale(${v.s}) rotateX(${v.rx}deg) rotateY(${v.ry}deg) rotateZ(${v.rz ?? 0}deg)`,
          borderRadius: bare ? 0 : radius,
          overflow: bare ? undefined : "hidden",
          boxShadow: bare
            ? undefined
            : neon
            ? `0 0 0 2px ${neon}, 0 0 60px color-mix(in oklab, ${neon} 45%, transparent), 0 60px 140px -40px oklch(0 0 0 / 0.7)`
            : "0 0 0 1.5px oklch(0.62 0.1 270 / 0.35), 0 70px 160px -50px oklch(0.25 0.05 265 / 0.5)",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** 一张 App 真截图铺满平板 */
export const Screen: React.FC<{ src: string; w: number; h: number }> = ({ src, w, h }) => <Img src={staticFile(src)} style={{ width: w, height: h, display: "block" }} />;

/** 平板上的一圈高亮：at 帧亮起（朱砂描边加光晕），out 帧熄；rect 用平板的像素坐标 */
export const Halo: React.FC<{ x: number; y: number; w: number; h: number; at: number; out?: number; color?: string; radius?: number }> = ({ x, y, w, h, at, out, color = "oklch(0.6 0.17 33)", radius = 18 }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, at, 14);
  const z = out === undefined ? 0 : prog(frame, out, 12);
  if (a <= 0 || z >= 1) return null;
  const pulse = Math.exp(-Math.max(0, frame - at) / 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 8,
        width: w + 20,
        height: h + 16,
        borderRadius: radius,
        boxShadow: `0 0 0 ${3 + 3 * pulse}px ${color}, 0 0 ${30 + 40 * pulse}px color-mix(in oklab, ${color} 55%, transparent)`,
        opacity: a * (1 - z),
        transform: `scale(${1.08 - 0.08 * a})`,
      }}
    />
  );
};
