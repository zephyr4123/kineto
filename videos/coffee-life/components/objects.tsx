import { ART, INK } from "../theme";
import { Bean } from "./art";

// 几幕里反复出现的物件。都以 (0, 0) 为中心画，外面用 translate / scale 摆位置；
// 尾声把整段旅程串成一圈时，会用小号的同一批物件，前后呼应。

export const Sun: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
  readonly spin?: number;
}> = ({ x, y, s = 1, spin = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${spin})`}>
    {Array.from({ length: 10 }, (_, i) => (
      <path
        key={i}
        d="M 0 -36 L 0 -50"
        stroke={ART.sun}
        strokeWidth={6}
        strokeLinecap="round"
        transform={`rotate(${i * 36})`}
      />
    ))}
    <circle r={26} fill={ART.sun} />
  </g>
);

// 麻袋：鼓起的袋身 + 扎口；fullness 0~1 控制鼓起的程度
export const Sack: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
  readonly fullness?: number;
}> = ({ x, y, s = 1, fullness = 1 }) => {
  const bulge = 0.82 + 0.18 * fullness;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cy={150} rx={150 * bulge} ry={20} fill={ART.shadow} />
      <g transform={`scale(${bulge} 1)`}>
        <path
          d="M -70 -120 Q -60 -95 -110 -40 Q -160 30 -140 110 Q -130 150 -80 150 L 80 150 Q 130 150 140 110 Q 160 30 110 -40 Q 60 -95 70 -120 Z"
          fill={ART.burlap}
          stroke={ART.burlapDark}
          strokeWidth={4}
        />
        {/* 麻布的织纹 */}
        {[-60, -20, 20, 60, 100].map((yy) => (
          <path
            key={yy}
            d={`M -130 ${yy} Q 0 ${yy + 10} 130 ${yy}`}
            stroke={ART.burlapDark}
            strokeWidth={2}
            opacity={0.35}
            fill="none"
          />
        ))}
        <path
          d="M -40 10 L 40 10 M -40 40 L 40 40"
          stroke={ART.burlapDark}
          strokeWidth={3}
          opacity={0.5}
        />
      </g>
      {/* 扎口 */}
      <path
        d="M -74 -122 Q 0 -100 74 -122 L 66 -150 Q 0 -134 -66 -150 Z"
        fill={ART.burlapDark}
      />
      <path
        d="M -60 -140 Q -30 -175 -10 -150 M 60 -140 Q 30 -175 10 -150"
        stroke={ART.branch}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

// 货轮：船体 + 甲板上一排集装箱 + 船尾的驾驶楼
export const Ship: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
}> = ({ x, y, s = 1 }) => {
  const boxes = [
    "#b8573d",
    "#7f9c8a",
    "#d3a35a",
    "#6f8fa3",
    "#b8573d",
    "#d3a35a",
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {boxes.map((c, i) => (
        <rect
          key={i}
          x={-190 + i * 50}
          y={-62 - (i % 2) * 34}
          width={46}
          height={30 + (i % 2) * 34}
          fill={c}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <rect
        x={120}
        y={-110}
        width={60}
        height={80}
        fill={ART.cup}
        stroke={INK}
        strokeWidth={3}
      />
      <rect x={130} y={-98} width={40} height={12} fill={ART.seaDark} />
      <rect x={146} y={-140} width={14} height={30} fill={INK} />
      <path d="M -230 -30 L 230 -30 L 196 40 L -200 40 Z" fill={INK} />
      <path d="M -214 12 L 214 12 L 204 40 L -200 40 Z" fill={ART.ripeDark} />
    </g>
  );
};

// 烘焙滚筒（正面）：一个大圆筒，中间圆窗里能看到豆子在翻，底下是火
export const Drum: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
  readonly f: number;
  readonly color: string;
  readonly heat?: number;
  readonly hop?: (i: number) => number;
}> = ({ x, y, s = 1, f, color, heat = 1, hop }) => {
  const R = 230;
  const win = 150;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* 火 */}
      {[-90, -30, 30, 90].map((dx, i) => {
        const flick = 1 + 0.18 * Math.sin(f * 0.5 + i * 1.7);
        return (
          <g
            key={dx}
            transform={`translate(${dx} ${R + 46}) scale(${heat * flick})`}
            opacity={heat}
          >
            <path
              d="M 0 -60 Q 26 -20 18 6 Q 0 26 -18 6 Q -26 -20 0 -60 Z"
              fill={ART.orange}
            />
            <path
              d="M 0 -30 Q 12 -8 8 6 Q 0 14 -8 6 Q -12 -8 0 -30 Z"
              fill={ART.sun}
            />
          </g>
        );
      })}
      <rect
        x={-R - 20}
        y={-R + 40}
        width={2 * R + 40}
        height={2 * R - 40}
        rx={40}
        fill={ART.steelDark}
      />
      <circle r={R} fill={ART.steel} stroke={INK} strokeWidth={4} />
      <circle
        r={R - 26}
        fill="none"
        stroke={ART.steelDark}
        strokeWidth={3}
        opacity={0.6}
      />
      {/* 螺栓 */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * (R - 13)}
            cy={Math.sin(a) * (R - 13)}
            r={5}
            fill={ART.steelDark}
          />
        );
      })}
      {/* 观察窗：豆子在窗里翻滚，下半部分堆着、被叶片带起来再落下 */}
      <clipPath id="drum-window">
        <circle r={win} />
      </clipPath>
      <circle r={win} fill="#3a2a22" />
      <g clipPath="url(#drum-window)">
        {Array.from({ length: 34 }, (_, i) => {
          const a = (i / 34) * Math.PI * 2 + f * 0.045;
          const rr = 40 + (i % 4) * 26;
          // 被带到上半圈的豆子会落回去：把它们压回下半部分
          const yy = Math.abs(Math.sin(a)) * rr * 0.9 + 20 - (hop ? hop(i) : 0);
          const xx = Math.cos(a) * rr;
          return (
            <Bean
              key={i}
              x={xx}
              y={yy}
              w={26}
              color={color}
              rotate={(a * 180) / Math.PI + i * 30}
            />
          );
        })}
      </g>
      <circle r={win} fill="none" stroke={INK} strokeWidth={6} />
      <path
        d={`M ${-win * 0.6} ${-win * 0.55} A ${win * 0.85} ${win * 0.85} 0 0 1 ${win * 0.2} ${-win * 0.82}`}
        stroke="white"
        strokeWidth={8}
        opacity={0.25}
        fill="none"
        strokeLinecap="round"
      />
      {/* 顶上的进料斗 */}
      <path
        d={`M -80 ${-R - 70} L 80 ${-R - 70} L 34 ${-R + 4} L -34 ${-R + 4} Z`}
        fill={ART.steel}
        stroke={INK}
        strokeWidth={4}
      />
    </g>
  );
};

// 手冲壶：鹅颈壶，壶嘴朝左；tilt 是倾斜角度
export const Kettle: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
  readonly tilt?: number;
}> = ({ x, y, s = 1, tilt = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-tilt})`}>
    <path
      d="M -60 -50 Q -80 60 -50 80 L 60 80 Q 90 60 60 -50 Z"
      fill={ART.steel}
      stroke={INK}
      strokeWidth={4}
    />
    <path
      d="M -60 -50 Q 0 -70 60 -50"
      fill="none"
      stroke={INK}
      strokeWidth={4}
    />
    <path d="M -20 -66 Q 0 -86 20 -66" fill={INK} />
    <path
      d="M -56 40 C -110 40, -110 -20, -150 -60"
      stroke={ART.steel}
      strokeWidth={14}
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M -56 40 C -110 40, -110 -20, -150 -60"
      stroke={INK}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      opacity={0.6}
    />
    <path
      d="M 62 -30 C 120 -30, 120 60, 64 60"
      stroke={INK}
      strokeWidth={12}
      fill="none"
      strokeLinecap="round"
    />
  </g>
);

// 编织篮：口宽底窄，几道横向的编纹
export const Basket: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s?: number;
}> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cy={120} rx={170} ry={22} fill={ART.shadow} />
    <path
      d="M -170 0 L 170 0 L 120 115 L -120 115 Z"
      fill={ART.burlap}
      stroke={ART.burlapDark}
      strokeWidth={4}
    />
    {[28, 56, 84].map((yy) => (
      <path
        key={yy}
        d={`M ${-170 + yy * 0.43} ${yy} L ${170 - yy * 0.43} ${yy}`}
        stroke={ART.burlapDark}
        strokeWidth={3}
        opacity={0.6}
      />
    ))}
    {[-100, -50, 0, 50, 100].map((xx) => (
      <path
        key={xx}
        d={`M ${xx} 0 L ${xx * 0.7} 115`}
        stroke={ART.burlapDark}
        strokeWidth={2}
        opacity={0.45}
      />
    ))}
    <ellipse
      rx={170}
      ry={22}
      fill="none"
      stroke={ART.burlapDark}
      strokeWidth={8}
    />
  </g>
);
