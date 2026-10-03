import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Clawd } from "../components/Clawd";
import { CitySkyline, RAINBOW, RainbowTrail } from "../components/Flight";
import { Burst, Shockwave, Twinkle } from "../components/Particles";
import { PixelText } from "../components/PixelText";
import { Crt } from "../components/Retro";
import { Cues } from "../components/Sfx";
import { Sprite } from "../components/Sprite";
import { Sky } from "../components/World";
import { blinking, clamp, easeInOut, easeOut, jumpArc, landSquash, shake, tween, typed } from "../fx";
import { LOGO, nibOffsets, NIB, pointAt, toPath, type Stroke } from "../logo";
import { CLAWD, CREAM, FONT_BODY, FONT_MONO } from "../theme";

// 落名：一支羽毛笔从夜空里飞进来，行书一笔连写出 kineto，回头补上 t 的横；
// 笔尖点向 i 的上方，Clawd 拖着彩虹从城市里冲上来，落在那儿当点。墨迹一闪变成实心立体字。
const FLY_IN = [0, 36] as const;
const WRITE = [36, 250] as const;
const TO_CROSS = [250, 262] as const;
const CROSS = [262, 280] as const;
const TO_DOT = [280, 298] as const;
const CLAWD_UP = [292, 316] as const;
const FLY_OUT = [312, 344] as const;
export const SOLID_AT = 322;
const TAGLINE_AT = 344;
export const TAGLINE = "Give your agent a path.";
export const SUBLINE = "an agent-first video studio · built on Remotion";

const S = 6;
const writeEase = Easing.inOut(Easing.sin);

const writeProgress = (f: number) => tween(f, WRITE, [0, 1], writeEase);
const crossProgress = (f: number) => tween(f, CROSS, [0, 1], Easing.inOut(Easing.quad));

// 笔尖在哪、朝哪写、是否正在出墨
function nibAt(f: number): { x: number; y: number; angle: number; inking: boolean } {
  const main = LOGO.main;
  const start = main.points[0];
  if (f < FLY_IN[1]) {
    const p = easeOut(tween(f, FLY_IN, [0, 1]));
    return { x: interpolate(p, [0, 1], [2100, start.x]), y: interpolate(p, [0, 1], [-160, start.y]) - jumpArc(p, 1, 120), angle: Math.PI, inking: false };
  }
  if (f < WRITE[1]) return { ...pointAt(main, writeProgress(f) * main.length), inking: true };
  const end = main.points[main.points.length - 1];
  const crossStart = LOGO.cross.points[0];
  if (f < TO_CROSS[1]) {
    const p = tween(f, TO_CROSS, [0, 1], easeInOut);
    return { x: interpolate(p, [0, 1], [end.x, crossStart.x]), y: interpolate(p, [0, 1], [end.y, crossStart.y]) - jumpArc(p, 1, 90), angle: Math.PI, inking: false };
  }
  if (f < CROSS[1]) return { ...pointAt(LOGO.cross, crossProgress(f) * LOGO.cross.length), inking: true };
  const crossEnd = LOGO.cross.points[LOGO.cross.points.length - 1];
  const hover = { x: LOGO.iDot.x + 40, y: LOGO.iDot.y - 40 };
  if (f < FLY_OUT[0]) {
    const p = tween(f, TO_DOT, [0, 1], easeInOut);
    const tap = f >= TO_DOT[1] && f < TO_DOT[1] + 10 ? 12 * Math.sin(((f - TO_DOT[1]) / 10) * Math.PI) : 0;
    return { x: interpolate(p, [0, 1], [crossEnd.x, hover.x]), y: interpolate(p, [0, 1], [crossEnd.y, hover.y]) - jumpArc(p, 1, 80) + tap, angle: Math.PI, inking: false };
  }
  const p = tween(f, FLY_OUT, [0, 1], Easing.in(Easing.cubic));
  return { x: interpolate(p, [0, 1], [hover.x, 2150]), y: interpolate(p, [0, 1], [hover.y, -220]), angle: Math.PI, inking: false };
}

// 一笔墨迹：同一条路径沿笔尖方向平移叠起来，按进度从头露到尾
const Ink: React.FC<{ stroke: Stroke; progress: number; color: string; dx?: number; dy?: number }> = ({ stroke, progress, color, dx = 0, dy = 0 }) => {
  const d = useMemo(() => toPath(stroke.points), [stroke]);
  if (progress <= 0) return null;
  const len = stroke.length + 2;
  return (
    <g transform={`translate(${dx} ${dy})`}>
      {nibOffsets.map((o, i) => (
        <path
          key={i}
          d={d}
          transform={`translate(${o.dx} ${o.dy})`}
          fill="none"
          stroke={color}
          strokeWidth={NIB.line}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - progress)}
        />
      ))}
    </g>
  );
};

