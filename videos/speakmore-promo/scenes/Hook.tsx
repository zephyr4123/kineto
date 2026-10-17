import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Bar } from "../../../engine/speakmore/Bar";
import { Seal } from "../../../engine/speakmore/Seal";
import type { Camera } from "../components/Stage";
import { COLOR, EASE, SANS, SERIF, W } from "../theme";

// 开场：口述的原话一字一字冒出来（比真人说得快，意思到了就行）→ 摁下完成键 → 语气词和改口前的话依次散掉，
// 留下的字挪到一起，模型添上的字用朱砂亮一下 → 整句停一拍 → 五道声波立起来、落成那方印，出片名。
// 声音：三处音效（按键、收拢、落印），配乐在 Video.tsx 里铺满全片。
// 原话和成品都是真的：系统语音（Tingting）读原话，交给 SpeakMore 当前的提示词（Gemini），3 次里 2 次得到一字不差的这句成品。

type Kind = "cut" | "keep" | "add";
// 原话 = cut 和 keep 依次连起来；成品 = keep 和 add 依次连起来。"br" 是原话两行之间的换行
const SEGMENTS: readonly (readonly [Kind, string] | "br")[] = [
  ["cut", "嗯，那个，"],
  ["keep", "后天的会"],
  ["add", "议"],
  ["cut", "，就是，"],
  ["keep", "改到"],
  ["cut", "周四下午吧，"],
  "br",
  ["cut", "哦不对，"],
  ["keep", "周五下午"],
  ["add", "吧"],
  ["keep", "，大家记得把上个月的数据带上"],
  ["cut", "。"],
];

// 中文和全角标点每个字都是 1em 宽：按格子排，原话和成品里每个字的位置都能直接算出来，留下的字就能从原位挪到新位
const FONT = 60;
const RAW_TOP = [418, 418 + FONT * 1.55];
const FINAL_TOP = 418 + (FONT * 1.55) / 2;

// 口述的快慢（帧）：每个字隔多久，逗号后多停一会儿
const SPEECH_START = 44;
const STEP = 2.4;
const COMMA_PAUSE = 6;

type Glyph = {
  ch: string;
  kind: Kind;
  /** 原话里的位置和冒出来的帧；模型添的字没有 */
  raw?: { x: number; y: number; at: number };
  /** 成品里的位置；散掉的字没有 */
  final?: { x: number; y: number; index: number };
  /** 散掉的字从哪一帧开始散（相对摁键后），模型添的字是第几个 */
  rank: number;
};

const glyphs: Glyph[] = (() => {
  const lines: string[][] = [[]];
  const out: Glyph[] = [];
  let cutSegment = -1;
  let added = -1;
  for (const segment of SEGMENTS) {
    if (segment === "br") {
      lines.push([]);
      continue;
    }
    const [kind, text] = segment;
    if (kind === "cut") cutSegment++;
    if (kind === "add") added++;
    [...text].forEach((ch, j) => {
      if (kind !== "add") lines[lines.length - 1].push(ch);
      out.push({ ch, kind, rank: kind === "cut" ? cutSegment * 5 + j : kind === "add" ? added : 0 });
    });
  }

  let line = 0;
  let col = 0;
  let at = SPEECH_START;
  let finalIndex = 0;
  const finalCount = out.filter((g) => g.kind !== "cut").length;
  const finalLeft = (W - finalCount * FONT) / 2;
  let segmentCursor = 0;
  for (const segment of SEGMENTS) {
    if (segment === "br") {
      line++;
      col = 0;
      continue;
    }
    for (let j = 0; j < segment[1].length; j++) {
      const g = out[segmentCursor++];
      if (g.kind !== "add") {
        const left = (W - lines[line].length * FONT) / 2;
        g.raw = { x: left + col * FONT, y: RAW_TOP[line], at };
        col++;
        at += STEP + (g.ch === "，" ? COMMA_PAUSE : 0);
      }
      if (g.kind !== "cut") g.final = { x: finalLeft + finalIndex * FONT, y: FINAL_TOP, index: finalIndex++ };
    }
  }
  return out;
})();

const SPEECH_END = Math.max(...glyphs.flatMap((g) => (g.raw ? [g.raw.at] : [])));

