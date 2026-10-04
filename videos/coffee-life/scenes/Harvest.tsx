import { interpolate, useCurrentFrame } from "remotion";
import { Canvas, Cherry, Defs, Leaf, Note, drawn, easeInOut, pop, prog, ripeColor, rnd } from "../components/art";
import { Basket } from "../components/objects";
import type { SceneProps } from "../components/Stage";
import { ART, CHERRY, INK } from "../theme";

// 采摘：「同一根枝条上的果子，不会同时成熟。讲究的庄园，每隔一周多就回到同一棵树前，只摘熟透的那几颗。」
// 一根横枝上四簇果子，各自按不同的时间由青转红；之后三轮采摘，每轮只有熟透的跳进篮子，青的留在枝上
const BRANCH = "M -30 330 C 160 290, 320 370, 480 340 S 760 300, 970 330";
const BASKET = { x: 468, y: 700 };

// 四簇果子，每簇 4~5 颗；ripeAt 是这颗果子红透的时刻（相对场景起点的帧，-1 表示到最后也没熟）
type Fruit = { readonly x: number; readonly y: number; readonly ripeAt: number };

const clusters = [
  { x: 150, y: 328 },
  { x: 360, y: 352 },
  { x: 600, y: 328 },
  { x: 810, y: 320 },
];

export const Harvest: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const [c0, c1] = [cues[0]!, cues[1]!];
  // 三轮采摘的时刻：「每隔一周多」之后开始
  const passes = [c1 + 40, c1 + 100, c1 + 160];

  // 成熟时间：大约三分之一在第一句里就红了，其余陆续赶上，留两颗到最后还是青的
  const fruits: Fruit[] = [];
  clusters.forEach((c, ci) => {
    const n = ci % 2 === 0 ? 5 : 4;
    for (let k = 0; k < n; k++) {
      const id = `${ci}-${k}`;
      const angle = -0.9 + (k / (n - 1)) * 1.8;
      const slot = Math.floor(rnd(`ripe-${id}`) * 10);
      const ripeAt = slot === 9 ? -1 : slot < 3 ? c0 + 20 + slot * 30 : slot < 6 ? passes[0] + 10 + (slot - 3) * 20 : passes[1] + 10 + (slot - 6) * 18;
      fruits.push({ x: c.x + Math.sin(angle) * 44, y: c.y + 42 + Math.cos(angle) * 14 + (k % 2) * 22, ripeAt });
    }
  });

  const branch = prog(f, 0, 30, easeInOut);
  const basket = prog(f, c1 - 10, c1 + 14, pop);
  const pass = passes.filter((p) => f >= p).length;

  return (
    <Canvas>
      <Defs />
      <path d={BRANCH} stroke={ART.branch} strokeWidth={14} strokeLinecap="round" fill="none" {...drawn(branch)} />
      {clusters.map((c, i) => (
        <g key={i}>
          <Leaf x={c.x - 30} y={c.y + 2} len={130} angle={-150} grow={prog(f, 10 + i * 5, 30 + i * 5, pop)} />
          <Leaf x={c.x + 30} y={c.y - 2} len={120} angle={-30} grow={prog(f, 14 + i * 5, 34 + i * 5, pop)} color={ART.leafDark} />
        </g>
      ))}

      <g transform={`translate(${BASKET.x} ${BASKET.y}) scale(${basket}) translate(${-BASKET.x} ${-BASKET.y})`} opacity={basket}>
        <Basket x={BASKET.x} y={BASKET.y} />
      </g>

      {fruits.map((fr, i) => {
        // 这颗果子在哪一轮被摘：红透之后的第一轮
        const pickAt = fr.ripeAt < 0 ? Infinity : passes.find((p) => p >= fr.ripeAt) ?? Infinity;
        const ripe = fr.ripeAt < 0 ? 0.15 : interpolate(f, [fr.ripeAt - 60, fr.ripeAt], [0, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const grow = prog(f, 16 + i * 2, 36 + i * 2, pop);
        // 摘下：同一轮里错开几帧，划一道弧线落进篮子；一直没熟的留在枝上
        const picked = Number.isFinite(pickAt);
        const t = picked ? prog(f, pickAt + (i % 6) * 3, pickAt + (i % 6) * 3 + 22, easeInOut) : 0;
        const tx = BASKET.x - 120 + rnd(`land-x-${i}`) * 240;
        const ty = BASKET.y - 14 - rnd(`land-y-${i}`) * 16;
        const x = fr.x + (tx - fr.x) * t;
        const y = fr.y + (ty - fr.y) * t - Math.sin(Math.PI * t) * 120;
        return (
          <g key={i}>
            <path d={`M ${fr.x} ${fr.y - 40} L ${fr.x} ${fr.y - 16}`} stroke={ART.branch} strokeWidth={4} opacity={grow * (picked ? 1 - prog(f, pickAt, pickAt + 6) : 1)} />
            <Cherry x={x} y={y} r={27} color={ripeColor(ripe)} scale={grow} />
          </g>
        );
      })}

      {/* 第几轮采摘 */}
      <g opacity={prog(f, passes[0] - 10, passes[0] + 6)}>
        {[0, 1, 2].map((k) => (
          <g key={k} opacity={pass > k ? 1 : 0.3}>
            <circle cx={150 + k * 318} cy={120} r={30} fill={pass > k ? CHERRY : "none"} stroke={pass > k ? CHERRY : INK} strokeWidth={3} />
            <text x={150 + k * 318} y={132} textAnchor="middle" fontSize={32} fill={pass > k ? "white" : INK}>
              {k + 1}
            </text>
            <Note x={150 + k * 318} y={196} text={`第${["一", "二", "三"][k]}轮`} size={26} color={INK} />
            {k < 2 ? (
              <>
                <path d={`M ${190 + k * 318} 120 L ${428 + k * 318} 120`} stroke={INK} strokeWidth={2} strokeDasharray="4 8" />
                <Note x={309 + k * 318} y={104} text="隔一周多" size={26} />
              </>
            ) : null}
          </g>
        ))}
      </g>
    </Canvas>
  );
};
