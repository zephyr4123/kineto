import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { easeIn, tween } from "../../../engine/motion";
import { Keycaps } from "../components/Keycaps";
import { LookupCard } from "../components/LookupCard";
import { CARD_ANCHOR, IBeam, SELECT_TOTAL, TERM_H, TERM_W, Terminal, selectionHead } from "../components/Terminal";
import { COLOR, EASE, H, SANS, W, b } from "../theme";

// 8 秒冒烟片：看风格用。配乐的拍点见 theme.ts。
// "一段外文"逐字出、"外文"两个字晃一下 → 镜头推穿这句话，周围的英文词擦身而过，落到一扇斜放的终端上
// → 拖选 DESCRIPTION 第一段 → 右⌥按下时音乐抽空，回车落在砸下的那一拍上，卡片从选区下方弹出
// → 译文的字散开，SpeakMore 从散开的地方聚拢落定，"划词即译"。
// 译文是 App 的真实输出（README 那张终端实拍里的同一段）。

// 一拍 24 帧。第 7–9 拍音乐抽空（右⌥按下、镜头往前探），第 10 拍砸下（回车、卡片弹出）
const T = {
  word1: b(1),
  word2: b(2),
  push: b(4),
  select: b(5),
  keysIn: b(6) - 6,
  alt: b(7),
  slam: b(10),
  text: b(10) + 22,
  release: b(12),
  keysOut: b(13),
  scatter: b(15) + 6,
  brand: b(17),
  tag1: b(18),
  tag2: b(18) + 12,
};

const TRANSLATION = "从本地仓库更新远程仓库里的一个或多个分支、标签或其他引用，并把远程仓库还没有的数据全部推送过去。";
/** 英文词摆在"一段外文"四周，相对画面中心的位置；depth 0 最远（小而虚）、0.45 最清楚、1 最近（大而虚） */
const CLOUD = [
  { word: "remote", x: -560, y: -170, depth: 0.92 },
  { word: "upstream", x: 430, y: -235, depth: 0.5 },
  { word: "repository", x: -250, y: -265, depth: 0.42 },
  { word: "rebase", x: 330, y: 215, depth: 0.58 },
  { word: "refs", x: 70, y: -340, depth: 0.12 },
  { word: "--force-with-lease", x: -600, y: 140, depth: 0.74 },
  { word: "fetch", x: 640, y: 40, depth: 0.32 },
  { word: "origin", x: -170, y: 285, depth: 0.22 },
  { word: "detached HEAD", x: 150, y: 355, depth: 0.86 },
  { word: "merge", x: -455, y: 330, depth: 0.38 },
  { word: "tags", x: 760, y: -150, depth: 0.08 },
  { word: "branches", x: -780, y: -330, depth: 0.55 },
] as const;

/** 进场：由虚变实、往上浮 */
const rise = (frame: number, at: number, dur = 18) => {
  const a = tween(frame, [at, at + dur], [0, 1], EASE.outExpo);
  return { opacity: a, transform: `translateY(${18 * (1 - a)}px)`, filter: a < 1 ? `blur(${8 * (1 - a)}px)` : undefined };
};