// 摁键之后的一连串，都从摁键那一帧往后排
const T = (() => {
  const press = Math.round(SPEECH_END) + 12;
  const move = press + 24;
  const add = move + 56;
  const settled = move + 66;
  const out = settled + 66;
  const bars = out + 8;
  const impact = bars + 30;
  return {
    barIn: 12,
    press,
    finishing: press + 6,
    cut: press + 8,
    move,
    add,
    done: press + 64,
    barOut: press + 96,
    settled,
    cool: add + 44,
    out,
    bars,
    impact,
    word: impact + 14,
    leave: impact + 104,
    end: impact + 124,
  };
})();

export const HOOK_FRAMES = T.end;
/** 印底落下的那一帧：配乐的重拍对在这里（Video.tsx） */
export const HOOK_IMPACT = T.impact;

// 桌面先原样亮一下，口述开始后退后（虚、暗），片名时再退一点，让印和名字跳出来；镜头极慢地往前推，到整句散去为止
export const HOOK_CAMERA: Camera = {
  focus: [
    [T.barIn + 16, 0],
    [SPEECH_START + 36, 0.85],
    [T.out, 0.85],
    [T.impact, 1],
  ],
  zoom: [
    [0, 1],
    [T.out, 1.03],
  ],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// 在 oklab 里混：oklch 会绕着色相走，朱砂转白的半路会泛紫
const mix = (to: string, from: string, t: number) => `color-mix(in oklab, ${to} ${(t * 100).toFixed(1)}%, ${from})`;

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 声波跟着字冒出来的密度走：每冒一个字推高一点、很快落下，逗号停顿时自然低下去
  const level = Math.min(
    1,
    glyphs.reduce((sum, g) => (g.raw && frame >= g.raw.at ? sum + 0.34 * Math.exp(-(frame - g.raw.at) / 7) : sum), 0),
  );

  // 字和悬浮条跟着桌面一起往前推（HOOK_CAMERA 的 zoom）
  const push = 1 + 0.03 * interpolate(frame, [0, T.out], [0, 1], clamp);
  const lit = interpolate(frame, [T.move + 10, T.settled], [0, 1], clamp);
  const sentenceOut = interpolate(frame, [T.out, T.out + 26], [0, 1], { ...clamp, easing: EASE.outQuint });

  const barIn = interpolate(frame, [T.barIn, T.barIn + 40], [0, 1], { ...clamp, easing: EASE.outExpo });
  const barOut = interpolate(frame, [T.barOut, T.barOut + 30], [0, 1], { ...clamp, easing: EASE.outQuint });

  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <AbsoluteFill
          style={{
            opacity: 1 - sentenceOut,
            filter: `blur(${10 * sentenceOut}px)`,
            transform: `translateY(${-16 * sentenceOut}px)`,
          }}
        >
          {glyphs.map((g, i) => (
            <Character key={i} glyph={g} frame={frame} lit={lit} />
          ))}
        </AbsoluteFill>

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 808,
            opacity: barIn * (1 - barOut),
            filter: `blur(${10 * (1 - barIn) + 8 * barOut}px)`,
            transform: `translate(-50%, ${30 * (1 - barIn) + 24 * barOut}px)`,
          }}
        >
          <Bar frame={frame} fps={fps} level={level} timing={{ press: T.press, finishing: T.finishing, done: T.done }} />
        </div>
      </AbsoluteFill>

      <Title frame={frame} />

      <Sequence from={T.press} layout="none" name="sfx:key">
        <Audio src={staticFile(assets.sfxKey)} volume={0.85} />
      </Sequence>
      <Sequence from={T.cut + 6} layout="none" name="sfx:gather">
        <Audio src={staticFile(assets.sfxGather)} volume={0.55} />
      </Sequence>
      {/* 配乐的重拍和这一下同时落，音效收着点，叠起来才不削波 */}
      <Sequence from={T.impact} layout="none" name="sfx:seal">
        <Audio src={staticFile(assets.sfxSeal)} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 一个字：原话里冒出来；要散的往上虚掉，留下的挪到成品的位置并变亮变实，模型添的字先朱砂后转白 */
