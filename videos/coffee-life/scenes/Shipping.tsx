import { useCurrentFrame } from "remotion";
import { Bean, Canvas, DashedPath, Defs, Note, ease, easeInOut, prog, rnd } from "../components/art";
import { Sack, Ship } from "../components/objects";
import { Sfx } from "../components/Sound";
import { assets } from "../assets.gen";
import type { SceneProps } from "../components/Stage";
import { ART, CHERRY, INK, SERIF, STAGE } from "../theme";

// 远行：「它们被装进麻袋，一袋大约六十公斤，大多坐上货轮，去往世界各地。」
// 生豆流进麻袋、袋子鼓起来、挂上吊牌；麻袋退场，货轮从海面驶来，一条虚线航路画向远方
const SACK = { x: 468, y: 430 };
const SEA_Y = 640;

export const Shipping: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues[0]!;
  const sackIn = prog(f, 0, 18, ease);
  const fullness = prog(f, c + 8, c + 64, easeInOut);
  const tag = prog(f, c + 70, c + 90, ease);
  // 「坐上货轮」：麻袋退场，海和船进来
  const away = prog(f, c + 118, c + 140, easeInOut);
  const sea = prog(f, c + 120, c + 150, ease);
  const sail = prog(f, c + 126, c + 176, ease);
  const route = prog(f, c + 172, c + 214, easeInOut);
  const shipX = -260 + sail * 640;
  const bob = Math.sin(f / 11) * 5;

  return (
    <Canvas>
      <Defs />
      <Sfx src={assets.sfxBeansPour} at={c + 4} duration={66} volume={0.22} trim={1.2} fade={10} />
      {/* 麻袋：豆子流进去 */}
      <g opacity={sackIn * (1 - away)} transform={`translate(0 ${-away * 120})`}>
        {Array.from({ length: 26 }, (_, i) => {
          const t0 = c + 4 + i * 2.2;
          const t = prog(f, t0, t0 + 18, (x) => x * x);
          const x = SACK.x + (rnd(`bx-${i}`) - 0.5) * 50;
          const y = -40 + t * (SACK.y - 120 + 40);
          return t > 0 && t < 1 ? <Bean key={i} x={x} y={y} w={22} color={ART.greenBean} rotate={rnd(`br-${i}`) * 360 + f * 6} /> : null;
        })}
        <Sack x={SACK.x} y={SACK.y} fullness={fullness} />
        {/* 吊牌 */}
        <g opacity={tag} transform={`translate(${SACK.x + 64} ${SACK.y - 150}) rotate(${12 - 12 * tag + Math.sin(f / 14) * 3})`}>
          <path d="M 0 0 L 40 60" stroke={INK} strokeWidth={2} />
          <rect x={20} y={56} width={150} height={78} rx={10} fill={ART.cup} stroke={INK} strokeWidth={3} />
          <circle cx={38} cy={72} r={6} fill="none" stroke={INK} strokeWidth={2} />
          <text x={98} y={110} textAnchor="middle" fontSize={36} fontWeight={600} fill={INK} fontFamily={SERIF}>
            ≈60 kg
          </text>
        </g>
      </g>

      {/* 海与货轮 */}
      <g opacity={sea}>
        {/* 海面铺满整个画面宽度，上沿渐隐，不留硬边 */}
        <defs>
          <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={ART.sea} stopOpacity={0} />
            <stop offset="12%" stopColor={ART.sea} stopOpacity={0.4} />
            <stop offset="100%" stopColor={ART.seaDark} stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <rect x={-STAGE.x} y={SEA_Y - 30} width={STAGE.w + 2 * STAGE.x} height={STAGE.h - SEA_Y + 30} fill="url(#sea)" />
        {[0, 1, 2].map((k) => {
          const pts = Array.from({ length: 25 }, (_, i) => {
            const x = -STAGE.x + i * 46;
            const y = SEA_Y + 20 + k * 70 + Math.sin(i * 0.8 + f / (14 + k * 4) + k) * 8;
            return `${x} ${y}`;
          });
          return <path key={k} d={`M ${pts.join(" L ")}`} stroke={ART.seaDark} strokeWidth={3} fill="none" opacity={0.5 - k * 0.12} />;
        })}
        {/* 航路：从船头画向远方 */}
        <DashedPath
          id="route"
          d={`M ${shipX + 240} ${SEA_Y - 70} C 760 420, 860 360, 1000 330`}
          stroke={CHERRY}
          dash="10 10"
          draw={route}
          opacity={route}
        />
        <Note x={760} y={300} text="去往世界各地" size={28} color={CHERRY} opacity={route} />
        <g transform={`translate(0 ${bob})`}>
          <Ship x={shipX} y={SEA_Y - 10} s={0.95} />
        </g>
      </g>
    </Canvas>
  );
};

