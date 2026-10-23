import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { COLOR, DISPLAY, EASE } from "../theme";

// 动态排版的零件（照风格纲领：字怎么动由字义决定，相邻两句不用同一种）。都是帧的纯函数，时间用场景里的帧。
// 打字、解码、滚轮、文字墙、聚拢、霓虹描字、对撞、虚实变焦。

type Base = { size?: number; weight?: number; color?: string; style?: React.CSSProperties };
const text = (size: number, weight: number, color: string): React.CSSProperties => ({ fontFamily: DISPLAY, fontSize: size, fontWeight: weight, letterSpacing: "-0.025em", color, whiteSpace: "pre" });

/** 逐字打出来，后面跟一根闪烁的光标；frames 帧打完 */
export const Typewriter: React.FC<Base & { value: string; at: number; frames: number; caret?: string; font?: string }> = ({ value, at, frames, caret = COLOR.cinnabar, font, size = 96, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  const chars = [...value];
  const n = Math.floor(prog(frame, at, frames, (t) => t) * chars.length);
  if (frame < at) return null;
  const typing = n < chars.length;
  return (
    <span style={{ ...text(size, weight, color), fontFamily: font ?? DISPLAY, ...style }}>
      {chars.slice(0, n).join("")}
      <span style={{ display: "inline-block", width: size * 0.06, height: size * 0.9, marginLeft: size * 0.04, verticalAlign: `-${size * 0.12}px`, background: caret, opacity: typing || Math.floor(frame / 16) % 2 ? 1 : 0 }} />
    </span>
  );
};

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789{}[]<>/=+*#$%&";

/** 解码：每个字先乱跳，到自己的那一帧锁定（从左往右依次锁）；像一段代码被读出来 */
export const Scramble: React.FC<Base & { value: string; at: number; frames: number }> = ({ value, at, frames, size = 96, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const chars = [...value];
  return (
    <span style={{ ...text(size, weight, color), ...style }}>
      {chars.map((ch, i) => {
        const lock = at + 6 + (i / Math.max(1, chars.length - 1)) * frames;
        if (frame >= lock || ch === " ") return <span key={`${ch}-${i}`}>{ch}</span>;
        const g = GLYPHS[Math.floor(random(`g-${i}-${Math.floor(frame / 2)}`) * GLYPHS.length)];
        return (
          <span key={`${ch}-${i}`} style={{ color: COLOR.cinnabar, opacity: 0.85 }}>
            {g}
          </span>
        );
      })}
    </span>
  );
};

/** 滚轮：一列词竖着滚过去，最后停在 words 的最后一个上；每个词停 hold 帧 */
export const Reel: React.FC<Base & { words: readonly string[]; at: number; hold?: number; land?: string }> = ({ words, at, hold = 7, land, size = 96, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const lineH = size * 1.15;
  const steps = words.length - 1;
  // 越到后面越慢，最后一个落下时带一点回弹
  const t = Math.min(1, (frame - at) / (hold * steps + 10));
  const eased = EASE.outQuint(t);
  const pos = eased * steps;
  // 盒子里放一份看不见的最后那个词：宽度、基线都照落定后的样子，整行居中和同行别的字对齐都按它算。
  // 不能用 overflow: hidden 裁（行内块一裁，基线就掉到盒底，字会被抬高），改用 clip-path 只裁上下、左右放开
  return (
    <span style={{ position: "relative", display: "inline-block", clipPath: "inset(-0.08em -3000px -0.12em -3000px)", ...text(size, weight, color), ...style }}>
      <span style={{ visibility: "hidden" }}>{words[steps]}</span>
      {words.map((w, i) => {
        const d = i - pos;
        if (Math.abs(d) > 1.2) return null;
        const last = i === words.length - 1;
        return (
          <span
            key={`${w}-${i}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translateY(${d * lineH}px)`,
              opacity: 1 - Math.min(1, Math.abs(d)) * 0.7,
              filter: `blur(${Math.abs(d) * 6}px)`,
              color: last ? (land ?? color) : color,
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
};

/** 文字墙：同一个词铺满全屏好几行，相邻行反向滑动，远近虚实不一；collapse 帧起收回到中间那一行 */
export const Wall: React.FC<{ word: string; at: number; collapse: number; out: number; rows?: number; color?: string; accent?: string }> = ({ word, at, collapse, out, rows = 7, color = COLOR.ink, accent = COLOR.cinnabar }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, at, 14);
  const c = prog(frame, collapse, 20, EASE.inOut);
  const z = prog(frame, out, 12);
  if (a <= 0 || z >= 1) return null;
  const mid = Math.floor(rows / 2);
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - z }}>
      {Array.from({ length: rows }, (_, r) => {
        const d = r - mid;
        const depth = Math.abs(d);
        const size = 150 - depth * 14;
        const dir = r % 2 ? 1 : -1;
        const shift = dir * (frame - at) * (3 + depth * 1.2);
        const y = 540 + d * 150 * (1 - c);
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              left: -800 + shift * (1 - c),
              top: y - size * 0.6,
              display: "flex",
              gap: size * 0.5,
              ...text(size, 650, d === 0 ? accent : color),
              opacity: a * (d === 0 ? 1 : 0.55 - depth * 0.1) * (1 - c),
              filter: `blur(${depth * 2.5}px)`,
            }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i}>{word}</span>
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 聚拢：字母从四散的地方飞回来、错开着落定；from 给每个字母一个起点偏移 */
export const Assemble: React.FC<Base & { value: string; at: number; frames?: number; spread?: number; seed?: string }> = ({ value, at, frames = 26, spread = 600, seed = "as", size = 96, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <span style={{ display: "inline-flex", ...text(size, weight, color), ...style }}>
      {[...value].map((ch, i) => {
        const t = prog(frame, at + i * 1.2, frames, EASE.outExpo);
        const sx = (random(`${seed}-x-${i}`) - 0.5) * spread * 2;
        const sy = (random(`${seed}-y-${i}`) - 0.5) * spread;
        return (
          <span
            key={`${ch}-${i}`}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: Math.min(1, t * 2.5),
              transform: `translate(${sx * (1 - t)}px, ${sy * (1 - t)}px) rotate(${(random(`${seed}-r-${i}`) - 0.5) * 120 * (1 - t)}deg) scale(${0.6 + 0.4 * t})`,
              filter: t < 1 ? `blur(${10 * (1 - t)}px)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** 霓虹描字：一道光从左往右扫过，扫过的地方亮起来、带辉光 */
export const Neon: React.FC<Base & { value: string; at: number; frames?: number; glow: string }> = ({ value, at, frames = 24, glow, size = 120, weight = 600, color = COLOR.nightInk, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = prog(frame, at, frames, EASE.inOut);
  const edge = t * 120 - 10; // 扫光的位置（百分比）
  return (
    <span style={{ position: "relative", display: "inline-block", ...text(size, weight, color), ...style }}>
      <span style={{ WebkitMaskImage: `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 12}%)`, maskImage: `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 12}%)`, textShadow: `0 0 ${size * 0.18}px ${glow}, 0 0 ${size * 0.5}px color-mix(in oklab, ${glow} 50%, transparent)` }}>{value}</span>
      <span style={{ position: "absolute", top: "8%", bottom: "8%", left: `${edge + 6}%`, width: size * 0.05, background: glow, boxShadow: `0 0 ${size * 0.3}px ${glow}`, opacity: t < 1 ? 1 : 0 }} />
    </span>
  );
};

/** 对撞：左右两段从画面两侧冲进来，在中间那个字上撞齐 */
export const Collide: React.FC<Base & { left: string; mid: string; right: string; at: number }> = ({ left, mid, right, at, size = 120, weight = 650, color = COLOR.nightInk, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = prog(frame, at, 16, EASE.outExpo);
  const m = prog(frame, at + 10, 12);
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", ...text(size, weight, color), ...style }}>
      <span style={{ transform: `translateX(${-900 * (1 - t)}px)`, filter: t < 1 ? `blur(${14 * (1 - t)}px)` : undefined }}>{left}</span>
      <span style={{ margin: `0 ${size * 0.25}px`, color: COLOR.neonCinnabar, opacity: m, transform: `scale(${1.6 - 0.6 * m})`, display: "inline-block" }}>{mid}</span>
      <span style={{ transform: `translateX(${900 * (1 - t)}px)`, filter: t < 1 ? `blur(${14 * (1 - t)}px)` : undefined }}>{right}</span>
    </span>
  );
};

/** 虚实变焦：从放大、虚焦的样子收成清楚的正常大小 */
export const Focus: React.FC<Base & { value: string; at: number; frames?: number }> = ({ value, at, frames = 18, size = 96, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = prog(frame, at, frames, EASE.outExpo);
  return <span style={{ display: "inline-block", ...text(size, weight, color), opacity: Math.min(1, t * 2), transform: `scale(${1.5 - 0.5 * t})`, filter: t < 1 ? `blur(${18 * (1 - t)}px)` : undefined, ...style }}>{value}</span>;
};

/** 一行居中放这些零件；out 帧整行一起往上虚掉 */
export const Line: React.FC<{ out?: number; y?: number; children: React.ReactNode; gap?: number }> = ({ out, y = 0, children, gap = 0 }) => {
  const frame = useCurrentFrame();
  const z = out === undefined ? 0 : prog(frame, out, 14, EASE.outQuint);
  if (z >= 1) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap, transform: `translateY(${y - 30 * z}px)`, opacity: 1 - z, filter: z > 0 ? `blur(${10 * z}px)` : undefined }}>{children}</div>
    </AbsoluteFill>
  );
};

/** 声波：字母像一段声音一样上下起伏，起伏从左往右传过去，慢慢平息（Speak） */
export const Wave: React.FC<Base & { value: string; at: number; amp?: number }> = ({ value, at, amp = 0.3, size = 110, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <span style={{ display: "inline-flex", ...text(size, weight, color), ...style }}>
      {[...value].map((ch, i) => {
        const t = frame - at - i * 2;
        const a = prog(frame, at + i * 2, 10);
        const env = t > 0 ? Math.exp(-t / 46) : 0;
        const s = Math.sin(t / 5.2);
        return (
          <span key={`${ch}-${i}`} style={{ display: "inline-block", whiteSpace: "pre", opacity: a, transform: `translateY(${-amp * size * s * env}px) scaleY(${1 + 0.22 * s * env})` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// 每个字母在几种语言里的近亲写法（拉丁重音、西里尔、希腊），宽度和原字相近；没有的就不翻
const KIN: Record<string, string> = { T: "ŤТΤŢ", R: "ŘŔЯŖ", A: "ÁÄАΑÅ", N: "ÑŃΝŇ", S: "ŚŠЅŞ", L: "ĹŁĽĻ", E: "ÉËЕΕÈ", P: "РΡÞ", K: "ĶКΚ", C: "ÇČСĆ" };

/** 多语：每个字母先在几种文字之间翻，再从左往右依次落成自己（Translate） */
export const Polyglot: React.FC<Base & { value: string; at: number; step?: number }> = ({ value, at, step = 3, size = 110, weight = 600, color = COLOR.ink, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <span style={{ display: "inline-flex", ...text(size, weight, color), ...style }}>
      {[...value].map((ch, i) => {
        const show = at + i;
        const lock = at + 10 + i * step;
        if (frame < show) return <span key={`${ch}-${i}`} style={{ display: "inline-block", whiteSpace: "pre", opacity: 0 }}>{ch}</span>;
        const kin = KIN[ch];
        if (frame < lock && kin) {
          const g = [...kin][Math.floor(random(`pg-${i}-${Math.floor(frame / 3)}`) * [...kin].length)];
          return (
            // 翻动中的字占着原字的宽，免得整行抖
            <span key={`${ch}-${i}`} style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
              <span style={{ opacity: 0 }}>{ch}</span>
              <span style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", color: "oklch(0.55 0.15 265)", opacity: 0.9 }}>{g}</span>
            </span>
          );
        }
        const t = prog(frame, lock, 10);
        return (
          <span key={`${ch}-${i}`} style={{ display: "inline-block", whiteSpace: "pre", transform: `translateY(${-14 * (1 - t)}px)` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};
