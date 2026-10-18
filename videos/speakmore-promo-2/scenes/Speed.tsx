import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../../../engine/motion";
import { Bar } from "../../../engine/speakmore/Bar";
import { Keycap } from "../components/Bits";
import { Sfx } from "../components/Fx";
import { Lift, type Rect, SHOTS } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { mix, prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 速度：一把横贯画面的时间尺（0–2 秒，刻度细到 0.05 秒）。按一下右 Option 开始说，再按一下停；
// 松开那一刻光标从 0 起跑，按真实的快慢走到 1.24 秒，身后留下两段光：本机转写（靛青）、润色（朱砂），字落进文稿。
// 随后同一把尺上再落三个数：本机转写中位数 0.23 秒、一分钟录音本机转写 0.9 秒（下面抽出模型页里那一行真截图）、
// 主流硬件不到 2 秒。四个数一把尺，一屏看完。
// 1.24 秒是 2026-10-16 在 App 里实测的一次（11.3 秒的录音：解码 65 ms、转写 626 ms、润色 550 ms，
// SpeakMore 仓库 bench/results/e2e-local-2026-10-16.md）；< 2 秒、0.23 秒和官网同一套数。

export const SPEED_FRAMES = b(16);
export const SPEED_CAMERA = deepCamera(SPEED_FRAMES);

const SENTENCE = "下午三点和设计组过一遍新版首页，带上上周收集的反馈。";
const MS = { decode: 65, transcribe: 626, polish: 550 };
const TOTAL = (MS.decode + MS.transcribe + MS.polish) / 1000;
const SPLIT = (MS.decode + MS.transcribe) / 1000;
const RELEASE = 104;
const T = {
  start: 22,
  release: RELEASE,
  done: RELEASE + Math.round(TOTAL * 60),
  board: b(8.4),
};

// 尺：0–2 秒铺满 1520 像素
const AXIS = { left: 200, right: 1720, y: 640, span: 2 };
const px = (s: number) => AXIS.left + (s / AXIS.span) * (AXIS.right - AXIS.left);
const TICKS = Array.from({ length: 41 }, (_, i) => i);

type Mark = { s: number; value: string; caption: string; top: number; align: "left" | "right"; at: number; color: string };
// 标记的高低、朝哪边放，排得互不相压（细线不穿过别的字）
const MARKS: readonly Mark[] = [
  { s: TOTAL, value: TOTAL.toFixed(2), caption: "松开到出字 · 本次实测", top: 250, align: "left", at: T.board + 12, color: COLOR.cinnabar },
  { s: 0.23, value: "0.23", caption: "本机转写 · 中位数", top: 250, align: "left", at: b(9.6), color: COLOR.seal },
  { s: 0.9, value: "0.9", caption: "一分钟录音 · 本机转写", top: 430, align: "right", at: b(10.6), color: COLOR.seal },
  { s: 2, value: "< 2", caption: "主流硬件 · 出字", top: 430, align: "right", at: b(11.6), color: COLOR.ink },
];
// 模型页转写一栏里本机模型表的第一行：Qwen3-ASR 0.6B（Metal 版），一分钟录音 0.9 秒（截图像素）
const QWEN_ROW: Rect = { x: 604, y: 852, w: 1528, h: 128 };
const ROW_SCALE = 0.46;

export const Speed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const elapsed = interpolate(frame, [T.release, T.done], [0, TOTAL], clamp);
  const speaking = interpolate(frame, [T.start + 6, T.start + 16, T.release - 8, T.release], [0, 1, 1, 0], clamp);
  const level = speaking * (0.5 + 0.5 * Math.abs(Math.sin(sec * 6.1) * Math.sin(sec * 2.3 + 0.7)));
  const keyPress = Math.max(
    interpolate(frame, [T.start - 3, T.start, T.start + 8], [0, 1, 0], clamp),
    interpolate(frame, [T.release - 3, T.release, T.release + 8], [0, 1, 0], clamp),
  );
  // 演示的东西（文稿、键帽、悬浮条、跟着光标的大数字）在板子出来时退场
  const demoOut = prog(frame, T.board, 20, EASE.inOut);
  const head = px(elapsed);
  const running = frame >= T.release - 10;

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {/* 尺下面一层很淡的光，托住整把尺 */}
      <div style={{ position: "absolute", left: 200, right: 200, top: AXIS.y - 120, height: 240, borderRadius: "50%", background: "oklch(0.8 0.06 255 / 0.07)", filter: "blur(60px)", opacity: prog(frame, 0, 40) }} />

      <Ruler frame={frame} />
      {running ? <Trail frame={frame} elapsed={elapsed} /> : null}
      <Brackets frame={frame} elapsed={elapsed} />

      {/* 光标：尺上一颗亮点，往上一道短光 */}
      {running && demoOut < 1 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: head - 1,
              top: AXIS.y - 70,
              width: 2,
              height: 86,
              background: "linear-gradient(transparent, oklch(1 0 0 / 0.95) 70%, transparent)",
              opacity: prog(frame, T.release - 10, 10) * (1 - demoOut),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: head - 7,
              top: AXIS.y - 7,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "white",
              boxShadow: `0 0 18px 6px ${frame < T.release + Math.round(SPLIT * 60) ? "oklch(0.8 0.07 255 / 0.8)" : "oklch(0.74 0.17 32 / 0.8)"}`,
              opacity: prog(frame, T.release - 10, 10) * (1 - demoOut),
              transform: `scale(${punch(frame, T.done, 0.6, 24)})`,
            }}
          />
        </>
      ) : null}

      {/* 跟着光标走的大数字 */}
      {demoOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: Math.min(1460, Math.max(460, head)),
            top: 336,
            transform: `translateX(-50%) scale(${punch(frame, T.done, 0.05)})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: (frame < T.board ? 1 : 1 - demoOut) * prog(frame, 8, 20),
            filter: demoOut > 0.01 ? `blur(${8 * demoOut}px)` : undefined,
            textShadow: SHADOW,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.16em" }}>松开到出字</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
            <span
              style={{
                fontSize: 210,
                fontWeight: 200,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                opacity: frame < T.release ? 0.4 : 1,
                textShadow: frame >= T.done ? `0 0 40px oklch(0.74 0.17 32 / ${0.5 * prog(frame, T.done, 20)})` : SHADOW,
              }}
            >
              {elapsed.toFixed(2)}
            </span>
            <span style={{ fontSize: 54, fontWeight: 400, color: COLOR.ink2 }}>秒</span>
          </div>
        </div>
      ) : null}

      {/* 文稿：一块深色玻璃，字整句落进去 */}
      {demoOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 340,
            top: 96,
            width: 1240,
            height: 132,
            boxSizing: "border-box",
            padding: "0 44px",
            display: "flex",
            alignItems: "center",
            borderRadius: 26,
            background: "oklch(0.2 0.012 255 / 0.5)",
            boxShadow: `0 0 0 1px ${COLOR.line}, 0 30px 80px oklch(0 0 0 / 0.35)`,
            backdropFilter: "blur(24px)",
            fontSize: 40,
            letterSpacing: "0.01em",
            ...show(frame, 0, T.board, 24),
          }}
        >
          {frame >= T.done ? (
            <span style={{ color: mix(COLOR.ink, COLOR.cinnabar, prog(frame, T.done + 10, 40)), opacity: prog(frame, T.done, 8) }}>{SENTENCE}</span>
          ) : (
            <span style={{ display: "inline-block", width: 3, height: 46, background: COLOR.seal, opacity: Math.floor(frame / 30) % 2 === 0 ? 1 : 0 }} />
          )}
        </div>
      ) : null}

      {demoOut < 1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 846, display: "flex", justifyContent: "center", alignItems: "center", gap: 44, ...show(frame, 12, T.board, 30) }}>
          <Keycap label="右 ⌥" press={keyPress} size={0.9} />
          <Bar frame={frame} fps={fps} level={level} timing={{ press: T.release, finishing: T.release + 6, done: T.done }} />
        </div>
      ) : null}

      {/* 同一把尺上的四个数 */}
      {MARKS.map((mark) => (
        <Marker key={mark.value} frame={frame} mark={mark} />
      ))}
      {/* 0.9 秒的出处：模型页里那一行，挂在尺下 */}
      <Lift shot={SHOTS.transcribe} rect={QWEN_ROW} scale={ROW_SCALE} radius={12} style={{ left: px(0.9) - (QWEN_ROW.w * ROW_SCALE) / 2, top: 830, ...show(frame, MARKS[2].at + 10, undefined, 20) }} />
      <div
        style={{
          position: "absolute",
          left: px(0.9),
          top: AXIS.y + 12,
          width: 0,
          height: 830 - AXIS.y - 12,
          borderLeft: `1.5px dashed ${COLOR.seal}`,
          opacity: 0.7 * prog(frame, MARKS[2].at + 6, 16),
        }}
      />

      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.start} name="sfxClick" volume={0.32} />
      <Sfx at={T.release} name="sfxClick" volume={0.32} />
      <Sfx at={T.release + Math.round(SPLIT * 60)} name="sfxTap" volume={0.22} />
      <Sfx at={T.done} name="sfxDing" volume={0.45} />
      <Sfx at={T.board} name="sfxSwish" volume={0.3} />
      {MARKS.slice(1).map((mark, i) => (
        <Sfx key={mark.value} at={mark.at} name={(["sfxNote1", "sfxNote2", "sfxNote3"] as const)[i]} volume={0.26} />
      ))}
    </AbsoluteFill>
  );
};

/** 尺：一道细线，0.05 秒一根小刻度、0.25 秒一根中刻度、0.5 秒一根大刻度标数；从左往右一根根亮起来 */
const Ruler: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <div style={{ position: "absolute", left: AXIS.left, width: AXIS.right - AXIS.left, top: AXIS.y, height: 1, background: "oklch(1 0 0 / 0.32)", transformOrigin: "0 0", transform: `scaleX(${prog(frame, 2, 36, EASE.inOut)})` }} />
    {TICKS.map((i) => {
      const major = i % 10 === 0;
      const mid = i % 5 === 0;
      const k = prog(frame, 4 + i * 0.7, 14);
      return (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: px(i * 0.05),
              top: AXIS.y,
              width: 1,
              height: major ? 26 : mid ? 16 : 9,
              background: `oklch(1 0 0 / ${major ? 0.6 : mid ? 0.34 : 0.18})`,
              opacity: k,
            }}
          />
          {major ? (
            <div
              style={{
                position: "absolute",
                left: px(i * 0.05),
                top: AXIS.y + 34,
                transform: "translateX(-50%)",
                fontSize: 20,
                fontWeight: 400,
                color: COLOR.faint,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",
                opacity: k,
              }}
            >
              {i === 40 ? "2.0 秒" : (i * 0.05).toFixed(1)}
            </div>
          ) : null}
        </div>
      );
    })}
  </>
);

/** 光标身后的两段光：本机转写（靛青）、润色（朱砂），底下再垫一层虚的，像是在发光 */
const Trail: React.FC<{ frame: number; elapsed: number }> = ({ frame, elapsed }) => {
  const a = Math.min(elapsed, SPLIT);
  const c = Math.max(0, elapsed - SPLIT);
  const seg = (from: number, len: number, color: string, glow: boolean) => (
    <div
      style={{
        position: "absolute",
        left: px(from),
        width: px(from + len) - px(from),
        top: AXIS.y - (glow ? 5 : 1.5),
        height: glow ? 10 : 3,
        borderRadius: 2,
        background: color,
        filter: glow ? "blur(8px)" : undefined,
        opacity: glow ? 0.9 : 1,
      }}
    />
  );
  // 跑完之后，整条光从左往右再亮一遍
  const sheen = interpolate(frame, [T.done + 4, T.done + 40], [-0.2, 1.2], clamp);
  return (
    <>
      {seg(0, a, COLOR.seal, true)}
      {seg(SPLIT, c, COLOR.cinnabar, true)}
      {seg(0, a, "oklch(0.86 0.06 255)", false)}
      {seg(SPLIT, c, "oklch(0.8 0.15 35)", false)}
      {frame > T.done ? (
        <div
          style={{
            position: "absolute",
            left: px(0),
            width: px(TOTAL) - px(0),
            top: AXIS.y - 2,
            height: 4,
            background: `linear-gradient(90deg, transparent ${sheen * 100 - 8}%, white ${sheen * 100}%, transparent ${sheen * 100 + 8}%)`,
            opacity: 0.9,
          }}
        />
      ) : null}
    </>
  );
};

/** 尺下面两道括号：本机转写多久、润色多久，光走过去时各自标出来 */
const Brackets: React.FC<{ frame: number; elapsed: number }> = ({ frame, elapsed }) => {
  const parts = [
    { from: 0, to: SPLIT, label: "本机转写", value: SPLIT, color: COLOR.seal, at: T.release + Math.round(SPLIT * 60), align: "center" as const },
    // 靠右放：0.9 秒那道虚线从这一段中间穿下去，字别压在线上
    { from: SPLIT, to: TOTAL, label: "润色", value: TOTAL - SPLIT, color: COLOR.cinnabar, at: T.done, align: "right" as const },
  ];
  return (
    <>
      {parts.map((part) => {
        const k = prog(frame, part.at, 20);
        if (elapsed <= part.from || k <= 0) return null;
        const x0 = px(part.from) + 4;
        const x1 = px(part.to) - 4;
        return (
          <div key={part.label} style={{ position: "absolute", left: x0, width: x1 - x0, top: AXIS.y + 78, opacity: k }}>
            <div style={{ height: 10, borderLeft: `1px solid ${part.color}`, borderRight: `1px solid ${part.color}`, borderBottom: `1px solid ${part.color}`, opacity: 0.8 }} />
            <div style={{ marginTop: 12, textAlign: part.align, fontSize: 24, fontWeight: 500, letterSpacing: "0.08em", color: part.color }}>
              {part.label}
              <span style={{ marginLeft: 12, fontWeight: 300, fontVariantNumeric: "tabular-nums", color: COLOR.ink2 }}>{part.value.toFixed(2)} 秒</span>
            </div>
          </div>
        );
      })}
    </>
  );
};

/** 尺上的一个数：尺上一颗点，往上一道细线，顶上是数字和一行说明 */
const Marker: React.FC<{ frame: number; mark: Mark }> = ({ frame, mark }) => {
  const k = prog(frame, mark.at, 26);
  if (k <= 0) return null;
  const x = px(mark.s);
  const labelBottom = mark.top + 140;
  const line = prog(frame, mark.at, 22, EASE.outQuint);
  const right = mark.align === "right";
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: labelBottom + 12,
          width: 1.5,
          height: AXIS.y - labelBottom - 22,
          background: `linear-gradient(oklch(1 0 0 / 0.25), ${mark.color})`,
          transformOrigin: "50% 100%",
          transform: `scaleY(${line})`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 6,
          top: AXIS.y - 6,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: mark.color,
          boxShadow: `0 0 16px 4px ${mark.color}`,
          transform: `scale(${line * punch(frame, mark.at, 0.6, 20)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: mark.top,
          ...(right ? { right: 1920 - x + 18, textAlign: "right" as const } : { left: x + 18 }),
          textShadow: SHADOW,
          ...show(frame, mark.at + 4, undefined, 18),
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, justifyContent: right ? "flex-end" : "flex-start" }}>
          <span style={{ fontSize: 96, fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{mark.value}</span>
          <span style={{ fontSize: 30, fontWeight: 400, color: COLOR.ink2 }}>秒</span>
        </div>
        <div style={{ marginTop: 14, fontSize: 24, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{mark.caption}</div>
      </div>
    </>
  );
};
