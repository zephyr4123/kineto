import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import type { Camera } from "../components/Stage";
import { show } from "../motion";
import { COLOR, EASE, SANS } from "../theme";

// 第六章 成本：按量计费，三个数并排（每句、每月、免费额度内）→ 一年的花费和 Typeless Pro 并排两根条。
// 数都出自 SpeakMore 的 README：一句 $0.0003（Gemini 提示词缓存之后）；每月 $0.67–1.05（按真实用量和 Gemini 3.6 Flash
// 标准价估算），取"约 $1"，一年约 $12；Typeless Pro 年付 $144（typeless.com/pricing，2026-10-14 查）。

const STATS = [
  { value: "$0.0003", label: "每句" },
  { value: "约 $1", label: "每月" },
  { value: "$0", label: "免费额度内" },
];
const BARS = [
  { name: "Typeless Pro", value: "$144 / 年", share: 1, color: COLOR.muted },
  { name: "SpeakMore", value: "约 $12 / 年", share: 12 / 144, color: COLOR.cinnabar },
];
const TRACK = 1040;

const T = { title: 4, stats: 20, statsOut: 196, compare: 212, grow: 236, out: 418, end: 438 };

export const COST_FRAMES = T.end;
export const COST_CAMERA: Camera = { focus: [[0, 1]], zoom: [[0, 1]] };

export const Cost: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <div style={{ position: "absolute", left: 200, top: 270, fontSize: 64, fontWeight: 500, letterSpacing: "0.02em", ...show(frame, T.title, T.statsOut) }}>
        按量计费，每月约一美元。
      </div>
      {STATS.map((s, i) => (
        <div key={s.label} style={{ position: "absolute", left: 200 + i * 600, top: 450, ...show(frame, T.stats + i * 12, T.statsOut + i * 3) }}>
          <div style={{ fontSize: 128, fontWeight: 250, lineHeight: 1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          <div style={{ marginTop: 30, fontSize: 32, color: COLOR.muted, letterSpacing: "0.12em" }}>{s.label}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 200, top: 790, fontSize: 24, color: COLOR.muted, letterSpacing: "0.06em", ...show(frame, T.stats + 40, T.statsOut) }}>
        依 Gemini 3.6 Flash 官方标准价估算
      </div>

      <div style={{ position: "absolute", left: 200, top: 300, fontSize: 64, fontWeight: 500, letterSpacing: "0.02em", ...show(frame, T.compare, T.out) }}>
        全年花费，约为 Typeless 的十二分之一。
      </div>
      {BARS.map((b, i) => {
        const grow = interpolate(frame, [T.grow + i * 16, T.grow + i * 16 + 60], [0, 1], { ...clamp, easing: EASE.outExpo });
        return (
          <div key={b.name} style={{ position: "absolute", left: 200, top: 500 + i * 150, display: "flex", alignItems: "center", ...show(frame, T.compare + 12 + i * 10, T.out) }}>
            <span style={{ width: 340, fontSize: 40, fontWeight: 500 }}>{b.name}</span>
            <span style={{ position: "relative", width: TRACK, height: 22 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: 11, background: "oklch(1 0 0 / 0.08)" }} />
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: TRACK * b.share * grow, borderRadius: 11, background: b.color }} />
              <span
                style={{
                  position: "absolute",
                  left: TRACK * b.share * grow + 24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 40,
                  fontWeight: 300,
                  whiteSpace: "nowrap",
                  opacity: grow,
                  // 长条的数字放在条里面靠右，短条的放在条外面
                  ...(b.share === 1 ? { left: "auto", right: 0, top: -58, transform: "none" } : {}),
                }}
              >
                {b.value}
              </span>
            </span>
          </div>
        );
      })}

      {STATS.map((_, i) => (
        <Sequence key={i} from={T.stats + i * 12 + 6} layout="none" name="sfx:tick">
          <Audio src={staticFile(assets.sfxTick)} volume={0.32} />
        </Sequence>
      ))}
      <Sequence from={T.grow - 6} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.22} />
      </Sequence>
    </AbsoluteFill>
  );
};
