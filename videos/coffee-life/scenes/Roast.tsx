import { interpolate, useCurrentFrame } from "remotion";
import { Callout, Canvas, Defs, Note, drawn, ease, easeInOut, pop, prog, rnd, roastColor } from "../components/art";
import { Drum } from "../components/objects";
import { Sfx } from "../components/Sound";
import { assets } from "../assets.gen";
import type { SceneProps } from "../components/Stage";
import { ART, CHERRY, INK, MUTED, SERIF } from "../theme";

// 烘焙（四句）：
// 1「真正的变化，发生在烘焙机里」——滚筒出现，点火
// 2「两百度左右……十来分钟，从绿变黄，再一点点变成褐色」——温度计、计时环，窗里的豆子跟着旁白变色
// 3「噼啪作响，像爆米花一样……一爆」——窗口周围一个个小爆裂，豆子跳起来
// 4「上千种香味物质」——进料口飘出彩色的香气粒子
const DRUM = { x: 380, y: 430, s: 0.92 };
const THERMO = { x: 800, top: 170, bottom: 540 };
const CLOCK = { x: 800, y: 680, r: 54 };

const CHIPS = [
  { label: "生豆", t: 0 },
  { label: "转黄", t: 0.35 },
  { label: "褐色", t: 0.72 },
] as const;

