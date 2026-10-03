import { random } from "remotion";
import { COIN, COIN_GOLD, QBLOCK } from "../sprites";
import { FONT_ARCADE, INK } from "../theme";
import { GROUND_Y } from "../timing";
import type { Palette } from "./Sprite";
import { Sprite } from "./Sprite";

// 十字路口的指路牌：一根柱子上挂好几块牌子，各指一个方向，每块都只写着「?」
export const Signpost: React.FC<{ x: number; frame: number; sway: number }> = ({ x, frame, sway }) => {
  const boards = [
    { y: 40, dir: 1, tilt: -14 },
    { y: 110, dir: -1, tilt: 10 },
    { y: 178, dir: 1, tilt: 18 },
    { y: 246, dir: -1, tilt: -20 },
    { y: 312, dir: 1, tilt: 4 },
  ];
  const h = 420;
  return (
    <div style={{ position: "absolute", left: x - 11, top: GROUND_Y - h, width: 22, height: h, backgroundColor: "#5b3f35", boxShadow: "inset -6px 0 0 #43302a" }}>
      {boards.map((b, i) => {
        const wob = Math.sin(frame / 7 + i * 1.9) * 6 * sway;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 11,
              top: b.y,
              transform: `scaleX(${b.dir}) rotate(${b.tilt + wob}deg)`,
              transformOrigin: "0 50%",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -6,
                top: -30,
                width: 168,
                height: 60,
                backgroundColor: "#3a2a24",
                clipPath: "polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: -24,
                width: 150,
                height: 48,
                backgroundColor: "#f2d6a2",
                clipPath: "polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)",
              }}
            />
            <div style={{ position: "absolute", left: 46, top: -16, fontFamily: FONT_ARCADE, fontSize: 32, color: INK, transform: `scaleX(${b.dir})` }}>?</div>
          </div>
        );
      })}
    </div>
  );
};

export const QBlockProp: React.FC<{ x: number; y: number; bump: number; palette: Palette; scale?: number }> = ({ x, y, bump, palette, scale = 9 }) => (
  <div style={{ position: "absolute", left: x - 6 * scale, top: y - 12 * scale - bump }}>
    <Sprite grid={QBLOCK} palette={palette} scale={scale} />
  </div>
);

// 硬币：用横向缩放模拟翻转
export const Coin: React.FC<{ x: number; y: number; spin: number; scale?: number; palette?: Palette; glow?: number }> = ({ x, y, spin, scale = 7, palette = COIN_GOLD, glow = 0 }) => (
  <div style={{ position: "absolute", left: x - 4 * scale, top: y - 4 * scale, transform: `scaleX(${Math.max(0.12, Math.abs(Math.cos(spin)))})` }}>
    {glow > 0 ? <div style={{ position: "absolute", inset: -24, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,210,74,${0.6 * glow}) 0%, rgba(255,210,74,0) 70%)` }} /> : null}
    <Sprite grid={COIN} palette={palette} scale={scale} />
  </div>
);

// 吐出来的胶片：一格格全是雪花
export const FilmStrip: React.FC<{ x: number; y: number; length: number; frame: number; rotate?: number }> = ({ x, y, length, frame, rotate = 0 }) => {
  const cells = Math.max(0, Math.floor(length / 70));
  return (
    <div style={{ position: "absolute", left: x - 45, top: y - length, width: 90, height: length, backgroundColor: "#1d1a2a", transform: `rotate(${rotate}deg)`, transformOrigin: "50% 100%", overflow: "hidden" }}>
      {Array.from({ length: cells + 1 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 16, top: i * 70 + 8, width: 58, height: 54, overflow: "hidden" }}>
          {Array.from({ length: 12 }, (_, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: (k % 4) * 14.5,
                top: Math.floor(k / 4) * 18,
                width: 14.5,
                height: 18,
                backgroundColor: `hsl(230, 15%, ${20 + 70 * random(`snow-${i}-${k}-${Math.floor(frame / 2)}`)}%)`,
              }}
            />
          ))}
        </div>
      ))}
      {Array.from({ length: Math.ceil(length / 22) }, (_, i) => (
        <div key={`h${i}`}>
          <div style={{ position: "absolute", left: 4, top: i * 22 + 6, width: 8, height: 10, backgroundColor: "#cfc8e6" }} />
          <div style={{ position: "absolute", right: 4, top: i * 22 + 6, width: 8, height: 10, backgroundColor: "#cfc8e6" }} />
        </div>
      ))}
    </div>
  );
};

// 冒烟：灰色方块往上飘、变大、变淡
export const Smoke: React.FC<{ x: number; y: number; frame: number; start: number; count?: number }> = ({ x, y, frame, start, count = 14 }) => {
  const t = frame - start;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const born = i * 4;
        const age = (t - born) % 56;
        if (t < born || age < 0) return null;
        const s = 18 + age * 1.1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + (random(`sm-${i}`) - 0.5) * 50 + Math.sin(age / 8 + i) * 16 - s / 2,
              top: y - age * 3.2 - s / 2,
              width: s,
              height: s,
              backgroundColor: "#c3c8dc",
              opacity: 0.75 * (1 - age / 56),
            }}
          />
        );
      })}
    </>
  );
};
