import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Clawd } from "../components/Clawd";
import { CitySkyline, RAINBOW, RainbowTrail } from "../components/Flight";
import { Burst, Shockwave, Twinkle } from "../components/Particles";
import { PixelText } from "../components/PixelText";
import { Cues } from "../components/Sfx";
import { Crt } from "../components/Retro";
import { Sky } from "../components/World";
import { blinking, clamp, easeInOut, easeOut, jumpArc, landSquash, shake, tween, typed } from "../fx";
import { LOGO, pointAt, STROKE, toPath } from "../logo";
import { CLAWD, CREAM, FONT_BODY, FONT_MONO } from "../theme";

// 落名：Clawd 从城市上空冲上夜空，拖着彩虹一笔一笔写出 kineto，写完一闪变成实心的字，
// 最后跳到 i 头上，当那个点。
const S = 6;
const RISE = 40;
const DRAW_END = 300;
const HOP = 8;
export const SOLID_AT = 322;
const DOT_HOP = [302, 320] as const;
const TAGLINE_AT = 344;
export const TAGLINE = "Give your agent a path.";
export const SUBLINE = "an agent-first video studio · built on Remotion";

// 每一笔的起止帧：笔画之间跳一下（不留痕），总书写时长固定
const totalLength = LOGO.strokes.reduce((s, st) => s + st.length, 0);
const speed = totalLength / (DRAW_END - RISE - HOP * (LOGO.strokes.length - 1));
const SCHEDULE = (() => {
  let t = RISE;
  return LOGO.strokes.map((st, i) => {
    if (i > 0) t += HOP;
    const start = t;
    t += st.length / speed;
    return { start, end: t };
  });
})();

const strokeProgress = (f: number) => SCHEDULE.map((s) => tween(f, [s.start, s.end], [0, 1]));

function penAt(f: number): { x: number; y: number; drawing: boolean } {
  const first = LOGO.strokes[0].points[0];
  if (f < RISE) {
    const p = easeOut(Math.max(0, f) / RISE);
    return { x: interpolate(p, [0, 1], [first.x - 260, first.x]), y: interpolate(p, [0, 1], [1250, first.y]), drawing: false };
  }
  for (let i = 0; i < SCHEDULE.length; i++) {
    const s = SCHEDULE[i];
    if (f < s.start) {
      // 两笔之间：从上一笔终点跳到这一笔起点
      const prev = LOGO.strokes[i - 1];
      const a = prev.points[prev.points.length - 1];
      const b = LOGO.strokes[i].points[0];
      const p = (f - (s.start - HOP)) / HOP;
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p - jumpArc(p, 1, 70), drawing: false };
    }
    if (f <= s.end) return { ...pointAt(LOGO.strokes[i], (f - s.start) * speed), drawing: true };
  }
  const last = LOGO.strokes[LOGO.strokes.length - 1];
  const a = last.points[last.points.length - 1];
  const p = tween(f, DOT_HOP, [0, 1], easeInOut);
  return { x: a.x + (LOGO.iDot.x - a.x) * p, y: a.y + (LOGO.iDot.y + 30 - a.y) * p - jumpArc(p, 1, 260), drawing: false };
}

// 字：彩虹管（外红内紫的六层同心描边），solid 时换成奶油色实心字 + 橙色立体投影
export const LogoArt: React.FC<{ progress: readonly number[]; solid: number }> = ({ progress, solid }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {solid > 0
      ? [
          { dx: 16, dy: 20, color: "#5a2618" },
          { dx: 9, dy: 11, color: CLAWD },
        ].map((layer, li) => (
          <g key={li} opacity={solid} transform={`translate(${layer.dx} ${layer.dy})`}>
            {LOGO.strokes.map((st, i) => (
              <path key={i} d={toPath(st.points)} fill="none" stroke={layer.color} strokeWidth={STROKE} strokeLinecap="square" strokeLinejoin="miter" />
            ))}
          </g>
        ))
      : null}
    <g opacity={1 - solid}>
      {LOGO.strokes.map((st, i) =>
        RAINBOW.map((c, k) => (
          <path
            key={`${i}-${k}`}
            d={toPath(st.points)}
            fill="none"
            stroke={c}
            strokeWidth={(STROKE * (RAINBOW.length - k)) / RAINBOW.length}
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeDasharray={`${st.length + 1} ${st.length + 1}`}
            strokeDashoffset={(st.length + 1) * (1 - progress[i])}
          />
        )),
      )}
    </g>
    {solid > 0 ? (
      <g opacity={solid}>
        {LOGO.strokes.map((st, i) => (
          <path key={i} d={toPath(st.points)} fill="none" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="square" strokeLinejoin="miter" />
        ))}
      </g>
    ) : null}
  </svg>
);

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
    <Sky camX={9000} camY={camY} frame={frame} mood={0} sunset={1} sunY={2000} />
    <Stars frame={frame} opacity={tween(-camY, [900, 2200], [0, 1])} />
    <CitySkyline camX={11000} camY={cityCamY} opacity={1} frame={frame} />
  </>
);

