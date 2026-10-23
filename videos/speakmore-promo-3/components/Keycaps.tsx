import { useCurrentFrame } from "remotion";
import { tween } from "../../../engine/motion";
import { COLOR, EASE, SANS } from "../theme";

// 画面右下的一组键帽：热键按下的那一下就是节拍。按下时键帽沉下去，朱砂的一圈光从键边漾开。
export type Keycap = { label: string; downAt: number; upAt: number };

const SIZE = 84;

const Cap: React.FC<{ cap: Keycap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const down = tween(frame, [cap.downAt, cap.downAt + 4], [0, 1], EASE.outQuint) * (1 - tween(frame, [cap.upAt, cap.upAt + 8], [0, 1], EASE.outQuint));
  const ringT = frame - cap.downAt;
  const ring = ringT >= 0 && ringT < 30 ? ringT / 30 : null;
  return (
    <div style={{ position: "relative" }}>
      {ring !== null ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 22,
            boxShadow: `0 0 0 2px ${COLOR.cinnabar}`,
            opacity: 0.55 * (1 - ring),
            transform: `scale(${1 + 0.45 * EASE.outExpo(ring)})`,
          }}
        />
      ) : null}
      <div
        style={{
          height: SIZE,
          minWidth: SIZE,
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 22,
          background: "oklch(1 0 0)",
          color: COLOR.ink,
          fontFamily: SANS,
          fontSize: 32,
          fontWeight: 500,
          transform: `translateY(${6 * down}px)`,
          boxShadow: `0 0 0 1.5px ${COLOR.line}, 0 ${7 * (1 - down) + 1}px 0 ${COLOR.line}, 0 ${24 * (1 - down) + 6}px 48px -20px oklch(0.2 0.02 255 / ${0.35 - 0.15 * down})`,
        }}
      >
        {cap.label}
      </div>
    </div>
  );
};

/** inAt 帧浮上来，outAt 帧沉下去淡掉 */
export const Keycaps: React.FC<{ caps: readonly Keycap[]; inAt: number; outAt: number }> = ({ caps, inAt, outAt }) => {
  const frame = useCurrentFrame();
  const a = tween(frame, [inAt, inAt + 22], [0, 1], EASE.outExpo);
  const z = tween(frame, [outAt, outAt + 18], [0, 1], EASE.outQuint);
  if (a <= 0 || z >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 150,
        bottom: 96,
        display: "flex",
        gap: 18,
        opacity: a * (1 - z),
        transform: `translateY(${40 * (1 - a) + 30 * z}px)`,
        filter: a < 1 || z > 0 ? `blur(${8 * (1 - a) + 8 * z}px)` : undefined,
      }}
    >
      {caps.map((cap) => (
        <Cap key={cap.label} cap={cap} />
      ))}
    </div>
  );
};
