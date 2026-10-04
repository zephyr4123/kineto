import { useCurrentFrame } from "remotion";
import { assets } from "../assets.gen";
import {
  Canvas,
  Cherry,
  Defs,
  Leaf,
  Shadow,
  drawn,
  easeInOut,
  pop,
  prog,
} from "../components/art";
import { RealPhoto } from "../components/RealPhoto";
import type { SceneProps } from "../components/Stage";
import { ART } from "../theme";

// 序：你手里的这杯咖啡（真实照片）→ 倒回去，照片收拢成一个红点 → 红点长成枝头的一颗咖啡樱桃（插画）。
// 由实入虚：片子从一杯真咖啡开始，进入插画的世界；尾声再从插画回到这杯真咖啡
export const CupScene: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const speak = cues[0]!;
  // 「最早是一颗红色的果子」大约在开口后 2 秒
  const turn = speak + 55;

  const photo = prog(f, 0, 30) * (1 - prog(f, turn + 6, turn + 28));
  const shrink = prog(f, turn, turn + 28, easeInOut);

  const branch = prog(f, turn + 18, turn + 58, easeInOut);
  const fruit = prog(f, turn + 22, turn + 44, pop);
  const leaves = [0, 1, 2, 3].map((i) =>
    prog(f, turn + 34 + i * 6, turn + 56 + i * 6, pop),
  );
  const buds = [0, 1].map((i) =>
    prog(f, turn + 46 + i * 8, turn + 64 + i * 8, pop),
  );

  const cx = 468;
  const cy = 500;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: String(1 - 0.92 * shrink),
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        <RealPhoto
          src={assets.cupSunlit}
          x={cx - 380}
          y={cy - 360}
          w={760}
          h={700}
          p={photo}
          drift={prog(f, 0, turn + 28)}
          focus={[0.48, 0.6]}
          zoom={1.6}
          shape="oval"
        />
      </div>
      <Canvas>
        <Defs />
        {/* 照片收拢成的红点 */}
        <circle
          cx={cx}
          cy={cy}
          r={40 * shrink}
          fill={ART.ripe}
          opacity={shrink * (1 - prog(f, turn + 22, turn + 30))}
        />

        {/* 枝条从左边伸进来，末端挂着那颗果子 */}
        <path
          d="M -40 300 C 140 250, 300 330, 430 330 S 700 300, 980 250"
          stroke={ART.branch}
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
          {...drawn(branch)}
        />
        <Leaf x={250} y={300} len={150} angle={-150} grow={leaves[0]} />
        <Leaf
          x={300}
          y={308}
          len={140}
          angle={35}
          grow={leaves[1]}
          color={ART.leafDark}
        />
        <Leaf x={650} y={312} len={160} angle={-35} grow={leaves[2]} />
        <Leaf
          x={700}
          y={300}
          len={130}
          angle={150}
          grow={leaves[3]}
          color={ART.leafDark}
        />
        <path
          d={`M ${cx} 332 L ${cx} ${cy - 92}`}
          stroke={ART.branch}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={fruit}
        />
        <Shadow x={cx} y={cy + 230} rx={120 * fruit} opacity={0.6} />
        <Cherry x={cx} y={cy} r={100} scale={fruit} />
        <path
          d={`M ${cx - 150} 318 L ${cx - 150} ${cy - 114}`}
          stroke={ART.branch}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={buds[0]}
        />
        <path
          d={`M ${cx + 140} 334 L ${cx + 140} ${cy - 128}`}
          stroke={ART.branch}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={buds[1]}
        />
        <Cherry
          x={cx - 150}
          y={cy - 70}
          r={46}
          color={ART.unripe}
          scale={buds[0]}
        />
        <Cherry
          x={cx + 140}
          y={cy - 80}
          r={50}
          color={ART.turning}
          scale={buds[1]}
        />
      </Canvas>
    </>
  );
};
