import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { b, C, SF, ZH } from "../theme";

// 舞台：底、颗粒、字幕、镜头切换。全片共用一块底（放在 Video.tsx 最下层），场景之间只换上面的东西。

/** 砸下的几拍：底的光在这些拍上亮一下 */
const HITS = [48, 64, 112, 192, 228].map(b);

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

/**
 * 字幕：英文大写主角词 + 中文短句配角。at 起 8 帧推进来（从大、从虚到实），until 起 6 帧往上退。
 * 主角词按字母错开一点点进场，像被拍子一个个敲上去。
 */
export const Hero: React.FC<{
  at: number;
  until?: number;
  title: string;
  sub?: string;
  y?: number;
  size?: number;
  subSize?: number;
  color?: string;
  stagger?: number;
  /** 主角词一开始就在（同一个主角词跨好几个场景时，后面的场景用它，只有副标题重新进场） */
  instant?: boolean;
}> = ({ at, until = Number.POSITIVE_INFINITY, title, sub, y = 210, size: want = 150, subSize = 50, color = C.ink, stagger = 1.2, instant = false }) => {
  const f = useCurrentFrame();
  // 词太长时缩字号，保证一行放得下（SF Black 大写字母平均约 0.66 em 宽）
  const size = Math.min(want, 980 / (0.66 * [...title].length));
  if (f < at - 1 || f > until + 8) return null;
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  const chars = [...title];
  const subIn = interpolate(f, [at + 4, at + 14], [0, 1], { ...clamp, easing: outExpo });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        textAlign: "center",
        zIndex: 10,
        isolation: "isolate",
        opacity: 1 - out,
        transform: `translateY(${-40 * out}px)`,
        filter: out > 0 ? `blur(${8 * out}px)` : undefined,
      }}
    >
      {/* 字幕底下垫一层由深到透明的底，镜头推近时手机顶上来也压不住字 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: -y, height: y + size * 2.6, background: "linear-gradient(180deg, rgba(248,251,255,0.94) 0%, rgba(244,248,255,0.8) 62%, rgba(244,248,255,0) 100%)", zIndex: -1 }} />
      <div style={{ fontFamily: SF, fontWeight: 900, fontSize: size, letterSpacing: "-0.035em", lineHeight: 0.95, color, whiteSpace: "pre" }}>
        {chars.map((ch, i) => {
          const p = instant ? 1 : interpolate(f, [at + i * stagger, at + i * stagger + 9], [0, 1], { ...clamp, easing: outExpo });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: p,
                transform: `translateY(${(1 - p) * 0.45 * size}px) scale(${1 + 0.35 * (1 - p)})`,
                filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
              }}
            >
              {ch === " " ? " " : ch}
            </span>
          );
        })}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 0.26 * size,
            fontFamily: ZH,
            fontWeight: 600,
            fontSize: subSize,
            letterSpacing: "0.08em",
            color: C.ink2,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 18}px)`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

/** 画面里的一行小注（手势叫什么、原版怎么操作）：浅色胶囊，不抢主角词 */
export const Note: React.FC<{ at: number; until?: number; text: string; y: number; dim?: boolean }> = ({ at, until = Infinity, text, y, dim = false }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: outExpo });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  if (p <= 0 || out >= 1) return null;
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", zIndex: 11, opacity: p * (1 - out), transform: `translateY(${(1 - p) * 12}px)` }}>
      <span
        style={{
          display: "inline-block",
          padding: "10px 26px",
          borderRadius: 30,
          background: dim ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.9)",
          border: "1.5px solid rgba(20,40,90,0.08)",
          boxShadow: "0 8px 24px rgba(20,40,90,0.1)",
          fontFamily: ZH,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: dim ? C.ink3 : C.ink2,
        }}
      >
        {text}
      </span>
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

/** 手机的默认机位：画面下方，上面留给字幕 */
export const HOME = { x: 540, y: 1228, s: 1.27 } as const;
