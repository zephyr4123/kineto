import { useCurrentFrame } from "remotion";
import {
  Bean,
  Canvas,
  Cup,
  Defs,
  Steam,
  ease,
  easeInOut,
  pop,
  prog,
  rnd,
} from "../components/art";
import { Kettle } from "../components/objects";
import { Sfx } from "../components/Sound";
import { assets } from "../assets.gen";
import type { SceneProps } from "../components/Stage";
import { ART, INK } from "../theme";

// 冲煮：「最后，豆子被磨成粉，热水流过咖啡粉，把这些香气和味道带进杯子。」
// 一条竖着的流程：磨豆机（豆子落进去、两枚磨盘转、粉落下）→ 滤杯 → 手冲壶注水 → 滴进杯子
const X = 440;

const Gear: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly angle: number;
}> = ({ x, y, r, angle }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    {Array.from({ length: 12 }, (_, i) => (
      <rect
        key={i}
        x={-6}
        y={-r - 10}
        width={12}
        height={16}
        rx={2}
        fill={ART.steelDark}
        transform={`rotate(${i * 30})`}
      />
    ))}
    <circle r={r} fill={ART.steel} stroke={INK} strokeWidth={3} />
    <circle r={r * 0.3} fill={ART.steelDark} />
  </g>
);

export const Brew: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues[0]!;
  const grinder = prog(f, 0, 20, pop);
  const grind = prog(f, c + 20, c + 90);
  const bed = prog(f, c + 40, c + 85, easeInOut);
  const kettle = prog(f, c + 74, c + 96, ease);
  const tilt =
    prog(f, c + 90, c + 112, easeInOut) *
    (1 - prog(f, c + 196, c + 214, easeInOut));
  const pour = prog(f, c + 104, c + 126) * (1 - prog(f, c + 190, c + 200));
  const cupIn = prog(f, c + 96, c + 120, pop);
  const fill = prog(f, c + 140, c + 215, easeInOut);
  const steam = prog(f, c + 190, c + 230);

  return (
    <Canvas>
      <Defs />
      <Sfx
        src={assets.sfxGrinder}
        at={c + 18}
        duration={74}
        volume={0.3}
        trim={1}
        fade={10}
      />
      <Sfx
        src={assets.sfxWaterPour}
        at={c + 104}
        duration={96}
        volume={0.28}
        trim={0.3}
        fade={12}
      />
      {/* 磨豆机 */}
      <g opacity={grinder}>
        {Array.from({ length: 6 }, (_, i) => {
          const t = prog(f, c + i * 4, c + i * 4 + 16, (x) => x * x);
          return t > 0 && t < 1 ? (
            <Bean
              key={i}
              x={X + (i - 2.5) * 16}
              y={-20 + t * 100}
              w={24}
              color={ART.brownBean}
              rotate={i * 50}
            />
          ) : null;
        })}
        <path
          d={`M ${X - 110} 70 L ${X + 110} 70 L ${X + 50} 150 L ${X - 50} 150 Z`}
          fill={ART.steel}
          stroke={INK}
          strokeWidth={4}
        />
        <rect
          x={X - 70}
          y={150}
          width={140}
          height={70}
          rx={10}
          fill={ART.steelDark}
          stroke={INK}
          strokeWidth={4}
        />
        <Gear x={X - 30} y={185} r={22} angle={grind * 720} />
        <Gear x={X + 30} y={185} r={22} angle={-grind * 720 + 15} />
      </g>
      {/* 粉末落下 */}
      {Array.from({ length: 40 }, (_, i) => {
        const period = 18;
        const t = ((f - c - 30 + (i * period) / 40) % period) / period;
        const on = f > c + 30 && f < c + 90;
        return on ? (
          <circle
            key={i}
            cx={X + (rnd(`p-${i}`) - 0.5) * 30}
            cy={222 + t * 190}
            r={2.5 + rnd(`pr-${i}`) * 2}
            fill={ART.brownBean}
            opacity={0.85}
          />
        ) : null;
      })}

      {/* 滤杯：锥形，里面一层咖啡粉 */}
      <g opacity={grinder}>
        <path
          d={`M ${X - 120} 420 L ${X + 120} 420 L ${X + 22} 560 L ${X - 22} 560 Z`}
          fill={ART.cup}
          stroke={INK}
          strokeWidth={4}
        />
        <clipPath id="cone">
          <path
            d={`M ${X - 120} 420 L ${X + 120} 420 L ${X + 22} 560 L ${X - 22} 560 Z`}
          />
        </clipPath>
        <rect
          x={X - 130}
          y={560 - bed * 90}
          width={260}
          height={100}
          fill={ART.brownBean}
          clipPath="url(#cone)"
        />
        {[-60, -20, 20, 60].map((dx) => (
          <path
            key={dx}
            d={`M ${X + dx} 424 L ${X + dx * 0.25} 556`}
            stroke={INK}
            strokeWidth={1.5}
            opacity={0.3}
          />
        ))}
        <path
          d={`M ${X - 150} 420 L ${X + 150} 420`}
          stroke={INK}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </g>

      {/* 手冲壶：从右边进来、倾斜、细细一道水流落进滤杯 */}
      <g opacity={kettle} transform={`translate(${(1 - kettle) * 120} 0)`}>
        <Kettle x={740} y={330} tilt={tilt * 28} />
      </g>
      {pour > 0 ? (
        <path
          d={`M ${740 - 150 * Math.cos((tilt * 28 * Math.PI) / 180) - 10} ${330 - 60 + tilt * 40} Q ${X + 120} ${300 + Math.sin(f / 5) * 4} ${X + 6} 470`}
          stroke={ART.water}
          strokeWidth={6 * pour}
          strokeLinecap="round"
          fill="none"
        />
      ) : null}

      {/* 滴进杯子 */}
      {Array.from({ length: 5 }, (_, i) => {
        const period = 22;
        const t = ((f - c - 130 + i * (period / 5)) % period) / period;
        const on = f > c + 130 && f < c + 220;
        return on ? (
          <path
            key={i}
            d={`M ${X} ${566 + t * 120} q -5 12 0 16 q 5 -4 0 -16 Z`}
            fill={ART.coffee}
            opacity={0.9}
          />
        ) : null;
      })}

      <g opacity={cupIn}>
        <Steam x={X - 6} y={680} f={f} opacity={steam} />
        <Cup x={X} y={780} s={0.62} fill={fill} />
      </g>
    </Canvas>
  );
};