const CUES = [
  [0, "launch"],
  ...SCHEDULE.map((s) => [s.start, "sparkle", 0.6] as const),
  [DOT_HOP[0], "jump"],
  [DOT_HOP[1], "pop"],
  [SOLID_AT, "hit"],
  ...Array.from(TAGLINE, (_, i) => i).filter((i) => i % 2 === 0).map((i) => [TAGLINE_AT + i * 2, "key", 0.35] as const),
] as const;

export const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const camY = interpolate(f, [0, 70], [-700, -2600], { ...clamp, easing: easeInOut });
  const cityCamY = interpolate(f, [0, 70], [-500, -2400], { ...clamp, easing: easeInOut });
  const pen = penAt(f);
  const progress = strokeProgress(f);
  const solid = tween(f, [SOLID_AT, SOLID_AT + 6], [0, 1]);
  const landed = f >= DOT_HOP[1];
  const s = shake(f, SOLID_AT, 18, 16, "solid");
  const trail: { x: number; y: number }[] = [];
  if (f < DOT_HOP[0]) for (let k = 0; k < 12; k++) trail.push(penAt(f - k));
  const pop = solid > 0 ? 1 + 0.06 * Math.exp(-(f - SOLID_AT) / 8) * Math.cos((f - SOLID_AT) / 3) : 1;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightSky frame={f} camY={camY} cityCamY={cityCamY} />
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) scale(${pop})`, transformOrigin: "960px 520px" }}>
        <LogoArt progress={progress} solid={solid} />
        {f < DOT_HOP[0] ? <RainbowTrail points={trail} band={5} /> : null}
        {/* 笔尖火花 */}
        {pen.drawing ? <Twinkle x={pen.x} y={pen.y} frame={f} start={f - (f % 6)} life={10} size={8} color="#fff6d8" /> : null}
        <Clawd
          x={pen.x}
          y={pen.y + (landed ? 0 : 5 * S)}
          scale={S}
          pose={{ eyes: landed ? (blinking(f, 30) ? "closed" : "center") : "wide", arms: landed && f < DOT_HOP[1] + 40 ? "up" : landed ? "side" : "up", legs: landed ? "stand" : "tuck" }}
          squash={landSquash(f, DOT_HOP[1])}
        />
        <Shockwave x={960} y={520} frame={f} start={SOLID_AT} life={30} maxSize={2200} color={CREAM} thickness={24} />
        <Burst frame={f} start={SOLID_AT} x={960} y={520} seed="solid" colors={[...RAINBOW, CREAM]} count={60} speed={[10, 30]} angle={[-180, 180]} gravity={0.25} life={50} size={[12, 22]} />
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
  <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
    <PixelText size={76} font={FONT_BODY} color={CREAM} outline={5} outlineColor="#141019" shadow={6} shadowColor={CLAWD}>
      {typed(TAGLINE, f, TAGLINE_AT, 2)}
    </PixelText>
    <PixelText size={34} font={FONT_MONO} color="#a9b8f0" style={{ opacity: tween(f, [TAGLINE_AT + 56, TAGLINE_AT + 70], [0, 1]) }}>
      {SUBLINE}
    </PixelText>
  </div>
);

