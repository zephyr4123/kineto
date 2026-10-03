// 「kineto」的行书：一笔连写的主笔画 + 回头补上的 t 横。骨架点用 Catmull-Rom 样条连成顺滑曲线，
// 再加密成折线（每段约 2px），书写动画、长度、笔尖位置都在这条折线上算。
// 单位：x 高 100，升部约 240；基线 y=0，向上为负。最后整体缩放、居中到画面里。
type Pt = readonly [number, number];

const MAIN: Pt[] = [
  // 起笔，挑上去写 k 的环
  [-40, -6],
  [-8, -40],
  [22, -120],
  [44, -205],
  [40, -246],
  [22, -244],
  [16, -205],
  [18, -120],
  [20, -40],
  [21, 0],
  // k 的小肚子，再踢出右腿
  [26, -52],
  [52, -92],
  [80, -96],
  [88, -74],
  [66, -54],
  [44, -50],
  [62, -38],
  [84, -10],
  [104, 0],
  [124, -14],
  // i
  [140, -60],
  [150, -100],
  [146, -50],
  [148, -8],
  [164, 0],
  [182, -24],
  // n
  [196, -72],
  [204, -100],
  [202, -50],
  [200, 0],
  [204, -46],
  [222, -88],
  [246, -100],
  [262, -82],
  [264, -40],
  [266, -6],
  [282, 0],
  [298, -16],
  // e
  [324, -46],
  [346, -78],
  [344, -100],
  [326, -100],
  [310, -78],
  [308, -40],
  [318, -8],
  [340, 0],
  [362, -14],
  // t：长长地挑上去再落下
  [382, -70],
  [396, -150],
  [400, -176],
  [396, -150],
  [392, -70],
  [393, -16],
  [406, 0],
  [428, -10],
  // o，收尾带一个向右上的飘带
  [446, -50],
  [470, -96],
  [452, -100],
  [438, -70],
  [440, -24],
  [458, 0],
  [484, -14],
  [492, -58],
  [480, -96],
  [470, -90],
  [492, -84],
  [530, -92],
  [570, -112],
];

// t 的横：最后回过头来一笔带过
const CROSS: Pt[] = [
  [366, -112],
  [400, -118],
  [440, -122],
];

// i 上那个点（Clawd 会落在这里）
const I_DOT: Pt = [150, -150];

// Catmull-Rom 样条加密成折线
function spline(pts: readonly Pt[], step = 2): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(len / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  const last = pts[pts.length - 1];
  out.push({ x: last[0], y: last[1] });
  return out;
}

export interface Stroke {
  points: { x: number; y: number }[];
  length: number;
  cum: number[];
}

const SCALE = 2.3;
export const CENTER = { x: 960, y: 470 };

function place(pts: readonly Pt[], ox: number, oy: number): Stroke {
  const points = spline(pts).map((p) => ({ x: ox + p.x * SCALE, y: oy + p.y * SCALE }));
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  return { points, length: cum[cum.length - 1], cum };
}

// 以主笔画的外接框居中
const xs = MAIN.map((p) => p[0]);
const ys = MAIN.map((p) => p[1]);
const OX = CENTER.x - ((Math.min(...xs) + Math.max(...xs)) / 2) * SCALE;
const OY = CENTER.y - ((Math.min(...ys) + Math.max(...ys)) / 2) * SCALE;

export const LOGO = {
  main: place(MAIN, OX, OY),
  cross: place(CROSS, OX, OY),
  iDot: { x: OX + I_DOT[0] * SCALE, y: OY + I_DOT[1] * SCALE },
};

// 宽头羽毛笔：笔尖是一条斜放的短线，同一条路径沿笔尖方向平移若干份叠起来，
// 竖画自然粗、顺着笔尖方向的笔画自然细。
export const NIB = { width: 44, angle: (-38 * Math.PI) / 180, copies: 18, line: 6 };
export const nibOffsets = Array.from({ length: NIB.copies }, (_, i) => {
  const t = i / (NIB.copies - 1) - 0.5;
  return { dx: Math.cos(NIB.angle) * NIB.width * t, dy: Math.sin(NIB.angle) * NIB.width * t };
});

export const toPath = (points: { x: number; y: number }[]) => points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

// 沿笔画走 d 像素后的位置与方向
export function pointAt(stroke: Stroke, d: number): { x: number; y: number; angle: number } {
  const target = Math.max(0, Math.min(stroke.length, d));
  let lo = 0;
  let hi = stroke.cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (stroke.cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const a = stroke.points[lo];
  const b = stroke.points[hi];
  const seg = stroke.cum[hi] - stroke.cum[lo] || 1;
  const k = (target - stroke.cum[lo]) / seg;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}
