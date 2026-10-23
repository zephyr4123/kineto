import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Glass, Halo, Screen, type ViewKeys } from "../components/Glass";
import { DictateGlimpse, type DictateTiming, SelectGlimpse, type SelectTiming, TranslateGlimpse, type TranslateTiming } from "../components/Glimpse";
import type { SaidPart } from "../components/Said";
import { Particles, type ParticleTiming, type TextLine, useTextBounds } from "../components/Particles";
import { IBeam } from "../components/Terminal";
import { Line, Polyglot, Wave } from "../components/Type";
import { AppIcon, Version, rise } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, b } from "../theme";

// 开场到揭幕（第 0–40 拍）：三个主角词全大写，各演一下自己的意思——SPEAK（字母像声波起伏）、TRANSLATE（字母在几种文字间翻转后落定）、
// SELECT（一道选区扫过）；每个词下面配一段小演示（Glimpse.tsx）：说一大段整理成几条、说中文落成英文、终端里划选报错出译文。
// 三个词并成一行；原曲抽空的三拍（第 28–31 拍）里这一行从左往右碎成粒子、卷成漩涡，
// 第 32 拍砸下漩涡涨开，粒子落成 speakmore，图标从上面弹出、旁边挂版本号；下面依次出三项功能的名字。随后首页真截图从下面升起，镜头贴着它滑过三组热键。
export const OPENING_FRAMES = b(40);

const ROW: TextLine = { text: "SPEAK   TRANSLATE   SELECT", size: 80, weight: 600, tracking: 0.01 };
const MARK: TextLine = { text: "speakmore", size: 210, weight: 650, tracking: -0.04, y: -30 };
const TIMING: ParticleTiming = { release: b(28), releaseSpread: 30, burst: b(32), arrive: b(32.1), arriveSpread: 22, fly: 26 };
/** 字母都落定、DOM 里的字从左往右显出来的起点 */
const MARK_IN = TIMING.arrive + TIMING.fly + 2;

// 首页截图（2160×1500）上三组热键的位置（像素）
const HOME = { w: 2160, h: 1500 };
const KEYS = [
  { x: 529, y: 214, w: 225, h: 40, at: b(37) },
  { x: 799, y: 214, w: 319, h: 40, at: b(37.8) },
  { x: 1161, y: 214, w: 295, h: 40, at: b(38.6) },
] as const;
const HOME_VIEW: ViewKeys = [
  [b(36.2), { fx: 0.45, fy: -0.35, s: 0.5, rx: 64, ry: -4 }],
  [b(37.2), { fx: 0.3, fy: 0.156, s: 1.2, rx: 24, ry: -16, rz: -3 }],
  [b(38), { fx: 0.44, fy: 0.156, s: 1.26, rx: 21, ry: -12, rz: -2 }],
  [b(38.8), { fx: 0.6, fy: 0.156, s: 1.3, rx: 18, ry: -8, rz: -1 }],
  [b(40), { fx: 0.62, fy: 0.16, s: 2.6, rx: 8, ry: -2 }],
];
const FEATURES = ["Voice input", "Voice translation", "Selection translation"] as const;
const WORDS = ["SPEAK   ", "TRANSLATE   ", "SELECT"] as const;
const WORD_FROM = [
  { x: -500, y: 0 },
  { x: 0, y: 260 },
  { x: 500, y: 0 },
] as const;
const SELECT = [..."SELECT"];
/** 三个词并成一行的那一拍 */
const ROW_AT = b(23);

// 三段小演示：成品都是 App 的真实输出（语音输入 dictate、语音翻译 translate、划词 lookup，DeepSeek V4.1 Flash，2026-10-23）
const WORD = { size: 116, y: -365 };
const SPEAK_T: DictateTiming = { at: b(0.4), speak: b(1), stop: b(4), burst: b(4.5), land: b(5.4), out: b(10) };
/** 说的一大段：浅灰的是语气词和口头的连接词，整理时炸散（只能是全角字）；成品没让说"第一第二"，App 自己分成了三条 */
const SPEAK_SAID: readonly SaidPart[] = [
  { text: "嗯，", cut: true },
  { text: "周五之前要做几件事，" },
  { text: "呃，一个是", cut: true },
  { text: "修好登录页，" },
  { text: "然后，嗯，", cut: true },
  { text: "更新一下文档，" },
  { text: "还有就是", cut: true },
  { text: "通知测试回归" },
  { text: "。", cut: true },
];
const SPEAK_OUT = ["周五之前要做几件事：", "1. 修好登录页", "2. 更新一下文档", "3. 通知测试回归"] as const;
const TRANSLATE_T: TranslateTiming = { at: b(10.5), speak: b(11.1), stop: b(13.1), done: b(13.7), land: b(13.9), out: b(16.3) };
const SELECT_T: SelectTiming = { at: b(16.8), select: b(17.9), dur: b(1.2), card: b(19.4), text: b(19.4) + 18, out: b(22.6) };