const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  // 推穿：这句话冲着镜头放大、虚掉
  const push = tween(frame, [T.push, T.push + 16], [0, 1], easeIn);
  if (push >= 1) return null;
  const scale = 1 + 16 * push * push;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {CLOUD.map(({ word, x: x0, y: y0, depth }, i) => {
        // 英文词浮在不同远近，近的漂得快；推穿时近的先擦着镜头飞出画面
        const appear = tween(frame, [16 + i * 5, 46 + i * 5], [0, 1], EASE.outQuint);
        const drift = frame * (0.08 + depth * 0.22);
        const fly = 1 + push * push * (4 + depth * 12);
        const x = (x0 + drift * Math.sign(x0)) * fly;
        const y = y0 * fly;
        const size = 20 + depth * 34;
        const blur = Math.abs(depth - 0.45) * 10 + push * 10;
        return (
          <span
            key={word}
            style={{
              position: "absolute",
              left: W / 2 + x,
              top: H / 2 + y,
              transform: "translate(-50%, -50%)",
              fontFamily: SANS,
              fontSize: size,
              color: COLOR.ink2,
              whiteSpace: "nowrap",
              opacity: appear * (0.35 + 0.35 * (1 - Math.abs(depth - 0.45))) * (1 - push),
              filter: `blur(${blur}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
      <div
        style={{
          display: "flex",
          fontFamily: SANS,
          fontSize: 72,
          fontWeight: 500,
          color: COLOR.ink,
          letterSpacing: "0.04em",
          transform: `scale(${scale})`,
          opacity: 1 - tween(frame, [T.push + 4, T.push + 11], [0, 1]),
          filter: push > 0 ? `blur(${push * 18}px)` : undefined,
        }}
      >
        {["一", "段"].map((ch, i) => (
          <span key={ch} style={{ display: "inline-block", ...rise(frame, T.word1 + i * 4) }}>
            {ch}
          </span>
        ))}
        {["外", "文"].map((ch, i) => {
          // "外文"：陌生的字，上下晃一次再站稳
          const t = frame - T.word2 - i * 5;
          const wobble = t > 0 ? Math.sin(t / 4.2) * 16 * Math.exp(-t / 16) : 0;
          return (
            <span key={ch} style={{ display: "inline-block", ...rise(frame, T.word2 + i * 5), translate: `0 ${-wobble}px`, rotate: `${wobble * 0.35}deg` }}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Desk: React.FC = () => {
  const frame = useCurrentFrame();
  // 等字冲过镜头、完全散掉再进来，两层不叠在一起发灰
  const enter = tween(frame, [T.push + 12, T.push + 58], [0, 1], EASE.outExpo);
  if (enter <= 0) return null;
  // 抽空的那一拍里镜头往前探，回车砸下时顶一下
  const lean = tween(frame, [T.alt, T.slam], [0, 1], easeIn);
  const kick = frame >= T.slam ? 0.025 * Math.exp(-(frame - T.slam) / 10) : 0;
  const leave = tween(frame, [T.scatter + 4, T.scatter + 28], [0, 1], EASE.inOut);
  const scale = (0.62 + 0.38 * enter) * (1 + 0.04 * lean + kick) * (1 - 0.12 * leave);
  const rotY = -24 * (1 - enter) - 13 + tween(frame, [T.push, T.scatter], [0, 5]);
  const rotX = 7 - tween(frame, [T.push, T.scatter], [0, 2]) + 34 * leave;
  const selected = Math.round(tween(frame, [T.select + 4, T.select + 46], [0, SELECT_TOTAL], EASE.inOut));
  const head = selectionHead(selected);
  const beam = tween(frame, [T.select - 12, T.select], [0, 1]) * (1 - tween(frame, [T.slam - 8, T.slam], [0, 1]));
  // 拖选前光标从右下滑到选区起点
  const approach = tween(frame, [T.select - 12, T.select + 4], [0, 1], EASE.outQuint);
  const beamX = head.x + 180 * (1 - approach);
  const beamY = head.y + 90 * (1 - approach);

  return (
    <AbsoluteFill style={{ perspective: 2600, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: TERM_W,
          height: TERM_H,
          transformStyle: "preserve-3d",
          transform: `translateY(${-30 + 80 * leave}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
          opacity: Math.min(1, enter * 2.5) * (1 - leave) ** 2,
          filter: enter < 1 || leave > 0 ? `blur(${10 * (1 - enter) + 12 * leave}px)` : undefined,
        }}
      >
        <Terminal selected={selected}>
          {beam > 0 ? <IBeam x={beamX} y={beamY} opacity={beam} /> : null}
          <div style={{ position: "absolute", left: CARD_ANCHOR.x, top: CARD_ANCHOR.y, transform: "translateZ(40px)" }}>
            <LookupCard
              at={T.slam}
              textAt={T.text}
              language="简体中文"
              text={TRANSLATION}
              charStyle={(i) => {
                // 译文的字一个接一个散开、飞走
                const t = tween(frame, [T.scatter + i * 0.5, T.scatter + i * 0.5 + 26], [0, 1], EASE.outQuint);
                if (t <= 0) return undefined;
                return {
                  transform: `translate(${(random(`sx-${i}`) - 0.5) * 260 * t}px, ${(random(`sy-${i}`) - 0.7) * 200 * t}px) rotate(${(random(`sr-${i}`) - 0.5) * 90 * t}deg)`,
                  opacity: 1 - t,
                  filter: `blur(${5 * t}px)`,
                };
              }}
            />
          </div>
        </Terminal>
      </div>
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const from = T.scatter + 14;
  if (frame < from) return null;
  const push = 1 + tween(frame, [T.brand, T.brand + 120], [0, 0.035]);
  const punch = frame >= T.brand ? 0.03 * Math.exp(-(frame - T.brand) / 9) : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${push + punch})` }}>
      <div style={{ display: "flex", fontFamily: SANS, fontSize: 168, fontWeight: 600, letterSpacing: "-0.02em", color: COLOR.ink, marginTop: -40 }}>
        {[..."SpeakMore"].map((ch, i) => {
          // 每个字母从译文散开的那一片（画面左下）飞来，错开着落定在拍上
          const start = from + i * 2;
          const t = tween(frame, [start, T.brand], [0, 1], EASE.outExpo);
          const sx = (random(`bx-${i}`) - 0.62) * 900;
          const sy = (random(`by-${i}`) - 0.3) * 420;
          return (
            <span
              key={`${ch}-${i}`}
              style={{
                display: "inline-block",
                opacity: tween(frame, [start, start + 10], [0, 1]),
                transform: `translate(${sx * (1 - t)}px, ${sy * (1 - t)}px) rotate(${(random(`br-${i}`) - 0.5) * 80 * (1 - t)}deg) scale(${0.55 + 0.45 * t})`,
                filter: t < 1 ? `blur(${10 * (1 - t)}px)` : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "0.2em", marginTop: 22, fontFamily: SANS, fontSize: 60, fontWeight: 500, letterSpacing: "0.14em" }}>
        <span style={{ color: COLOR.ink2, ...rise(frame, T.tag1) }}>划词</span>
        <span style={{ color: COLOR.cinnabar, ...rise(frame, T.tag2) }}>即译</span>
      </div>
    </AbsoluteFill>
  );
};

export const SMOKE_FRAMES = 480;

export const Smoke: React.FC = () => (
  <AbsoluteFill>
    <Opening />
    <Desk />
    <Keycaps
      inAt={T.keysIn}
      outAt={T.keysOut}
      caps={[
        { label: "右 ⌥", downAt: T.alt, upAt: T.release },
        { label: "回车", downAt: T.slam, upAt: T.release },
      ]}
    />
    <Brand />
  </AbsoluteFill>
);
