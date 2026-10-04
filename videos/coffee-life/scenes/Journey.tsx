import { assets } from "../assets.gen";
import { useCurrentFrame } from "remotion";
import {
  Canvas,
  Cherry,
  Cup,
  DashedPath,
  Defs,
  Note,
  Steam,
  easeInOut,
  pop,
  prog,
} from "../components/art";
import { Drum, Kettle, Sack, Ship, Sun } from "../components/objects";
import { RealPhoto } from "../components/RealPhoto";
import type { SceneProps } from "../components/Stage";
import { CHERRY } from "../theme";

// 尾声：「从枝头到杯中，一颗种子要走上好几个月。下次端起咖啡的时候，不妨喝慢一点。」
// 杯子在中间，一圈虚线把前面走过的路串起来（果子、晒场、麻袋、货轮、烘焙、冲煮），
// 第二句时这一圈淡去，插画杯子化回开头那杯真实的咖啡（照片）：由虚回实，和开头首尾呼应
const CX = 468;
const CY = 470;
const RING = 330;

const STOPS: readonly {
  readonly angle: number;
  readonly draw: (
    x: number,
    y: number,
    s: number,
    f: number,
  ) => React.ReactNode;
}[] = [
  { angle: -90, draw: (x, y, s) => <Cherry x={x} y={y} r={30} scale={s} /> },
  { angle: -30, draw: (x, y, s) => <Sun x={x} y={y} s={0.7 * s} /> },
  { angle: 30, draw: (x, y, s) => <Sack x={x} y={y} s={0.24 * s} /> },
  { angle: 90, draw: (x, y, s) => <Ship x={x} y={y + 10} s={0.22 * s} /> },
  {
    angle: 150,
    draw: (x, y, s, f) => (
      <Drum x={x} y={y} s={0.17 * s} f={f} color="#7c4a2b" />
    ),
  },
  { angle: 210, draw: (x, y, s) => <Kettle x={x} y={y} s={0.38 * s} /> },
];

export const Journey: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const [c0, c1] = [cues[0]!, cues[1]!];
  const cup = prog(f, 0, 20, pop);
  const ring = prog(f, c0 + 6, c0 + 110, easeInOut);
  const months = prog(f, c0 + 96, c0 + 120);
  const fade = 1 - prog(f, c1, c1 + 40, easeInOut);
  const settle = prog(f, c1, c1 + 90, easeInOut);
  const cupScale = 0.8 + 0.12 * settle;

  // 一圈从顶上（果子）出发，顺时针走一周回到起点
  const circle = `M ${CX} ${CY - RING} A ${RING} ${RING} 0 1 1 ${CX - 0.01} ${CY - RING}`;
  return (
    <>
      <RealPhoto
        src={assets.cupSunlit}
        x={CX - 380}
        y={CY - 320}
        w={760}
        h={700}
        p={prog(f, c1 + 10, c1 + 54)}
        drift={prog(f, c1 + 10, c1 + 160)}
        focus={[0.48, 0.6]}
        zoom={1.6}
        shape="oval"
      />
      <Canvas>
        <Defs />
        <g opacity={fade}>
          <DashedPath
            id="journey-ring"
            d={circle}
            stroke={CHERRY}
            width={3}
            dash="2 14"
            draw={ring}
            opacity={0.7}
          />
          {STOPS.map((stop, i) => {
            const a = (stop.angle * Math.PI) / 180;
            const reach = (stop.angle + 90) / 360;
            const s = prog(f, c0 + 6 + reach * 104, c0 + 22 + reach * 104, pop);
            return (
              <g key={i}>
                {stop.draw(
                  CX + Math.cos(a) * RING,
                  CY + Math.sin(a) * RING,
                  s,
                  f,
                )}
              </g>
            );
          })}
          <Note
            x={CX}
            y={CY + RING + 80}
            text="好几个月"
            size={32}
            color={CHERRY}
            opacity={months}
          />
        </g>
        <g
          transform={`translate(${CX} ${CY + 40}) scale(${cupScale * cup}) translate(${-CX} ${-(CY + 40)})`}
          opacity={1 - prog(f, c1 + 10, c1 + 46)}
        >
          <Steam x={CX - 8} y={CY - 130} f={f} calm={settle} opacity={cup} />
          <Cup x={CX} y={CY + 60} />
        </g>
      </Canvas>
    </>
  );
};