const Character: React.FC<{ glyph: Glyph; frame: number; lit: number }> = ({ glyph: g, frame, lit }) => {
  let x = 0;
  let y = 0;
  let opacity = 1;
  let blur = 0;
  let dy = 0;
  let scale = 1;
  let color: string = COLOR.spoken;
  let weight = 360;

  if (g.raw) {
    const appear = interpolate(frame, [g.raw.at, g.raw.at + 16], [0, 1], { ...clamp, easing: EASE.outExpo });
    ({ x, y } = g.raw);
    opacity = appear;
    blur = 8 * (1 - appear);
    dy = 14 * (1 - appear);
  }

  if (g.kind === "cut") {
    const start = T.cut + g.rank;
    const gone = interpolate(frame, [start, start + 26], [0, 1], { ...clamp, easing: EASE.outQuint });
    opacity *= 1 - gone;
    blur += 14 * gone;
    dy -= 12 * gone;
    scale = 1 - 0.06 * gone;
  }

  if (g.kind === "keep" && g.raw && g.final) {
    // 先在各自那一行里横着靠拢，再两行并成一行：横着走时同一行的字一起动、不错位，
    // 走完两行占的横向范围已经分开，上下合并时不会叠在一起
    const across = interpolate(frame, [T.move, T.move + 40], [0, 1], { ...clamp, easing: EASE.inOut });
    const down = interpolate(frame, [T.move + 30, T.move + 62], [0, 1], { ...clamp, easing: EASE.inOut });
    x = lerp(g.raw.x, g.final.x, across);
    y = lerp(g.raw.y, g.final.y, down);
    color = mix(COLOR.ink, COLOR.spoken, lit);
    weight = lerp(360, 480, lit);
  }

  if (g.kind === "add" && g.final) {
    const start = T.add + g.rank * 10;
    const a = interpolate(frame, [start, start + 24], [0, 1], { ...clamp, easing: EASE.outExpo });
    const cool = interpolate(frame, [T.cool + g.rank * 10, T.cool + g.rank * 10 + 40], [0, 1], clamp);
    ({ x, y } = g.final);
    opacity = a;
    blur = 10 * (1 - a);
    scale = 1.18 - 0.18 * a;
    color = mix(COLOR.ink, COLOR.cinnabar, cool);
    weight = 480;
  }

  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: FONT,
        height: FONT,
        fontSize: FONT,
        lineHeight: 1,
        fontWeight: weight,
        color,
        opacity,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        transform: `translateY(${dy}px) scale(${scale})`,
      }}
    >
      {g.ch}
    </span>
  );
};

/** 片名：五道从中间往两边立起来，印底落下（伴着那一声低音），再出名字和口号 */
const Title: React.FC<{ frame: number }> = ({ frame }) => {
  const order = [8, 4, 0, 4, 8];
  const bars = order.map((delay) =>
    interpolate(frame, [T.bars + delay, T.bars + delay + 26], [0, 1], { ...clamp, easing: EASE.outExpo }),
  );
  const base = interpolate(frame, [T.impact, T.impact + 16], [0, 1], { ...clamp, easing: EASE.outQuint });
  const rise = (delay: number) =>
    interpolate(frame, [T.word + delay, T.word + delay + 34], [0, 1], { ...clamp, easing: EASE.outExpo });
  const name = rise(0);
  const motto = rise(12);
  // 下一章接上来之前，整块往上虚掉
  const leave = interpolate(frame, [T.leave, T.end], [0, 1], { ...clamp, easing: EASE.outQuint });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - leave,
        filter: leave > 0.01 ? `blur(${12 * leave}px)` : undefined,
        transform: `translateY(${-20 * leave}px)`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "translateY(-24px)" }}>
        <Seal size={196} bars={bars} base={base} />
        <div
          style={{
            marginTop: 56,
            fontFamily: SANS,
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            color: COLOR.ink,
            opacity: name,
            filter: `blur(${10 * (1 - name)}px)`,
            transform: `translateY(${14 * (1 - name)}px)`,
          }}
        >
          SpeakMore
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: SERIF,
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: "0.5em",
            // 字距加在每个字后面，最后一个字后面也有：往右补齐，整行才居中
            paddingLeft: "0.5em",
            lineHeight: 1,
            color: COLOR.muted,
            opacity: motto,
            filter: `blur(${8 * (1 - motto)}px)`,
            transform: `translateY(${10 * (1 - motto)}px)`,
          }}
        >
          开口即成文
        </div>
      </div>
    </AbsoluteFill>
  );
};
