import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { Phone } from "../components/phone";
import { Hero } from "../components/stage";
import { followAt } from "../components/story";
import { UUSnug } from "../components/uu";
import { b, C, local, SF, ZH } from "../theme";

// 场景：Mac 留在宿舍，人带着手机去了图书馆（开场日历提醒里的那个小组讨论），Claude Code 照常往下跑：
// 手机上是上一个场景里刚问的 gestures，回答一路写到图书馆写完。
// 一张代码画的街区图：两个落点、一条连线上来回走的光点，手机沿着路线走远，距离往上数。
const START = 192;
const at = local(START);
const DORM = { x: 250, y: 800 };
/** 手机就是图书馆那头的落点：放在右下，路线接到它左边 */
const PHONE = { x: 790, y: 1420, s: 0.62 };
const END = { x: 610, y: 1330 };
const C1 = { x: 260, y: 1120 };
const C2 = { x: 420, y: 1300 };
const ROUTE = `M ${DORM.x} ${DORM.y} C ${C1.x} ${C1.y}, ${C2.x} ${C2.y}, ${END.x} ${END.y}`;

// 街区：横竖两组略微倾斜的街道，几条主路亮一点
const STREETS = Array.from({ length: 34 }, (_, i) => {
  const v = i % 2 === 0;
  const k = Math.floor(i / 2);
  const off = k * 120 + random(`st${i}`) * 60;
  const tilt = (random(`tl${i}`) - 0.5) * 80;
  return v ? { x1: off - 80, y1: 520, x2: off - 80 + tilt, y2: 1920, main: k % 4 === 1 } : { x1: -40, y1: 540 + off, x2: 1120, y2: 540 + off + tilt, main: k % 4 === 2 };
});

const Laptop: React.FC = () => (
  <svg width="96" height="70" viewBox="0 0 96 70">
    <rect x="14" y="4" width="68" height="46" rx="5" fill="#ffffff" stroke="#1f63ff" strokeWidth="3" />
    <rect x="20" y="10" width="56" height="34" rx="2" fill="url(#lg)" />
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22d8ff" />
        <stop offset="1" stopColor="#2a6dff" />
      </linearGradient>
    </defs>
    <path d="M4 56h88l-6 8H10z" fill="#1f63ff" />
  </svg>
);

const Pin: React.FC<{ x: number; y: number; p: number; children: React.ReactNode; label: string; sub: string; side: "left" | "right" }> = ({ x, y, p, children, label, sub, side }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>
    <div style={{ position: "absolute", left: -70, top: -70, width: 140, height: 140, borderRadius: 70, background: "rgba(255,255,255,0.85)", border: "2.5px solid rgba(31,99,255,0.55)", boxShadow: "0 10px 30px rgba(20,40,90,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    <div style={{ position: "absolute", top: -40, [side === "left" ? "right" : "left"]: 96, whiteSpace: "nowrap", textAlign: side === "left" ? "right" : "left" }}>
      <div style={{ fontFamily: ZH, fontSize: 46, fontWeight: 700, color: C.ink }}>{label}</div>
      <div style={{ fontFamily: SF, fontSize: 28, color: C.ink2, marginTop: 4 }}>{sub}</div>
    </div>
  </div>
);

export const Anywhere: React.FC = () => {
  const f = useCurrentFrame();
  const t = f;
  const map = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: outExpo });
  const route = interpolate(t, [at(1), at(5)], [0, 1], { ...clamp, easing: inOutQuint });
  const dorm = interpolate(f, [4, 18], [0, 1], { ...clamp, easing: outExpo });
  const lib = interpolate(f, [at(5), at(5) + 14], [0, 1], { ...clamp, easing: outExpo });
  const km = 2.4 * route;
  // 手机跟着路线走：用三次贝塞尔算位置
  const bz = (u: number) => {
    const P = [DORM, C1, C2, END];
    const m = 1 - u;
    return {
      x: m * m * m * P[0].x + 3 * m * m * u * P[1].x + 3 * m * u * u * P[2].x + u * u * u * P[3].x,
      y: m * m * m * P[0].y + 3 * m * m * u * P[1].y + 3 * m * u * u * P[2].y + u * u * u * P[3].y,
    };
  };
  const dot = bz(route);
  // Claude Code 在手机上照常往外吐字
  const lines = followAt(b(START) + f);
  return (
    <AbsoluteFill>
      <svg style={{ position: "absolute", left: 0, top: 0, opacity: map }} width={1080} height={1920}>
        <defs>
          <radialGradient id="fade" cx="50%" cy="60%" r="60%">
            <stop offset="0.5" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="m">
            <rect width="1080" height="1920" fill="url(#fade)" />
          </mask>
        </defs>
        <g mask="url(#m)">
          <path d="M -40 1300 C 300 1220, 600 1420, 1120 1260 L 1120 1340 C 600 1500, 300 1300, -40 1380 Z" fill="rgba(0,184,234,0.1)" />
          {STREETS.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.main ? "rgba(31,99,255,0.18)" : "rgba(31,99,255,0.08)"} strokeWidth={s.main ? 5 : 2} />
          ))}
        </g>
        <path d={ROUTE} fill="none" stroke={C.blue} strokeWidth="7" strokeLinecap="round" pathLength={1} strokeDasharray={`${route} 1`} />
        {/* 连线上来回走的光点：画面和输入在两头之间传 */}
        {route > 0.98
          ? [0, 0.33, 0.66].map((o, i) => {
              const u = (t / 70 + o) % 1;
              const q = bz(i % 2 === 0 ? u : 1 - u);
              return <circle key={i} cx={q.x} cy={q.y} r={9} fill={C.cyan} opacity={0.9} />;
            })
          : null}
      </svg>
      <Pin x={DORM.x} y={DORM.y} p={dorm} label="宿舍" sub="MacBook" side="right">
        <Laptop />
      </Pin>
      {route > 0 && route < 1 ? <div style={{ position: "absolute", left: dot.x - 14, top: dot.y - 14, width: 28, height: 28, borderRadius: 14, background: C.cyan, boxShadow: "0 0 30px rgba(0,184,234,0.8)" }} /> : null}
      <div style={{ position: "absolute", left: 120, top: 1520, width: 470, textAlign: "right", opacity: lib }}>
        <div style={{ fontFamily: ZH, fontSize: 46, fontWeight: 700, color: C.ink }}>图书馆</div>
        <div style={{ fontFamily: SF, fontSize: 28, color: C.ink2, marginTop: 4 }}>iPhone</div>
      </div>
      <div style={{ position: "absolute", left: 470, top: 930, fontFamily: SF, fontWeight: 800, fontSize: 92, color: C.blue, opacity: route > 0 ? 1 : 0, letterSpacing: "-0.02em" }}>
        {km.toFixed(1)} km
      </div>
      <Phone x={PHONE.x} y={PHONE.y} scale={PHONE.s} glow={0.4 + 0.5 * lib}>
        <UUSnug>
          <GhosttyApp lines={lines} size={16} />
        </UUSnug>
      </Phone>
      <Hero at={2} until={at(16) - 6} title="ANYWHERE" sub="人在途中 · 进度不停" />
    </AbsoluteFill>
  );
};
