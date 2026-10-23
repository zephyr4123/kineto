import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Glass, Halo, Screen, type ViewKeys } from "../components/Glass";
import { Particles, type ParticleTiming, type TextLine, useTextBounds } from "../components/Particles";
import { IBeam } from "../components/Terminal";
import { Line, Polyglot, Wave } from "../components/Type";
import { rise } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, b } from "../theme";

// 开场到揭幕（第 0–32 拍）：三个词各演一下自己的意思——Speak.（字母像声波起伏）、Translate.（字母在几种文字间翻转后落定）、
// Select.（一道选区扫过）；三个词并成一行；原曲抽空的三拍（第 20–23 拍）里这一行从左往右碎成粒子、卷成漩涡，
// 第 24 拍砸下漩涡涨开，粒子落成 speakmore；下面依次出三项功能的名字。随后首页真截图从下面升起，镜头贴着它滑过三组热键。
export const OPENING_FRAMES = b(32);

const ROW: TextLine = { text: "Speak. Translate. Select.", size: 84, weight: 600, tracking: -0.025 };
const MARK: TextLine = { text: "speakmore", size: 210, weight: 650, tracking: -0.04, y: -30 };
const TIMING: ParticleTiming = { release: b(20), releaseSpread: 30, burst: b(24), arrive: b(24.1), arriveSpread: 22, fly: 26 };
/** 字母都落定、DOM 里的字从左往右显出来的起点 */
const MARK_IN = TIMING.arrive + TIMING.fly + 2;

// 首页截图（2160×1500）上三组热键的位置（像素）
const HOME = { w: 2160, h: 1500 };
const KEYS = [
  { x: 529, y: 214, w: 225, h: 40, at: b(29) },
  { x: 799, y: 214, w: 319, h: 40, at: b(29.8) },
  { x: 1161, y: 214, w: 295, h: 40, at: b(30.6) },
] as const;
const HOME_VIEW: ViewKeys = [
  [b(28.2), { fx: 0.45, fy: -0.35, s: 0.5, rx: 64, ry: -4 }],
  [b(29.2), { fx: 0.3, fy: 0.156, s: 1.2, rx: 24, ry: -16, rz: -3 }],
  [b(30), { fx: 0.44, fy: 0.156, s: 1.26, rx: 21, ry: -12, rz: -2 }],
  [b(30.8), { fx: 0.6, fy: 0.156, s: 1.3, rx: 18, ry: -8, rz: -1 }],
  [b(32), { fx: 0.62, fy: 0.16, s: 2.6, rx: 8, ry: -2 }],
];
const FEATURES = ["Voice input", "Voice translation", "Selection translation"] as const;
const WORDS = ["Speak. ", "Translate. ", "Select."] as const;
const WORD_FROM = [
  { x: -500, y: 0 },
  { x: 0, y: 260 },
  { x: 500, y: 0 },
] as const;
const SELECT = [..."Select."];