/** 横向擦除的遮罩（画面坐标）：默认 x 左边透明、右边留着；reveal 反过来，x 左边显出 */
const sweepMask = (x: number, reveal = false): React.CSSProperties => {
  const g = reveal ? `linear-gradient(90deg, #000 ${x - 50}px, transparent ${x + 50}px)` : `linear-gradient(90deg, transparent ${x - 40}px, #000 ${x + 40}px)`;
  return { WebkitMaskImage: g, maskImage: g };
};

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const row = useTextBounds(ROW);
  const mark = useTextBounds(MARK);

  // SELECT：一道选区从左扫到右，和下面终端里的拖选同时
  const picked = Math.round(prog(frame, SELECT_T.select, SELECT_T.dur, EASE.inOut) * SELECT.length);
  const beam = prog(frame, SELECT_T.select - 6, 6) * (1 - prog(frame, SELECT_T.card, 6));

  // 并成一行：镜头极慢地推近，到第 28 拍正好是原大（粒子按原大的字形采样）
  const rowScale = 0.95 + 0.05 * EASE.inOut(prog(frame, ROW_AT, TIMING.release - ROW_AT, (t) => t));
  const rowSweep = row.left + ((frame - TIMING.release - 3) / TIMING.releaseSpread) * (row.right - row.left);
  const markSweep = mark.left + ((frame - MARK_IN) / (TIMING.arriveSpread + 6)) * (mark.right - mark.left);
  // 第 36 拍起 speakmore 和三项功能往上虚掉，首页截图升上来
  const markOut = prog(frame, b(36.2), 18, easeIn);

  return (
    <AbsoluteFill>
      {/* SPEAK：字母像声波一样起伏；下面说一大段，语气词炸散，备忘录里落成编号的三条 */}
      <Line out={SPEAK_T.out} y={WORD.y}>
        <Wave value="SPEAK" at={b(0.3)} size={WORD.size} style={{ letterSpacing: "0.02em" }} />
      </Line>
      <DictateGlimpse parts={SPEAK_SAID} title="待办" lines={SPEAK_OUT} timing={SPEAK_T} />

      {/* TRANSLATE：字母在几种文字间翻，落成自己；下面说中文（字幕逐字出来），落下来的是英文 */}
      <Line out={TRANSLATE_T.out} y={WORD.y}>
        <Polyglot value="TRANSLATE" at={b(10.4)} size={WORD.size} style={{ letterSpacing: "0.02em" }} />
      </Line>
      <TranslateGlimpse name="Daniel" avatar="oklch(0.5 0.1 262)" incoming="Are you free for a quick call tomorrow?" said="嗯，可以，明天上午十点打给你" chip="英文" result="Sure, I'll call you at 10 a.m. tomorrow." timing={TRANSLATE_T} />

      {/* SELECT：被一道选区扫过；下面终端里同时划选一行报错，卡片给出译文 */}
      <Line out={SELECT_T.out} y={WORD.y}>
        <span style={{ display: "inline-flex", fontFamily: DISPLAY, fontSize: WORD.size, fontWeight: 600, letterSpacing: "0.02em", color: COLOR.ink, ...rise(frame, b(16.7)) }}>
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
      <SelectGlimpse result="fatal: 拒绝合并互不相关的历史记录" timing={SELECT_T} />

      {/* 三个词并成一行；抽空时从左往右碎成粒子（遮罩和粒子用同一条扫线） */}
      {frame >= ROW_AT && frame < TIMING.release + TIMING.releaseSpread + 20 ? (
        <AbsoluteFill style={frame >= TIMING.release ? sweepMask(rowSweep) : undefined}>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${rowScale})` }}>
            <span style={{ display: "inline-flex", whiteSpace: "pre", fontFamily: DISPLAY, fontSize: ROW.size, fontWeight: ROW.weight, letterSpacing: `${ROW.tracking}em`, color: COLOR.ink }}>
              {WORDS.map((word, i) => {
                const t = prog(frame, ROW_AT + i * 12, 24, EASE.outExpo);
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

      {/* speakmore：粒子落定的地方从左往右显出来；图标从上面弹出、右上挂版本号；下面依次出三项功能 */}
      {frame >= MARK_IN && markOut < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - markOut, transform: `translateY(${-120 * markOut}px)`, filter: markOut > 0 ? `blur(${12 * markOut}px)` : undefined }}>
          <AbsoluteFill style={sweepMask(markSweep, true)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${MARK.y}px)` }}>
              <span style={{ whiteSpace: "pre", fontFamily: DISPLAY, fontSize: MARK.size, fontWeight: MARK.weight, letterSpacing: `${MARK.tracking}em`, color: COLOR.ink }}>{MARK.text}</span>
            </AbsoluteFill>
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: "translateY(-260px)" }}>
            <div style={{ position: "relative", display: "grid", placeItems: "center", opacity: prog(frame, MARK_IN - 4, 10), transform: `scale(${0.4 + 0.6 * prog(frame, MARK_IN - 4, 26, EASE.outExpo)})` }}>
              <AppIcon size={150} style={{ filter: "drop-shadow(0 20px 36px oklch(0.2 0.05 260 / 0.3))" }} />
            </div>
          </AbsoluteFill>
          <div style={{ position: "absolute", left: mark.right + 28, top: 540 + (MARK.y ?? 0) - 92, ...rise(frame, MARK_IN + 18, undefined, 14) }}>
            <Version />
          </div>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: "translateY(150px)" }}>
            <div style={{ display: "flex", gap: 34, fontFamily: DISPLAY, fontSize: 50, fontWeight: 500, letterSpacing: "-0.015em", color: COLOR.ink2 }}>
              {FEATURES.map((f, i) => (
                <span key={f} style={{ display: "inline-flex", gap: 34, alignItems: "center", ...rise(frame, b(34.4) + i * b(0.5)) }}>
                  {i > 0 ? <span style={{ width: 8, height: 8, borderRadius: 4, background: COLOR.cinnabar }} /> : null}
                  {f}
                </span>
              ))}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {/* 首页真截图从下面升起，镜头滑过三组热键，一拍亮一组；最后冲着它推穿进下一段 */}
      <Glass w={HOME.w} h={HOME.h} keys={HOME_VIEW} at={b(36.2)} out={b(39.3)} fadeOut={16}>
        <Screen src={assets.appHome} w={HOME.w} h={HOME.h} />
        {KEYS.map((k) => (
          <Halo key={k.x} x={k.x} y={k.y} w={k.w} h={k.h} at={k.at} />
        ))}
      </Glass>
    </AbsoluteFill>
  );
};
