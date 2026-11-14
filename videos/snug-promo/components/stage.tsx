import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { b, C, SF, ZH } from "../theme";

// 舞台：底、颗粒、字幕、镜头切换。全片共用一块底（放在 Video.tsx 最下层），场景之间只换上面的东西。

/** 砸下的几拍：底的光在这些拍上亮一下 */
const HITS = [12, 48, 60, 88, 120, 140, 156].map(b);

/**
 * 底（浅色，取 Snug 图标的白、青、蓝），从下往上：
 * 1. 带一点蓝的白，上亮下略深的斜向渐变；
 * 2. 三团慢慢漂的柔光：青、蓝、一点淡紫，砸下的拍上亮一下；
 * 3. 图标里的两个形状放大成两块半透明的「玻璃」：一台显示器、一块手机屏，各自缓慢漂移，叠在一起的地方自然叠出更深的蓝；
 * 4. 很淡的网格（往下缓缓流动），中间清楚、四周淡出；
 * 5. 每隔一阵从左上往右下扫过一道很淡的光；四角压一点点蓝灰。
 * 光和形状的位置随时间连续变化，场景硬切时底不跳。
 */
export const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const hit = HITS.reduce((acc, at) => acc + (f >= at ? Math.exp(-(f - at) / 24) : 0), 0);
  const ax = 22 + 16 * Math.sin(f / 170);
  const ay = 24 + 10 * Math.cos(f / 210);
  const bx = 78 + 12 * Math.cos(f / 190);
  const by = 70 + 12 * Math.sin(f / 150);
  const cx = 55 + 20 * Math.sin(f / 260 + 1);
  const cy = 46 + 14 * Math.cos(f / 230);
  const sweep = ((f % 540) / 540) * 2.4 - 0.7;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${C.bg1} 0%, #f1f6fe 42%, ${C.bg0} 100%)`, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 26% at ${ax}% ${ay}%, rgba(0,214,255,${0.34 + 0.14 * hit}) 0%, transparent 70%),
            radial-gradient(46% 30% at ${bx}% ${by}%, rgba(31,99,255,${0.26 + 0.12 * hit}) 0%, transparent 72%),
            radial-gradient(38% 24% at ${cx}% ${cy}%, rgba(160,150,255,0.22) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      {/* 图标里的显示器 */}
      <div
        style={{
          position: "absolute",
          left: -150 + 40 * Math.sin(f / 320),
          top: 280 + 30 * Math.cos(f / 280),
          width: 980,
          height: 640,
          borderRadius: 130,
          background: "linear-gradient(135deg, rgba(0,229,255,0.2) 0%, rgba(16,200,248,0.07) 100%)",
          border: "2px solid rgba(255,255,255,0.75)",
          boxShadow: "inset 0 0 80px rgba(255,255,255,0.35)",
          transform: `rotate(${-6 + 2 * Math.sin(f / 400)}deg) scale(${1 + 0.015 * hit})`,
        }}
      />
      {/* 图标里的手机屏 */}
      <div
        style={{
          position: "absolute",
          left: 600 + 36 * Math.cos(f / 300),
          top: 820 + 40 * Math.sin(f / 340),
          width: 560,
          height: 820,
          borderRadius: 100,
          background: "linear-gradient(160deg, rgba(10,122,255,0.2) 0%, rgba(0,80,224,0.06) 100%)",
          border: "2px solid rgba(255,255,255,0.7)",
          boxShadow: "inset 0 0 70px rgba(255,255,255,0.3)",
          transform: `rotate(${8 + 2 * Math.cos(f / 380)}deg) scale(${1 + 0.015 * hit})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(rgba(31,99,255,0.06) 1.5px, transparent 1.5px) 0 ${(f * 0.4) % 72}px / 72px 72px, linear-gradient(90deg, rgba(31,99,255,0.06) 1.5px, transparent 1.5px) 0 0 / 72px 72px`,
          maskImage: "radial-gradient(75% 60% at 50% 50%, black 0%, transparent 90%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(120deg, transparent ${(sweep - 0.12) * 100}%, rgba(255,255,255,0.55) ${sweep * 100}%, transparent ${(sweep + 0.12) * 100}%)`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(95% 75% at 50% 48%, transparent 60%, rgba(90,120,180,0.16) 100%)" }} />
    </AbsoluteFill>
  );
};

