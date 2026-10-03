import { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { mix } from "../fx";
import { GROUND_Y } from "../timing";

// 全片共用的暖蓝世界。mood 在 0（晴：饱和的暖蓝天、桃色地平线、太阳）与 1（阴：灰蓝、乌云、起雾）之间渐变，
// 第一幕「变天」、第二幕「放晴」都是同一个世界换天气。背景层按视差跟镜头走，云自己还会飘。
const CLEAR = {
  bands: ["#2c58b0", "#3768c2", "#4a7fd6", "#6497e2", "#86b1ec", "#b9cfee", "#ffd6ad", "#ffbf8e"],
  far: "#6a8fdc",
  mid: "#4569bd",
  near: "#30509e",
  cloud: "#ffffff",
  cloudShade: "#d6e3fb",
  cloudWarm: "#ffe2c8",
  groundTop: "#ffc98c",
  groundEdge: "#e89a62",
  ground: "#2b468f",
  groundDeep: "#213874",
};
const GLOOM = {
  bands: ["#2f3d63", "#36466e", "#3e4f79", "#465884", "#506290", "#5d6d9a", "#6f7aa3", "#7d86ab"],
  far: "#4b5a88",
  mid: "#3b4876",
  near: "#2f3a63",
  cloud: "#8d97b9",
  cloudShade: "#6d779c",
  cloudWarm: "#7c86aa",
  groundTop: "#9a92a8",
  groundEdge: "#6f6886",
  ground: "#2a3561",
  groundDeep: "#222b52",
};

// 黄昏的霓虹城市：顶上还是深暖蓝，往下过渡到紫、粉、橙
const SUNSET = {
  bands: ["#1d2a74", "#27358a", "#3a3f9e", "#5a46a6", "#8b4fa8", "#c45a9a", "#ec7a86", "#ffad7a"],
  far: "#3a3a8c",
  mid: "#2c2c72",
  near: "#22225c",
  cloud: "#ffd2c4",
  cloudShade: "#e8a3b4",
  cloudWarm: "#ffb38a",
  groundTop: "#ffb38a",
  groundEdge: "#e07a6a",
  ground: "#26265e",
  groundDeep: "#1d1d4c",
};

type Palette = typeof CLEAR;
const blend = (a: Palette, b: Palette, t: number): Palette => {
  const k = Math.max(0, Math.min(1, t));
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(a) as (keyof Palette)[]) {
    const x = a[key];
    const y = b[key];
    out[key] = Array.isArray(x) ? x.map((c, i) => mix(c, (y as string[])[i], k)) : mix(x as string, y as string, k);
  }
  return out as Palette;
};
export const palette = (mood: number, sunset = 0): Palette => blend(blend(CLEAR, GLOOM, mood), SUNSET, sunset);

// 阶梯状的像素山脊
function ridge(seed: string, width: number, step: number, base: number, amp: number, smooth = 0): string {
  let d = `M0 1080 L0 ${base}`;
  let prev = 0.5;
  for (let x = 0; x <= width; x += step) {
    const r = random(`${seed}-${x}`);
    prev = smooth * prev + (1 - smooth) * r;
    const h = Math.round(base - amp * (0.25 + 0.75 * prev));
    d += ` L${x} ${h} L${x + step} ${h}`;
  }
  return `${d} L${width} 1080 Z`;
}

// 一条横向无缝循环的层：内容画两遍，按 offset 取模平移
const Loop: React.FC<{ offset: number; width: number; children: React.ReactNode; top?: number; opacity?: number }> = ({ offset, width, children, top = 0, opacity = 1 }) => {
  const x = -(((offset % width) + width) % width);
  return (
    <div style={{ position: "absolute", left: x, top, width: width * 2, height: 1080, opacity }}>
      <div style={{ position: "absolute", left: 0, top: 0 }}>{children}</div>
      <div style={{ position: "absolute", left: width, top: 0 }}>{children}</div>
    </div>
  );
};

