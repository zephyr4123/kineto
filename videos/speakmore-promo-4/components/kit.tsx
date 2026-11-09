import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { BARS as SEAL_BARS } from "../../../engine/speakmore/Seal";
import { NUM, SANS, TONE, type Tone, ZH } from "../theme";

// 这支片子共用的零件：卡片的底、文字的进场、数字滚动、截图运镜（含光标和打字遮罩）。

const inOut = Easing.inOut(Easing.cubic);

/**
 * 卡片的底，从下往上四层：
 * 1. 同色相一深一浅的斜向渐变，上面三团光慢慢漂（主光、同色系偏深的一团、邻近色压得很淡的一团），四角压暗；
 * 2. 图标的五道声纹放大到将近一屏高、整组立在一侧，颜色只比底亮一点，带长长的柔影，五道各自缓缓起伏，像一段很慢的声音；
 * 3. 每十秒左右从左往右扫过一道很淡的光。
 * side 是声纹放在哪一边：放在截图那一侧，被截图压住一部分，露出来的边缘给画面纵深，不和字抢；
 * 落版那种居中的卡用 center，声纹淡一点、正好在图标后面，像图标的一道大影子。
 */
export const Backdrop: React.FC<{ tone: Tone; side?: "left" | "right" | "center" }> = ({ tone, side = "right" }) => {
  const frame = useCurrentFrame();
  const t = TONE[tone];
  const wave = (period: number, amp: number, phase: number) => amp * Math.sin(frame / period + phase);
  const blobs = [
    { c: t.glow, x: 24 + wave(260, 7, 0), y: 14 + wave(330, 5, 1.6), w: 70, h: 80 },
    { c: t.mesh[0], x: 80 + wave(300, 8, 2), y: 84 + wave(240, 6, 0.5), w: 80, h: 75 },
    { c: t.mesh[1], x: 62 + wave(380, 10, 4), y: 26 + wave(290, 7, 3), w: 50, h: 55 },
  ];
  // 光带：每 640 帧扫过一次，扫过的那一段只占三分之一，其余时间不在画面里
  const sweep = ((frame + 200) % 640) / 640;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            ...blobs.map((g) => `radial-gradient(ellipse ${g.w}% ${g.h}% at ${g.x}% ${g.y}%, ${g.c}, transparent 70%)`),
            `radial-gradient(ellipse 120% 120% at 50% 45%, transparent 55%, oklch(0 0 0 / 0.16) 100%)`,
            `linear-gradient(155deg, ${t.from}, ${t.to})`,
          ].join(", "),
        }}
      />
      <svg
        viewBox="180 170 660 690"
        width={900}
        height={940}
        style={{
          position: "absolute",
          top: 70 + wave(420, 12, 0.8),
          ...(side === "center" ? { left: (1920 - 900) / 2, opacity: 0.6 } : { [side]: 40 }),
          filter: `drop-shadow(0 40px 50px ${t.barShadow})`,
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient id={`bar-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.bar} />
            <stop offset="1" stopColor={t.bar} stopOpacity={0.25} />
          </linearGradient>
        </defs>
        {SEAL_BARS.map((bar, i) => (
          <polygon
            key={bar.points}
            points={bar.points}
            fill={`url(#bar-${tone})`}
            style={{ transformBox: "fill-box", transformOrigin: "center", transform: `scaleY(${1 + 0.07 * Math.sin(frame / 48 + i * 1.15)})` }}
          />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${t.sheen} 50%, transparent 60%)`,
          backgroundSize: "300% 100%",
          backgroundPosition: `${interpolate(sweep, [0, 0.34], [100, 0], clamp)}% 0`,
          mixBlendMode: "soft-light",
          opacity: interpolate(sweep, [0, 0.04, 0.3, 0.34], [0, 1, 1, 0], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** 整支片子最上面一层细颗粒：四种底用同一层，质感统一 */
export const Grain: React.FC = () => (
  <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none" }} />
);

/**
 * 转场：新卡片从五道竖条里升上来。五道的顶照着 App 图标五道刻痕的斜口画，中间那道最先，两边依次跟上，
 * 两拍（LAND 帧）之内铺满。local 是这张卡自己的帧（0 起升）；铺满后不再裁切。
 */
const CROWNS = [
  // 每道顶上的折线：[x 占这一列的比例, y 相对最高点往下多少，按列宽算]
  [
    [0, 0.43],
    [1, 0],
  ],
  [
    [0, 0.4],
    [0.84, 0],
    [1, 0.47],
  ],
  [
    [0, 0.41],
    [0.6, 0],
    [1, 0.5],
  ],
  [
    [0, 0.37],
    [0.83, 0],
    [1, 0.21],
  ],
  [
    [0, 0],
    [1, 0.4],
  ],
] as const;
const ORDER_DELAY = [16, 8, 0, 8, 16];
export const skyline = (local: number, land: number, w: number, h: number) => {
  const col = w / 5;
  const rise = land - 16;
  const pts: string[] = [`0px ${h}px`];
  CROWNS.forEach((crown, i) => {
    const p = interpolate(local, [ORDER_DELAY[i], ORDER_DELAY[i] + rise], [0, 1], { ...clamp, easing: inOut });
    // 斜口按图标的比例缩到三分之一：看得出是那五道刻痕，又不至于像碎片
    const top = h + 40 - p * (h + 40 + col * 0.25);
    for (const [fx, fy] of crown) pts.push(`${(i + fx) * col}px ${top + fy * col * 0.35}px`);
  });
  pts.push(`${w}px ${h}px`);
  return `polygon(${pts.join(", ")})`;
};

/** 一行字从看不见的下沿滑上来（遮罩出字，不缩放、不虚化） */
export const Line: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dur?: number;
}> = ({ at, children, style, dur = 40 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: outExpo });
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em", ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: Math.min(1, p * 1.6) }}>{children}</div>
    </div>
  );
};

/** 卡片标题：得意黑 */
export const Head: React.FC<{ at: number; text: string; color: string; size?: number; style?: React.CSSProperties }> = ({
  at,
  text,
  color,
  size = 136,
  style,
}) => (
  <Line at={at} style={style}>
    <div style={{ fontFamily: ZH, fontSize: size, lineHeight: 1.05, color, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{text}</div>
  </Line>
);

/** 卡片的副行：思源黑体，中等字重，字距放开一点 */
export const Sub: React.FC<{ at: number; text: string; color: string; size?: number; style?: React.CSSProperties }> = ({
  at,
  text,
  color,
  size = 32,
  style,
}) => (
  <Line at={at} style={style}>
    <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: size, lineHeight: 1.5, color, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{text}</div>
  </Line>
);

/** 大数字：窄体特粗，从 0 滚到 value，先快后慢 */
export const Count: React.FC<{
  at: number;
  value: number;
  decimals?: number;
  dur?: number;
  size: number;
  color: string;
  prefix?: string;
}> = ({ at, value, decimals = 0, dur = 90, size, color, prefix = "" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const shown = (value * p).toFixed(decimals);
  return (
    <Line at={at} dur={30}>
      <div
        style={{
          fontFamily: NUM,
          fontWeight: 800,
          fontVariationSettings: '"wdth" 75, "opsz" 96',
          fontSize: size,
          lineHeight: 0.86,
          letterSpacing: "-0.012em",
          color,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {prefix}
        {shown}
      </div>
    </Line>
  );
};

// ———— 截图运镜 ————

/** 运镜关键帧：f 帧时，图上 (x, y)（原图像素）落在框的正中，原图 1 像素 = s 屏幕像素 */
export type Key = { f: number; x: number; y: number; s: number };

const sampleCam = (keys: readonly Key[], frame: number) => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const z = keys[i];
    if (frame <= z.f) {
      const t = inOut((frame - a.f) / Math.max(1, z.f - a.f));
      // 缩放按对数插值，推近和拉远的速度看起来才均匀
      const s = Math.exp(Math.log(a.s) + (Math.log(z.s) - Math.log(a.s)) * t);
      return { f: frame, x: a.x + (z.x - a.x) * t, y: a.y + (z.y - a.y) * t, s };
    }
  }
  return keys[keys.length - 1];
};

/**
 * 打字遮罩：盖在原图的一行字上，按时间从左往右退开，像字被写出来；caret 时在写到的位置放一根光标。
 * step 给了就按这个宽度一格一格退（一个字一格，像边说边认出来的字）；fade 时不退，整块淡掉（像整段粘贴进来）。
 */
export type Typing = { x: number; y: number; w: number; h: number; at: number; dur: number; color: string; caret?: string; step?: number; fade?: boolean };

/** 光标：arrow 是箭头，ibeam 是文字光标；keys 是原图上的位置，clicks 是按下的帧 */
export type Pointer = { kind: "arrow" | "ibeam"; keys: readonly { f: number; x: number; y: number }[]; clicks?: readonly number[]; show: readonly [number, number] };

const samplePointer = (keys: Pointer["keys"], frame: number) => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const z = keys[i];
    if (frame <= z.f) {
      const t = Easing.bezier(0.45, 0, 0.2, 1)((frame - a.f) / Math.max(1, z.f - a.f));
      return { f: frame, x: a.x + (z.x - a.x) * t, y: a.y + (z.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
};

const ARROW = "M2 2 L2 30.5 L9.2 23.8 L13.8 34.6 L18.4 32.6 L13.9 22.2 L23.4 22.2 Z";

const PointerView: React.FC<{ p: Pointer; frame: number; toScreen: (x: number, y: number) => [number, number] }> = ({ p, frame, toScreen }) => {
  const vis = interpolate(frame, [p.show[0], p.show[0] + 12, p.show[1] - 12, p.show[1]], [0, 1, 1, 0], clamp);
  if (vis <= 0) return null;
  const at = samplePointer(p.keys, frame);
  const [sx, sy] = toScreen(at.x, at.y);
  const press = Math.max(0, ...(p.clicks ?? []).map((c) => (frame >= c && frame < c + 14 ? Math.sin(((frame - c) / 14) * Math.PI) : 0)));
  const rings = (p.clicks ?? []).filter((c) => frame >= c && frame < c + 30);
  return (
    <>
      {rings.map((c) => {
        const t = (frame - c) / 30;
        const r = 18 + 44 * Easing.out(Easing.cubic)(t);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: sx - r,
              top: sy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: "3px solid oklch(1 0 0 / 0.9)",
              boxShadow: "0 0 0 1px oklch(0 0 0 / 0.08)",
              opacity: (1 - t) * vis,
            }}
          />
        );
      })}
      {p.kind === "arrow" ? (
        <svg
          viewBox="0 0 28 40"
          width={50}
          style={{
            position: "absolute",
            left: sx - 3.6,
            top: sy - 3.6,
            opacity: vis,
            transformOrigin: "4px 4px",
            transform: `scale(${1 - 0.12 * press})`,
            filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 0.32))",
            overflow: "visible",
          }}
        >
          <path d={ARROW} fill="#fff" stroke="#111" strokeWidth={1.8} strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 34" width={26} style={{ position: "absolute", left: sx - 13, top: sy - 28, opacity: vis, overflow: "visible", filter: "drop-shadow(0 4px 8px oklch(0 0 0 / 0.35))" }}>
          <path d="M3 2 H6.5 Q8 2 8 4 Q8 2 9.5 2 H13 M8 4 V30 M3 32 H6.5 Q8 32 8 30 Q8 32 9.5 32 H13" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <path d="M3 2 H6.5 Q8 2 8 4 Q8 2 9.5 2 H13 M8 4 V30 M3 32 H6.5 Q8 32 8 30 Q8 32 9.5 32 H13" fill="none" stroke="#111" strokeWidth={2} strokeLinecap="round" />
        </svg>
      )}
    </>
  );
};

/**
 * 一块"屏幕"：固定在画面上的圆角框，里面的截图按关键帧推近、平移（Screen Studio 那种运镜）。
 * 截图原尺寸 w×h（像素）；bg 是框里截图以外的底色；typing 是打字遮罩，pointer 是光标，overlay 是盖在图上的元素（跟着图一起推），都用原图坐标。
 */
export const Screen: React.FC<{
  src: string;
  w: number;
  h: number;
  box: { x: number; y: number; w: number; h: number; r?: number };
  keys: readonly Key[];
  bg?: string;
  typing?: readonly Typing[];
  pointer?: Pointer;
  frame?: number;
  style?: React.CSSProperties;
  shadow?: boolean;
  overlay?: React.ReactNode;
}> = ({ src, w, h, box, keys, bg = "transparent", typing = [], pointer, frame: frameProp, style, shadow = true, overlay }) => {
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const cam = sampleCam(keys, frame);
  const left = box.w / 2 - cam.x * cam.s;
  const top = box.h / 2 - cam.y * cam.s;
  const toScreen = (x: number, y: number): [number, number] => [left + x * cam.s, top + y * cam.s];
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: box.r ?? 22,
        overflow: "hidden",
        background: bg,
        boxShadow: shadow ? "0 46px 90px -40px oklch(0.15 0.03 260 / 0.55), 0 16px 34px -18px oklch(0.15 0.03 260 / 0.4)" : undefined,
        ...style,
      }}
    >
      <div style={{ position: "absolute", left, top, width: w, height: h, transformOrigin: "0 0", transform: `scale(${cam.s})` }}>
        <Img src={staticFile(src)} style={{ width: w, height: h, display: "block" }} />
        {typing.map((m) => {
          const p = interpolate(frame, [m.at, m.at + m.dur], [0, 1], clamp);
          if (m.fade) return <div key={`${m.x}-${m.y}`} style={{ position: "absolute", left: m.x, top: m.y, width: m.w, height: m.h, background: m.color, opacity: 1 - p }} />;
          const shown = m.step && p < 1 ? Math.floor((m.w * p) / m.step) * m.step : m.w * p;
          const caretOn = m.caret !== undefined && frame >= m.at - 20 && Math.floor((frame - m.at) / 16) % 2 === 0;
          return (
            <div key={`${m.x}-${m.y}`}>
              <div style={{ position: "absolute", left: m.x + shown, top: m.y, width: m.w - shown + 4, height: m.h, background: m.color }} />
              {caretOn && p < 1 ? <div style={{ position: "absolute", left: m.x + shown + 2, top: m.y + m.h * 0.12, width: 4, height: m.h * 0.76, background: m.caret }} /> : null}
            </div>
          );
        })}
        {overlay}
      </div>
      {pointer ? <PointerView p={pointer} frame={frame} toScreen={toScreen} /> : null}
    </div>
  );
};

/** 秒换帧（相对于卡片铺满的那一刻） */
export const sec = (s: number) => Math.round(s * 60);
