import { useCurrentFrame } from "remotion";
import { Canvas, Cherry, Defs, Leaf, Shadow, Steam, Cup, drawn, ease, easeInOut, pop, prog } from "../components/art";
import type { SceneProps } from "../components/Stage";
import { ART } from "../theme";

// 序：你手里的这杯咖啡 → 倒回去，杯子缩成一个红点 → 红点长成枝头的一颗咖啡樱桃
export const CupScene: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const speak = cues[0]!;
  // 「最早是一颗红色的果子」大约在开口后 2 秒
  const turn = speak + 55;

  const draw = prog(f, 4, 44, easeInOut);
  const shrink = prog(f, turn, turn + 28, easeInOut);
  const cupScale = 1.25 * (1 - shrink * 0.97);

  const branch = prog(f, turn + 18, turn + 58, easeInOut);
  const fruit = prog(f, turn + 22, turn + 44, pop);
  const leaves = [0, 1, 2, 3].map((i) => prog(f, turn + 34 + i * 6, turn + 56 + i * 6, pop));
  const buds = [0, 1].map((i) => prog(f, turn + 46 + i * 8, turn + 64 + i * 8, pop));

  const cx = 468;
  const cy = 500;
  return (
    <Canvas>
      <Defs />
      {shrink < 1 ? (
        <g opacity={1 - prog(f, turn + 14, turn + 28)}>
          <Steam x={cx - 8} y={cy - 190 * cupScale} f={f} opacity={prog(f, 30, 60) * (1 - shrink)} />
          <g transform={`translate(${cx} ${cy}) scale(${cupScale}) translate(${-cx} ${-cy})`}>
            <Cup x={cx} y={cy + 40} draw={draw} fill={prog(f, 36, 70, ease)} />
          </g>
          {/* 杯子收拢成的红点 */}
          <circle cx={cx} cy={cy} r={40 * shrink} fill={ART.ripe} opacity={shrink} />
        </g>
      ) : null}

      {/* 枝条从左边伸进来，末端挂着那颗果子 */}
      <path d="M -40 300 C 140 250, 300 330, 430 330 S 700 300, 980 250" stroke={ART.branch} strokeWidth={14} strokeLinecap="round" fill="none" {...drawn(branch)} />
      <Leaf x={250} y={300} len={150} angle={-150} grow={leaves[0]} />
      <Leaf x={300} y={308} len={140} angle={35} grow={leaves[1]} color={ART.leafDark} />
      <Leaf x={650} y={312} len={160} angle={-35} grow={leaves[2]} />
      <Leaf x={700} y={300} len={130} angle={150} grow={leaves[3]} color={ART.leafDark} />
      <path d={`M ${cx} 332 L ${cx} ${cy - 92}`} stroke={ART.branch} strokeWidth={8} strokeLinecap="round" opacity={fruit} />
      <Shadow x={cx} y={cy + 230} rx={120 * fruit} opacity={0.6} />
      <Cherry x={cx} y={cy} r={100} scale={fruit} />
      <path d={`M ${cx - 150} 318 L ${cx - 150} ${cy - 114}`} stroke={ART.branch} strokeWidth={6} strokeLinecap="round" opacity={buds[0]} />
      <path d={`M ${cx + 140} 334 L ${cx + 140} ${cy - 128}`} stroke={ART.branch} strokeWidth={6} strokeLinecap="round" opacity={buds[1]} />
      <Cherry x={cx - 150} y={cy - 70} r={46} color={ART.unripe} scale={buds[0]} />
      <Cherry x={cx + 140} y={cy - 80} r={50} color={ART.turning} scale={buds[1]} />
    </Canvas>
  );
};
