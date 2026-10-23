import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Glyph, type Icon } from "../../../engine/Glyph";
import { prog } from "../../../engine/motion";
import { UI } from "../../../engine/speakmore/icons";
import { COLOR, DISPLAY, EASE, SANS } from "../theme";

// 三种识别方式并排三列（平级，不分主次），一拍一拍依次点亮：每列上面一条图标画的流程（声音从哪儿走到哪儿），
// 下面英文名、中文名和这一种的特色。说法照官网"ways"一节：直出音频直达模型一步成文；混合本机转写、任意模型润色、只上传文字；
// 离线完全在本机、不联网不要密钥，只做语音输入。

type Step = { icon: Icon; cloud?: boolean };
type Mode = { name: string; zh: string; flow: readonly Step[]; points: readonly { icon: Icon; text: string }[] };

const MIC: Step = { icon: UI.mic };
const DEVICE: Step = { icon: UI.chip };
const CLOUD: Step = { icon: UI.cloud, cloud: true };
const TEXT: Step = { icon: UI.text };

export const MODES: readonly Mode[] = [
  {
    name: "Direct",
    zh: "原生直出",
    flow: [MIC, CLOUD, TEXT],
    points: [
      { icon: UI.cloud, text: "音频直达模型" },
      { icon: UI.check, text: "一步成文" },
    ],
  },
  {
    name: "Hybrid",
    zh: "转写加润色",
    flow: [MIC, DEVICE, CLOUD, TEXT],
    points: [
      { icon: UI.chip, text: "本机转写" },
      { icon: UI.plug, text: "润色模型任选" },
      { icon: UI.shield, text: "只上传文字" },
    ],
  },
  {
    name: "Offline",
    zh: "本地直接跑",
    flow: [MIC, DEVICE, TEXT],
    points: [
      { icon: UI.wifiOff, text: "不联网　不上传" },
      { icon: UI.key, text: "不需要密钥" },
      { icon: UI.mic, text: "用于语音输入" },
    ],
  },
];

const COL = 570;
const NODE = 92;

/** lights[i] 是第 i 列点亮的帧；all 帧起三列一起亮着 */
export const Modes: React.FC<{ at: number; lights: readonly number[]; all: number; out: number }> = ({ at, lights, all, out }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, at, 20);
  const z = prog(frame, out, 16, EASE.inOut);
  if (a <= 0 || z >= 1) return null;
  // 现在亮着的是哪一列：最近一个点亮的；到 all 以后三列都亮
  const current = lights.reduce((c, t, i) => (frame >= t ? i : c), -1);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: a * (1 - z), filter: z > 0 ? `blur(${10 * z}px)` : undefined, transform: `translateY(${50 + 30 * (1 - a)}px)` }}>
      <div style={{ display: "flex", gap: 34 }}>
        {MODES.map((mode, i) => {
          // 亮着的那列随下一列点亮慢慢暗下去；all 以后三列一起亮
          const own = i === current ? prog(frame, lights[i], 14) : i < current ? 1 - prog(frame, lights[i + 1], 14) : 0;
          const on = Math.max(own, prog(frame, all, 16));
          const focus = frame < all && i === current ? prog(frame, lights[i], 18, EASE.outExpo) : 0;
          return <Column key={mode.name} mode={mode} on={on} focus={focus} since={lights[i]} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

const Column: React.FC<{ mode: Mode; on: number; focus: number; since: number }> = ({ mode, on, focus, since }) => {
  const frame = useCurrentFrame();
  const dim = 0.32 + 0.68 * on;
  return (
    <div
      style={{
        width: COL,
        padding: "44px 40px 46px",
        borderRadius: 36,
        background: `oklch(1 0 0 / ${0.35 + 0.55 * on})`,
        boxShadow: `0 0 0 1.5px oklch(0.62 0.1 270 / ${0.12 + 0.3 * on}), 0 ${40 * on}px ${110 * on}px -40px oklch(0.25 0.05 265 / ${0.45 * on})`,
        transform: `scale(${0.95 + 0.08 * focus})`,
        opacity: dim,
        filter: on < 0.5 ? `blur(${2 * (1 - on * 2)}px)` : undefined,
      }}
    >
      <Flow steps={mode.flow} on={on} since={since} />
      <div style={{ marginTop: 40, display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 70, fontWeight: 650, letterSpacing: "-0.025em", color: COLOR.ink }}>{mode.name}</span>
        <span style={{ fontFamily: SANS, fontSize: 34, fontWeight: 500, color: on > 0.5 ? COLOR.cinnabar : COLOR.ink2 }}>{mode.zh}</span>
      </div>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        {mode.points.map((p, i) => {
          const t = prog(frame, since + 8 + i * 6, 14);
          return (
            <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: SANS, fontSize: 33, color: COLOR.ink, opacity: 0.55 + 0.45 * t, transform: `translateX(${12 * (1 - t)}px)` }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", background: "oklch(0.95 0.02 265)", color: "oklch(0.45 0.12 265)", flex: "none" }}>
                <Glyph icon={p.icon} size={28} />
              </span>
              {p.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** 一条流程：几个圆圈里的图标，用线连起来；点亮时线从左画到右，一个光点沿线跑过去 */
const Flow: React.FC<{ steps: readonly Step[]; on: number; since: number }> = ({ steps, on, since }) => {
  const frame = useCurrentFrame();
  const width = COL - 80;
  const gap = (width - NODE) / (steps.length - 1);
  const draw = prog(frame, since, 26, EASE.inOut);
  const run = ((frame - since) % 48) / 48;
  return (
    <div style={{ position: "relative", width, height: NODE + 34 }}>
      <div style={{ position: "absolute", left: NODE / 2, right: NODE / 2, top: NODE / 2 - 1.5, height: 3, borderRadius: 2, background: "oklch(0.88 0.01 265)" }} />
      <div style={{ position: "absolute", left: NODE / 2, top: NODE / 2 - 1.5, height: 3, borderRadius: 2, width: (width - NODE) * draw * on, background: COLOR.cinnabar }} />
      {on > 0.5 && frame >= since ? (
        <div style={{ position: "absolute", left: NODE / 2 + (width - NODE) * run - 9, top: NODE / 2 - 9, width: 18, height: 18, borderRadius: 9, background: COLOR.cinnabar, boxShadow: `0 0 18px ${COLOR.cinnabar}`, opacity: draw }} />
      ) : null}
      {steps.map((s, i) => {
        const lit = prog(frame, since + i * 6, 12) * on;
        return (
          <div key={`${i}-${s.cloud}`} style={{ position: "absolute", left: i * gap, top: 0, width: NODE, height: NODE, borderRadius: NODE / 2, display: "grid", placeItems: "center", background: s.cloud ? "oklch(0.96 0.025 265)" : "oklch(1 0 0)", boxShadow: `0 0 0 2px oklch(0.62 0.1 270 / ${0.25 + 0.5 * lit}), 0 12px 30px -12px oklch(0.25 0.05 265 / 0.4)`, color: s.cloud ? "oklch(0.5 0.14 265)" : COLOR.ink }}>
            <Glyph icon={s.icon} size={40} />
          </div>
        );
      })}
    </div>
  );
};