/** 胶片颗粒：每两帧换一次种子，铺在最上层，盖住渐变的色阶。直接用内联 SVG 滤镜画，不走背景图（渲染时背景图可能还没解码） */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 97;
  return (
    <AbsoluteFill style={{ opacity: 0.1, mixBlendMode: "soft-light", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** 估一行字的宽度（em）：中文一个字 1 em，英文数字约 0.58 em，空格和「·」约 0.32 em */
const emWidth = (text: string, track: number) =>
  [...text].reduce((w, ch) => w + (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 1 : ch === " " || ch === "·" ? 0.32 : 0.58) + track, 0);

const KICKER_SIZE = 40;
/** 英文小标占的高度（字 + 和主标题的间距），单独放小标时用来对齐主标题 */
export const KICKER_H = Math.round(KICKER_SIZE * 1.3 + 14);

/** 英文小标：一行字距拉开的大写字母，标明这一段是什么。at 起落下来，until 起退掉 */
export const Kicker: React.FC<{ at: number; until?: number; text: string; y: number }> = ({ at, until = Number.POSITIVE_INFINITY, text, y }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: outExpo });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  if (p <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        textAlign: "center",
        zIndex: 11,
        fontFamily: SF,
        fontWeight: 800,
        fontSize: KICKER_SIZE,
        lineHeight: 1.3,
        letterSpacing: "0.2em",
        color: C.deep,
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * -12 - 20 * out}px)`,
      }}
    >
      {text}
    </div>
  );
};

/**
 * 字幕：中文主标题是主角（大字、深色），上面一行英文小标，下面可选一行中文副标题。
 * at 起进场：小标落下，主标题一个字一个字从下面顶上来（从虚到实），副标题跟着浮上来；until 起 6 帧往上退。
 * 字幕底下垫一层由浅到透明的底，镜头推近时手机顶上来也压不住字，字和底的对比度保持在 4.5:1 以上。
 */
export const Headline: React.FC<{
  at: number;
  until?: number;
  title: string;
  kicker?: string;
  sub?: string;
  /** 整块字幕的顶 */
  y?: number;
  size?: number;
  subSize?: number;
  backing?: boolean;
}> = ({ at, until = Number.POSITIVE_INFINITY, title, kicker, sub, y = 150, size: want = 116, subSize = 52, backing = true }) => {
  const f = useCurrentFrame();
  const size = Math.min(want, 980 / emWidth(title, 0.02));
  if (f < at - 1 || f > until + 8) return null;
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  const subIn = interpolate(f, [at + 6, at + 16], [0, 1], { ...clamp, easing: outExpo });
  const titleTop = kicker ? KICKER_H : 0;
  const height = titleTop + size * 1.2 + (sub ? 16 + subSize * 1.3 : 0);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, zIndex: 10, isolation: "isolate", opacity: 1 - out, transform: `translateY(${-30 * out}px)`, filter: out > 0 ? `blur(${8 * out}px)` : undefined }}>
      {backing ? <div style={{ position: "absolute", left: 0, right: 0, top: -y, height: y + height + 150, background: "linear-gradient(180deg, rgba(248,251,255,0.95) 0%, rgba(244,248,255,0.86) 66%, rgba(244,248,255,0) 100%)", zIndex: -1 }} /> : null}
      {kicker ? <Kicker at={at} text={kicker} y={0} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: titleTop, textAlign: "center", fontFamily: ZH, fontWeight: 600, fontSize: size, lineHeight: 1.2, letterSpacing: "0.02em", color: C.ink, whiteSpace: "pre" }}>
        {[...title].map((ch, i) => {
          const p = interpolate(f, [at + 2 + i * 1.6, at + 12 + i * 1.6], [0, 1], { ...clamp, easing: outExpo });
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 0.5 * size}px) scale(${1 + 0.25 * (1 - p)})`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>
              {ch}
            </span>
          );
        })}
      </div>
      {sub ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: titleTop + size * 1.2 + 16, textAlign: "center", fontFamily: ZH, fontWeight: 600, fontSize: subSize, lineHeight: 1.3, letterSpacing: "0.06em", color: C.ink2, opacity: subIn, transform: `translateY(${(1 - subIn) * 18}px)` }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

/**
 * 镜头切换：场景开头 8 帧从放大、发虚推进来，结尾 6 帧往里一缩、变虚退掉（快推入、切出）。
 * cut=false 的场景首尾和相邻场景的画面接得上，直接硬切，不加这层。
 */
export const Shot: React.FC<{ frames: number; enter?: boolean; exit?: boolean; children: React.ReactNode }> = ({
  frames,
  enter = true,
  exit = true,
  children,
}) => {
  const f = useCurrentFrame();
  const i = enter ? interpolate(f, [0, 8], [0, 1], { ...clamp, easing: outExpo }) : 1;
  const o = exit ? interpolate(f, [frames - 6, frames], [0, 1], clamp) : 0;
  const scale = (1 + 0.14 * (1 - i)) * (1 - 0.08 * o);
  const blur = 14 * (1 - i) + 12 * o;
  return (
    <AbsoluteFill style={{ opacity: Math.min(i * 1.6, 1) * (1 - o), transform: `scale(${scale})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

/** 两段砸下里每小节的第一拍：整个画面往前顶一下（很轻），跟着音乐的重拍走 */
const DROPS = [
  [48, 112],
  [120, 156],
] as const;
const BARS = DROPS.flatMap(([from, to]) => Array.from({ length: (to - from) / 4 }, (_, i) => b(from + 4 * i)));
export const Pulse: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const last = BARS.filter((t) => t <= f).pop();
  const k = last === undefined ? 0 : Math.exp(-(f - last) / 9);
  return <AbsoluteFill style={{ transform: k > 0.01 ? `scale(${1 + 0.014 * k})` : undefined }}>{children}</AbsoluteFill>;
};

/** 手机的默认机位：画面下方，上面留给字幕 */
export const HOME = { x: 540, y: 1228, s: 1.27 } as const;
