import { useMemo } from "react";
import { random } from "remotion";
import { GOLD, INK } from "../theme";
import { GROUND_Y } from "../timing";
import { Cloud, palette } from "./World";

// 飞行段的道具：彩虹尾迹、大炮、金环、浮空岛、云海、黄昏城市。坐标都是世界坐标，除非另有说明。

export const RAINBOW = ["#ff4f5e", "#ff9f43", "#ffd24a", "#5dffa0", "#5ec8ff", "#9d7bff"];

// 彩虹尾迹：points 是屏幕坐标（新的在前）。每段沿运动方向画六条平行色带，越往尾巴越淡越细。
export const RainbowTrail: React.FC<{ points: readonly { x: number; y: number }[]; band?: number; opacity?: number }> = ({ points, band = 11, opacity = 1 }) => {
  if (points.length < 2 || opacity <= 0) return null;
  const n = points.length;
  const segs: React.ReactNode[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) continue;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const fade = 1 - i / (n - 1);
    const h = band * RAINBOW.length * (0.55 + 0.45 * fade);
    segs.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: b.x,
          top: b.y - h / 2,
          width: len + 2,
          height: h,
          transformOrigin: `0 ${h / 2}px`,
          transform: `rotate(${angle}deg)`,
          opacity: fade * opacity,
          background: `linear-gradient(to bottom, ${RAINBOW.map((c, k) => `${c} ${(k / 6) * 100}%, ${c} ${((k + 1) / 6) * 100}%`).join(", ")})`,
        }}
      />,
    );
  }
  return <>{segs}</>;
};

// 大炮：炮管斜指天空，开炮时往后一缩
export const Cannon: React.FC<{ x: number; frame: number; fireAt: number; angle?: number }> = ({ x, frame, fireAt, angle = -48 }) => {
  const t = frame - fireAt;
  const recoil = t >= 0 && t < 14 ? 40 * Math.sin((t / 14) * Math.PI) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: GROUND_Y }}>
      <div style={{ position: "absolute", left: -40, top: -150, transform: `rotate(${angle}deg) translateX(${-recoil}px)`, transformOrigin: "40px 75px" }}>
        <div style={{ width: 340, height: 150, backgroundColor: "#3b4a8f", boxShadow: "inset 0 -26px 0 #2a376e, inset 0 18px 0 #5568b4" }} />
        <div style={{ position: "absolute", left: 300, top: -14, width: 60, height: 178, backgroundColor: "#ffd24a", boxShadow: "inset 0 -20px 0 #c79a10" }} />
        <div style={{ position: "absolute", left: 120, top: 0, width: 26, height: 150, backgroundColor: "#ff9f43" }} />
      </div>
      <div style={{ position: "absolute", left: -110, top: -110, width: 240, height: 110, backgroundColor: "#7a4b2e", boxShadow: "inset 0 18px 0 #a0663f" }} />
      {[-80, 50].map((wx) => (
        <div key={wx} style={{ position: "absolute", left: wx, top: -70, width: 84, height: 84, borderRadius: "50%", backgroundColor: INK, boxShadow: "inset 0 0 0 14px #4a3a2c" }} />
      ))}
    </div>
  );
};

// 金环：竖着的椭圆，穿过时一闪
export const Ring: React.FC<{ x: number; y: number; frame: number; hitAt: number }> = ({ x, y, frame, hitAt }) => {
  const t = frame - hitAt;
  const hit = t >= 0;
  const pulse = hit && t < 20 ? 1 + 0.6 * Math.sin((t / 20) * Math.PI) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 50,
        top: y - 120,
        width: 100,
        height: 240,
        borderRadius: "50%",
        border: `18px solid ${hit && t < 20 ? "white" : GOLD}`,
        boxShadow: `0 0 ${hit ? 60 : 24}px rgba(255,210,74,0.9), inset 0 0 18px rgba(255,210,74,0.7)`,
        transform: `scale(${pulse}) rotate(${Math.sin(frame / 12) * 8}deg)`,
        opacity: hit ? Math.max(0, 1 - Math.max(0, t - 20) / 20) : 1,
      }}
    />
  );
};

// 浮空岛：草皮 + 往下收尖的岩石，挂着几块小碎石
export const Island: React.FC<{ x: number; y: number; w: number; frame: number }> = ({ x, y, w, frame }) => {
  const steps = 7;
  const bob = Math.sin(frame / 30) * 6;
  return (
    <div style={{ position: "absolute", left: x, top: y + bob }}>
      {Array.from({ length: steps }, (_, i) => {
        const inset = (w / 2) * (i / steps) ** 1.3;
        return <div key={i} style={{ position: "absolute", left: inset, top: 30 + i * 46, width: w - inset * 2, height: 48, backgroundColor: i % 2 ? "#7a5a8f" : "#8a6a9f" }} />;
      })}
      <div style={{ position: "absolute", left: -10, top: 0, width: w + 20, height: 34, backgroundColor: "#5fd3a0", boxShadow: "inset 0 -10px 0 #3fa57a" }} />
      {[0.15, 0.82].map((p, i) => (
        <div key={i} style={{ position: "absolute", left: w * p, top: -150 }}>
          <div style={{ position: "absolute", left: 30, top: 70, width: 22, height: 82, backgroundColor: "#6b4a3a" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 84, height: 84, backgroundColor: "#3fbf8a" }} />
          <div style={{ position: "absolute", left: 14, top: -24, width: 56, height: 30, backgroundColor: "#5fd3a0" }} />
        </div>
      ))}
      {[0.3, 0.55, 0.7].map((p, i) => (
        <div key={`r${i}`} style={{ position: "absolute", left: w * p, top: 380 + i * 40 + Math.sin(frame / 20 + i) * 10, width: 36, height: 30, backgroundColor: "#7a5a8f" }} />
      ))}
    </div>
  );
};

