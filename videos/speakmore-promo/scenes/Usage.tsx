import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Bar } from "../components/Bar";
import { Caption } from "../components/Caption";
import { Glyph } from "../components/Glyph";
import type { Camera } from "../components/Stage";
import { Window } from "../components/Window";
import { APP_ICONS } from "../icons";
import { show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, WINDOW } from "../theme";

// 第三章 怎么用：桌面回到眼前，一封新邮件，按一下右 Option、说一句、再按一下，整理好的话落在光标处 →
// 三个不同的应用里各落一句 → 三种整理各闪一下（删语气词、改口只留最后、列举成条目）。
// 口述和成品都是真的：系统语音读原话、交给 SpeakMore 当前的提示词（Gemini）整理，三次里至少两次一字不差。
// 不写"几秒出字"：本机记录里模型一般 3.7 秒回话，和 README 的"约 2 秒"对不上，没有出处的数不上片子。

const SPOKEN = "嗯，跟大家同步一下，新版本今天下午三点上线，那个，有问题随时在群里说。";
const WRITTEN = "跟大家同步一下，新版本今天下午 3 点上线，有问题随时在群里说";

const APPS = [
  { icon: "gmail", title: "邮件", text: "附件是第三季度的报价，麻烦查收一下" },
  { icon: "vscode", title: "提交信息", text: "修复登录页在弱网下的超时问题" },
  { icon: "notion", title: "周会纪要", text: "周会纪要：下周起改成双周发版" },
] as const;

const CLEANUPS = [
  {
    label: "语气词，删去。",
    spoken: "嗯，这个方案，呃，整体是可以的，就是，排期还要再确认一下。",
    written: ["这个方案整体是可以的，排期还要再确认一下"],
  },
  { label: "改口，只留定论。", spoken: "把会议室订在明天上午十点，不对，十一点。", written: ["把会议室定在明天上午 11 点"] },
  {
    label: "列举，自成条目。",
    spoken: "周五之前要完成三件事，第一更新报价单，第二确认物流，第三把合同发给法务。",
    written: ["周五之前要完成三件事：", "1. 更新报价单", "2. 确认物流", "3. 把合同发给法务"],
  },
] as const;

const SPEECH_START = 56;
const STEP = 2;
// 口述的每个字什么时候冒出来：逗号后多停一会儿
const speechAt = (() => {
  let at = SPEECH_START;
  return [...SPOKEN].map((ch) => {
    const t = at;
    at += STEP + (ch === "，" ? 4 : 0);
    return t;
  });
})();

const T = {
  win: 8,
  barIn: 30,
  press: 44,
  stop: 152,
  paste: 208,
  barOut: 236,
  winOut: 296,
  apps: 306,
  appsOut: 452,
  cleanups: 476,
  card: 80,
  end: 766,
};

export const USAGE_FRAMES = T.end;
export const USAGE_CAMERA: Camera = {
  focus: [
    [0, 1],
    [40, 0.45],
    [T.appsOut, 0.45],
    [T.appsOut + 40, 1],
  ],
  zoom: [[0, 1]],
};