// 字：书写时是发着金光的墨，solid 之后是奶油色实心字 + 橙色立体投影
export const LogoArt: React.FC<{ main: number; cross: number; solid: number }> = ({ main, cross, solid }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {solid > 0
      ? [
          { dx: 14, dy: 18, color: "#5a2618" },
          { dx: 7, dy: 9, color: CLAWD },
        ].map((layer, i) => (
          <g key={i} opacity={solid}>
            <Ink stroke={LOGO.main} progress={main} color={layer.color} dx={layer.dx} dy={layer.dy} />
            <Ink stroke={LOGO.cross} progress={cross} color={layer.color} dx={layer.dx} dy={layer.dy} />
          </g>
        ))
      : null}
    <g style={{ filter: solid < 1 ? `drop-shadow(0 0 ${14 * (1 - solid)}px rgba(255,196,110,0.9))` : undefined }}>
      <Ink stroke={LOGO.main} progress={main} color={solid > 0 ? CREAM : "#fff2cf"} />
      <Ink stroke={LOGO.cross} progress={cross} color={solid > 0 ? CREAM : "#fff2cf"} />
    </g>
  </svg>
);

// 像素羽毛笔：笔尖朝下，羽片一侧宽一侧窄，中间一根羽轴，下端是笔杆和墨色笔尖
const QUILL = (() => {
  const W = 15;
  const rows: string[] = [];
  for (let y = 0; y < 46; y++) {
    const row = Array<string>(W).fill(".");
    if (y < 33) {
      const t = y / 33;
      const right = Math.round(Math.sin(Math.PI * Math.min(1, t * 1.15)) * 6.2);
      const left = Math.round(Math.sin(Math.PI * Math.min(1, t * 1.05)) * 4.2);
      for (let x = 7 - left; x <= 7 + right; x++) row[x] = (x + y) % 4 === 0 ? "b" : "w";
      if (7 - left >= 0) row[7 - left] = "e";
      if (7 + right < W) row[7 + right] = "e";
      if (y > 0) row[7] = "r";
    } else if (y < 41) {
      row[7] = "r";
      row[8] = y < 38 ? "r" : ".";
    } else {
      row[7] = "k";
      if (y < 44) row[8] = "k";
    }
    rows.push(row.join(""));
  }
  return rows;
})();
const QUILL_PAL = { w: "#f6f1ff", b: "#c9d6ff", e: "#8fa3e6", r: "#d9c9a8", k: "#1b1426" };
const QS = 5;

const Quill: React.FC<{ x: number; y: number; tilt: number; frame: number }> = ({ x, y, tilt, frame }) => {
  const tipX = 7.5 * QS;
  const tipY = 46 * QS;
  return (
    <div style={{ position: "absolute", left: x - tipX, top: y - tipY, transformOrigin: `${tipX}px ${tipY}px`, transform: `rotate(${tilt + Math.sin(frame / 9) * 2}deg)` }}>
      <div style={{ position: "absolute", left: -30, top: -30, width: 15 * QS + 60, height: 46 * QS + 60, background: "radial-gradient(ellipse, rgba(255,226,170,0.35), rgba(255,226,170,0) 65%)" }} />
      <Sprite grid={QUILL} palette={QUILL_PAL} scale={QS} />
    </div>
  );
};

// 夜空里的星星
export const Stars: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => (
  <AbsoluteFill style={{ opacity }}>
    {Array.from({ length: 90 }, (_, i) => {
      const s = random(`star-s-${i}`) > 0.85 ? 8 : 4;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / (14 + 10 * random(`star-t-${i}`)) + i));
      return <div key={i} style={{ position: "absolute", left: random(`star-x-${i}`) * 1920, top: random(`star-y-${i}`) * 760, width: s, height: s, backgroundColor: "#fff6d8", opacity: tw }} />;
    })}
  </AbsoluteFill>
);

export const NightSky: React.FC<{ frame: number; camY: number; cityCamY: number }> = ({ frame, camY, cityCamY }) => (
  <>
    <Sky camX={9000} camY={camY} frame={frame} mood={0} sunset={1} sunY={2000} clouds={0.3} />
    <Stars frame={frame} opacity={tween(-camY, [900, 2200], [0, 1])} />
    <CitySkyline camX={11000} camY={cityCamY} opacity={1} frame={frame} />
  </>
);

const CUES = [
  [FLY_IN[0], "whoosh", 0.7],
  [WRITE[0], "sparkle", 0.7],
  [TO_CROSS[0], "whoosh", 0.4],
  [CROSS[0], "sparkle", 0.6],
  [TO_DOT[1], "pop", 0.6],
  [CLAWD_UP[0], "launch"],
  [CLAWD_UP[1], "pop"],
  [FLY_OUT[0], "whoosh", 0.5],
  [SOLID_AT, "hit"],
  ...Array.from(TAGLINE, (_, i) => i)
    .filter((i) => i % 2 === 0)
    .map((i) => [TAGLINE_AT + i * 2, "key", 0.35] as const),
] as const;

