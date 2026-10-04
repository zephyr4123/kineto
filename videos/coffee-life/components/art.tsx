import { Easing, interpolate, interpolateColors, random } from "remotion";
import { tween } from "../../../engine/motion";
import { ART, INK, MUTED, PAPER, SERIF, STAGE } from "../theme";

// 插画零件：几何扁平风，所有场景共用，画风才统一。坐标都在舞台的 SVG 里（STAGE.w × STAGE.h）。
// 动画全是帧的纯函数：调用方把「进度」算好传进来，零件只负责画。

export const ease = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const pop = Easing.out(Easing.back(1.8));

// 0~1 的进度：f 在 [a, b] 之间线性（或按 easing）走完
export const prog = (
  f: number,
  a: number,
  b: number,
  easing: (t: number) => number = ease,
) => tween(f, [a, b], [0, 1], easing);

// 一整幅舞台：SVG 画布，字体统一
export const Canvas: React.FC<{
  readonly children: React.ReactNode;
  readonly opacity?: number;
}> = ({ children, opacity = 1 }) => (
  <svg
    viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
    width={STAGE.w}
    height={STAGE.h}
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      overflow: "visible",
      opacity,
      fontFamily: SERIF,
    }}
  >
    {children}
  </svg>
);

// 描线动画：pathLength 归一化成 1，draw 从 0 到 1 把线画出来
export const drawn = (draw: number) => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - draw,
});

// 果子成熟的颜色：0 青 → 0.35 黄 → 0.6 橙 → 0.8 红 → 1 过熟发暗
export const ripeColor = (t: number) =>
  interpolateColors(
    t,
    [0, 0.35, 0.6, 0.8, 1],
    [ART.unripe, ART.turning, ART.orange, ART.ripe, ART.overripe],
  );

// 豆子烘焙的颜色：0 生豆淡绿 → 0.35 转黄 → 0.7 褐 → 1 深褐
export const roastColor = (t: number) =>
  interpolateColors(
    t,
    [0, 0.35, 0.7, 1],
    [ART.greenBean, ART.yellowBean, ART.brownBean, ART.darkBean],
  );

