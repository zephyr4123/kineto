import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { clamp, easeIn, inOutQuint, outExpo, outQuint } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { CardTitle, cardAt, ChapterTag, MINIS, MiniWindow } from "../components/chapter";
import { Phone } from "../components/phone";
import { WIN } from "../components/snug";
import { HOME } from "../components/stage";
import { SHELL_HISTORY } from "../components/story";
import { PROMPT } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { ZH } from "../theme";

// 第三章「万窗皆宜」：第一次砸下的最后一小节，夜幕从上面落下来，满天星点里浮起十几个 Mac 窗口（终端、对话、网页、代码、文档、文件夹），
// 正中是大标题。音乐渐弱的那一小节，标题升到顶上，手机从下面升起，窗口一个接一个飞进手机屏，屏幕每收进一个就亮一下；
// 静音那一拍屏幕亮起，是下一段要用的终端，夜幕褪去 —— 手机停在下一段开头一模一样的位置，直接接上。
const START = 96;
const at = cardAt(START);
const END = at(8);
const N = 18;
const SCREEN = { x: HOME.x, y: HOME.y - 60 };
const RISE = at(4);
const LAND_AT = at(4.8);
const FLY0 = at(4.6);
const FLY_GAP = 4;
const FLY = 18;
const LIT = at(6.9);
const DAWN = at(7.4);
/** 下一段（终端）第 0 帧手机屏上的样子 */
const SHELL_FIRST = [...SHELL_HISTORY, [...PROMPT, { t: "" }]];

/** 窗口的位置：散在整屏，避开正中放标题的那一条 */
const WINS = Array.from({ length: N }, (_, k) => {
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 40; tries++) {
    x = 70 + random(`wx-${k}-${tries}`) * 940;
    y = 110 + random(`wy-${k}-${tries}`) * 1700;
    if (!(y > 560 && y < 1200 && x > 60 && x < 1020)) break;
  }
  const z = 0.55 + 0.45 * random(`wz-${k}`);
  const w = (190 + 150 * random(`ww-${k}`)) * z;
  return { win: MINIS[k % MINIS.length], x, y, z, w, h: w * 0.66, rot: -9 + 18 * random(`wr-${k}`), ph: random(`wp-${k}`) * 6.28, pop: at(0.2) + k * 3 };
});
/** 飞进手机的顺序：从上往下（标题要升到顶上，上面的窗口先走） */
const ORDER = [...WINS.keys()].sort((a, b) => WINS[a].y - WINS[b].y);
const flyAt = (k: number) => FLY0 + ORDER.indexOf(k) * FLY_GAP;

const STARS = Array.from({ length: 80 }, (_, i) => ({ x: random(`sx-${i}`) * 1080, y: random(`sy-${i}`) * 1920, r: 1 + 2.2 * random(`sr-${i}`), ph: random(`sp-${i}`) * 6.28 }));

