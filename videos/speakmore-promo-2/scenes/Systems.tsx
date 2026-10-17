import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Camera } from "../../../engine/camera";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Bar } from "../../../engine/speakmore/Bar";
import { Flash, Sfx } from "../components/Fx";
import { MacWindow, ScreenCard, WinDesktop, WinWindow, WindowsMark } from "../components/Screens";
import { Desktop } from "../components/Stage";
import { UI } from "../icons";
import { prog, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 两个系统：从 Windows 桌面亮起来，悬浮条听写一句，字落进窗口；镜头往后拉，Mac 的桌面从左边进来，
// 两块屏幕并排，同一句话。字幕只两行：Mac 与 Windows / 体验如一。

export const SYSTEMS_FRAMES = b(16);

const SENTENCE = "后天的会议改到周五下午，大家记得把上个月的数据带上。";
const T = { win: 8, bar: 24, press: 100, done: 138, pull: b(7.5), title: b(8.6), labels: b(9.4), out: b(15) };
// 两块屏幕并排时的位置
const CARD = { scale: 0.43, y: 336, left: 112, right: 1920 - 112 - 1920 * 0.43 };

export const SYSTEMS_CAMERA: Camera = { focus: [[0, 1]], zoom: [[0, 1.02]] };

export const Systems: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pull = prog(frame, T.pull, 50);
  const macIn = prog(frame, T.pull + 6, 50);
  const enter = prog(frame, 0, 40);
  const out = prog(frame, T.out, 30, EASE.inOut);

  // Windows 那块：先铺满（亮起时从略大落回来），拉开后缩到右边
  const winScale = interpolate(pull, [0, 1], [1 + 0.08 * (1 - enter), CARD.scale]);
  const winX = interpolate(pull, [0, 1], [(1920 - 1920 * winScale) / 2, CARD.right]);
  const winY = interpolate(pull, [0, 1], [(1080 - 1080 * winScale) / 2, CARD.y]);
  const macX = interpolate(macIn, [0, 1], [-900, CARD.left]);
  const float = (phase: number) => 6 * Math.sin((frame / fps) * 1.6 + phase) * pull;

  // 说话的响度：说话那一段起伏，按下完成后归零
  const t = frame / fps;
  const speaking = interpolate(frame, [T.bar + 10, T.bar + 20, T.press - 8, T.press], [0, 1, 1, 0], clamp);
  const level = speaking * (0.55 + 0.45 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1)));
  const barShow = show(frame, T.bar, T.done + 40, 30);

  const shown = Math.floor(interpolate(frame, [T.done, T.done + 16], [0, [...SENTENCE].length], clamp));
  const lit = prog(frame, T.done + 16, 40);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, transform: `scale(${1 + 0.08 * out})`, opacity: 1 - out }}>
      {/* Mac：从左边进来，窗口里已经是同一句话 */}
      {macIn > 0 ? (
        <ScreenCard x={macX} y={CARD.y + float(0)} scale={CARD.scale}>
          <Desktop focus={0} />
          <MacWindow title="会议纪要" width={980} height={400} style={{ left: 470, top: 190 }}>
            <Text>{SENTENCE}</Text>
          </MacWindow>
        </ScreenCard>
      ) : null}

      <ScreenCard x={winX} y={winY + float(1.4)} scale={winScale} radius={24 * pull}>
        <WinDesktop>
          <WinWindow title="会议纪要.txt" width={980} height={400} style={{ left: 470, top: 190, ...show(frame, T.win, undefined, 30) }}>
            <Text>
              {[...SENTENCE].slice(0, shown).join("")}
              {frame < T.done ? <Caret frame={frame} /> : null}
            </Text>
            {/* 字刚落下时朱砂亮一下，再转回正文的颜色 */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `oklch(0.74 0.17 32 / ${0.08 * (1 - lit) * (shown > 0 ? 1 : 0)})` }} />
          </WinWindow>
          <div style={{ position: "absolute", left: "50%", top: 900, transform: "translateX(-50%)" }}>
            <div style={barShow}>
              <Bar frame={frame} fps={fps} level={level} timing={{ press: T.press, finishing: T.press + 6, done: T.done }} />
            </div>
          </div>
        </WinDesktop>
      </ScreenCard>

      {/* 拉开之后：两行字、两块屏幕底下各一个标志 */}
      <div style={{ position: "absolute", top: 64, left: 0, right: 0, textAlign: "center", color: COLOR.ink, textShadow: SHADOW }}>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: "-0.01em", ...show(frame, T.title) }}>Mac 与 Windows</div>
        <div style={{ marginTop: 10, fontSize: 40, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.12em", ...show(frame, T.title + 12) }}>体验如一</div>
      </div>
      <Label x={CARD.left} frame={frame} at={T.labels}>
        <Glyph icon={UI.apple} size={34} style={{ marginTop: -4 }} />
        macOS
      </Label>
      <Label x={CARD.right} frame={frame} at={T.labels + 8}>
        <WindowsMark size={28} />
        Windows
      </Label>

      <Flash frame={frame} at={[0]} strength={0.9} />
      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.press} name="sfxClick" volume={0.32} />
      <Sfx at={T.done} name="sfxDing" volume={0.4} />
      <Sfx at={T.pull} name="sfxSwish" volume={0.45} />
      <Sfx at={T.labels} name="sfxNote1" volume={0.3} />
      <Sfx at={T.labels + 8} name="sfxNote2" volume={0.3} />
    </AbsoluteFill>
  );
};

const Text: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: "30px 36px", fontSize: 34, lineHeight: 1.65, color: COLOR.paperInk }}>{children}</div>
);

const Caret: React.FC<{ frame: number }> = ({ frame }) => (
  <span style={{ display: "inline-block", width: 3, height: 38, marginLeft: 2, verticalAlign: "-6px", background: "oklch(0.55 0.15 250)", opacity: Math.floor(frame / 30) % 2 === 0 ? 1 : 0 }} />
);

const Label: React.FC<{ x: number; frame: number; at: number; children: React.ReactNode }> = ({ x, frame, at, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      width: 1920 * CARD.scale,
      top: CARD.y + 1080 * CARD.scale + 34,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 14,
      fontSize: 34,
      fontWeight: 600,
      color: COLOR.ink,
      textShadow: SHADOW,
      ...show(frame, at),
    }}
  >
    {children}
  </div>
);
