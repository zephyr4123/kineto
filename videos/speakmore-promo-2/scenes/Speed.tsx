import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../../../engine/motion";
import { Bar } from "../../../engine/speakmore/Bar";
import { Keycap } from "../components/Bits";
import { Flash, MotionBlurX, Sfx } from "../components/Fx";
import { MacWindow } from "../components/Screens";
import { type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { mix, prog, punch, show } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SHADOW, b } from "../theme";

// 速度：按一下右 Option 开始说，再按一下停；松开那一刻秒表起跑，按真实的快慢走（1.24 秒，不加速），
// 下面一条分成本机转写、润色两段跟着填满，字落进文稿、秒表停住。
// 随后秒表缩进右边的一列数里，和另外三个数并在一屏：主流硬件不到 2 秒出字、本机转写中位数 0.23 秒、
// 一分钟录音本机转写 0.9 秒；左边是模型页转写一栏的真截图，最后一个数出自它（圈出那一行）。
// 1.24 秒是 2026-10-16 在 App 里实测的一次（11.3 秒的录音：解码 65 ms、转写 626 ms、润色 550 ms，
// SpeakMore 仓库 bench/results/e2e-local-2026-10-16.md）；< 2 秒、0.23 秒和官网同一套数。

export const SPEED_FRAMES = b(16);
export const SPEED_CAMERA = deepCamera(SPEED_FRAMES);

const SENTENCE = "下午三点和设计组过一遍新版首页，带上上周收集的反馈。";
const MS = { decode: 65, transcribe: 626, polish: 550 };
const TOTAL = (MS.decode + MS.transcribe + MS.polish) / 1000;
const RELEASE = 104;
const T = {
  start: 22,
  release: RELEASE,
  done: RELEASE + Math.round(TOTAL * 60),
  board: b(8.4),
  out: b(14.6),
};

// 并成一屏的四个数：第一个就是刚才秒表停住的那个
const ROWS = [
  { value: TOTAL.toFixed(2), unit: "秒", label: "松开到出字 · 本次实测", at: T.board + 24 },
  { value: "< 2", unit: "秒", label: "主流硬件 · 出字", at: b(10) },
  { value: "0.23", unit: "秒", label: "本机转写 · 中位数", at: b(11) },
  { value: "0.9", unit: "秒", label: "一分钟录音 · 本机转写", at: b(12) },
] as const;
const LIST = { left: 1130, top: 190, row: 190 };
// 转写一栏里本机模型表的第一行：Qwen3-ASR 0.6B（Metal 版），一分钟录音 0.9 秒（截图像素）
const QWEN_ROW: Rect = { x: 604, y: 852, w: 1528, h: 128 };
const SHOT_AT = { left: 70, top: 100, width: 960 };