// 像素云：几块矩形叠出来，底部一条暖色反光
export const Cloud: React.FC<{ x: number; y: number; s: number; p: Palette }> = ({ x, y, s, p }) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    <div style={{ position: "absolute", left: 40 * s, top: 0, width: 90 * s, height: 40 * s, backgroundColor: p.cloud }} />
    <div style={{ position: "absolute", left: 0, top: 30 * s, width: 230 * s, height: 40 * s, backgroundColor: p.cloud }} />
    <div style={{ position: "absolute", left: 110 * s, top: 14 * s, width: 70 * s, height: 30 * s, backgroundColor: p.cloud }} />
    <div style={{ position: "absolute", left: 10 * s, top: 60 * s, width: 210 * s, height: 10 * s, backgroundColor: p.cloudShade }} />
    <div style={{ position: "absolute", left: 30 * s, top: 70 * s, width: 170 * s, height: 8 * s, backgroundColor: p.cloudWarm }} />
  </div>
);

const CLOUD_SPAN = 3200;

// camY < 0 表示镜头升高：远处的层下沉得慢、近处的下沉得快，天顶露出更深的蓝
export const Sky: React.FC<{ camX: number; camY?: number; frame: number; mood: number; sunset?: number; sunY?: number; clouds?: number }> = ({
  camX,
  camY = 0,
  frame,
  mood,
  sunset = 0,
  sunY = 600,
  clouds = 1,
}) => {
  const p = palette(mood, sunset);
  const lift = (k: number) => -camY * k;
  const far = useMemo(() => ridge("far", 3600, 40, 760, 360, 0.6), []);
  const mid = useMemo(() => ridge("mid", 3000, 60, 860, 260, 0.75), []);
  const cloudList = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i / 9) * CLOUD_SPAN + 200 * random(`cx${i}`),
        y: 60 + 380 * random(`cy${i}`),
        s: 0.7 + 0.9 * random(`cs${i}`),
        speed: 0.25 + 0.5 * random(`cv${i}`),
      })),
    [],
  );
  const sunOpacity = Math.max(0, 1 - mood * 1.4);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -2400 + lift(0.35),
          height: 2400 + 1080,
          background: `linear-gradient(to bottom, ${mix(p.bands[0], "#101a4a", 0.5)} 0%, ${p.bands[0]} 66%, ${p.bands[0]} 69%, ${p.bands.map((c, i) => `${c} ${69 + (i / p.bands.length) * 24}%, ${c} ${69 + ((i + 1) / p.bands.length) * 24}%`).join(", ")}, ${p.bands[p.bands.length - 1]} 100%)`,
        }}
      />
      {/* 太阳：同心方块，几乎不随镜头动 */}
      <div style={{ position: "absolute", left: 1320 - camX * 0.02, top: sunY - 150 + lift(0.04), opacity: sunOpacity }}>
        {[300, 240, 180].map((d, i) => (
          <div
            key={d}
            style={{
              position: "absolute",
              left: 150 - d / 2,
              top: 150 - d / 2,
              width: d,
              height: d,
              borderRadius: i === 0 ? 0 : 0,
              backgroundColor: ["rgba(255,214,150,0.25)", "rgba(255,226,170,0.5)", "#fff1c9"][i],
              clipPath: "polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)",
            }}
          />
        ))}
      </div>
      {/* 远云：视差 0.08，外加自己飘 */}
      {cloudList.slice(0, 5).map((c, i) => (
        <Loop key={i} offset={camX * 0.08 + frame * c.speed} width={CLOUD_SPAN} top={lift(0.1)} opacity={clouds}>
          <Cloud x={c.x} y={c.y} s={c.s * 0.8} p={p} />
        </Loop>
      ))}
      <div style={{ opacity: 1 - sunset }}>
        <Loop offset={camX * 0.15} width={3600} top={lift(0.15)}>
          <svg width={3600} height={1080} shapeRendering="crispEdges">
            <path d={far} fill={p.far} />
          </svg>
        </Loop>
      </div>
      {cloudList.slice(5).map((c, i) => (
        <Loop key={i} offset={camX * 0.25 + frame * c.speed * 1.6} width={CLOUD_SPAN} top={lift(0.25)} opacity={clouds}>
          <Cloud x={c.x} y={c.y + 120} s={c.s} p={p} />
        </Loop>
      ))}
      <div style={{ opacity: 1 - sunset }}>
        <Loop offset={camX * 0.35} width={3000} top={lift(0.35)}>
          <svg width={3000} height={1080} shapeRendering="crispEdges">
            <path d={mid} fill={p.mid} />
          </svg>
        </Loop>
      </div>
    </AbsoluteFill>
  );
};

