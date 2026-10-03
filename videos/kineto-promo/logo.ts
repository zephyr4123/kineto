// 「kineto」的单线字形：每个字母由几条折线组成（单位 u，y 向上为负，基线 y=0），
// 第四幕 Clawd 按这个顺序一笔一笔画出来，第五幕把它缩小放在片尾。
export const U = 58;
export const STROKE = 0.8 * U;
export const BASELINE = 640;

type Pt = readonly [number, number];
interface Letter {
  width: number;
  strokes: readonly (readonly Pt[])[];
}

const LETTERS: Record<string, Letter> = {
  k: {
    width: 3,
    strokes: [
      [
        [0, -6.5],
        [0, 0],
      ],
      [
        [2.8, -4],
        [0.15, -1.7],
        [2.9, 0],
      ],
    ],
  },
  i: {
    width: 0,
    strokes: [
      [
        [0, -4],
        [0, 0],
      ],
    ],
  },
  n: {
    width: 3,
    strokes: [
      [
        [0, 0],
        [0, -3.3],
        [0.7, -4],
        [2.3, -4],
        [3, -3.3],
        [3, 0],
      ],
    ],
  },
  e: {
    width: 3,
    strokes: [
      [
        [0.1, -2],
        [3, -2],
        [3, -3.3],
        [2.3, -4],
        [0.7, -4],
        [0, -3.3],
        [0, -0.7],
        [0.7, 0],
        [2.7, 0],
      ],
    ],
  },
  t: {
    width: 2.4,
    strokes: [
      [
        [0.9, -5.8],
        [0.9, -0.7],
        [1.6, 0],
        [2.4, 0],
      ],
      [
        [0, -4],
        [2.3, -4],
      ],
    ],
  },
  o: {
    width: 3,
    strokes: [
      [
        [0.7, -4],
        [2.3, -4],
        [3, -3.3],
        [3, -0.7],
        [2.3, 0],
        [0.7, 0],
        [0, -0.7],
        [0, -3.3],
        [0.7, -4],
      ],
    ],
  },
};

const WORD = "kineto";
const GAP = 1.2;

export interface Stroke {
  points: { x: number; y: number }[];
  length: number;
}

function layout(): { strokes: Stroke[]; iDot: { x: number; y: number }; width: number } {
  const total = WORD.split("").reduce((w, ch, i) => w + LETTERS[ch].width + (i ? GAP : 0), 0) * U;
  let x = 960 - total / 2;
  const strokes: Stroke[] = [];
  let iDot = { x: 0, y: 0 };
  for (const ch of WORD) {
    const letter = LETTERS[ch];
    for (const s of letter.strokes) {
      const points = s.map(([px, py]) => ({ x: x + px * U, y: BASELINE + py * U }));
      let length = 0;
      for (let k = 1; k < points.length; k++) length += Math.hypot(points[k].x - points[k - 1].x, points[k].y - points[k - 1].y);
      strokes.push({ points, length });
    }
    if (ch === "i") iDot = { x, y: BASELINE - 5.6 * U };
    x += (letter.width + GAP) * U;
  }
  return { strokes, iDot, width: total };
}

export const LOGO = layout();

export const toPath = (points: { x: number; y: number }[]) => points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

// 沿一条折线走 d 像素后的位置
export function pointAt(stroke: Stroke, d: number): { x: number; y: number } {
  let left = Math.max(0, Math.min(stroke.length, d));
  for (let k = 1; k < stroke.points.length; k++) {
    const a = stroke.points[k - 1];
    const b = stroke.points[k];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= seg) return { x: a.x + ((b.x - a.x) * left) / seg, y: a.y + ((b.y - a.y) * left) / seg };
    left -= seg;
  }
  return stroke.points[stroke.points.length - 1];
}