export const Shadow: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry?: number;
  readonly opacity?: number;
}> = ({ x, y, rx, ry = rx * 0.18, opacity = 1 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={ART.shadow} opacity={opacity} />
);

// 咖啡樱桃：圆果 + 左上的高光 + 果顶一圈深色的花萼痕
export const Cherry: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly color?: string;
  readonly scale?: number;
}> = ({ x, y, r, color = ART.ripe, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle r={r} fill={color} />
    <circle r={r} fill="url(#cherry-shade)" />
    <ellipse
      cx={-r * 0.36}
      cy={-r * 0.38}
      rx={r * 0.26}
      ry={r * 0.17}
      fill="white"
      opacity={0.32}
      transform={`rotate(-30 ${-r * 0.36} ${-r * 0.38})`}
    />
    <circle
      cx={r * 0.3}
      cy={r * 0.52}
      r={r * 0.13}
      fill={ART.ripeDark}
      opacity={0.55}
    />
  </g>
);

// 共用的渐变：果子的明暗、豆子的明暗。每个 Canvas 里放一份
export const Defs: React.FC = () => (
  <defs>
    <radialGradient id="cherry-shade" cx="35%" cy="30%" r="80%">
      <stop offset="55%" stopColor="black" stopOpacity={0} />
      <stop offset="100%" stopColor="black" stopOpacity={0.28} />
    </radialGradient>
    <radialGradient id="bean-shade" cx="35%" cy="30%" r="80%">
      <stop offset="50%" stopColor="black" stopOpacity={0} />
      <stop offset="100%" stopColor="black" stopOpacity={0.22} />
    </radialGradient>
  </defs>
);

// 咖啡豆：椭圆，中间一道 S 形的豆缝
export const Bean: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly color: string;
  readonly rotate?: number;
  readonly crease?: string;
  readonly opacity?: number;
}> = ({ x, y, w, color, rotate = 0, crease, opacity = 1 }) => {
  const h = w * 1.35;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      <ellipse rx={w / 2} ry={h / 2} fill={color} />
      <ellipse rx={w / 2} ry={h / 2} fill="url(#bean-shade)" />
      <path
        d={`M 0 ${-h * 0.42} C ${w * 0.16} ${-h * 0.15}, ${-w * 0.16} ${h * 0.15}, 0 ${h * 0.42}`}
        stroke={crease ?? "rgba(0,0,0,0.35)"}
        strokeWidth={Math.max(2, w * 0.07)}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

// 叶子：杏仁形，一条叶脉；从叶柄处长出来（grow 0~1）
export const Leaf: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly len: number;
  readonly angle: number;
  readonly grow?: number;
  readonly color?: string;
}> = ({ x, y, len, angle, grow = 1, color = ART.leaf }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${grow})`}>
    <path
      d={`M 0 0 Q ${len * 0.45} ${-len * 0.3} ${len} 0 Q ${len * 0.45} ${len * 0.3} 0 0 Z`}
      fill={color}
    />
    <path
      d={`M ${len * 0.06} 0 L ${len * 0.9} 0`}
      stroke={ART.leafDark}
      strokeWidth={2}
      opacity={0.6}
    />
  </g>
);

// 杯子：侧面的马克杯 + 杯碟；从侧面看不到杯里，fill 只控制杯口那层咖啡（0 空杯 → 1 满杯）
export const Cup: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
  readonly fill?: number;
  readonly draw?: number;
}> = ({ x, y, s = 1, fill = 1, draw = 1 }) => {
  const body =
    "M -110 -120 L 110 -120 L 96 40 Q 92 80 52 80 L -52 80 Q -92 80 -96 40 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cy={96} rx={190} ry={30} fill={ART.shadow} opacity={draw} />
      <ellipse
        cy={84}
        rx={170}
        ry={24}
        fill={ART.cup}
        stroke={INK}
        strokeWidth={3}
        opacity={draw}
      />
      <path
        d="M 104 -80 C 170 -80, 170 20, 98 20"
        fill="none"
        stroke={INK}
        strokeWidth={14}
        opacity={draw}
      />
      <path
        d="M 104 -80 C 170 -80, 170 20, 98 20"
        fill="none"
        stroke={ART.cup}
        strokeWidth={8}
        opacity={draw}
      />
      <path d={body} fill={ART.cup} opacity={draw} />
      <path
        d={body}
        fill="none"
        stroke={INK}
        strokeWidth={4}
        {...drawn(draw)}
      />
      <ellipse
        cy={-120}
        rx={110}
        ry={20}
        fill={ART.cup}
        stroke={INK}
        strokeWidth={4}
        opacity={draw}
      />
      {fill > 0 ? (
        <g opacity={tween(fill, [0, 0.2], [0, 1])}>
          <ellipse cy={-114} rx={98} ry={15} fill={ART.coffee} />
          <ellipse cy={-116} rx={70} ry={9} fill={ART.crema} opacity={0.55} />
        </g>
      ) : null}
    </g>
  );
};

// 热气：几缕曲线从 (x, y) 往上飘，每缕有自己的相位；calm 越大飘得越慢
export const Steam: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly f: number;
  readonly opacity?: number;
  readonly calm?: number;
}> = ({ x, y, f, opacity = 1, calm = 0 }) => {
  const speed = 1 - calm * 0.7;
  return (
    <g opacity={opacity}>
      {[-34, 0, 34].map((dx, i) => {
        const t = (f * speed) / 30 + i * 0.9;
        const pts = Array.from({ length: 9 }, (_, k) => {
          const yy = -k * 22;
          const xx = dx + Math.sin(t * 1.6 + k * 0.7) * (6 + k * 2.2);
          return `${x + xx} ${y + yy}`;
        });
        return (
          <path
            key={dx}
            d={`M ${pts.join(" L ")}`}
            fill="none"
            stroke={MUTED}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.35 + 0.2 * Math.sin(t)}
          />
        );
      })}
    </g>
  );
};

// 引线标注：圆点落在对象上，细线引到文字。p 是出现进度（0~1），淡出交给外层
export const Callout: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly tx: number;
  readonly ty: number;
  readonly text: string;
  readonly p: number;
  readonly size?: number;
}> = ({ x, y, tx, ty, text, p, size = 32 }) => {
  const left = tx < x;
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={7 * tween(p, [0, 0.3], [0, 1])}
        fill={INK}
        stroke={PAPER}
        strokeWidth={3}
      />
      <path
        d={`M ${x} ${y} L ${tx} ${ty}`}
        stroke={INK}
        strokeWidth={2}
        {...drawn(tween(p, [0.15, 0.7], [0, 1]))}
      />
      <text
        x={tx + (left ? -12 : 12)}
        y={ty + size * 0.35}
        textAnchor={left ? "end" : "start"}
        fontSize={size}
        fill={INK}
        letterSpacing="0.08em"
        opacity={tween(p, [0.5, 1], [0, 1])}
      >
        {text}
      </text>
    </g>
  );
};

// 小字说明（图注体）
export const Note: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly opacity?: number;
  readonly anchor?: "start" | "middle" | "end";
  readonly size?: number;
  readonly color?: string;
}> = ({
  x,
  y,
  text,
  opacity = 1,
  anchor = "middle",
  size = 28,
  color = MUTED,
}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontSize={size}
    fill={color}
    letterSpacing="0.1em"
    opacity={opacity}
  >
    {text}
  </text>
);

// 确定性的随机：同一个 seed 每帧都得到同一个值
export const rnd = (seed: string) => random(seed);
export const lerp = (a: number, b: number, t: number) =>
  interpolate(t, [0, 1], [a, b]);

// 虚线的描出动画：虚线本身占用了 strokeDasharray，描出改用一条实线做遮罩，遮罩画到哪虚线就露到哪
export const DashedPath: React.FC<{
  readonly id: string;
  readonly d: string;
  readonly draw: number;
  readonly dash: string;
  readonly stroke: string;
  readonly width?: number;
  readonly opacity?: number;
}> = ({ id, d, draw, dash, stroke, width = 3, opacity = 1 }) => (
  <g opacity={opacity}>
    <mask id={id} maskUnits="userSpaceOnUse">
      <path
        d={d}
        stroke="white"
        strokeWidth={width + 10}
        fill="none"
        strokeLinecap="round"
        {...drawn(draw)}
      />
    </mask>
    <path
      d={d}
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinecap="round"
      fill="none"
      mask={`url(#${id})`}
    />
  </g>
);
