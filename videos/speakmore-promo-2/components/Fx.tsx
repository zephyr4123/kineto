import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { flash } from "../motion";

// 声音和闪白：各章自己放，落在自己的拍点上。

/** 每个音效文件的长度（帧）：Sequence 只开这么长 */
const LENGTH = {
  sfxClick: 5,
  sfxTap: 9,
  sfxNote0: 54,
  sfxNote1: 54,
  sfxNote2: 54,
  sfxNote3: 54,
  sfxNote4: 54,
  sfxNote5: 54,
  sfxFlash: 54,
  sfxSwell: 42,
  sfxSwish: 17,
  sfxDing: 60,
  sfxKeys: 180,
  sfxSeal: 132,
  sfxBlip: 6,
} as const;

// 配乐压得很满：各处写的音量统一再乘这么多（上限 1），钟声和闪白才听得出来
const GAIN = 1.7;

/** 一处音效：at 帧起放；frames 给了就只放这么长（打字声按敲的长度截） */
export const Sfx: React.FC<{ at: number; name: keyof typeof LENGTH & keyof typeof assets; volume?: number; frames?: number }> = ({
  at,
  name,
  volume = 0.6,
  frames,
}) => {
  const length = frames ?? LENGTH[name];
  const gain = Math.min(1, volume * GAIN);
  return (
    <Sequence from={Math.round(at)} durationInFrames={length} layout="none">
      <Audio src={staticFile(assets[name])} volume={frames ? (f) => (f > length - 4 ? gain * ((length - f) / 4) : gain) : gain} />
    </Sequence>
  );
};

/** 倒放的钟声要提前起：尾巴（最响处）正好落在 at 那一帧 */
export const swellBefore = (at: number) => at - LENGTH.sfxSwell;

/** 闪白：几处一起算，取最亮的那一下 */
export const Flash: React.FC<{ frame: number; at: readonly number[]; strength?: number; dur?: number }> = ({ frame, at, strength = 0.85, dur }) => {
  const k = Math.max(0, ...at.map((a) => flash(frame, a, dur)));
  if (k <= 0.002) return null;
  return <AbsoluteFill style={{ background: `oklch(0.99 0.01 60 / ${k * strength})`, pointerEvents: "none" }} />;
};

/** 横向的运动模糊（甩镜头用）：id 要在同一画面里唯一 */
export const MotionBlurX: React.FC<{ id: string; amount: number }> = ({ id, amount }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-20%" y="-5%" width="140%" height="110%">
      <feGaussianBlur stdDeviation={`${amount} 0`} />
    </filter>
  </svg>
);
