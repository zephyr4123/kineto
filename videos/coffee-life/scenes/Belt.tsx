import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Canvas, Note, drawn, ease, easeInOut, pop, prog } from "../components/art";
import type { SceneProps } from "../components/Stage";
import { assets } from "../assets.gen";
import { CHERRY, INK, MUTED, PAPER, STAGE } from "../theme";

// 产地 · 咖啡带：「世界上的咖啡，大多种在南北回归线之间，人们把这一圈叫作咖啡带」
// 底图是 Natural Earth 陆地轮廓按等距圆柱投影生成的 SVG（经度 -180~180，纬度 72~-56）。
// 只露出经度 -125~155 这一段（咖啡带两端之外多是太平洋），地图能放大约三成
const LON_FROM = -125;
const LON_SPAN = 280;
const PPD = STAGE.w / LON_SPAN;
const IMG_W = 360 * PPD;
const IMG_H = (IMG_W * 640) / 1800;
const MAP_TOP = 250;
const TROPIC = 23.44;

const x = (lon: number) => (lon - LON_FROM) * PPD;
const y = (lat: number) => MAP_TOP + ((72 - lat) / 128) * IMG_H;

// 几个代表性产区（大致位置）；云南放进来，中国观众更有代入感
const ORIGINS = [
  { name: "哥伦比亚", lat: 4.6, lon: -75.6, side: -1 },
  { name: "巴西", lat: -19, lon: -45, side: 1 },
  { name: "埃塞俄比亚", lat: 7, lon: 38.5, side: 1 },
  { name: "云南", lat: 22.8, lon: 101, side: 1 },
] as const;

export const Belt: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues[0]!;
  const land = prog(f, 0, 24);
  // 「南北回归线之间」大约在开口后 1.5 秒：带子从赤道向南北展开
  const band = prog(f, c + 36, c + 72, easeInOut);
  const lines = prog(f, c + 50, c + 84, ease);
  const labels = prog(f, c + 70, c + 90);
  // 「咖啡带」三个字在句尾：标题和产区圆点这时出来
  const title = prog(f, c + 150, c + 175);
  const top = y(TROPIC);
  const bottom = y(-TROPIC);
  const equator = y(0);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(assets.worldMap)}
        style={{ position: "absolute", left: -(LON_FROM + 180) * PPD, top: MAP_TOP, width: IMG_W, height: IMG_H, opacity: land }}
      />
      <Canvas>
        <rect x={0} y={equator - (equator - top) * band} width={STAGE.w} height={(bottom - top) * band} fill={CHERRY} opacity={0.16} />
        {[
          { at: top, name: "北回归线", dash: "10 8", color: CHERRY },
          { at: equator, name: "赤道", dash: "2 8", color: MUTED },
          { at: bottom, name: "南回归线", dash: "10 8", color: CHERRY },
        ].map((l) => (
          <g key={l.name}>
            <path d={`M 0 ${l.at} L ${STAGE.w} ${l.at}`} stroke={l.color} strokeWidth={2.5} strokeDasharray={l.dash} opacity={0.85 * lines} />
            <text x={10} y={l.at - 12} fontSize={26} fill={l.color} letterSpacing="0.08em" opacity={labels}>
              {l.name}
            </text>
          </g>
        ))}
        {ORIGINS.map((o, i) => {
          const on = prog(f, c + 110 + i * 10, c + 126 + i * 10, pop);
          return (
            <g key={o.name} opacity={prog(f, c + 110 + i * 10, c + 118 + i * 10)}>
              <circle cx={x(o.lon)} cy={y(o.lat)} r={9 * on} fill={CHERRY} stroke={PAPER} strokeWidth={4} />
              <text x={x(o.lon) + o.side * 18} y={y(o.lat) + 10} textAnchor={o.side > 0 ? "start" : "end"} fontSize={28} fill={INK}>
                {o.name}
              </text>
            </g>
          );
        })}
        <g opacity={title}>
          <text x={0} y={110} fontSize={56} fontWeight={600} fill={INK} letterSpacing="0.16em">
            咖啡带
          </text>
          <path d="M 0 140 L 120 140" stroke={CHERRY} strokeWidth={3} {...drawn(title)} />
          <Note x={0} y={186} text="北纬 23°26′ — 南纬 23°26′" anchor="start" size={26} />
        </g>
      </Canvas>
    </AbsoluteFill>
  );
};