export const Roast: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const [c0, c1, c2, c3] = [cues[0]!, cues[1]!, cues[2]!, cues[3]!];
  const drum = prog(f, 0, 24, pop);
  const heat = prog(f, c0 + 40, c0 + 70, ease);

  const gauges = prog(f, c1, c1 + 20);
  const temp = prog(f, c1 + 10, c1 + 80, easeInOut);
  const clock = prog(f, c1 + 60, c1 + 120, easeInOut);
  const tint = interpolate(f, [c1 + 125, c1 + 165, c1 + 180, c1 + 240, c3, c3 + 120], [0, 0.35, 0.35, 0.72, 0.72, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chips = CHIPS.map((ch, i) => prog(f, c1 + 115 + [0, 35, 85][i]!, c1 + 135 + [0, 35, 85][i]!, pop));

  // 一爆：开口后约 1.8 秒（「噼啪作响」）开始，持续到「一爆」两个字
  const crackFrom = c2 + 52;
  const crackTo = c2 + 160;
  const bursts = Array.from({ length: 18 }, (_, i) => ({
    at: crackFrom + rnd(`burst-${i}`) * (crackTo - crackFrom),
    a: rnd(`burst-a-${i}`) * Math.PI * 2,
    r: 120 + rnd(`burst-r-${i}`) * 90,
  }));
  const hop = (i: number) => {
    const b = bursts[i % bursts.length]!;
    const t = f - b.at;
    return t > 0 && t < 10 ? Math.sin((t / 10) * Math.PI) * 30 : 0;
  };
  const shakeX = f > crackFrom && f < crackTo ? Math.sin(f * 2.3) * 2 : 0;
  const crackName = prog(f, c2 + 150, c2 + 176);

  const aroma = prog(f, c3, c3 + 30);
  const counter = prog(f, c3 + 36, c3 + 60);

  return (
    <Canvas>
      <Defs />
      {/* 噼啪声：爆米花的录音代替（一爆的声学特征和爆米花相近）；素材有削波，压得很低 */}
      <Sfx src={assets.sfxCrackle} at={crackFrom} duration={crackTo - crackFrom + 20} volume={0.16} trim={22} fade={14} />
      {/* 香气粒子：从进料口飘上来 */}
      {Array.from({ length: 44 }, (_, i) => {
        const period = 70 + Math.floor(rnd(`ap-${i}`) * 50);
        const t = ((f - c3 + Math.floor(rnd(`ao-${i}`) * period)) % period) / period;
        const colors = [ART.crema, ART.orange, ART.sun, CHERRY, ART.brownBean, ART.leaf];
        // 只在舞台里飘：从进料口升到舞台顶上就散了，不压到书眉
        const x = DRUM.x + (rnd(`ax-${i}`) - 0.5) * 120 + Math.sin(t * 6 + i) * 60 * t;
        const y = DRUM.y - 290 - t * 130;
        return (
          <circle key={i} cx={x} cy={y} r={3 + rnd(`ar-${i}`) * 7} fill={colors[i % colors.length]} opacity={aroma * Math.sin(Math.PI * t) * 0.9} />
        );
      })}

      <g transform={`translate(${DRUM.x + shakeX} ${DRUM.y}) scale(${drum}) translate(${-DRUM.x} ${-DRUM.y})`}>
        <Drum x={DRUM.x} y={DRUM.y} s={DRUM.s} f={f} color={roastColor(tint)} heat={heat} hop={hop} />
      </g>

      {/* 爆裂：窗口周围一圈短线 */}
      {bursts.map((b, i) => {
        const t = prog(f, b.at, b.at + 12);
        if (t <= 0 || t >= 1) return null;
        const bx = DRUM.x + Math.cos(b.a) * b.r * DRUM.s;
        const by = DRUM.y + Math.sin(b.a) * b.r * DRUM.s;
        return (
          <g key={i} transform={`translate(${bx} ${by}) scale(${0.6 + t * 0.8})`} opacity={1 - t}>
            {Array.from({ length: 8 }, (_, k) => (
              <path key={k} d="M 0 -14 L 0 -26" stroke={ART.sun} strokeWidth={5} strokeLinecap="round" transform={`rotate(${k * 45})`} />
            ))}
          </g>
        );
      })}
      <Callout x={DRUM.x - 90} y={DRUM.y - 70} tx={DRUM.x - 250} ty={DRUM.y - 300} text="一爆" p={crackName} size={40} />

      {/* 温度计 */}
      <g opacity={gauges}>
        <rect x={THERMO.x - 16} y={THERMO.top} width={32} height={THERMO.bottom - THERMO.top} rx={16} fill={ART.cup} stroke={INK} strokeWidth={3} />
        <circle cx={THERMO.x} cy={THERMO.bottom + 20} r={30} fill={CHERRY} stroke={INK} strokeWidth={3} />
        <rect
          x={THERMO.x - 8}
          y={THERMO.bottom - temp * (THERMO.bottom - THERMO.top - 40)}
          width={16}
          height={temp * (THERMO.bottom - THERMO.top - 40) + 20}
          fill={CHERRY}
        />
        {[0, 0.5, 1].map((k) => (
          <path key={k} d={`M ${THERMO.x + 16} ${THERMO.bottom - k * (THERMO.bottom - THERMO.top - 40)} L ${THERMO.x + 30} ${THERMO.bottom - k * (THERMO.bottom - THERMO.top - 40)}`} stroke={INK} strokeWidth={2} />
        ))}
        <text x={THERMO.x - 40} y={THERMO.top + 52} textAnchor="end" fontSize={40} fontWeight={600} fill={INK} opacity={prog(f, c1 + 60, c1 + 80)} fontFamily={SERIF}>
          ≈200°C
        </text>
      </g>

      {/* 计时环：十来分钟 */}
      <g opacity={prog(f, c1 + 54, c1 + 70)}>
        <circle cx={CLOCK.x} cy={CLOCK.y} r={CLOCK.r} fill={ART.cup} stroke={INK} strokeWidth={3} />
        <circle
          cx={CLOCK.x}
          cy={CLOCK.y}
          r={CLOCK.r - 12}
          fill="none"
          stroke={ART.orange}
          strokeWidth={14}
          transform={`rotate(-90 ${CLOCK.x} ${CLOCK.y})`}
          {...drawn(clock)}
        />
        <path d={`M ${CLOCK.x} ${CLOCK.y} L ${CLOCK.x} ${CLOCK.y - 30}`} stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${clock * 360} ${CLOCK.x} ${CLOCK.y})`} />
        <Note x={CLOCK.x} y={CLOCK.y + 100} text="十来分钟" size={28} color={INK} />
      </g>

      {/* 颜色的变化：三个色块，当前的那个下面有一道线 */}
      {CHIPS.map((ch, i) => {
        const x = 170 + i * 150;
        const active = tint >= ch.t - 0.01 && (i === CHIPS.length - 1 || tint < CHIPS[i + 1]!.t - 0.01);
        return (
          <g key={ch.label} opacity={chips[i]}>
            {i > 0 ? <path d={`M ${x - 110} 820 L ${x - 40} 820`} stroke={MUTED} strokeWidth={2} /> : null}
            <circle cx={x} cy={820} r={30 * chips[i]!} fill={roastColor(ch.t)} />
            <Note x={x} y={890} text={ch.label} size={28} color={INK} opacity={active ? 1 : 0.55} />
            <path d={`M ${x - 26} 904 L ${x + 26} 904`} stroke={CHERRY} strokeWidth={3} opacity={active ? 1 : 0} />
          </g>
        );
      })}

      {/* 上千种香味物质 */}
      <g opacity={counter}>
        <text x={DRUM.x + 190} y={96} fontSize={64} fontWeight={600} fill={INK} fontFamily={SERIF}>
          1000+
        </text>
        <Note x={DRUM.x + 194} y={138} text="种香味物质" anchor="start" size={28} />
      </g>
    </Canvas>
  );
};
