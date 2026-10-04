import { noise } from "@remotion/effects/noise";
import { AbsoluteFill, Img, Solid, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { Defs } from "../components/art";
import { Drum, Kettle, Ship, Sun } from "../components/objects";
import { RealPhoto } from "../components/RealPhoto";
import { CHAPTERS } from "../script";
import { CHERRY, HAIRLINE, INK, MUTED, PAPER, SERIF } from "../theme";

// 发布用的封面：两头是真的，中间是画的——
// 左边一枝真实的咖啡樱桃（枝头），右边一杯真实的咖啡（杯中），中间一条虚线把它们连起来，
// 沿途四站是片子里的插画：晾晒、远行、烘焙、冲煮。和成片一样由实入虚、再由虚回实。
// 背景从左到右由枝头的绿过渡到杯子的暖褐，再盖一层纸色和纸纹。
// 横版 16:9（B 站 / 视频号 / X），竖版 3:4（小红书 / 抖音主页）。照片只有物、没有人。

type Point = { readonly x: number; readonly y: number };

// 三次贝塞尔曲线上 t 处的点：站点按 t 均匀摆在路线上
const bezier = (p: readonly [Point, Point, Point, Point], t: number): Point => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: k.reduce((s, w, i) => s + w * p[i]!.x, 0),
    y: k.reduce((s, w, i) => s + w * p[i]!.y, 0),
  };
};

// 四站：图标都以 (0, 0) 为中心画，这里只调大小和视觉重心
const STOPS = [
  { chapter: "drying", icon: <Sun x={0} y={0} s={0.62} /> },
  { chapter: "voyage", icon: <Ship x={0} y={8} s={0.15} /> },
  {
    chapter: "roast",
    icon: <Drum x={0} y={0} s={0.115} f={0} color="#7c4a2b" />,
  },
  { chapter: "brew", icon: <Kettle x={6} y={2} s={0.27} /> },
] as const;

const Wash: React.FC<{ readonly width: number; readonly height: number }> = ({
  width,
  height,
}) => {
  const photo = (src: string, mask?: string) => (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        scale: "1.2",
        filter: "blur(32px) saturate(0.85)",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
  const toRight = "linear-gradient(to right, transparent 30%, #000 70%)";
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden" }}>
      {photo(assets.cherryBranch)}
      {photo(assets.cupSunlit, toRight)}
      <AbsoluteFill style={{ backgroundColor: PAPER, opacity: 0.62 }} />
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.08 }}>
        <Solid
          width={width}
          height={height}
          color="#9a9a9a"
          effects={[noise({ amount: 1, seed: 7 })]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TitleBlock: React.FC<{ readonly size: number; readonly top: number }> = ({
  size,
  top,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: SERIF,
    }}
  >
    {/* letterSpacing 会在最后一个字后面也留空，左边补同样的宽度，整行才居中 */}
    <div
      style={{
        fontSize: size,
        fontWeight: 600,
        color: INK,
        letterSpacing: "0.16em",
        paddingLeft: "0.16em",
      }}
    >
      一杯咖啡的一生
    </div>
    <div
      style={{
        width: size * 1.1,
        height: 1.5,
        backgroundColor: HAIRLINE,
        margin: `${size * 0.32}px 0 ${size * 0.3}px`,
      }}
    />
    <div
      style={{
        fontSize: size * 0.38,
        color: MUTED,
        letterSpacing: "0.3em",
        paddingLeft: "0.3em",
      }}
    >
      从枝头，到杯中
    </div>
  </div>
);

// 路线：一条暗红虚线从枝头连到杯中，四站等距排在线上，站名用片中的章号与章名。
// 路线是 U 形：两头的站，线从上方进出，站名放在外侧；中间的站，线横穿而过，站名放在下方——字不压线
const Route: React.FC<{
  readonly width: number;
  readonly height: number;
  readonly curve: readonly [Point, Point, Point, Point];
  readonly disc?: number;
}> = ({ width, height, curve, disc = 58 }) => {
  const [a, b, c, d] = curve;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, fontFamily: SERIF }}
    >
      <Defs />
      <path
        d={`M ${a.x} ${a.y} C ${b.x} ${b.y}, ${c.x} ${c.y}, ${d.x} ${d.y}`}
        stroke={CHERRY}
        strokeWidth={3.5}
        strokeDasharray="2 15"
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      {[a, d].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={8} fill={CHERRY} />
      ))}
      {STOPS.map((stop, i) => {
        const p = bezier(curve, (i + 1) / (STOPS.length + 1));
        const { no, title } = CHAPTERS[stop.chapter];
        const side =
          i === 0 ? "left" : i === STOPS.length - 1 ? "right" : "below";
        const label =
          side === "below"
            ? { x: 0, y: disc + 40, anchor: "middle" as const }
            : {
                x: (disc + 16) * (side === "left" ? -1 : 1),
                y: disc * 0.17,
                anchor: side === "left" ? ("end" as const) : ("start" as const),
              };
        return (
          <g key={stop.chapter} transform={`translate(${p.x} ${p.y})`}>
            <circle
              r={disc}
              fill={PAPER}
              opacity={0.94}
              stroke={HAIRLINE}
              strokeWidth={1.5}
            />
            <g transform={`scale(${disc / 58})`}>{stop.icon}</g>
            <text
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              fontSize={disc * 0.46}
              letterSpacing="0.12em"
            >
              <tspan fill={CHERRY}>{no}</tspan>
              <tspan fill={INK} dx={8}>
                {title}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 两张真实照片：枝头取果子最密的那一段；杯子用椭圆裁切，放大到只剩桌面和杯子，上方深色的墙不进画
const Branch: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}> = (box) => (
  <RealPhoto
    src={assets.cherryBranch}
    {...box}
    p={1}
    focus={[0.48, 0.45]}
    zoom={1.12}
    feather={0.26}
  />
);
const CupPhoto: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}> = (box) => (
  <RealPhoto
    src={assets.cupSunlit}
    {...box}
    p={1}
    focus={[0.48, 0.62]}
    zoom={1.95}
    shape="oval"
  />
);

const LW = 1920;
const LH = 1080;
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Wash width={LW} height={LH} />
    <Branch x={-20} y={150} w={640} h={880} />
    <CupPhoto x={1290} y={300} w={620} h={660} />
    <Route
      width={LW}
      height={LH}
      curve={[
        { x: 560, y: 560 },
        { x: 680, y: 1010 },
        { x: 1240, y: 1010 },
        { x: 1380, y: 600 },
      ]}
    />
    <TitleBlock size={108} top={110} />
  </AbsoluteFill>
);

const PW = 1080;
const PH = 1440;
export const CoverPortrait: React.FC = () => (
  <AbsoluteFill>
    <Wash width={PW} height={PH} />
    <Branch x={-10} y={400} w={560} h={640} />
    <CupPhoto x={520} y={430} w={580} h={580} />
    <Route
      width={PW}
      height={PH}
      disc={60}
      curve={[
        { x: 300, y: 930 },
        { x: 120, y: 1400 },
        { x: 960, y: 1400 },
        { x: 780, y: 930 },
      ]}
    />
    <TitleBlock size={104} top={120} />
  </AbsoluteFill>
);
