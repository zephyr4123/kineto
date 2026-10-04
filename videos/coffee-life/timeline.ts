import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { type CalculateMetadataFunction, staticFile } from "remotion";
import { LINES, type SceneId } from "./script";
import { FPS } from "./theme";
import { VOICE } from "./voice";

// 时间线全部从旁白量出来：每句的音频多长，这句就占多长，镜头、字幕、章节都跟着它。
// 换音色、改稿子以后不用手调任何帧号。

const sec = (s: number) => Math.round(s * FPS);

// 开头先停在扉页上，再开口；句与句之间留一口气，换章时留得更长；结尾留白后接片尾。
// 旁白每段前后自带约 0.33 秒静音，实际停顿 = 间隔 + 0.65 秒（句间约 0.9 秒，换章约 2 秒）
export const TITLE_HOLD = sec(3);
const LINE_GAP = sec(0.25);
const CHAPTER_GAP = sec(1.3);
// 字幕比音频起点晚一点出现，和真正开口的时刻对齐
export const SPEECH_LEAD = sec(0.2);
const TAIL = sec(1.8);
export const END_CARD = sec(4);

// 没有配音时按语速估（云大围 0.9 倍速实测约 3.5 字/秒），只用于还没合成旁白时预览排版
const estimate = (text: string) =>
  [...text].filter((c) => /\p{Script=Han}/u.test(c)).length / 3.5 + 0.3;

export type Props = { readonly durations: readonly number[] };

export type TimedLine = {
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly gapBefore: number;
};
// 场景：起止是全片的帧号；cues / ends 是场景里每句旁白的起止（相对场景起点），场景动画按它们卡时间
export type TimedScene = {
  readonly scene: SceneId;
  readonly start: number;
  readonly end: number;
  readonly cues: readonly number[];
  readonly ends: readonly number[];
};

export const buildTimeline = (durations: readonly number[]) => {
  const lines: TimedLine[] = [];
  let t = TITLE_HOLD;
  LINES.forEach((line, i) => {
    const gapBefore =
      i === 0
        ? TITLE_HOLD
        : line.chapter !== LINES[i - 1]!.chapter
          ? CHAPTER_GAP
          : LINE_GAP;
    if (i > 0) t += gapBefore;
    const end = t + sec(durations[i]!);
    lines.push({ index: i, start: t, end, gapBefore });
    t = end;
  });
  const endCardAt = t + TAIL;
  const total = endCardAt + END_CARD;

  // 场景：从这个场景第一句之前的停顿中点开始（画面先到，声音后到），到下一个场景开始为止
  const scenes: TimedScene[] = [];
  for (const tl of lines) {
    const scene = LINES[tl.index]!.scene;
    const last = scenes[scenes.length - 1];
    if (last?.scene === scene) {
      scenes[scenes.length - 1] = {
        ...last,
        cues: [...last.cues, tl.start - last.start],
        ends: [...last.ends, tl.end - last.start],
      };
      continue;
    }
    const start = tl.index === 0 ? 0 : tl.start - Math.round(tl.gapBefore / 2);
    if (last) scenes[scenes.length - 1] = { ...last, end: start };
    scenes.push({
      scene,
      start,
      end: endCardAt,
      cues: [tl.start - start],
      ends: [tl.end - start],
    });
  }
  return { lines, scenes, endCardAt, total };
};

const audioSeconds = async (src: string) => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(staticFile(src)),
  });
  return input.computeDuration();
};

export const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props,
}) => {
  const durations = await Promise.all(
    LINES.map((line, i) =>
      VOICE[i] ? audioSeconds(VOICE[i]) : estimate(line.text),
    ),
  );
  return {
    durationInFrames: buildTimeline(durations).total,
    props: { ...props, durations },
  };
};
