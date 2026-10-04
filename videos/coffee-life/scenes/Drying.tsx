import { interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Bean, Canvas, Cherry, Defs, Note, Shadow, ease, easeInOut, pop, prog, rnd } from "../components/art";
import { Sun } from "../components/objects";
import type { SceneProps } from "../components/Stage";
import { ART, CHERRY, INK, SERIF } from "../theme";

// 晾晒：「摘下的果子要尽快处理。有的整颗晒干，有的先去掉果肉再晒。
//        人们在阳光下不停翻动，直到豆子里的水分只剩百分之十一左右。」
// 两张高架晾晒床：左边整颗晒（红果慢慢晒成深褐），右边先去果肉（剩下裹着种壳的奶白色豆子）。
// 第二句里一把耙子来回翻，一滴水代表含水率，越晒越浅，最后标出约 11%
const BEDS = [
  { x: 40, label: "整颗晒干" },
  { x: 496, label: "先去果肉再晒" },
] as const;
const BED_W = 400;
const BED_Y = 420;

const Bed: React.FC<{ readonly x: number; readonly show: number }> = ({ x, show }) => (
  <g opacity={show} transform={`translate(0 ${(1 - show) * 30})`}>
    <Shadow x={x + BED_W / 2} y={BED_Y + 210} rx={210} ry={18} />
    {[x + 30, x + BED_W - 30].map((lx) => (
      <path key={lx} d={`M ${lx} ${BED_Y + 80} L ${lx} ${BED_Y + 206}`} stroke={ART.branch} strokeWidth={10} strokeLinecap="round" />
    ))}
    <path d={`M ${x} ${BED_Y} L ${x + BED_W} ${BED_Y} L ${x + BED_W - 24} ${BED_Y + 90} L ${x + 24} ${BED_Y + 90} Z`} fill={ART.burlap} stroke={ART.burlapDark} strokeWidth={4} />
    {/* 网格：高架床的纱网 */}
    {Array.from({ length: 9 }, (_, i) => (
      <path key={i} d={`M ${x + 20 + i * 45} ${BED_Y + 4} L ${x + 34 + i * 41} ${BED_Y + 86}`} stroke={ART.burlapDark} strokeWidth={1.5} opacity={0.5} />
    ))}
  </g>
);

export const Drying: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const [c0, c1] = [cues[0]!, cues[1]!];
  const left = prog(f, c0 + 40, c0 + 64, ease);
  const right = prog(f, c0 + 96, c0 + 120, ease);
  // 整颗晒：红果慢慢变成深褐的「果干」；去果肉：果肉褪掉，剩下奶白色的带壳豆
  const dryWhole = prog(f, c0 + 70, c1 + 150, easeInOut);
  const depulp = prog(f, c0 + 130, c0 + 165, easeInOut);
  const sunArc = prog(f, 0, c1 + 170, easeInOut);
  // 耙子在第二句里来回两趟
  const rakeOn = prog(f, c1 + 6, c1 + 20) * (1 - prog(f, c1 + 150, c1 + 166));
  const rakeT = interpolate(f, [c1 + 10, c1 + 70, c1 + 130], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const moisture = prog(f, c1 + 10, c1 + 140, easeInOut);
  const gauge = prog(f, c1, c1 + 20);
  const label = prog(f, c1 + 120, c1 + 145);

  const sunX = 140 + sunArc * 656;
  const sunY = 150 - Math.sin(sunArc * Math.PI) * 70;

  return (
    <Canvas>
      <Defs />
      <Sun x={sunX} y={sunY} s={1.25 * prog(f, 0, 20, pop)} spin={f * 0.5} />
      {BEDS.map((b, bi) => {
        const show = bi === 0 ? left : right;
        return (
          <g key={b.label}>
            <Bed x={b.x} show={show} />
            <text x={b.x + BED_W / 2} y={BED_Y - 70} textAnchor="middle" fontSize={34} fill={INK} letterSpacing="0.1em" opacity={show} fontFamily={SERIF}>
              {b.label}
            </text>
            {Array.from({ length: 16 }, (_, i) => {
              const sweep = rakeT * BED_W;
              const near = Math.max(0, 1 - Math.abs(b.x + 40 + (i % 8) * 46 - (b.x + sweep)) / 60);
              const x = b.x + 48 + (i % 8) * 43.5 + (rnd(`dx-${bi}-${i}`) - 0.5) * 10 + near * 10 * rakeOn;
              const y = BED_Y + 24 + Math.floor(i / 8) * 34 + (rnd(`dy-${bi}-${i}`) - 0.5) * 6 - near * 6 * rakeOn;
              return bi === 0 ? (
                <Cherry key={i} x={x} y={y} r={19} scale={show} color={interpolateColors(dryWhole, [0, 1], [ART.ripe, ART.overripe])} />
              ) : (
                <g key={i}>
                  <Cherry x={x} y={y} r={19} scale={show * (1 - depulp)} />
                  <Bean x={x} y={y} w={25} color={ART.parchment} rotate={70 + rnd(`r-${i}`) * 40} opacity={depulp} />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 耙子 */}
      <g opacity={rakeOn} transform={`translate(${60 + rakeT * 780} ${BED_Y - 10})`}>
        <path d="M 0 -150 L 0 10" stroke={ART.branch} strokeWidth={8} strokeLinecap="round" />
        <path d="M -50 10 L 50 10" stroke={ART.branch} strokeWidth={8} strokeLinecap="round" />
        {[-40, -20, 0, 20, 40].map((dx) => (
          <path key={dx} d={`M ${dx} 10 L ${dx} 30`} stroke={ART.branch} strokeWidth={5} strokeLinecap="round" />
        ))}
      </g>

      {/* 含水率：一滴水，越晒越浅 */}
      <g opacity={gauge} transform="translate(380 790)">
        <path d="M 0 -80 C 40 -30, 56 0, 56 30 A 56 56 0 0 1 -56 30 C -56 0, -40 -30, 0 -80 Z" fill="none" stroke={INK} strokeWidth={3} />
        <clipPath id="drop-clip">
          <path d="M 0 -80 C 40 -30, 56 0, 56 30 A 56 56 0 0 1 -56 30 C -56 0, -40 -30, 0 -80 Z" />
        </clipPath>
        <rect x={-60} y={-80 + moisture * 120} width={120} height={200} fill={ART.water} clipPath="url(#drop-clip)" />
        <Note x={90} y={0} text="含水率" anchor="start" size={28} />
        <text x={90} y={58} fontSize={56} fontWeight={600} fill={CHERRY} opacity={label} fontFamily={SERIF}>
          ≈11%
        </text>
      </g>
    </Canvas>
  );
};
