import { Img, staticFile, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { EASE } from "../theme";

// App 真截图摆成一块斜放的玻璃板：进场由远到近、由虚变实，停着时镜头仍在极慢地转；
// 可以推近到截图的某一块（zoom），可以圈出一块、其余压暗（spot）。children 画在截图的坐标里（0–w，0–h）。

export type Rect = { x: number; y: number; w: number; h: number };

export const Panel: React.FC<{
  src: string;
  /** 截图在画面里多宽、多高（px） */
  w: number;
  h: number;
  /** 中心相对画面中心的位置 */
  x?: number;
  y?: number;
  rotX?: number;
  rotY?: number;
  /** 停着时绕竖轴再慢慢转多少度 */
  drift?: number;
  at: number;
  out?: number;
  /** 推近：at 帧起 dur 帧内推到 rect（截图坐标的比例 0–1） */
  zoom?: { at: number; dur?: number; rect: Rect };
  /** 圈一块：at 帧起其余压暗 */
  spot?: { at: number; rect: Rect; dark?: boolean };
  radius?: number;
  /** 暗场里的霓虹描边 */
  neon?: string;
  /** 进场从哪个方向来：远处（默认）或侧面 */
  from?: "far" | "left" | "right" | "below";
  /** 图本身已带窗框和阴影（README 的实拍图）：不再加框 */
  bare?: boolean;
  children?: React.ReactNode;
}> = ({ src, w, h, x = 0, y = 0, rotX = 8, rotY = -14, drift = 5, at, out, zoom, spot, radius = 22, neon, from = "far", bare, children }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, at, 34);
  const z = out === undefined ? 0 : prog(frame, out, 22, EASE.inOut);
  if (a <= 0 || z >= 1) return null;
  const life = frame - at;
  const ry = rotY + drift * Math.min(1, life / 300) - (from === "left" ? -40 : from === "right" ? 40 : 0) * (1 - a);
  const dx = (from === "left" ? -700 : from === "right" ? 700 : 0) * (1 - a);
  const dy = (from === "below" ? 500 : 0) * (1 - a);
  const scale = (from === "far" ? 0.7 + 0.3 * a : 1) * (1 - 0.1 * z);
  const blur = 10 * (1 - a) + 12 * z;

  // 推近：把 rect 的中心移到画面中心、放大到 rect 撑满画面宽的 0.9
  let zs = 1;
  let zx = 0;
  let zy = 0;
  if (zoom) {
    const t = prog(frame, zoom.at, zoom.dur ?? 40, EASE.inOut);
    const target = Math.min((w * 0.95) / (zoom.rect.w * w), (h * 0.95) / (zoom.rect.h * h));
    zs = 1 + (target - 1) * t;
    zx = (0.5 - (zoom.rect.x + zoom.rect.w / 2)) * w * t;
    zy = (0.5 - (zoom.rect.y + zoom.rect.h / 2)) * h * t;
  }
  const spotT = spot ? prog(frame, spot.at, 20) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 960 + x - w / 2 + dx,
        top: 540 + y - h / 2 + dy,
        width: w,
        height: h,
        perspective: 2600,
        opacity: Math.min(1, a * 2) * (1 - z) ** 2,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX + 20 * z}deg) rotateY(${ry}deg) scale(${scale})`,
          borderRadius: bare ? 0 : radius,
          overflow: "hidden",
          boxShadow: bare
            ? undefined
            : neon
            ? `0 0 0 1.5px ${neon}, 0 0 40px color-mix(in oklab, ${neon} 45%, transparent), 0 40px 100px -30px oklch(0 0 0 / 0.7)`
            : "0 0 0 1px oklch(0.2 0.02 255 / 0.08), 0 50px 110px -36px oklch(0.2 0.03 260 / 0.45)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `translate(${zx}px, ${zy}px) scale(${zs})` }}>
          <Img src={staticFile(src)} style={{ width: w, height: h, display: "block" }} />
          {children}
          {spot && spotT > 0 ? (
            <div
              style={{
                position: "absolute",
                left: spot.rect.x * w,
                top: spot.rect.y * h,
                width: spot.rect.w * w,
                height: spot.rect.h * h,
                borderRadius: 14,
                boxShadow: `0 0 0 9999px oklch(${spot.dark ? "0.1 0.02 275" : "0.98 0.004 255"} / ${0.62 * spotT}), 0 0 0 2px oklch(0.55 0.17 33 / ${spotT})`,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