export const Usage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const level = Math.min(1, speechAt.reduce((sum, at) => (frame >= at ? sum + 0.34 * Math.exp(-(frame - at) / 7) : sum), 0));
  const barIn = interpolate(frame, [T.barIn, T.barIn + 40], [0, 1], { ...clamp, easing: EASE.outExpo });
  const barOut = interpolate(frame, [T.barOut, T.barOut + 30], [0, 1], { ...clamp, easing: EASE.outQuint });
  const spokenOut = interpolate(frame, [T.paste - 6, T.paste + 14], [0, 1], { ...clamp, easing: EASE.outQuint });
  const pasted = interpolate(frame, [T.paste, T.paste + 6], [0, 1], clamp);
  // 贴进去的那一下：字底下一层朱砂很快淡掉
  const flash = interpolate(frame, [T.paste, T.paste + 50], [0.28, 0], clamp);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <Caption frame={frame} at={20} out={T.stop}>
        按下，开口。
      </Caption>
      <Caption frame={frame} at={T.stop + 4} out={T.paste + 22}>
        再按，成文。
      </Caption>
      <Caption frame={frame} at={T.paste + 26} out={T.winOut}>
        文字即落于光标之处。
      </Caption>

      {/* 一封新邮件 */}
      <div style={{ position: "absolute", left: 440, top: 236, width: 1040, height: 430, ...show(frame, T.win, T.winOut, 30) }}>
        <Window width={1040} height={430} title="新邮件">
          <div style={{ padding: "14px 36px", color: WINDOW.text, fontSize: 26 }}>
            {[
              ["收件人", "产品组"],
              ["主题", "版本发布"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 24, padding: "14px 0", borderBottom: `1px solid ${WINDOW.line}` }}>
                <span style={{ color: WINDOW.faint, width: 80 }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div style={{ position: "relative", marginTop: 30, fontSize: 32, lineHeight: 1.6 }}>
              {/* 贴进去之前不占位置，光标停在开头 */}
              {frame >= T.paste ? <span style={{ opacity: pasted, background: `oklch(0.74 0.17 32 / ${flash})`, borderRadius: 6 }}>{WRITTEN}</span> : null}
              <Caret frame={frame} />
            </div>
          </div>
        </Window>
      </div>

      {/* 说的话：压暗、小一号，跟着声音一个字一个字冒出来 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 700,
          textAlign: "center",
          fontSize: 30,
          color: COLOR.spoken,
          textShadow: SHADOW,
          opacity: 1 - spokenOut,
          filter: spokenOut > 0.01 ? `blur(${8 * spokenOut}px)` : undefined,
        }}
      >
        {[...SPOKEN].map((ch, i) => {
          const a = interpolate(frame, [speechAt[i], speechAt[i] + 12], [0, 1], { ...clamp, easing: EASE.outExpo });
          return (
            <span key={i} style={{ opacity: a, filter: a < 0.99 ? `blur(${6 * (1 - a)}px)` : undefined }}>
              {ch}
            </span>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          opacity: barIn * (1 - barOut),
          filter: `blur(${10 * (1 - barIn) + 8 * barOut}px)`,
          transform: `translate(-50%, ${30 * (1 - barIn) + 24 * barOut}px)`,
        }}
      >
        <Bar frame={frame} fps={fps} level={level} timing={{ press: T.stop, finishing: T.stop + 6, done: T.paste - 8 }} />
      </div>
      <Keycap frame={frame} presses={[T.press, T.stop]} style={{ left: 1176, top: 780, opacity: barIn * (1 - barOut) }} />

      {/* 三个应用里各落一句 */}
      <Caption frame={frame} at={T.apps} out={T.appsOut}>
        凡可输入之处，皆可开口。
      </Caption>
      {APPS.map((app, i) => {
        const at = T.apps + 40 + i * 28;
        const a = interpolate(frame, [at, at + 6], [0, 1], clamp);
        return (
          <div key={app.icon} style={{ position: "absolute", left: 150 + i * 550, top: 360, width: 520, height: 280, ...show(frame, T.apps + i * 8, T.appsOut, 30) }}>
            <Window
              width={520}
              height={280}
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 10, color: WINDOW.text }}>
                  <Glyph icon={APP_ICONS[app.icon]} size={22} />
                  {app.title}
                </span>
              }
            >
              <div style={{ padding: "34px 34px", color: WINDOW.text, fontSize: 30, lineHeight: 1.6 }}>
                <span style={{ opacity: a, background: `oklch(0.74 0.17 32 / ${interpolate(frame, [at, at + 40], [0.28, 0], clamp)})`, borderRadius: 6 }}>
                  {app.text}
                </span>
                {a < 1 ? <Caret frame={frame} /> : null}
              </div>
            </Window>
          </div>
        );
      })}

      {/* 三种整理 */}
      {CLEANUPS.map((c, i) => {
        const at = T.cleanups + i * T.card;
        const out = i === CLEANUPS.length - 1 ? T.end - 26 : at + T.card - 8;
        const settled = interpolate(frame, [at + 20, at + 40], [0, 1], clamp);
        return (
          <div key={c.label}>
            <div style={{ position: "absolute", left: 200, top: 470, fontSize: 68, fontWeight: 500, letterSpacing: "0.02em", ...show(frame, at, out) }}>{c.label}</div>
            <div style={{ position: "absolute", left: 1000, width: 720, top: 360, fontSize: 32, lineHeight: 1.55, color: COLOR.spoken, ...show(frame, at + 6, out) }}>
              <span style={{ opacity: 1 - 0.45 * settled }}>{c.spoken}</span>
            </div>
            <div style={{ position: "absolute", left: 1000, width: 720, top: 520, fontSize: 40, fontWeight: 500, lineHeight: 1.55 }}>
              {c.written.map((line, j) => (
                <div key={line} style={show(frame, at + 22 + j * 5, out)}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Sequence from={T.win} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.22} />
      </Sequence>
      {[T.press, T.stop].map((at) => (
        <Sequence key={at} from={at} layout="none" name="sfx:key">
          <Audio src={staticFile(assets.sfxKey)} volume={0.7} />
        </Sequence>
      ))}
      {[T.paste, T.apps + 40, T.apps + 68, T.apps + 96].map((at) => (
        <Sequence key={at} from={at} layout="none" name="sfx:tick">
          <Audio src={staticFile(assets.sfxTick)} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={T.apps} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.2} />
      </Sequence>
      {CLEANUPS.map((_, i) => (
        <Sequence key={i} from={T.cleanups + i * T.card + 18} layout="none" name="sfx:gather">
          <Audio src={staticFile(assets.sfxGather)} volume={0.28} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** 输入框里的光标：一秒闪一次 */
const Caret: React.FC<{ frame: number }> = ({ frame }) => (
  <span
    style={{
      display: "inline-block",
      width: 3,
      height: "1.1em",
      marginLeft: 3,
      verticalAlign: "-0.18em",
      background: COLOR.sealCinnabar,
      opacity: Math.floor(frame / 30) % 2 === 0 ? 1 : 0,
    }}
  />
);

/** 右 Option 键：按下去的那几帧往下沉、阴影收起来 */
const Keycap: React.FC<{ frame: number; presses: readonly number[]; style?: React.CSSProperties }> = ({ frame, presses, style }) => {
  const down = Math.max(...presses.map((p) => interpolate(frame, [p - 2, p + 2, p + 10, p + 18], [0, 1, 1, 0], clamp)));
  return (
    <div
      style={{
        position: "absolute",
        width: 84,
        height: 80,
        borderRadius: 14,
        background: "oklch(0.97 0.003 80)",
        color: WINDOW.text,
        boxShadow: `0 ${6 - 4 * down}px 0 oklch(0.78 0.006 80), 0 ${10 - 6 * down}px 18px oklch(0 0 0 / 0.3)`,
        transform: `translateY(${4 * down}px)`,
        fontFamily: SANS,
        ...style,
      }}
    >
      <span style={{ position: "absolute", right: 12, top: 8, fontSize: 22 }}>⌥</span>
      <span style={{ position: "absolute", left: 12, bottom: 10, fontSize: 17, fontWeight: 500 }}>option</span>
    </div>
  );
};