export const Speed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const elapsed = interpolate(frame, [T.release, T.done], [0, TOTAL], clamp);
  const stopped = prog(frame, T.done, 30);
  const speaking = interpolate(frame, [T.start + 6, T.start + 16, T.release - 8, T.release], [0, 1, 1, 0], clamp);
  const level = speaking * (0.5 + 0.5 * Math.abs(Math.sin(sec * 6.1) * Math.sin(sec * 2.3 + 0.7)));
  const keyPress = Math.max(
    interpolate(frame, [T.start - 3, T.start, T.start + 8], [0, 1, 0], clamp),
    interpolate(frame, [T.release - 3, T.release, T.release + 8], [0, 1, 0], clamp),
  );

  // 两段：本机转写（含解码）、润色；按毫秒算各自在什么时候填满
  const split = (MS.decode + MS.transcribe) / 1000 / TOTAL;
  const fill = elapsed / TOTAL;

  // 演示退场：文稿和悬浮条往左走，秒表缩到右边那一列的第一行
  const board = prog(frame, T.board, 36, EASE.inOut);
  // 文稿和悬浮条先走（18 帧），截图再从左边进来，不叠在一起
  const demoOut = prog(frame, T.board, 18, EASE.inOut);
  const shotIn = prog(frame, T.board + 16, 44);

  // 甩出去：往左甩，带横向模糊
  const whip = prog(frame, T.out, 22, EASE.inOut);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <MotionBlurX id="speed-whip" amount={60 * Math.sin(Math.PI * whip)} />
      <AbsoluteFill style={{ transform: `translateX(${-1400 * whip}px)`, filter: whip > 0.01 && whip < 0.99 ? "url(#speed-whip)" : undefined, opacity: 1 - whip }}>
        {demoOut < 1 ? (
          <AbsoluteFill style={{ opacity: 1 - demoOut, transform: `translateX(${-160 * demoOut}px)`, filter: demoOut > 0.01 ? `blur(${10 * demoOut}px)` : undefined }}>
            <MacWindow title="新建文稿" width={860} height={330} style={{ left: 150, top: 230, ...show(frame, 0, undefined, 30) }}>
              <div style={{ padding: "30px 36px", fontSize: 36, lineHeight: 1.62, color: COLOR.paperInk }}>
                {frame >= T.done ? (
                  <span style={{ color: mix(COLOR.paperInk, "oklch(0.6 0.17 32)", prog(frame, T.done + 10, 40)) }}>{SENTENCE}</span>
                ) : (
                  <span style={{ display: "inline-block", width: 3, height: 40, verticalAlign: "-7px", background: "oklch(0.55 0.15 250)", opacity: Math.floor(frame / 30) % 2 === 0 ? 1 : 0 }} />
                )}
              </div>
            </MacWindow>
            <div style={{ position: "absolute", left: 0, right: 0, top: 812, display: "flex", justifyContent: "center", alignItems: "center", gap: 44, ...show(frame, 12, undefined, 30) }}>
              <Keycap label="右 ⌥" press={keyPress} size={0.95} />
              <Bar frame={frame} fps={fps} level={level} timing={{ press: T.release, finishing: T.release + 6, done: T.done }} />
            </div>
          </AbsoluteFill>
        ) : null}

        {/* 秒表：板子出来时缩进第一行的位置，交给那一行 */}
        {board < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 1110,
              width: 680,
              top: 236,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transformOrigin: "0 0",
              transform: `translate(${interpolate(board, [0, 1], [0, LIST.left - 1130])}px, ${interpolate(board, [0, 1], [0, LIST.top - 290])}px) scale(${interpolate(board, [0, 1], [1, 0.5])})`,
              opacity: 1 - prog(frame, T.board + 14, 14),
              ...(frame < T.board ? show(frame, 8) : {}),
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.08em", textShadow: SHADOW, opacity: 1 - board }}>松开到出字</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6, transform: `scale(${punch(frame, T.done, 0.06)})` }}>
              <span
                style={{
                  fontFamily: MONO_STACK,
                  fontSize: 230,
                  fontWeight: 300,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  color: mix(COLOR.ink, COLOR.cinnabar, frame < T.done ? 1 : stopped),
                  opacity: frame < T.release ? 0.45 : 1,
                  textShadow: SHADOW,
                }}
              >
                {elapsed.toFixed(2)}
              </span>
              <span style={{ fontSize: 70, fontWeight: 500, color: COLOR.ink2 }}>秒</span>
            </div>
            {/* 一条分两段：本机转写、润色 */}
            <div style={{ opacity: 1 - board }}>
              <div style={{ position: "relative", width: 640, height: 14, marginTop: 34, borderRadius: 7, background: "oklch(1 0 0 / 0.12)", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(fill, split) * 100}%`, background: COLOR.seal }} />
                <div style={{ position: "absolute", left: `${split * 100}%`, top: 0, bottom: 0, width: `${Math.max(0, fill - split) * 100}%`, background: COLOR.cinnabar }} />
              </div>
              <div style={{ position: "relative", width: 640, height: 40, marginTop: 14, fontSize: 26, color: COLOR.ink2 }}>
                <span style={{ position: "absolute", left: 0 }}>本机转写</span>
                <span style={{ position: "absolute", left: `${split * 100}%`, marginLeft: 14 }}>润色</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* 一屏四个数：左边真截图，右边一列 */}
        {shotIn > 0 ? (
          <AbsoluteFill style={{ perspective: 2200 }}>
            <Shot
              shot={SHOTS.transcribe}
              width={SHOT_AT.width}
              spot={{ rect: QWEN_ROW, k: prog(frame, ROWS[3].at, 14) }}
              style={{
                left: SHOT_AT.left,
                top: SHOT_AT.top,
                opacity: shotIn,
                transformOrigin: "0% 50%",
                transform: `translateX(${-200 * (1 - shotIn)}px) rotateY(${16 - 10 * shotIn}deg)`,
              }}
            />
          </AbsoluteFill>
        ) : null}
        {frame >= T.board ? (
          <div style={{ position: "absolute", left: LIST.left, top: LIST.top, width: 680, textShadow: SHADOW }}>
            {ROWS.map((row, i) => (
              <Metric key={row.label} frame={frame} index={i} {...row} hot={i === 3 ? prog(frame, row.at, 14) : 0} />
            ))}
          </div>
        ) : null}
      </AbsoluteFill>

      <Flash frame={frame} at={[0]} strength={0.7} />
      <Flash frame={frame} at={[T.done]} strength={0.25} dur={12} />
      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.start} name="sfxClick" volume={0.32} />
      <Sfx at={T.release} name="sfxClick" volume={0.32} />
      <Sfx at={T.release + Math.round(((MS.decode + MS.transcribe) / 1000) * 60)} name="sfxTap" volume={0.22} />
      <Sfx at={T.done} name="sfxDing" volume={0.45} />
      <Sfx at={T.board} name="sfxSwish" volume={0.35} />
      {ROWS.slice(1).map((row, i) => (
        <Sfx key={row.label} at={row.at} name={(["sfxNote1", "sfxNote2", "sfxNote3"] as const)[i]} volume={0.26} />
      ))}
      <Sfx at={T.out} name="sfxSwish" volume={0.45} />
    </AbsoluteFill>
  );
};

/** 一列里的一个数：数字、单位，下面一行说明；行与行之间一道细线。hot 时数字染成朱砂（和截图上圈出的那一行对上） */
const Metric: React.FC<{ frame: number; index: number; value: string; unit: string; label: string; at: number; hot: number }> = ({
  frame,
  index,
  value,
  unit,
  label,
  at,
  hot,
}) => (
  <div style={{ position: "absolute", left: 0, top: index * LIST.row, width: 680, height: LIST.row, ...show(frame, at, undefined, 20) }}>
    {index > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: -14, height: 1, background: COLOR.line }} /> : null}
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, transform: `scale(${punch(frame, at, 0.05, 20)})`, transformOrigin: "0 50%" }}>
      <span
        style={{
          fontFamily: MONO_STACK,
          fontSize: 112,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: index === 0 ? COLOR.cinnabar : mix(COLOR.cinnabar, COLOR.ink, hot),
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 40, fontWeight: 500, color: COLOR.ink2 }}>{unit}</span>
    </div>
    <div style={{ marginTop: 14, fontSize: 30, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.05em" }}>{label}</div>
  </div>
);
