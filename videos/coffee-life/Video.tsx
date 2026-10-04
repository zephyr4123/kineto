import { Audio } from "@remotion/media";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "./components/Backdrop";
import { Caption, ChapterLabel, RunningHead } from "./components/Page";
import { Sfx } from "./components/Sound";
import { Stage } from "./components/Stage";
import { assets } from "./assets.gen";
import { EndCard } from "./scenes/EndCard";
import { Title } from "./scenes/Title";
import { CHAPTERS, LINES, type ChapterId } from "./script";
import { type Props, SPEECH_LEAD, TITLE_HOLD, buildTimeline } from "./timeline";
import { VOICE } from "./voice";

// 成片的编排：纸面 → 书眉与章名 → 插画舞台 → 字幕，外加扉页、片尾和旁白。
// 所有时刻都来自 buildTimeline（由旁白时长算出），这里不写死帧号。
// 配乐最后一个和弦在曲子里的秒数（实测响度曲线：157 秒是最后一次起音，之后一路衰减）
const MUSIC_LAST_CHORD = 157;

export const Video: React.FC<Props> = ({ durations }) => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  const tl = useMemo(() => buildTimeline(durations), [durations]);

  // 章节的起止：从这一章第一句之前的停顿中点开始，到下一章开始为止（与镜头切换同一时刻）
  const chapters = useMemo(() => {
    const out: { chapter: ChapterId; start: number; end: number }[] = [];
    for (const l of tl.lines) {
      const chapter = LINES[l.index]!.chapter;
      if (out[out.length - 1]?.chapter === chapter) continue;
      const start = l.index === 0 ? 0 : l.start - Math.round(l.gapBefore / 2);
      if (out.length > 0) out[out.length - 1]!.end = start;
      out.push({ chapter, start, end: tl.endCardAt });
    }
    return out;
  }, [tl]);

  // 配乐：Scott Buckley《The Long Way Home》。从曲子中段起放，让它第 157 秒的最后一个和弦落在片尾页出现的那一刻；
  // 有人说话时压低，停顿时抬起来一点
  const musicFrom = Math.max(
    0,
    Math.round(MUSIC_LAST_CHORD * fps) - tl.endCardAt,
  );
  const speaking = (frame: number) =>
    Math.max(
      0,
      ...tl.lines.map((l) =>
        interpolate(
          frame,
          [l.start - 8, l.start + 4, l.end - 4, l.end + 12],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      ),
    );
  const musicVolume = (frame: number) =>
    (0.3 - 0.15 * speaking(frame)) *
    interpolate(frame, [0, 75, tl.total - 45, tl.total], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const body = interpolate(f, [tl.endCardAt, tl.endCardAt + 24], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop scenes={tl.scenes} total={tl.total} />
      <AbsoluteFill style={{ opacity: body }}>
        <RunningHead />
        {chapters.map((c) =>
          CHAPTERS[c.chapter].title ? (
            <Sequence
              key={c.chapter}
              name={`chapter:${c.chapter}`}
              from={c.start}
              durationInFrames={c.end - c.start}
              premountFor={fps}
            >
              <ChapterLabel chapter={c.chapter} duration={c.end - c.start} />
            </Sequence>
          ) : null,
        )}
        <Stage scenes={tl.scenes} />
        {tl.lines.map((l, i) => {
          const next = tl.lines[i + 1];
          const from = l.start + SPEECH_LEAD;
          const until = Math.min(
            l.end + Math.round(fps * 0.6),
            next ? next.start + SPEECH_LEAD - 2 : tl.endCardAt,
          );
          return (
            <Sequence
              key={`caption-${i}`}
              name={`caption:${i + 1}`}
              from={from}
              durationInFrames={until - from}
              premountFor={fps}
            >
              <Caption text={LINES[l.index]!.text} duration={until - from} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Sequence name="title" durationInFrames={TITLE_HOLD} premountFor={fps}>
        <Title duration={TITLE_HOLD} />
      </Sequence>
      <Sequence name="end" from={tl.endCardAt} premountFor={fps}>
        <EndCard />
      </Sequence>

      <Audio
        src={staticFile(assets.musicLongWayHome)}
        trimBefore={musicFrom}
        volume={musicVolume}
      />
      {/* 换章翻一页书 */}
      {chapters.slice(1).map((c) => (
        <Sfx
          key={`page-${c.chapter}`}
          src={assets.sfxPageTurn}
          at={c.start - 6}
          duration={52}
          volume={0.3}
        />
      ))}
      {tl.lines.map((l) =>
        VOICE[l.index] ? (
          <Sequence
            key={`vo-${l.index}`}
            name={`vo:${l.index + 1}`}
            from={l.start}
            durationInFrames={l.end - l.start + 2}
            layout="none"
          >
            <Audio src={staticFile(VOICE[l.index]!)} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