export const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const camY = interpolate(f, [0, 70], [-700, -2600], { ...clamp, easing: easeInOut });
  const cityCamY = interpolate(f, [0, 70], [-500, -2400], { ...clamp, easing: easeInOut });
  const nib = nibAt(f);
  const solid = tween(f, [SOLID_AT, SOLID_AT + 6], [0, 1]);
  const s = shake(f, SOLID_AT, 18, 16, "solid");
  const pop = solid > 0 ? 1 + 0.06 * Math.exp(-(f - SOLID_AT) / 8) * Math.cos((f - SOLID_AT) / 3) : 1;
  // 写字时笔杆随书写方向轻轻摆：往右写略直、往回勾略斜
  const tilt = 30 + (nib.inking ? 8 * Math.sin(nib.angle) : -10);

  // Clawd 从城市里冲上来当 i 的点
  const riseAt = (t: number) => interpolate(tween(t, CLAWD_UP, [0, 1], Easing.out(Easing.quad)), [0, 1], [1260, LOGO.iDot.y + 30]);
  const dot = { x: LOGO.iDot.x, y: LOGO.iDot.y + 30 };
  const rising = f >= CLAWD_UP[0] && f < CLAWD_UP[1];
  const landed = f >= CLAWD_UP[1];
  const clawdTrail: { x: number; y: number }[] = [];
  if (rising) for (let k = 0; k < 14; k++) clawdTrail.push({ x: dot.x, y: riseAt(f - k) - 30 });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightSky frame={f} camY={camY} cityCamY={cityCamY} />
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) scale(${pop})`, transformOrigin: "960px 470px" }}>
        <LogoArt main={writeProgress(f)} cross={crossProgress(f)} solid={solid} />
        {/* 笔尖的金色火星 */}
        {nib.inking
          ? [0, 1, 2].map((k) => {
              const at = f - ((f + k * 3) % 9);
              return <Twinkle key={k} x={nib.x + (random(`nib-${at}-${k}`) - 0.5) * 30} y={nib.y + (random(`nibY-${at}-${k}`) - 0.5) * 30} frame={f} start={at} life={12} size={6} color={k % 2 ? "#ffd24a" : "#fff6d8"} />;
            })
          : null}
        {rising ? <RainbowTrail points={clawdTrail} band={7} /> : null}
        {f >= CLAWD_UP[0] ? (
          <Clawd
            x={dot.x}
            y={rising ? riseAt(f) : dot.y}
            scale={S}
            pose={{ eyes: landed ? (blinking(f, 30) ? "closed" : "center") : "wide", arms: landed && f >= CLAWD_UP[1] + 40 ? "side" : "up", legs: landed ? "stand" : "tuck" }}
            squash={landSquash(f, CLAWD_UP[1])}
          />
        ) : null}
        {f < FLY_OUT[1] ? <Quill x={nib.x} y={nib.y} tilt={tilt} frame={f} /> : null}
        <Shockwave x={960} y={470} frame={f} start={SOLID_AT} life={30} maxSize={2200} color={CREAM} thickness={24} />
        <Burst frame={f} start={SOLID_AT} x={960} y={470} seed="solid" colors={[...RAINBOW, CREAM]} count={60} speed={[10, 30]} angle={[-180, 180]} gravity={0.25} life={50} size={[12, 22]} />
        <Burst frame={f} start={CLAWD_UP[1]} x={dot.x} y={dot.y} seed="dot" colors={[...RAINBOW]} count={16} speed={[4, 12]} angle={[-180, 0]} gravity={0.3} life={26} size={[8, 12]} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Twinkle key={i} x={420 + i * 270} y={260 + (i % 2) * 380} frame={f} start={SOLID_AT + 10 + i * 9} size={12} color={i % 2 ? "#ffd24a" : "white"} />
        ))}
      </AbsoluteFill>
      {f >= SOLID_AT && f < SOLID_AT + 6 ? <AbsoluteFill style={{ backgroundColor: "white", opacity: 0.8 * (1 - (f - SOLID_AT) / 6) }} /> : null}
      <Tagline f={f} />
      <Crt />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};

export const Tagline: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
    <PixelText size={76} font={FONT_BODY} color={CREAM} outline={5} outlineColor="#141019" shadow={6} shadowColor={CLAWD}>
      {typed(TAGLINE, f, TAGLINE_AT, 2)}
    </PixelText>
    <PixelText size={34} font={FONT_MONO} color="#a9b8f0" style={{ opacity: tween(f, [TAGLINE_AT + 56, TAGLINE_AT + 70], [0, 1]) }}>
      {SUBLINE}
    </PixelText>
  </div>
);
