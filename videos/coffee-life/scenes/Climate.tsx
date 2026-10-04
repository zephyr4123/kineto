import { useCurrentFrame } from "remotion";
import {
  Canvas,
  Cherry,
  Defs,
  Leaf,
  Note,
  Shadow,
  drawn,
  ease,
  easeInOut,
  pop,
  prog,
  rnd,
} from "../components/art";
import { Sun } from "../components/objects";
import type { SceneProps } from "../components/Stage";
import { ART, INK, MUTED } from "../theme";

// 产地 · 气候：「咖啡树怕霜冻，也怕酷热，喜欢温和湿润的地方」
// 一棵咖啡树一层层长出来；树下一条温度带，说到哪一端亮哪一端，最后中间「温和」高亮、下起细雨
const GROUND = 640;
const TRUNK_X = 468;
const STRIP = { x: 120, y: 760, w: 696, h: 20 };

// 咖啡树是灌木：主干上一层层横枝，枝上成对的叶子，叶腋里挂一簇果子
const TIERS = [
  { y: 560, len: 230 },
  { y: 480, len: 210 },
  { y: 400, len: 180 },
  { y: 320, len: 140 },
  { y: 250, len: 90 },
];

const Snowflake: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s: number;
}> = ({ x, y, s }) => (
  <g
    transform={`translate(${x} ${y}) scale(${s})`}
    stroke="#7c9bb4"
    strokeWidth={5}
    strokeLinecap="round"
  >
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <path d="M 0 -30 L 0 30" />
        <path d="M -8 -22 L 0 -14 L 8 -22 M -8 22 L 0 14 L 8 22" fill="none" />
      </g>
    ))}
  </g>
);