// 近处的树丛：视差 0.6，压在地平线上
export const Bushes: React.FC<{ camX: number; camY?: number; mood: number; sunset?: number }> = ({ camX, camY = 0, mood, sunset = 0 }) => {
  const p = palette(mood, sunset);
  const bushes = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({ x: i * 300 + 120 * random(`bx${i}`), w: 120 + 160 * random(`bw${i}`), h: 50 + 90 * random(`bh${i}`) })),
    [],
  );
  return (
    <Loop offset={camX * 0.6} width={3000} top={-camY * 0.6}>
      {bushes.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x, top: GROUND_Y - b.h, width: b.w, height: b.h }}>
          <div style={{ position: "absolute", left: b.w * 0.15, top: 0, width: b.w * 0.7, height: b.h, backgroundColor: p.near }} />
          <div style={{ position: "absolute", left: 0, top: b.h * 0.35, width: b.w, height: b.h * 0.65, backgroundColor: p.near }} />
        </div>
      ))}
    </Loop>
  );
};

// 地面：暖色顶边 + 网点土层；pits 是坑（世界坐标）
export const Ground: React.FC<{ camX: number; camY?: number; mood: number; sunset?: number; pits?: readonly (readonly [number, number])[]; from?: number; to?: number }> = ({
  camX,
  camY = 0,
  mood,
  sunset = 0,
  pits = [],
  from = -2000,
  to = 40000,
}) => {
  const p = palette(mood, sunset);
  const segments: [number, number][] = [];
  let start = from;
  for (const [a, b] of [...pits].sort((x, y) => x[0] - y[0])) {
    segments.push([start, a]);
    start = b;
  }
  segments.push([start, to]);
  return (
    <AbsoluteFill style={{ transform: `translate(${-camX}px, ${-camY}px)` }}>
      {segments.map(([a, b], i) => {
        // 只画进入画面的那一段，免得几万像素宽的 div 拖慢渲染
        const left = Math.max(a, camX - 200);
        const right = Math.min(b, camX + 2200);
        if (right <= left) return null;
        const tile = 48;
        const phase = ((left % tile) + tile) % tile;
        return (
          <div key={i} style={{ position: "absolute", left, top: GROUND_Y, width: right - left, height: 1400, backgroundColor: p.ground }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                top: 36,
                backgroundImage: `radial-gradient(${p.groundDeep} 4px, transparent 4px)`,
                backgroundSize: `${tile}px ${tile}px`,
                backgroundPosition: `${-phase}px 0`,
              }}
            />
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 16, backgroundColor: p.groundTop }} />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 16,
                height: 12,
                backgroundImage: `repeating-linear-gradient(to right, ${p.groundEdge} 0 24px, transparent 24px 48px)`,
                backgroundPosition: `${-phase}px 0`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 雾：随天气浓淡；前景层比地面移动得快
export const Fog: React.FC<{ camX: number; frame: number; amount: number }> = ({ camX, frame, amount }) => {
  if (amount <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: amount }}>
      {[0, 1].map((i) => (
        <Loop key={i} offset={camX * (1.2 + i * 0.25) + frame * (1.2 + i)} width={1920} top={i ? 610 : 380}>
          <div
            style={{
              width: 1920,
              height: i ? 170 : 240,
              backgroundImage: "repeating-linear-gradient(to right, rgba(205,214,240,0.20) 0px, rgba(205,214,240,0.20) 380px, rgba(205,214,240,0) 380px, rgba(205,214,240,0) 560px)",
            }}
          />
        </Loop>
      ))}
    </AbsoluteFill>
  );
};

// 雨：屏幕空间的斜向像素短线
export const Rain: React.FC<{ frame: number; amount: number; density?: number }> = ({ frame, amount, density = 70 }) => {
  if (amount <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.5 * amount }}>
      {Array.from({ length: density }, (_, i) => {
        const speed = 26 + 12 * random(`rs${i}`);
        const y = ((random(`ry${i}`) * 1200 + frame * speed) % 1200) - 100;
        const x = random(`rx${i}`) * 2300 - y * 0.3;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: 30, backgroundColor: "#c9d3f2", transform: "rotate(16deg)" }} />;
      })}
    </AbsoluteFill>
  );
};
