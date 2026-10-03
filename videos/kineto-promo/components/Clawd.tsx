import { CLAWD, INK } from "../theme";
import { Sprite } from "./Sprite";

// Clawd 取自 Claude Code 启动画面的方块字符画（▐▛███▜▌ / ▝▜█████▛▘ / ▘▘ ▝▝）。
// 终端字符格是 1:2 的竖长条，四分块像素也是竖长的，所以这里把每一行拆成两行，换成方像素后比例才对：
// 身体 12×8、两侧手臂各 2 像素、竖条眼睛、四条短腿，整只 18×10。
export type Eyes = "center" | "left" | "right" | "up" | "down" | "closed" | "wide";
export type Arms = "side" | "up" | "down";
export type Legs = "stand" | "runA" | "runB" | "tuck";

export interface Pose {
  eyes?: Eyes;
  arms?: Arms;
  legs?: Legs;
}

const WIDTH = 18;
const blank = () => Array.from({ length: 10 }, () => Array<string>(WIDTH).fill("."));

function fill(rows: string[][], y: number, from: number, to: number, ch = "o") {
  for (let x = from; x <= to; x++) rows[y][x] = ch;
}

const cache = new Map<string, string[]>();

export function clawdGrid({ eyes = "center", arms = "side", legs = "stand" }: Pose): string[] {
  const key = `${eyes}|${arms}|${legs}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rows = blank();
  for (let y = 0; y < 8; y++) fill(rows, y, 3, 14);

  // 手臂：平伸在第 4–5 行；举手时从肩膀斜向上；垂下时贴着身体下半
  if (arms === "side") {
    fill(rows, 4, 1, 16);
    fill(rows, 5, 1, 16);
  } else if (arms === "up") {
    fill(rows, 1, 1, 16);
    rows[0][1] = "o";
    rows[0][16] = "o";
    fill(rows, 2, 2, 15);
  } else {
    fill(rows, 6, 1, 16);
    fill(rows, 7, 1, 16);
  }

  // 眼睛：1×2 的竖条，靠挪位置表达视线
  const eyeX = eyes === "left" ? [4, 11] : eyes === "right" ? [6, 13] : [5, 12];
  const eyeY = eyes === "up" ? [1, 2] : eyes === "down" ? [3, 4] : eyes === "closed" ? [3] : eyes === "wide" ? [1, 2, 3] : [2, 3];
  for (const x of eyeX) for (const y of eyeY) rows[y][x] = "k";

  const legX = [4, 6, 11, 13];
  if (legs === "stand") {
    for (const x of legX) {
      fill(rows, 8, x, x);
      fill(rows, 9, x, x);
    }
  } else if (legs === "tuck") {
    for (const x of legX) fill(rows, 8, x, x);
  } else {
    const long = legs === "runA" ? [4, 11] : [6, 13];
    for (const x of legX) fill(rows, 8, x, x);
    for (const x of long) fill(rows, 9, x, x);
  }

  const grid = rows.map((r) => r.join(""));
  cache.set(key, grid);
  return grid;
}

const palettes = new Map<string, Record<string, string>>();
const paletteFor = (body: string, eye: string) => {
  const key = `${body}|${eye}`;
  let p = palettes.get(key);
  if (!p) {
    p = { o: body, k: eye };
    palettes.set(key, p);
  }
  return p;
};

// (x, y) 是脚底中点。squash 做挤压拉伸：>1 变扁，<1 拉长，体积大致守恒。
export const Clawd: React.FC<{
  x: number;
  y: number;
  scale: number;
  pose?: Pose;
  flip?: boolean;
  rotate?: number;
  squash?: number;
  color?: string;
  eyeColor?: string;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ x, y, scale, pose = {}, flip = false, rotate = 0, squash = 1, color = CLAWD, eyeColor = INK, opacity = 1, style }) => {
  const w = WIDTH * scale;
  const h = 10 * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h,
        width: w,
        height: h,
        opacity,
        transformOrigin: "50% 100%",
        transform: `rotate(${rotate}deg) scale(${(flip ? -1 : 1) * squash}, ${1 / squash})`,
        ...style,
      }}
    >
      <Sprite grid={clawdGrid(pose)} palette={paletteFor(color, eyeColor)} scale={scale} />
    </div>
  );
};

export const CLAWD_SIZE = { w: WIDTH, h: 10 };
