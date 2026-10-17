import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { Lift, type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 三种识别方式：首次引导里"先选一种识别方式"那一页（真截图）在左，三种方式一拍一项从页面上抽出来、排到右边，
// 每一项底下接一条光路：上下两条轨道，上面是云端、下面是本机，录音沿着它走到成稿；哪一步上了云，线就弯上去。
// 数据隐私那一条始终贴着本机那条轨道走。

export const MODES_FRAMES = b(16);
export const MODES_CAMERA = deepCamera(MODES_FRAMES);

type Kind = "io" | "device" | "cloud";
type Node = { label: string; icon: keyof typeof UI; kind: Kind };
const REC: Node = { label: "录音", icon: "mic", kind: "io" };
const DONE: Node = { label: "成稿", icon: "text", kind: "io" };
// 引导页上三项的位置（截图像素）和各自的走向
const WAYS: readonly { rect: Rect; nodes: readonly Node[] }[] = [
  { rect: { x: 486, y: 400, w: 1348, h: 212 }, nodes: [REC, { label: "大模型", icon: "cloud", kind: "cloud" }, DONE] },
  {
    rect: { x: 486, y: 632, w: 1348, h: 208 },
    nodes: [REC, { label: "本机转写", icon: "chip", kind: "device" }, { label: "润色", icon: "cloud", kind: "cloud" }, DONE],
  },
  { rect: { x: 486, y: 860, w: 1348, h: 210 }, nodes: [REC, { label: "本机转写", icon: "chip", kind: "device" }, DONE] },
];

const SHOT_AT = { left: 60, top: 250, width: 900 };
const COLUMN = { left: 1030, top: 186, width: 740, gap: 252 };
const CARD_SCALE = COLUMN.width / WAYS[0].rect.w;
const liftAt = (i: number) => b(2 + 2 * i);
/** 抽出来落定之后，光点从录音走到成稿 */
const travelAt = (i: number) => liftAt(i) + 34;
const TRAVEL = b(1.6);
const T = { again: b(10), caption: b(10.4), out: b(15.2) };

export const Modes: React.FC = () => {
  const frame = useCurrentFrame();
  const out = prog(frame, T.out, 26, EASE.inOut);
  const shotIn = prog(frame, 6, 44);
  const current = WAYS.reduce((n, _, i) => (frame >= liftAt(i) ? i : n), -1);
  const shotScale = SHOT_AT.width / SHOTS.way.w;

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 150, top: 96, textShadow: SHADOW }}>
        <div style={{ fontSize: 78, fontWeight: 700, ...show(frame, 0) }}>三种识别方式</div>
        <div style={{ marginTop: 8, fontSize: 36, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.12em", ...show(frame, 10) }}>平级可选 · 一键切换</div>
      </div>

      <AbsoluteFill style={{ perspective: 2200 }}>
        <Shot
          shot={SHOTS.way}
          width={SHOT_AT.width}
          spot={current >= 0 && frame < T.again ? { rect: WAYS[current].rect, k: prog(frame, liftAt(0), 14) } : undefined}
          style={{
            left: SHOT_AT.left,
            top: SHOT_AT.top,
            opacity: shotIn * (1 - 0.35 * prog(frame, T.again, 30)),
            transformOrigin: "0% 50%",
            transform: `translateX(${-200 * (1 - shotIn)}px) rotateY(${16 - 8 * shotIn}deg)`,
          }}
        />
      </AbsoluteFill>

      {WAYS.map((way, i) => {
        const lift = prog(frame, liftAt(i), 40, EASE.inOut);
        if (lift <= 0) return null;
        const to = { left: COLUMN.left, top: COLUMN.top + i * COLUMN.gap };
        const from = { left: SHOT_AT.left + way.rect.x * shotScale, top: SHOT_AT.top + way.rect.y * shotScale, k: shotScale / CARD_SCALE };
        return (
          <div key={i}>
            <Lift
              shot={SHOTS.way}
              rect={way.rect}
              scale={CARD_SCALE}
              radius={18}
              style={{
                left: interpolate(lift, [0, 1], [from.left, to.left]),
                top: interpolate(lift, [0, 1], [from.top, to.top]),
                transformOrigin: "0 0",
                transform: `scale(${interpolate(lift, [0, 1], [from.k, 1]) * punch(frame, liftAt(i) + 40, 0.03, 18)})`,
                boxShadow: `0 0 0 1px oklch(0 0 0 / 0.08), 0 ${30 * lift}px ${80 * lift}px oklch(0 0 0 / ${0.5 * lift})`,
              }}
            />
            <Route frame={frame} nodes={way.nodes} left={to.left} top={to.top + way.rect.h * CARD_SCALE + 8} at={travelAt(i)} id={`route-${i}`} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 150, top: 930, fontSize: 38, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.08em", textShadow: SHADOW, ...show(frame, T.caption) }}>
        首页切换 · 即刻生效 · 配置分别保存
      </div>

      <Flash frame={frame} at={[0]} strength={0.7} />
      <Sfx at={0} name="sfxFlash" volume={0.3} />
      {WAYS.map((_, i) => (
        <Sfx key={`l${i}`} at={liftAt(i)} name="sfxSwish" volume={0.28} />
      ))}
      {WAYS.map((_, i) => (
        <Sfx key={`n${i}`} at={liftAt(i) + 40} name={(["sfxNote0", "sfxNote1", "sfxNote2"] as const)[i]} volume={0.26} />
      ))}
      {WAYS.map((_, i) => (
        <Sfx key={`d${i}`} at={travelAt(i) + TRAVEL} name="sfxBlip" volume={0.32} />
      ))}
      <Sfx at={T.again} name="sfxNote4" volume={0.24} />
      <Sfx at={swellBefore(MODES_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

// 光路的两条轨道（相对这一条的左上角）：上面云端、下面本机
const RAIL = { cloud: 34, device: 82, labelW: 56, start: 104, end: COLUMN.width - 36 };
const railOf = (kind: Kind) => (kind === "cloud" ? RAIL.cloud : RAIL.device);

/** 一条光路上取样的点：同一条轨道上走直线，换轨道时走一段两头水平的弧 */
function sample(nodes: readonly Node[]) {
  const step = (RAIL.end - RAIL.start) / (nodes.length - 1);
  const stations = nodes.map((node, j) => ({ x: RAIL.start + j * step, y: railOf(node.kind) }));
  const points: { x: number; y: number }[] = [stations[0]];
  for (let j = 1; j < stations.length; j++) {
    const a = stations[j - 1];
    const c = stations[j];
    const mx = (a.x + c.x) / 2;
    for (let t = 1 / 32; t <= 1.0001; t += 1 / 32) {
      const u = 1 - t;
      // 三次贝塞尔：两个控制点都在中线上，各自贴着起点、终点那一条轨道
      points.push({
        x: u * u * u * a.x + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * c.x,
        y: u * u * u * a.y + 3 * u * u * t * a.y + 3 * u * t * t * c.y + t * t * t * c.y,
      });
    }
  }
  const lengths = [0];
  for (let j = 1; j < points.length; j++) lengths.push(lengths[j - 1] + Math.hypot(points[j].x - points[j - 1].x, points[j].y - points[j - 1].y));
  return { stations, points, lengths, total: lengths[lengths.length - 1] };
}

/** 走过 p（0–1）那一点 */
function pointAt(path: ReturnType<typeof sample>, p: number) {
  const target = p * path.total;
  const j = Math.max(1, path.lengths.findIndex((l) => l >= target));
  const a = path.points[j - 1];
  const c = path.points[j];
  const t = (target - path.lengths[j - 1]) / Math.max(1e-6, path.lengths[j] - path.lengths[j - 1]);
  return { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t };
}

/**
 * 一条光路：两条轨道（云端、本机）的细虚线，线先淡淡地铺好；at 起一颗光点从录音走到成稿，走过的那一截亮起来，
 * 颜色按高低在靛青（本机）和朱砂（云端）之间过渡。T.again 时三条一起再走一遍
 */
const Route: React.FC<{ frame: number; nodes: readonly Node[]; left: number; top: number; at: number; id: string }> = ({ frame, nodes, left, top, at, id }) => {
  const path = sample(nodes);
  const start = frame >= T.again ? T.again : at;
  const p = interpolate(frame, [start, start + TRAVEL], [0, 1], { ...clamp, easing: EASE.inOut });
  const head = pointAt(path, p);
  const d = path.points.map((pt, j) => `${j === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  const moving = frame >= start && frame < start + TRAVEL + 16;
  const cloudless = nodes.every((node) => node.kind !== "cloud");
  return (
    <div style={{ position: "absolute", left, top, width: COLUMN.width, height: 116, ...show(frame, at - 12, undefined, 12) }}>
      {(["cloud", "device"] as const).map((rail) => (
        <div key={rail}>
          <div style={{ position: "absolute", left: 0, top: RAIL[rail] - 11, fontSize: 18, fontWeight: 500, letterSpacing: "0.14em", color: rail === "cloud" ? "oklch(0.74 0.17 32 / 0.8)" : "oklch(0.8 0.07 255 / 0.9)" }}>
            {rail === "cloud" ? "云端" : "本机"}
          </div>
          <div
            style={{
              position: "absolute",
              left: RAIL.labelW,
              right: 0,
              top: RAIL[rail],
              borderTop: "1px dashed oklch(1 0 0 / 0.14)",
              // 不经云端的那一条：云端轨道中间断开，让出"不经云端"四个字
              maskImage: cloudless && rail === "cloud" ? "linear-gradient(90deg, black 36%, transparent 41%, transparent 63%, black 68%)" : undefined,
            }}
          />
        </div>
      ))}
      {cloudless ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: RAIL.cloud - 12, textAlign: "center", fontSize: 18, letterSpacing: "0.2em", color: COLOR.faint }}>
          不经云端
        </div>
      ) : null}
      <svg width={COLUMN.width} height={116} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${id}-tone`} gradientUnits="userSpaceOnUse" x1={0} y1={RAIL.cloud} x2={0} y2={RAIL.device}>
            <stop offset="0" stopColor="oklch(0.78 0.16 35)" />
            <stop offset="1" stopColor="oklch(0.84 0.07 255)" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-10%" y="-60%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <path d={d} fill="none" stroke={`url(#${id}-tone)`} strokeWidth={1.5} opacity={0.3} />
        {p > 0 ? (
          <>
            <path d={d} fill="none" stroke={`url(#${id}-tone)`} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${p * path.total} ${path.total}`} filter={`url(#${id}-glow)`} opacity={0.8} />
            <path d={d} fill="none" stroke={`url(#${id}-tone)`} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={`${p * path.total} ${path.total}`} />
          </>
        ) : null}
        {path.stations.map((st, j) => {
          const reached = p * path.total >= path.lengths[Math.min(path.lengths.length - 1, j * 32)] - 0.5 && frame >= start;
          return <circle key={j} cx={st.x} cy={st.y} r={reached ? 6 : 4} fill={reached ? "white" : "oklch(1 0 0 / 0.5)"} />;
        })}
        {moving ? <circle cx={head.x} cy={head.y} r={7} fill="white" style={{ filter: "drop-shadow(0 0 8px white)" }} opacity={1 - prog(frame, start + TRAVEL, 16)} /> : null}
      </svg>
      {nodes.map((node, j) => {
        const st = path.stations[j];
        const above = node.kind === "cloud";
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: st.x,
              top: above ? st.y - 40 : st.y + 14,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              color: COLOR.ink2,
            }}
          >
            <Glyph icon={UI[node.icon]} size={18} />
            {node.label}
          </div>
        );
      })}
    </div>
  );
};
