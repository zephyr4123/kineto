import { useMemo } from "react";

// 像素画：每行一个字符串，一个字符一个像素，"." 透明，其余字符查调色板。
// 同一行相邻同色像素合并成一个 <rect>，crispEdges 保证放大后边缘不糊。
export type Palette = Readonly<Record<string, string>>;

interface Run {
  x: number;
  y: number;
  w: number;
  color: string;
}

function toRuns(grid: readonly string[], palette: Palette): Run[] {
  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = palette[row[x]];
      let end = x + 1;
      while (end < row.length && row[end] === row[x]) end++;
      if (row[x] !== "." && color) runs.push({ x, y, w: end - x, color });
      x = end;
    }
  });
  return runs;
}

export const Sprite: React.FC<{
  grid: readonly string[];
  palette: Palette;
  scale: number;
  style?: React.CSSProperties;
}> = ({ grid, palette, scale, style }) => {
  const runs = useMemo(() => toRuns(grid, palette), [grid, palette]);
  const w = grid[0].length;
  const h = grid.length;
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ display: "block", overflow: "visible", ...style }}
    >
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
};