/** 横向擦除的遮罩（画面坐标）：默认 x 左边透明、右边留着；reveal 反过来，x 左边显出 */
const sweepMask = (x: number, reveal = false): React.CSSProperties => {
  const g = reveal ? `linear-gradient(90deg, #000 ${x - 50}px, transparent ${x + 50}px)` : `linear-gradient(90deg, transparent ${x - 40}px, #000 ${x + 40}px)`;
  return { WebkitMaskImage: g, maskImage: g };
};

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const row = useTextBounds(ROW);
  const mark = useTextBounds(MARK);

  // Select.：一道选区从左扫到右
  const picked = Math.round(prog(frame, b(11), b(1.4), EASE.inOut) * SELECT.length);
  const beam = prog(frame, b(10.8), 6) * (1 - prog(frame, b(12.8), 6));

  // 并成一行：镜头极慢地推近，到第 20 拍正好是原大（粒子按原大的字形采样）
  const rowScale = 0.95 + 0.05 * EASE.inOut(prog(frame, b(15), b(5), (t) => t));
  const rowSweep = row.left + ((frame - TIMING.release - 3) / TIMING.releaseSpread) * (row.right - row.left);
  const markSweep = mark.left + ((frame - MARK_IN) / (TIMING.arriveSpread + 6)) * (mark.right - mark.left);
  // 第 28 拍起 speakmore 和三项功能往上虚掉，首页截图升上来
  const markOut = prog(frame, b(28.2), 18, easeIn);

  return (
    <AbsoluteFill>
      {/* Speak.：字母像声波一样起伏 */}
      <Line out={b(4.4)}>
        <Wave value="Speak." at={b(0.5)} size={120} />
      </Line>

      {/* Translate.：字母在几种文字间翻，落成自己 */}
      <Line out={b(9.4)}>
        <Polyglot value="Translate." at={b(5)} size={120} />
      </Line>

      {/* Select.：被一道选区扫过 */}
      <Line out={b(14.4)}>
        <span style={{ display: "inline-flex", fontFamily: DISPLAY, fontSize: 120, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.ink, ...rise(frame, b(10)) }}>
          {SELECT.map((ch, i) => (
            <span key={`${ch}-${i}`} style={{ position: "relative", whiteSpace: "pre", background: i < picked ? "oklch(0.62 0.13 255 / 0.32)" : undefined }}>
              {ch}
              {beam > 0 && i === Math.max(0, picked - 1) ? (
                <span style={{ position: "absolute", left: picked === 0 ? 0 : "100%", top: "50%" }}>
                  <IBeam x={0} y={0} opacity={beam} />
                </span>
              ) : null}
            </span>
          ))}
        </span>
      </Line>

      {/* 三个词并成一行；抽空时从左往右碎成粒子（遮罩和粒子用同一条扫线） */}
      {frame >= b(15) && frame < TIMING.release + TIMING.releaseSpread + 20 ? (
        <AbsoluteFill style={frame >= TIMING.release ? sweepMask(rowSweep) : undefined}>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${rowScale})` }}>
            <span style={{ display: "inline-flex", whiteSpace: "pre", fontFamily: DISPLAY, fontSize: ROW.size, fontWeight: ROW.weight, letterSpacing: `${ROW.tracking}em`, color: COLOR.ink }}>
              {WORDS.map((word, i) => {
                const t = prog(frame, b(15) + i * 12, 24, EASE.outExpo);
                const from = WORD_FROM[i];
                return (
                  <span key={word} style={{ display: "inline-block", opacity: Math.min(1, t * 2), transform: `translate(${from.x * (1 - t)}px, ${from.y * (1 - t)}px)`, filter: t < 1 ? `blur(${14 * (1 - t)}px)` : undefined }}>
                    {word}
                  </span>
                );
              })}
            </span>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {frame >= TIMING.release - 1 && frame < MARK_IN + 60 ? <Particles from={ROW} to={MARK} timing={TIMING} /> : null}

      {/* speakmore：粒子落定的地方从左往右显出来；下面依次出三项功能 */}
      {frame >= MARK_IN && markOut < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - markOut, transform: `translateY(${-120 * markOut}px)`, filter: markOut > 0 ? `blur(${12 * markOut}px)` : undefined }}>
          <AbsoluteFill style={sweepMask(markSweep, true)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${MARK.y}px)` }}>
              <span style={{ whiteSpace: "pre", fontFamily: DISPLAY, fontSize: MARK.size, fontWeight: MARK.weight, letterSpacing: `${MARK.tracking}em`, color: COLOR.ink }}>{MARK.text}</span>
            </AbsoluteFill>
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: "translateY(150px)" }}>
            <div style={{ display: "flex", gap: 34, fontFamily: DISPLAY, fontSize: 50, fontWeight: 500, letterSpacing: "-0.015em", color: COLOR.ink2 }}>
              {FEATURES.map((f, i) => (
                <span key={f} style={{ display: "inline-flex", gap: 34, alignItems: "center", ...rise(frame, b(26.4) + i * b(0.5)) }}>
                  {i > 0 ? <span style={{ width: 8, height: 8, borderRadius: 4, background: COLOR.cinnabar }} /> : null}
                  {f}
                </span>
              ))}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {/* 首页真截图从下面升起，镜头滑过三组热键，一拍亮一组；最后冲着它推穿进下一段 */}
      <Glass w={HOME.w} h={HOME.h} keys={HOME_VIEW} at={b(28.2)} out={b(31.3)} fadeOut={16}>
        <Screen src={assets.appHome} w={HOME.w} h={HOME.h} />
        {KEYS.map((k) => (
          <Halo key={k.x} x={k.x} y={k.y} w={k.w} h={k.h} at={k.at} />
        ))}
      </Glass>
    </AbsoluteFill>
  );
};