// 云海：一条很宽的云带（世界坐标 y 处），俯冲时从中间穿过
export const CloudSea: React.FC<{ y: number; from: number; to: number; frame: number }> = ({ y, from, to, frame }) => {
  const p = palette(0);
  const puffs = useMemo(() => {
    const out: { x: number; dy: number; s: number }[] = [];
    for (let x = from, i = 0; x < to; x += 260, i++) out.push({ x: x + 80 * random(`sea-x-${i}`), dy: 60 * random(`sea-y-${i}`), s: 1.2 + 0.8 * random(`sea-s-${i}`) });
    return out;
  }, [from, to]);
  return (
    <>
      <div style={{ position: "absolute", left: from, top: y + 60, width: to - from, height: 260, backgroundColor: p.cloud }} />
      {puffs.map((c, i) => (
        <Cloud key={i} x={c.x + Math.sin(frame / 40 + i) * 20} y={y - 40 + c.dy} s={c.s} p={p} />
      ))}
      <div style={{ position: "absolute", left: from, top: y + 300, width: to - from, height: 60, backgroundColor: p.cloudShade }} />
    </>
  );
};

// 黄昏城市的天际线：两层楼，窗户亮着，屏幕空间 + 视差
export const CitySkyline: React.FC<{ camX: number; camY: number; opacity: number; frame: number }> = ({ camX, camY, opacity, frame }) => {
  const far = useMemo(() => buildings("far", 40, 90, 160, 240, 560), []);
  const near = useMemo(() => buildings("near", 26, 140, 240, 200, 460), []);
  if (opacity <= 0.01) return null;
  const layer = (bs: ReturnType<typeof buildings>, k: number, color: string, win: string, base: number) => {
    const span = 6000;
    const off = -(((camX * k) % span) + span) % span;
    return (
      <div style={{ position: "absolute", left: off, top: -camY * k, width: span * 2, height: 1080 }}>
        {[0, span].map((dx) =>
          bs.map((b, i) => (
            <div key={`${dx}-${i}`} style={{ position: "absolute", left: dx + b.x, top: base - b.h, width: b.w, height: b.h + 400, backgroundColor: color }}>
              {b.windows.map((w, j) => (
                <div
                  key={j}
                  style={{
                    position: "absolute",
                    left: w.x,
                    top: w.y,
                    width: 14,
                    height: 18,
                    backgroundColor: win,
                    opacity: random(`win-${i}-${j}-${Math.floor(frame / 40)}`) > 0.08 ? 0.9 : 0.2,
                  }}
                />
              ))}
            </div>
          )),
        )}
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {layer(far, 0.2, "#2c2c72", "#ffcf7a", 760)}
      {layer(near, 0.45, "#1f1f58", "#ffe39a", 830)}
    </div>
  );
};

function buildings(seed: string, count: number, minW: number, maxW: number, minH: number, maxH: number) {
  return Array.from({ length: count }, (_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const w = minW + (maxW - minW) * r("w");
    const h = minH + (maxH - minH) * r("h");
    const windows: { x: number; y: number }[] = [];
    for (let wy = 24; wy < h - 20; wy += 44) for (let wx = 18; wx < w - 26; wx += 34) if (r(`w${wx}-${wy}`) > 0.45) windows.push({ x: wx, y: wy });
    return { x: i * (6000 / count) + 30 * r("x"), w, h, windows };
  });
}

// 城市路面：深色柏油 + 跑动的车道线 + 路灯
export const CityRoad: React.FC<{ from: number; to: number; frame: number }> = ({ from, to, frame }) => (
  <>
    <div style={{ position: "absolute", left: from, top: GROUND_Y, width: to - from, height: 400, backgroundColor: "#1c1c4a" }} />
    <div style={{ position: "absolute", left: from, top: GROUND_Y, width: to - from, height: 14, backgroundColor: "#ff8fb0" }} />
    <div
      style={{
        position: "absolute",
        left: from,
        top: GROUND_Y + 90,
        width: to - from,
        height: 12,
        backgroundImage: "repeating-linear-gradient(to right, #ffd24a 0 70px, transparent 70px 140px)",
      }}
    />
    {Array.from({ length: Math.floor((to - from) / 600) }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: from + 200 + i * 600, top: GROUND_Y - 330 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: 330, backgroundColor: "#3a3a7a" }} />
        <div style={{ position: "absolute", left: -10, top: -10, width: 70, height: 18, backgroundColor: "#3a3a7a" }} />
        <div style={{ position: "absolute", left: 30, top: 8, width: 34, height: 14, backgroundColor: Math.floor(frame / 50 + i) % 7 === 0 ? "#9a8a5a" : "#fff1b8", boxShadow: "0 0 50px 20px rgba(255,230,150,0.35)" }} />
      </div>
    ))}
  </>
);

// 峡谷：地面断开的一大段，两侧是岩壁
export const Canyon: React.FC<{ from: number; to: number }> = ({ from, to }) => (
  <div style={{ position: "absolute", left: from, top: GROUND_Y, width: to - from, height: 1400, background: "linear-gradient(#1b2b66, #0d1640 50%)" }}>
    {[0, 1].map((side) => (
      <div key={side} style={{ position: "absolute", [side ? "right" : "left"]: 0, top: 0, width: 40, height: 1400, backgroundColor: "#22357a" }} />
    ))}
  </div>
);
