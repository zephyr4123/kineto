import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Panel } from "../components/Panel";
import { Line, Neon, Reel, Scramble } from "../components/Type";
import { Sub, Tag } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS, b } from "../theme";

// 暗场（第 136–168 拍，原曲的过门、低音全撤）：
// "One app."（霓虹描字）压在首页深色真截图上，推近到首页顶上那排热键 → 三行霓虹键帽：右⌥ 语音输入、右⌥ 空格 语音翻译、右⌥ 回车 划词翻译
// → "Rebind any key."（key 滚过 ⌥ ⌘ F5 Caps）配设置·快捷键的真截图 → "Choose any model."（model 滚过各家模型）配引擎页真截图
// → "One key. Ready."：密钥面板的真截图，一把密钥粘进去、乱码解成星号、打勾 → 第 166 拍起一切收向中间，等第 168 拍砸下。
const START = 136;
const at = (n: number) => b(n - START);
export const ONEAPP_FRAMES = b(32);

const ROWS = [
  { keys: ["右 ⌥"], name: "Voice input", zh: "语音输入", color: COLOR.neonCinnabar },
  { keys: ["右 ⌥", "空格"], name: "Voice translation", zh: "语音翻译", color: COLOR.neonIndigo },
  { keys: ["右 ⌥", "回车"], name: "Selection translation", zh: "划词翻译", color: COLOR.ochre },
] as const;

const NeonKey: React.FC<{ label: string; color: string; press: number }> = ({ label, color, press }) => {
  const frame = useCurrentFrame();
  const t = frame - press;
  const down = t >= 0 && t < 10 ? Math.sin((t / 10) * Math.PI) : 0;
  const lit = prog(frame, press, 8);
  return (
    <span
      style={{
        height: 96,
        minWidth: 96,
        padding: "0 30px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        background: "oklch(0.2 0.03 275)",
        color: COLOR.nightInk,
        fontFamily: SANS,
        fontSize: 36,
        fontWeight: 500,
        transform: `translateY(${6 * down}px)`,
        boxShadow: `0 0 0 1.5px color-mix(in oklab, ${color} ${30 + 70 * lit}%, transparent), 0 0 ${10 + 40 * lit * (1 - down * 0.3)}px color-mix(in oklab, ${color} ${50 * lit}%, transparent), 0 ${8 - 6 * down}px 0 oklch(0.12 0.02 275)`,
      }}
    >
      {label}
    </span>
  );
};

