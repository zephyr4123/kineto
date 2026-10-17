import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../../../engine/motion";
import { Bar } from "../../../engine/speakmore/Bar";
import { Keycap, Stat } from "../components/Bits";
import { Flash, MotionBlurX, Sfx } from "../components/Fx";
import { MacWindow } from "../components/Screens";
import { deepCamera } from "../components/Stage";
import { mix, prog, punch, show } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SHADOW, b } from "../theme";

// 速度：按一下右 Option 开始说，再按一下停；松开那一刻秒表起跑，按真实的快慢走（1.24 秒，不加速），
// 下面一条分成本机转写、润色两段跟着填满，字落进文稿、秒表停住。随后两拍一切：主流硬件 < 2 秒、本机转写 0.23 秒。
// 1.24 秒是 2026-10-16 在 App 里实测的一次（11.3 秒的录音：解码 65 ms、转写 626 ms、润色 550 ms，
// SpeakMore 仓库 bench/results/e2e-local-2026-10-16.md）；0.23 秒是本机转写的中位数（官网同一个数）。

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
  big1: b(10),
  big2: b(12),
  out: b(14.4),
};

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
  const demoOut = frame >= T.big1 ? 1 : 0;

  // 甩出去：往左甩，带横向模糊
  const whip = prog(frame, T.out, 22, EASE.inOut);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <MotionBlurX id="speed-whip" amount={60 * Math.sin(Math.PI * whip)} />
      <AbsoluteFill style={{ transform: `translateX(${-1400 * whip}px)`, filter: whip > 0.01 && whip < 0.99 ? "url(#speed-whip)" : undefined, opacity: 1 - whip }}>
        {demoOut === 0 ? (
          <>
            <MacWindow title="新建文稿" width={860} height={330} style={{ left: 150, top: 230, ...show(frame, 0, undefined, 30) }}>
              <div style={{ padding: "30px 36px", fontSize: 36, lineHeight: 1.62, color: COLOR.paperInk }}>
                {frame >= T.done ? (
                  <span style={{ color: mix(COLOR.paperInk, "oklch(0.6 0.17 32)", prog(frame, T.done + 10, 40)) }}>{SENTENCE}</span>
                ) : (
                  <span style={{ display: "inline-block", width: 3, height: 40, verticalAlign: "-7px", background: "oklch(0.55 0.15 250)", opacity: Math.floor(frame / 30) % 2 === 0 ? 1 : 0 }} />
                )}
              </div>
            </MacWindow>

            <div style={{ position: "absolute", left: 1110, width: 680, top: 236, display: "flex", flexDirection: "column", alignItems: "center", ...show(frame, 8) }}>
              <div style={{ fontSize: 34, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.08em", textShadow: SHADOW }}>松开到出字</div>
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
              <div style={{ position: "relative", width: 640, height: 14, marginTop: 34, borderRadius: 7, background: "oklch(1 0 0 / 0.12)", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(fill, split) * 100}%`, background: COLOR.seal }} />
                <div style={{ position: "absolute", left: `${split * 100}%`, top: 0, bottom: 0, width: `${Math.max(0, fill - split) * 100}%`, background: COLOR.cinnabar }} />
              </div>
              <div style={{ position: "relative", width: 640, height: 40, marginTop: 14, fontSize: 26, color: COLOR.ink2 }}>
                <span style={{ position: "absolute", left: 0 }}>本机转写</span>
                <span style={{ position: "absolute", left: `${split * 100}%`, marginLeft: 14 }}>润色</span>
              </div>
            </div>

            <div style={{ position: "absolute", left: 0, right: 0, top: 812, display: "flex", justifyContent: "center", alignItems: "center", gap: 44, ...show(frame, 12, undefined, 30) }}>
              <Keycap label="右 ⌥" press={keyPress} size={0.95} />
              <Bar frame={frame} fps={fps} level={level} timing={{ press: T.release, finishing: T.release + 6, done: T.done }} />
            </div>
          </>
        ) : null}

        {frame >= T.big1 && frame < T.big2 ? <BigStat frame={frame} at={T.big1} label="主流硬件" value="< 2" unit="秒" /> : null}
        {frame >= T.big2 ? <BigStat frame={frame} at={T.big2} label="本机转写" value="0.23" unit="秒" /> : null}
      </AbsoluteFill>

      <Flash frame={frame} at={[0, T.big1, T.big2]} strength={0.7} />
      <Flash frame={frame} at={[T.done]} strength={0.25} dur={12} />
      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.start} name="sfxClick" volume={0.32} />
      <Sfx at={T.release} name="sfxClick" volume={0.32} />
      <Sfx at={T.release + Math.round(((MS.decode + MS.transcribe) / 1000) * 60)} name="sfxTap" volume={0.22} />
      <Sfx at={T.done} name="sfxDing" volume={0.45} />
      <Sfx at={T.big1} name="sfxFlash" volume={0.3} />
      <Sfx at={T.big2} name="sfxFlash" volume={0.3} />
      <Sfx at={T.out} name="sfxSwish" volume={0.45} />
    </AbsoluteFill>
  );
};

const BigStat: React.FC<{ frame: number; at: number; label: string; value: string; unit: string }> = ({ frame, at, label, value, unit }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${punch(frame, at, 0.06, 24)})`, textShadow: SHADOW }}>
    <Stat label={label} value={value} unit={unit} size={250} style={{ filter: `blur(${6 * (1 - prog(frame, at, 8))}px)` }} />
  </AbsoluteFill>
);
