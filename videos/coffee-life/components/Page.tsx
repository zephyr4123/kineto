import { Easing, useCurrentFrame } from "remotion";
import { tween } from "../../../engine/motion";
import { CHAPTERS, type ChapterId } from "../script";
import {
  CAPTION_Y,
  CHERRY,
  HAIRLINE,
  HEADER_Y,
  INK,
  MARGIN,
  MUTED,
  SERIF,
  W,
} from "../theme";

// 书眉：右上角是书名，底下一条细线贯穿版心，像书页的页眉
export const RunningHead: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        right: MARGIN,
        top: HEADER_Y + 10,
        fontFamily: SERIF,
        fontSize: 24,
        letterSpacing: "0.32em",
        color: MUTED,
      }}
    >
      一杯咖啡的一生
    </div>
    <div
      style={{
        position: "absolute",
        left: MARGIN,
        top: HEADER_Y + 58,
        width: W - 2 * MARGIN,
        height: 1.5,
        backgroundColor: HAIRLINE,
      }}
    />
  </>
);

// 章节号与章名：换章时旧的淡出、新的从下方轻轻浮上来
export const ChapterLabel: React.FC<{
  readonly chapter: ChapterId;
  readonly duration: number;
}> = ({ chapter, duration }) => {
  const f = useCurrentFrame();
  const { no, title } = CHAPTERS[chapter];
  const enter = tween(f, [0, 20], [0, 1], Easing.out(Easing.cubic));
  const leave = tween(f, [duration - 12, duration], [1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGIN,
        top: HEADER_Y - 6,
        display: "flex",
        alignItems: "baseline",
        gap: 22,
        fontFamily: SERIF,
        opacity: enter * leave,
        translate: `0px ${(1 - enter) * 12}px`,
      }}
    >
      {no ? (
        <span style={{ fontSize: 30, color: CHERRY, letterSpacing: "0.08em" }}>
          {no}
        </span>
      ) : null}
      <span
        style={{
          fontSize: 40,
          fontWeight: 600,
          color: INK,
          letterSpacing: "0.18em",
        }}
      >
        {title}
      </span>
    </div>
  );
};

// 中文默认可以在任意两个字之间换行，会把「十来分钟」断成「十来分｜钟」。
// 在标点后插零宽空格，再用 keep-all 禁止在汉字之间断开：只在标点处换行，最长的一个短句也放得下一行
const breakAtPunctuation = (text: string) =>
  text.replace(/([，。：；、！？」])/g, "$1\u200b");

// 字幕：放在照片下方的纸面上，不压画面；两行以内，按短句换行，行长自动均衡
export const Caption: React.FC<{
  readonly text: string;
  readonly duration: number;
}> = ({ text, duration }) => {
  const f = useCurrentFrame();
  const enter = tween(f, [0, 10], [0, 1], Easing.out(Easing.quad));
  const leave = tween(f, [duration - 8, duration], [1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGIN,
        width: W - 2 * MARGIN,
        top: CAPTION_Y,
        fontFamily: SERIF,
        fontSize: 44,
        lineHeight: 1.66,
        letterSpacing: "0.02em",
        color: INK,
        wordBreak: "keep-all",
        textWrap: "balance",
        opacity: enter * leave,
        translate: `0px ${(1 - enter) * 8}px`,
      }}
    >
      {breakAtPunctuation(text)}
    </div>
  );
};