export const WindowsCard: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= END) return null;
  const curtain = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: outQuint });
  const dawn = interpolate(f, [DAWN, END], [0, 1], { ...clamp, easing: inOutQuint });
  const up = interpolate(f, [RISE, RISE + 20], [0, 1], { ...clamp, easing: inOutQuint });
  const phoneY = interpolate(f, [RISE, LAND_AT], [2800, HOME.y], { ...clamp, easing: outQuint });
  const lit = interpolate(f, [LIT, LIT + 10], [0, 1], clamp);
  const arrivals = WINS.reduce((acc, _, k) => {
    const t = flyAt(k) + FLY;
    return acc + (f >= t ? Math.exp(-(f - t) / 8) : 0);
  }, 0);

  return (
    <AbsoluteFill>
      {/* 夜幕：从上往下落，最后褪掉 */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${(1 - curtain) * 100}% 0)`, opacity: 1 - dawn }}>
        <AbsoluteFill style={{ background: "radial-gradient(120% 75% at 50% 38%, #163a86 0%, #0b1d48 42%, #050b1c 100%)" }} />
        {STARS.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "#cfe3ff", opacity: 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(f / 14 + s.ph)) }} />
        ))}
        {/* 手机身后的一圈光，窗口每飞进一个亮一下 */}
        <div style={{ position: "absolute", left: SCREEN.x - 700, top: SCREEN.y - 700, width: 1400, height: 1400, borderRadius: "50%", opacity: up, background: `radial-gradient(circle, rgba(0,184,234,${0.18 + 0.2 * Math.min(arrivals, 1.5)}) 0%, rgba(31,99,255,0.12) 35%, transparent 65%)` }} />
        {/* 满天的窗口 */}
        {WINS.map((w, k) => {
          const pop = interpolate(f, [w.pop, w.pop + 12], [0, 1], { ...clamp, easing: outExpo });
          const t0 = flyAt(k);
          const fly = interpolate(f, [t0, t0 + FLY], [0, 1], { ...clamp, easing: easeIn });
          if (pop <= 0 || fly >= 1) return null;
          const driftX = 14 * Math.sin(f / 50 + w.ph);
          const driftY = 10 * Math.cos(f / 60 + w.ph) - f * 0.25 * w.z;
          const x = w.x + driftX + (SCREEN.x - w.x - driftX) * fly;
          const y = w.y + driftY + (SCREEN.y - w.y - driftY) * fly;
          const s = (0.6 + 0.4 * pop) * (1 - 0.88 * fly);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: x - w.w / 2,
                top: y - w.h / 2,
                opacity: Math.min(1, pop * 1.5) * (0.55 + 0.45 * w.z) * (1 - fly * fly),
                transform: `rotate(${w.rot * (1 - fly)}deg) scale(${s})`,
                filter: `blur(${(1 - w.z) * 5}px) drop-shadow(0 0 ${26 * w.z}px rgba(80,170,255,0.55))`,
                zIndex: Math.round(w.z * 10),
              }}
            >
              <MiniWindow win={w.win} w={w.w} h={w.h} seed={k} />
            </div>
          );
        })}
        {/* 夜幕落下时的一道青光边 */}
        {curtain < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: curtain * 1920 - 4, height: 8, background: "rgba(0,210,255,0.95)", boxShadow: "0 0 30px rgba(0,200,255,0.9)" }} /> : null}
      </AbsoluteFill>

      {/* 手机：升上来，屏幕先黑着、收窗口时一闪一闪，最后亮起终端（和下一段第 0 帧一样） */}
      {f >= RISE ? (
        <Phone x={HOME.x} y={phoneY} scale={HOME.s} glow={0.25 + 0.6 * Math.min(arrivals, 1)}>
          <UUSnug kb={0}>
            <GhosttyApp lines={SHELL_FIRST} size={17} title={WIN.shell.title} anchor="bottom" />
          </UUSnug>
          {lit < 1 ? <div style={{ position: "absolute", inset: 0, background: "#04070f", opacity: 1 - lit }} /> : null}
          {arrivals > 0.02 && lit < 1 ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 40% at 50% 46%, rgba(120,200,255,${Math.min(0.8, 0.5 * arrivals)}) 0%, transparent 70%)` }} /> : null}
        </Phone>
      ) : null}

      {/* 标题：先在正中，手机升起时升到顶上 */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - interpolate(f, [DAWN - 4, DAWN + 6], [0, 1], clamp), transform: `translateY(${-560 * up}px) scale(${1 - 0.18 * up})`, transformOrigin: "50% 690px" }}>
        {/* 标题身后压一块暗，升到顶上时盖住还没飞走的窗口 */}
        <div style={{ position: "absolute", left: 540 - 620, top: 600, width: 1240, height: 620, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(5,11,28,0.92) 0%, rgba(5,11,28,0.75) 55%, rgba(5,11,28,0) 100%)", opacity: up }} />
        <ChapterTag at={at(0.3)} until={END} n={3} text="EVERY WINDOW" x={0} y={690} color="#a9c8ff" />
        <CardTitle at={at(0.4)} until={END} text="万窗皆宜" x={0} y={770} size={210} color="#ffffff" track="0.1em" shadow="0 0 60px rgba(60,140,255,0.55)" />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center", fontFamily: ZH, fontWeight: 600, fontSize: 56, letterSpacing: "0.08em", color: "#d3e3ff", opacity: interpolate(f, [at(1), at(1) + 12], [0, 1], clamp) }}>
          终端 · App · 浏览器
        </div>
      </div>
    </AbsoluteFill>
  );
};
