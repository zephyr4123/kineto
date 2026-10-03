import { useMemo } from "react";
import { random } from "remotion";
import { PAPER, PAPER_PAL, SOCK, SOCK_PAL } from "../sprites";
import { PixelText } from "./PixelText";
import { Sprite } from "./Sprite";

// 瞎猜的产物：揉皱的纸、袜子、一堆「最终版」视频文件、摔坏的胶片盘。
export type JunkKind = "paper" | "sock" | "file" | "reel";
export const JUNK_KINDS: readonly JunkKind[] = ["file", "paper", "reel", "sock", "file", "paper"];
export const FILE_NAMES = ["final_v3.mp4", "final_FINAL.mp4", "final_v2_fixed.mp4", "dont_touch.mp4", "untitled (7).mp4"];

const FileIcon: React.FC<{ s: number; label?: string }> = ({ s, label }) => (
  <div style={{ position: "relative", width: 64 * s, height: 80 * s }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#e6e1f0",
        clipPath: "polygon(0 0, 70% 0, 100% 22%, 100% 100%, 0 100%)",
      }}
    />
    <div style={{ position: "absolute", right: 0, top: 0, width: 19 * s, height: 18 * s, backgroundColor: "#a49dbb" }} />
    <div style={{ position: "absolute", left: 8 * s, right: 8 * s, top: 40 * s, height: 18 * s, backgroundColor: "#7a5ab8" }}>
      <div style={{ fontSize: 13 * s, lineHeight: `${18 * s}px`, color: "white", textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>MP4</div>
    </div>
    {label ? (
      <PixelText size={30} color="#ffd24a" outline={4} style={{ position: "absolute", left: "50%", top: -50, transform: "translateX(-50%)" }}>
        {label}
      </PixelText>
    ) : null}
  </div>
);

const Reel: React.FC<{ s: number }> = ({ s }) => (
  <svg width={70 * s} height={70 * s} viewBox="0 0 14 14" shapeRendering="crispEdges">
    <rect x={4} y={0} width={6} height={1} fill="#5d5670" />
    <rect x={2} y={1} width={10} height={2} fill="#5d5670" />
    <rect x={1} y={3} width={12} height={8} fill="#5d5670" />
    <rect x={2} y={11} width={10} height={2} fill="#5d5670" />
    <rect x={4} y={13} width={6} height={1} fill="#5d5670" />
    <rect x={3} y={4} width={2} height={2} fill="#1b1726" />
    <rect x={9} y={4} width={2} height={2} fill="#1b1726" />
    <rect x={6} y={9} width={2} height={2} fill="#1b1726" />
    <rect x={6} y={6} width={2} height={2} fill="#c9c2dc" />
    {/* 裂缝 */}
    <rect x={10} y={6} width={1} height={1} fill="#1b1726" />
    <rect x={11} y={7} width={1} height={2} fill="#1b1726" />
    <rect x={12} y={9} width={1} height={1} fill="#1b1726" />
  </svg>
);

export const JunkItem: React.FC<{ kind: JunkKind; s?: number; label?: string }> = ({ kind, s = 1, label }) => {
  if (kind === "file") return <FileIcon s={s} label={label} />;
  if (kind === "reel") return <Reel s={s} />;
  if (kind === "sock") return <Sprite grid={SOCK} palette={SOCK_PAL} scale={10 * s} />;
  return <Sprite grid={PAPER} palette={PAPER_PAL} scale={8 * s} />;
};

// 垃圾山：预先在一座三角形的山体里撒好 160 个位置，按高度从低到高排序；
// 显示前 count 个，所以少的时候散在地上，多了就从山脚一路堆成山。(x, groundY) 是山脚中点。
const PILE_MAX = 160;
const PILE_H = 400;
const PILE_W = 520;

export const JunkPile: React.FC<{ x: number; groundY: number; count: number; s?: number; mound?: boolean }> = ({ x, groundY, count, s = 1, mound = false }) => {
  const items = useMemo(
    () =>
      Array.from({ length: PILE_MAX }, (_, i) => {
        const r = (k: string) => random(`pile-${i}-${k}`);
        const h = PILE_H * (1 - Math.sqrt(r("h")));
        return {
          kind: JUNK_KINDS[Math.floor(r("k") * JUNK_KINDS.length)],
          h,
          dx: (r("x") * 2 - 1) * PILE_W * (1 - h / PILE_H) * 0.92,
          rot: (r("r") * 2 - 1) * 70,
        };
      }).sort((a, b) => growth(a) - growth(b)),
    [],
  );
  const shown = items.slice(0, Math.min(count, items.length));
  const top = shown.reduce((m, it) => Math.max(m, it.h), 0);
  return (
    <div style={{ position: "absolute", left: x, top: groundY }}>
      {mound ? (
        <svg width={PILE_W * 2 * s} height={(top + 40) * s} style={{ position: "absolute", left: -PILE_W * s, top: -(top + 30) * s }} shapeRendering="crispEdges">
          <path d={steppedMound(PILE_W * s, (top + 30) * s, 28 * s)} fill="#3d4470" />
        </svg>
      ) : null}
      {shown.map((it, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: it.dx * s,
            top: -it.h * s - 50 * s,
            transform: `translate(-50%, 0) rotate(${it.rot}deg)`,
          }}
        >
          <JunkItem kind={it.kind} s={0.9 * s} />
        </div>
      ))}
    </div>
  );
};

// 堆积顺序：离山脚中心越近越先出现，山从中间往外、往上长
const growth = (it: { h: number; dx: number }) => it.h / PILE_H + Math.abs(it.dx) / PILE_W;

// 前 count 件里最高那件的高度（与 JunkPile 用同一套随机数）
export const pileTop = (count: number) =>
  Array.from({ length: PILE_MAX }, (_, i) => {
    const h = PILE_H * (1 - Math.sqrt(random(`pile-${i}-h`)));
    return { h, dx: (random(`pile-${i}-x`) * 2 - 1) * PILE_W * (1 - h / PILE_H) * 0.92 };
  })
    .sort((a, b) => growth(a) - growth(b))
    .slice(0, count)
    .reduce((m, it) => Math.max(m, it.h), 0);

// 阶梯状的三角山体（像素风）
function steppedMound(halfW: number, h: number, step: number): string {
  let d = `M0 ${h}`;
  const n = Math.ceil(h / step);
  for (let k = 0; k <= n; k++) {
    const y = h - k * step;
    const w = halfW * (1 - k / n);
    d += ` L${halfW - w} ${y} L${halfW - w} ${y - step}`;
  }
  for (let k = n; k >= 0; k--) {
    const y = h - k * step;
    const w = halfW * (1 - k / n);
    d += ` L${halfW + w} ${y - step} L${halfW + w} ${y}`;
  }
  return `${d} Z`;
}