export const OneApp: React.FC = () => {
  const frame = useCurrentFrame();
  const gather = prog(frame, at(166), b(2), easeIn);
  const keyTyped = Math.floor(prog(frame, at(161.6), 26, (t) => t) * 24);

  return (
    <AbsoluteFill style={{ transform: `scale(${1 - 0.85 * gather})`, opacity: 1 - gather, filter: gather > 0 ? `blur(${12 * gather}px)` : undefined }}>
      {/* One app.：首页深色真截图，推近到顶上那排热键 */}
      <Panel src={assets.appHomeDark} w={1300} h={(1300 * 1500) / 2160} y={60} rotY={-12} rotX={8} at={0} out={at(141.4)} neon={COLOR.neonIndigo} zoom={{ at: at(138.6), dur: 40, rect: { x: 0.24, y: 0.07, w: 0.56, h: 0.16 } }} />
      <Line out={at(141.4)} y={-400}>
        <Neon value="One app." at={at(136.4)} glow={COLOR.neonIndigo} size={110} />
        <span style={{ width: 40 }} />
        <Neon value="Three features." at={at(138)} glow={COLOR.neonCinnabar} size={110} color={COLOR.nightInk2} />
      </Line>

      {/* 三行霓虹键帽，每拍按下一行 */}
      {frame >= at(141.6) && frame < at(148) ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, opacity: 1 - prog(frame, at(147.4), 12) }}>
          {ROWS.map((row, i) => {
            const t = prog(frame, at(141.6) + i * 8, 18, EASE.outExpo);
            return (
              <div key={row.name} style={{ display: "flex", alignItems: "center", gap: 18, width: 1460, whiteSpace: "nowrap", opacity: t, transform: `translateX(${-200 * (1 - t)}px)`, filter: t < 1 ? `blur(${8 * (1 - t)}px)` : undefined }}>
                <div style={{ display: "flex", gap: 16, width: 420, justifyContent: "flex-end" }}>
                  {row.keys.map((k) => (
                    <NeonKey key={k} label={k} color={row.color} press={at(142 + i)} />
                  ))}
                </div>
                <span style={{ marginLeft: 50, fontFamily: DISPLAY, fontSize: 62, fontWeight: 600, letterSpacing: "-0.02em", color: COLOR.nightInk, whiteSpace: "nowrap" }}>{row.name}</span>
                <span style={{ fontFamily: SANS, fontSize: 28, letterSpacing: "0.14em", color: COLOR.nightInk2, marginLeft: 18 }}>{row.zh}</span>
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* Rebind any key.：设置 · 快捷键 */}
      <Panel src={assets.appSetHotkeys} w={1180} h={(1180 * 1500) / 2160} y={90} rotY={12} rotX={7} from="left" at={at(147.8)} out={at(151.6)} neon={COLOR.neonCinnabar} spot={{ at: at(149), rect: { x: 0.26, y: 0.12, w: 0.72, h: 0.3 }, dark: true }} />
      <Line out={at(151.4)} y={-410}>
        <span style={{ fontFamily: DISPLAY, fontSize: 104, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.nightInk, whiteSpace: "pre", opacity: prog(frame, at(148), 10) }}>Rebind any </span>
        <Reel words={["⌥", "⌘", "F5", "Caps", "key."]} at={at(148.2)} hold={6} size={104} color={COLOR.nightInk} land={COLOR.neonCinnabar} />
      </Line>
      <Tag text="Hotkeys" sub="快捷键，随意改绑" dark at={at(148.6)} out={at(151.4)} style={{ left: 140, bottom: 90 }} />

      {/* Choose any model.：引擎页 */}
      <Panel src={assets.appEngine} w={1240} h={(1240 * 1500) / 2160} y={90} rotY={-12} rotX={7} from="right" at={at(151.8)} out={at(155.6)} neon={COLOR.neonIndigo} spot={{ at: at(153), rect: { x: 0.2, y: 0.25, w: 0.58, h: 0.55 }, dark: true }} />
      <Line out={at(155.4)} y={-410}>
        <span style={{ fontFamily: DISPLAY, fontSize: 104, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.nightInk, whiteSpace: "pre", opacity: prog(frame, at(152), 10) }}>Choose any </span>
        <Reel words={["Gemini", "GPT", "DeepSeek", "Qwen", "Kimi", "GLM", "model."]} at={at(152.2)} hold={5} size={104} color={COLOR.nightInk} land={COLOR.neonIndigo} />
      </Line>
      <Tag text="Engine" sub="引擎，模型自由选择" dark at={at(152.6)} out={at(155.4)} style={{ left: 140, bottom: 90 }} />

      {/* Presets.：推荐组合，一键启用 */}
      <Panel src={assets.appPresets} w={1240} h={(1240 * 1500) / 2160} y={90} rotY={10} rotX={7} from="below" at={at(155.8)} out={at(159.6)} neon={COLOR.ochre} spot={{ at: at(157), rect: { x: 0.46, y: 0.08, w: 0.33, h: 0.66 }, dark: true }} />
      <Line out={at(159.4)} y={-410}>
        <Scramble value="Presets. One click." at={at(156)} frames={20} size={104} color={COLOR.nightInk} />
      </Line>
      <Tag text="Presets" sub="推荐组合，一键启用" dark at={at(156.6)} out={at(159.4)} style={{ left: 140, bottom: 90 }} />

      {/* One key. Ready.：密钥面板，粘进一把密钥 */}
      <Panel src={assets.appKeys} w={1240} h={(1240 * 1500) / 2160} y={90} rotY={-10} rotX={7} at={at(159.8)} out={at(166.4)} neon={COLOR.neonCinnabar} spot={{ at: at(160.6), rect: { x: 0.52, y: 0.02, w: 0.47, h: 0.96 }, dark: true }} />
      {frame >= at(161) ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              marginTop: 330,
              width: 760,
              padding: "26px 34px",
              borderRadius: 26,
              background: "oklch(0.2 0.03 275 / 0.92)",
              boxShadow: `0 0 0 1.5px ${COLOR.neonCinnabar}, 0 0 50px color-mix(in oklab, ${COLOR.neonCinnabar} 40%, transparent)`,
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontFamily: SANS,
              color: COLOR.nightInk,
              opacity: prog(frame, at(161), 12),
              transform: `translateY(${30 * (1 - prog(frame, at(161), 16))}px)`,
            }}
          >
            <span style={{ fontSize: 26, color: COLOR.nightInk2, whiteSpace: "nowrap" }}>DeepSeek</span>
            <span style={{ flex: 1, fontSize: 34, letterSpacing: "0.12em", fontFamily: DISPLAY }}>{"•".repeat(keyTyped)}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 26, fontWeight: 600, color: COLOR.green, opacity: prog(frame, at(164), 8) }}>
              <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" strokeDasharray={24} strokeDashoffset={24 * (1 - prog(frame, at(164), 14))} />
              </svg>
              检测通过
            </span>
          </div>
        </AbsoluteFill>
      ) : null}
      <Line out={at(166)} y={-410}>
        <Neon value="One key. " at={at(160.4)} glow={COLOR.neonCinnabar} size={110} />
        <Neon value="Ready." at={at(164)} glow={COLOR.green} size={110} />
      </Line>
      <Line out={at(166)} y={-300}>
        <Sub text="一把密钥，即刻就绪" at={at(164.4)} size={34} color={COLOR.nightInk2} />
      </Line>
    </AbsoluteFill>
  );
};
