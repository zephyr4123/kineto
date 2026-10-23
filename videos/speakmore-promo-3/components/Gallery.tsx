import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { prog } from "../../../engine/motion";
import { UI } from "../../../engine/speakmore/icons";
import { Tile } from "../../../engine/speakmore/Logo";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE } from "../theme";

// 能接哪些模型：各家标志排成一列往画面深处退去（前后虚影），一家一家走到最前面、名字亮在底下，走过的从镜头边上掠过去。
// DeepSeek 打头、停得最久（他说大家最关心它）；家名照官网 models.vendors，最后一格是自定义服务。

const PROVIDERS = [
  { name: "DeepSeek", src: assets.logoDeepseek },
  { name: "Qwen", src: assets.logoQwen },
  { name: "Gemini", src: assets.logoGemini },
  { name: "OpenAI", src: assets.logoOpenai },
  { name: "Kimi", src: assets.logoKimi, dark: true },
  { name: "Zhipu GLM", src: assets.logoZhipu },
  { name: "MiniMax", src: assets.logoMinimax },
  { name: "Bailian", src: assets.logoBailian },
  { name: "SenseVoice", src: assets.logoAlibabaCloud },
  { name: "Ollama", src: assets.logoOllama },
  { name: "LM Studio", src: assets.logoLmstudio },
  { name: "Custom service", src: null },
] as const;

const TILE = 300;
const DEPTH = 480;

/** at 进场；first 帧起从 DeepSeek 往后走，每 step 帧换一家；out 退场 */
export const Gallery: React.FC<{ at: number; first: number; step: number; out: number }> = ({ at, first, step, out }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, at, 20);
  const z = prog(frame, out, 16, EASE.inOut);
  if (a <= 0 || z >= 1) return null;
  // 走到第几家：每一步先快后慢地挪过去
  const k = Math.max(0, (frame - first) / step);
  const whole = Math.min(PROVIDERS.length - 1, Math.floor(k));
  const cursor = whole >= PROVIDERS.length - 1 ? whole : whole + EASE.inOut(Math.min(1, (k - whole) / 0.7));
  const front = Math.round(cursor);
  const label = 1 - Math.min(1, Math.abs(cursor - front) * 2.4);
  return (
    <AbsoluteFill style={{ perspective: 1400, opacity: a * (1 - z), filter: z > 0 ? `blur(${10 * z}px)` : undefined }}>
      {/* 后面的先画，前面的盖在上面 */}
      {PROVIDERS.map((p, i) => ({ p, i, d: i - cursor }))
        .filter(({ d }) => d > -1.6 && d < 7)
        .sort((x, y) => y.d - x.d)
        .map(({ p, i, d }) => {
          const behind = Math.max(0, d);
          const passed = Math.max(0, -d);
          const opacity = d >= 0 ? Math.max(0, 1 - behind * 0.13) : Math.max(0, 1 - passed * 1.1);
          const blur = d >= 0 ? behind * 3.2 : passed * 14;
          return (
            <div
              key={p.name}
              style={{
                position: "absolute",
                left: 960 - TILE / 2,
                top: 470 - TILE / 2,
                transform: `translate3d(${d * 400 + passed * -560}px, ${-d * 30}px, ${-d * DEPTH}px) rotateY(${-22 * Math.tanh(d)}deg)`,
                opacity,
                filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
              }}
            >
              {p.src ? (
                <Tile src={p.src} size={TILE} dark={"dark" in p && p.dark} />
              ) : (
                <div style={{ width: TILE, height: TILE, borderRadius: TILE * 0.235, display: "grid", placeItems: "center", background: "oklch(0.995 0 0)", color: COLOR.ink, boxShadow: `0 ${TILE * 0.12}px ${TILE * 0.32}px oklch(0 0 0 / 0.35)` }}>
                  <Glyph icon={UI.plug} size={TILE * 0.5} />
                </div>
              )}
              {i === 0 ? <div style={{ position: "absolute", inset: -14, borderRadius: TILE * 0.28, boxShadow: `0 0 0 2px ${COLOR.neonIndigo}, 0 0 60px color-mix(in oklab, ${COLOR.neonIndigo} 50%, transparent)`, opacity: Math.max(0, 1 - Math.abs(d) * 1.5) }} /> : null}
            </div>
          );
        })}
      {/* 最前面那家的名字 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 470 + TILE / 2 + 60, textAlign: "center", fontFamily: DISPLAY, fontSize: 64, fontWeight: 650, letterSpacing: "-0.02em", color: COLOR.nightInk, opacity: label, transform: `translateY(${12 * (1 - label)}px)`, filter: label < 1 ? `blur(${6 * (1 - label)}px)` : undefined }}>
        {PROVIDERS[front].name}
      </div>
    </AbsoluteFill>
  );
};