export const Climate: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues[0]!;
  const trunk = prog(f, 0, 30, easeInOut);
  const strip = prog(f, c + 10, c + 40, easeInOut);
  const cold = prog(f, c + 24, c + 40, pop);
  const hot = prog(f, c + 58, c + 74, pop);
  const mild = prog(f, c + 96, c + 120, ease);
  const rain = prog(f, c + 104, c + 130);
  // 说到「霜冻」「酷热」时，两端各暗下去一点：它们不是咖啡树想要的
  const coldDim = 1 - 0.55 * prog(f, c + 44, c + 60);
  const hotDim = 1 - 0.55 * prog(f, c + 78, c + 94);

  return (
    <Canvas>
      <Defs />
      <defs>
        <linearGradient id="temp" x1="0" x2="1">
          <stop offset="0%" stopColor="#9db8cc" />
          <stop offset="50%" stopColor="#c7cc98" />
          <stop offset="100%" stopColor="#df8a56" />
        </linearGradient>
      </defs>

      {/* 细雨 */}
      {Array.from({ length: 16 }, (_, i) => {
        const period = 34 + Math.floor(rnd(`rain-p-${i}`) * 16);
        const t =
          ((f + Math.floor(rnd(`rain-o-${i}`) * period)) % period) / period;
        const x = 190 + rnd(`rain-x-${i}`) * 560;
        const y = 150 + t * 420;
        return (
          <path
            key={i}
            d={`M ${x} ${y} q -5 12 0 16 q 5 -4 0 -16 Z`}
            fill={ART.water}
            opacity={rain * Math.sin(t * Math.PI) * 0.85}
          />
        );
      })}

      {/* 地面与树 */}
      <path
        d={`M 150 ${GROUND} L 786 ${GROUND}`}
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
        {...drawn(trunk)}
      />
      <Shadow x={TRUNK_X} y={GROUND + 4} rx={180 * trunk} ry={16} />
      <path
        d={`M ${TRUNK_X} ${GROUND} L ${TRUNK_X} ${GROUND - 410}`}
        stroke={ART.branch}
        strokeWidth={16}
        strokeLinecap="round"
        {...drawn(trunk)}
      />
      {TIERS.map((tier, i) => {
        const g = prog(f, 14 + i * 9, 40 + i * 9, pop);
        return [-1, 1].map((side) => {
          const ex = TRUNK_X + side * tier.len;
          const ey = tier.y - 26;
          return (
            <g key={`${i}${side}`}>
              <path
                d={`M ${TRUNK_X} ${tier.y} Q ${TRUNK_X + side * tier.len * 0.5} ${tier.y - 6} ${ex} ${ey}`}
                stroke={ART.branch}
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
                {...drawn(g)}
              />
              {[0.35, 0.7, 1].map((k) => (
                <g key={k}>
                  <Leaf
                    x={TRUNK_X + side * tier.len * k}
                    y={tier.y - 4 - 22 * k}
                    len={70 - k * 14}
                    angle={side > 0 ? -38 : -142}
                    grow={g}
                  />
                  <Leaf
                    x={TRUNK_X + side * tier.len * k}
                    y={tier.y - 4 - 22 * k}
                    len={62 - k * 12}
                    angle={side > 0 ? 28 : 152}
                    grow={g}
                    color={ART.leafDark}
                  />
                </g>
              ))}
              {i < 4
                ? [0, 1, 2].map((j) => (
                    <Cherry
                      key={j}
                      x={TRUNK_X + side * (tier.len * 0.5 + j * 13)}
                      y={tier.y + 8 + (j % 2) * 10}
                      r={11}
                      scale={g}
                      color={j === 1 ? ART.ripe : ART.orange}
                    />
                  ))
                : null}
            </g>
          );
        });
      })}

      {/* 温度带 */}
      <rect
        x={STRIP.x}
        y={STRIP.y}
        width={STRIP.w * strip}
        height={STRIP.h}
        rx={STRIP.h / 2}
        fill="url(#temp)"
      />
      <rect
        x={STRIP.x}
        y={STRIP.y}
        width={STRIP.w * 0.3}
        height={STRIP.h}
        rx={STRIP.h / 2}
        fill="#f1eadf"
        opacity={(1 - coldDim) * strip}
      />
      <rect
        x={STRIP.x + STRIP.w * 0.7}
        y={STRIP.y}
        width={STRIP.w * 0.3}
        height={STRIP.h}
        rx={STRIP.h / 2}
        fill="#f1eadf"
        opacity={(1 - hotDim) * strip}
      />
      <g opacity={coldDim}>
        <Snowflake x={STRIP.x - 2} y={STRIP.y + 70} s={cold} />
        <Note
          x={STRIP.x + 50}
          y={STRIP.y + 82}
          text="霜冻"
          anchor="start"
          opacity={cold}
        />
      </g>
      <g opacity={hotDim}>
        <Sun
          x={STRIP.x + STRIP.w + 2}
          y={STRIP.y + 70}
          s={0.9 * hot}
          spin={f * 0.6}
        />
        <Note
          x={STRIP.x + STRIP.w - 52}
          y={STRIP.y + 82}
          text="酷热"
          anchor="end"
          opacity={hot}
        />
      </g>
      {/* 温和：中间一段高亮，一条虚线连到树下 */}
      <rect
        x={STRIP.x + STRIP.w * (0.5 - 0.17 * mild)}
        y={STRIP.y - 8}
        width={STRIP.w * 0.34 * mild}
        height={STRIP.h + 16}
        rx={(STRIP.h + 16) / 2}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        opacity={mild}
      />
      <path
        d={`M ${TRUNK_X} ${GROUND + 26} L ${TRUNK_X} ${STRIP.y - 14}`}
        stroke={MUTED}
        strokeWidth={3}
        strokeDasharray="6 8"
        opacity={mild}
      />
      <Note
        x={TRUNK_X}
        y={STRIP.y + 82}
        text="温和 · 湿润"
        size={32}
        color={INK}
        opacity={mild}
      />
    </Canvas>
  );
};
