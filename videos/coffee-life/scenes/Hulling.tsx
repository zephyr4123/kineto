import { assets } from "../assets.gen";
import { useCurrentFrame } from "remotion";
import {
  Bean,
  Callout,
  Canvas,
  DashedPath,
  Defs,
  Note,
  Shadow,
  drawn,
  ease,
  easeInOut,
  pop,
  prog,
} from "../components/art";
import { RealPhoto } from "../components/RealPhoto";
import type { SceneProps } from "../components/Stage";
import { ART, MUTED } from "../theme";

// 脱壳：「脱去外壳，就是淡绿色的生豆。闻起来像青草和干草，还没有一点咖啡香。」
// 晒干的带壳豆裂开、外壳落下，露出生豆；豆子上方飘起几缕气味，带出青草、干草，末端一只虚线小杯：还没有咖啡香。
// 虚实对照：生豆露出来以后，底下铺开一堆真实的生豆（照片），插画的豆子就落在这堆真豆子上
const CX = 468;
const CY = 500;
const SHELL_W = 280;

const Grass: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s: number;
}> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[
      "M 0 30 Q -4 0 -22 -34",
      "M 0 30 Q 2 -6 4 -44",
      "M 0 30 Q 6 2 26 -28",
    ].map((d) => (
      <path
        key={d}
        d={d}
        stroke={ART.leaf}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
      />
    ))}
  </g>
);

const Hay: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s: number;
}> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-16, -8, 0, 8, 16].map((dx, i) => (
      <path
        key={dx}
        d={`M ${dx * 0.4} 34 L ${dx * 1.6} -34`}
        stroke={i % 2 ? ART.turning : ART.yellowBean}
        strokeWidth={6}
        strokeLinecap="round"
      />
    ))}
    <path
      d="M -16 6 L 16 6"
      stroke={ART.branch}
      strokeWidth={6}
      strokeLinecap="round"
    />
  </g>
);

export const Hulling: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues[0]!;
  const shell = prog(f, 0, 22, pop);
  const crack = prog(f, c + 6, c + 24, ease);
  const split = prog(f, c + 24, c + 54, easeInOut);
  const bean = prog(f, c + 30, c + 56, pop);
  const name = prog(f, c + 60, c + 86);
  const scent = prog(f, c + 96, c + 140, easeInOut);
  const grass = prog(f, c + 110, c + 130, pop);
  const hay = prog(f, c + 134, c + 154, pop);
  const notYet = prog(f, c + 182, c + 206);

  return (
    <>
      <RealPhoto
        src={assets.greenBin}
        x={-40}
        y={560}
        w={1016}
        h={380}
        p={prog(f, c + 34, c + 74)}
        drift={prog(f, c + 34, c + 260)}
        focus={[0.5, 0.65]}
        feather={0.26}
      />
      <Canvas>
        <Defs />
        <Shadow x={CX} y={CY + 230} rx={170} ry={22} />

        {/* 生豆 */}
        <g
          transform={`translate(${CX} ${CY}) scale(${0.7 + 0.3 * bean}) translate(${-CX} ${-CY})`}
          opacity={bean}
        >
          <Bean
            x={CX}
            y={CY}
            w={220}
            color={ART.greenBean}
            crease={ART.greenBeanDark}
          />
        </g>
        <Callout
          x={CX + 80}
          y={CY - 40}
          tx={CX + 280}
          ty={CY - 150}
          text="生豆"
          p={name}
          size={36}
        />

        {/* 带壳豆：裂开、两半外壳各自落下 */}
        {[-1, 1].map((side) => (
          <g
            key={side}
            opacity={1 - prog(f, c + 34, c + 60)}
            transform={`translate(${side * 90 * split} ${160 * split * split}) rotate(${side * 28 * split} ${CX} ${CY + 100})`}
          >
            <clipPath id={`shell-${side}`}>
              <rect
                x={side < 0 ? CX - 200 : CX}
                y={CY - 260}
                width={200}
                height={520}
              />
            </clipPath>
            <g
              clipPath={`url(#shell-${side})`}
              transform={`translate(${CX} ${CY}) scale(${shell}) translate(${-CX} ${-CY})`}
            >
              <Bean
                x={CX}
                y={CY}
                w={SHELL_W}
                color={ART.parchment}
                crease="rgba(120, 90, 50, 0.25)"
              />
              {[-80, -40, 0, 40, 80].map((dy) => (
                <path
                  key={dy}
                  d={`M ${CX - 110} ${CY + dy} Q ${CX} ${CY + dy + 14} ${CX + 110} ${CY + dy}`}
                  stroke="rgba(120, 90, 50, 0.12)"
                  strokeWidth={3}
                  fill="none"
                />
              ))}
            </g>
          </g>
        ))}
        <path
          d={`M ${CX} ${CY - 170} L ${CX - 10} ${CY - 90} L ${CX + 8} ${CY - 20} L ${CX - 6} ${CY + 60} L ${CX + 4} ${CY + 170}`}
          stroke="#7a5a35"
          strokeWidth={4}
          fill="none"
          opacity={1 - split}
          {...drawn(crack)}
        />

        {/* 气味：三缕曲线往上飘 */}
        {[-1, 0, 1].map((k) => (
          <DashedPath
            key={k}
            id={`scent-${k}`}
            d={`M ${CX + k * 60} ${CY - 200} C ${CX + k * 60 + 30} ${CY - 250}, ${CX + k * 120 - 30} ${CY - 300}, ${CX + k * 200} ${CY - 380}`}
            stroke={MUTED}
            width={4}
            dash="2 12"
            draw={scent}
            opacity={scent * (0.6 + 0.4 * Math.sin(f / 9 + k))}
          />
        ))}
        <Grass x={CX - 230} y={CY - 410} s={grass} />
        <Note x={CX - 230} y={CY - 340} text="青草" opacity={grass} size={30} />
        <Hay x={CX + 230} y={CY - 410} s={hay} />
        <Note x={CX + 230} y={CY - 340} text="干草" opacity={hay} size={30} />

        {/* 还没有咖啡香：一只虚线的小空杯 */}
        <g opacity={notYet * 0.8} transform={`translate(${CX} ${CY - 410})`}>
          <path
            d="M -30 -26 L 30 -26 L 25 18 Q 23 30 10 30 L -10 30 Q -23 30 -25 18 Z"
            fill="none"
            stroke={MUTED}
            strokeWidth={3}
            strokeDasharray="6 6"
          />
          <path
            d="M 30 -16 C 48 -16, 48 12, 28 12"
            fill="none"
            stroke={MUTED}
            strokeWidth={3}
            strokeDasharray="6 6"
          />
          <Note x={0} y={70} text="咖啡香 · 还没有" size={26} />
        </g>
      </Canvas>
    </>
  );
};
