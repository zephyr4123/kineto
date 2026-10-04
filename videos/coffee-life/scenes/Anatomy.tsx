import { useCurrentFrame } from "remotion";
import { Callout, Canvas, Cherry, Defs, Leaf, Shadow, ease, easeInOut, pop, prog } from "../components/art";
import type { SceneProps } from "../components/Stage";
import { ART } from "../theme";

// 果实：「这种果子叫咖啡樱桃。剥开果皮和果肉，里面通常是两粒种子，也就是咖啡豆。」
// 一颗大樱桃 → 从中间裂成两半向两边滑开 → 露出剖面：果皮、果肉、两粒平面相对的种子
const CX = 468;
const CY = 470;
const R = 200;

// 种子：半个椭圆，平的一面朝中间（咖啡豆平的那一面就是这么来的），外面裹一层种壳
const Seed: React.FC<{ readonly side: -1 | 1; readonly glow: number }> = ({ side, glow }) => {
  const rx = 84;
  const ry = 128;
  const gap = 5;
  const half = `M ${side * gap} ${-ry} A ${rx} ${ry} 0 0 ${side > 0 ? 1 : 0} ${side * gap} ${ry} Z`;
  return (
    <g>
      <path d={half} fill={ART.parchment} transform={`scale(1.1)`} />
      <path d={half} fill={ART.greenBean} />
      <path d={half} fill="url(#bean-shade)" />
      <path
        d={`M ${side * (gap + 22)} ${-ry * 0.7} C ${side * (gap + 34)} ${-ry * 0.2}, ${side * (gap + 14)} ${ry * 0.2}, ${side * (gap + 26)} ${ry * 0.7}`}
        stroke={ART.greenBeanDark}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <path d={half} fill="white" opacity={0.25 * glow} />
    </g>
  );
};

export const Anatomy: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const [c0, c1] = [cues[0]!, cues[1]!];
  const enter = prog(f, 0, 24, pop);
  const name = prog(f, c0 + 22, c0 + 50);
  // 「剥开」：两半向两边滑开、淡出，剖面从中间浮出来
  const open = prog(f, c1 + 6, c1 + 40, easeInOut);
  const section = prog(f, c1 + 14, c1 + 40, ease);
  const skin = prog(f, c1 + 34, c1 + 62);
  const pulp = prog(f, c1 + 52, c1 + 80);
  // 「两粒种子」大约在开口后 3 秒，「也就是咖啡豆」时种子轻轻亮一下
  const seeds = prog(f, c1 + 92, c1 + 120);
  const glow = Math.sin(Math.PI * prog(f, c1 + 130, c1 + 160, easeInOut));
  const nameOut = 1 - prog(f, c1, c1 + 14);

  return (
    <Canvas>
      <Defs />
      <Shadow x={CX} y={CY + R + 70} rx={(R + 20) * enter} ry={26} />

      {/* 剖面 */}
      <g transform={`translate(${CX} ${CY}) scale(${0.85 + 0.15 * section})`} opacity={section}>
        <circle r={R} fill={ART.ripe} />
        <circle r={R - 16} fill={ART.pulp} />
        <circle r={R - 16} fill="url(#bean-shade)" opacity={0.5} />
        <Seed side={-1} glow={glow} />
        <Seed side={1} glow={glow} />
      </g>

      {/* 整颗樱桃：剥开时左右两半各自滑开 */}
      <clipPath id="left-half">
        <rect x={CX - R - 10} y={CY - R - 10} width={R + 10} height={2 * R + 20} />
      </clipPath>
      <clipPath id="right-half">
        <rect x={CX} y={CY - R - 10} width={R + 10} height={2 * R + 20} />
      </clipPath>
      {[-1, 1].map((side) => (
        <g key={side} opacity={1 - prog(f, c1 + 20, c1 + 44)} transform={`translate(${side * 230 * open} 0)`}>
          <g clipPath={`url(#${side < 0 ? "left" : "right"}-half)`}>
            <path d={`M ${CX} ${CY - R} L ${CX} ${CY - R - 70}`} stroke={ART.branch} strokeWidth={10} strokeLinecap="round" opacity={1 - open} />
            <Cherry x={CX} y={CY} r={R} scale={enter} />
          </g>
        </g>
      ))}
      <g opacity={1 - open}>
        <Leaf x={CX} y={CY - R - 50} len={150} angle={-160} grow={prog(f, 10, 34, pop)} />
        <Leaf x={CX} y={CY - R - 50} len={140} angle={-20} grow={prog(f, 14, 38, pop)} color={ART.leafDark} />
      </g>

      <g opacity={nameOut}>
        <Callout x={CX + 120} y={CY - 60} tx={CX + 300} ty={CY - 200} text="咖啡樱桃" p={name} size={36} />
      </g>
      <Callout x={CX + R - 6} y={CY + 40} tx={CX + 330} ty={CY + 150} text="果皮" p={skin} />
      <Callout x={CX - 130} y={CY + 90} tx={CX - 330} ty={CY + 180} text="果肉" p={pulp} />
      <Callout x={CX - 50} y={CY - 40} tx={CX - 320} ty={CY - 210} text="种子" p={seeds} />
      <Callout x={CX + 50} y={CY - 40} tx={CX + 320} ty={CY - 210} text="种子" p={seeds} />
    </Canvas>
  );
};
