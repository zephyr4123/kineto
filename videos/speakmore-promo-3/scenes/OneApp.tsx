import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Panel } from "../components/Panel";
import { Gallery } from "../components/Gallery";
import { Line, Neon, Reel } from "../components/Type";
import { Sub } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS, b } from "../theme";

// 暗场（第 188–220 拍，原曲的过门、低音全撤）：
// "One app" / "Three features" 上下两行霓虹描字，压在首页深色真截图上 → 三行霓虹键帽：右⌥ 语音输入、右⌥ 空格 语音翻译、右⌥ 回车 划词翻译
// → "Rebind any key"（key 滚过 ⌥ ⌘ F5 Caps）配设置·快捷键的真截图 → "Choose any model"：各家标志排成一列往深处退，DeepSeek 打头，一家家走到前面
// → "One key" "Ready"：密钥面板的真截图，一把密钥粘进去、打勾 → 第 218 拍起一切收向中间，等第 220 拍砸下。
const START = 188;
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
  const gather = prog(frame, at(218), b(2), easeIn);
  const keyTyped = Math.floor(prog(frame, at(212.6), 26, (t) => t) * 20);

  return (
    <AbsoluteFill style={{ transform: `scale(${1 - 0.85 * gather})`, opacity: 1 - gather, filter: gather > 0 ? `blur(${12 * gather}px)` : undefined }}>
      {/* One app / Three features：上下两行，压在首页深色真截图上，推近到顶上那排热键 */}
      <Panel fadeIn={30} src={assets.appHomeDark} w={1240} h={(1240 * 1500) / 2160} y={190} rotY={-12} rotX={8} at={0} out={at(192.4)} neon={COLOR.neonIndigo} zoom={{ at: at(190), dur: 40, rect: { x: 0.24, y: 0.07, w: 0.56, h: 0.16 } }} />
      <Line out={at(192.2)} y={-440}>
        <Neon value="One app" at={at(188.4)} glow={COLOR.neonIndigo} size={96} />
      </Line>
      <Line out={at(192.2)} y={-335}>
        <Neon value="Three features" at={at(189.6)} glow={COLOR.neonCinnabar} size={96} color={COLOR.nightInk2} />
      </Line>

      {/* 三行霓虹键帽，每拍按下一行 */}
      {frame >= at(192.4) && frame < at(196.6) ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, opacity: 1 - prog(frame, at(195.8), 12) }}>
          {ROWS.map((row, i) => {
            const t = prog(frame, at(192.4) + i * 8, 18, EASE.outExpo);
            return (
              <div key={row.name} style={{ display: "flex", alignItems: "center", gap: 18, width: 1460, whiteSpace: "nowrap", opacity: t, transform: `translateX(${-200 * (1 - t)}px)`, filter: t < 1 ? `blur(${8 * (1 - t)}px)` : undefined }}>
                <div style={{ display: "flex", gap: 16, width: 420, justifyContent: "flex-end" }}>
                  {row.keys.map((k) => (
                    <NeonKey key={k} label={k} color={row.color} press={at(193 + i * 0.8)} />
                  ))}
                </div>
                <span style={{ marginLeft: 50, fontFamily: DISPLAY, fontSize: 62, fontWeight: 600, letterSpacing: "-0.02em", color: COLOR.nightInk, whiteSpace: "nowrap" }}>{row.name}</span>
                <span style={{ fontFamily: SANS, fontSize: 28, letterSpacing: "0.14em", color: COLOR.nightInk2, marginLeft: 18 }}>{row.zh}</span>
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* Rebind any key：设置 · 快捷键 */}
      <Panel fadeIn={30} src={assets.appSetHotkeys} w={1180} h={(1180 * 1216) / 1664} y={90} rotY={12} rotX={7} from="left" at={at(196)} out={at(200.2)} neon={COLOR.neonCinnabar} spot={{ at: at(197), rect: { x: 0.26, y: 0.12, w: 0.72, h: 0.3 }, dark: true }} />
      <Line out={at(200)} y={-430}>
        <span style={{ fontFamily: DISPLAY, fontSize: 96, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.nightInk, whiteSpace: "pre", opacity: prog(frame, at(196.2), 10) }}>Rebind any </span>
        <Reel words={["⌥", "⌘", "F5", "Caps", "key"]} at={at(196.4)} hold={6} size={96} color={COLOR.nightInk} land={COLOR.neonCinnabar} />
      </Line>

      {/* Choose any model：各家标志的画廊，前后虚影，DeepSeek 打头 */}
      <Line out={at(210.4)} y={-430}>
        <span style={{ fontFamily: DISPLAY, fontSize: 96, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.nightInk, whiteSpace: "pre", opacity: prog(frame, at(200.4), 10) }}>Choose any </span>
        <Neon value="model" at={at(200.8)} glow={COLOR.neonIndigo} size={96} />
      </Line>
      <Gallery at={at(200.2)} first={at(202.4)} step={16} out={at(210.6)} />

      {/* One key  Ready：密钥面板，粘进一把密钥 */}
      <Panel fadeIn={30} src={assets.appKeys} w={1180} h={(1180 * 1500) / 2160} y={170} rotY={-10} rotX={7} at={at(210.8)} out={at(218.4)} neon={COLOR.neonCinnabar} spot={{ at: at(211.6), rect: { x: 0.52, y: 0.02, w: 0.47, h: 0.96 }, dark: true }} />
      {frame >= at(212) ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              marginTop: 400,
              width: 900,
              padding: "26px 34px",
              borderRadius: 26,
              background: "oklch(0.2 0.03 275 / 0.92)",
              boxShadow: `0 0 0 1.5px ${COLOR.neonCinnabar}, 0 0 50px color-mix(in oklab, ${COLOR.neonCinnabar} 40%, transparent)`,
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontFamily: SANS,
              color: COLOR.nightInk,
              opacity: prog(frame, at(212), 12),
              transform: `translateY(${30 * (1 - prog(frame, at(212), 16))}px)`,
            }}
          >
            <span style={{ fontSize: 26, color: COLOR.nightInk2, whiteSpace: "nowrap" }}>DeepSeek</span>
            <span style={{ flex: 1, fontSize: 34, letterSpacing: "0.12em", fontFamily: DISPLAY }}>{"•".repeat(keyTyped)}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 26, fontWeight: 600, whiteSpace: "nowrap", flex: "none", color: COLOR.green, opacity: prog(frame, at(215), 8) }}>
              <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" strokeDasharray={24} strokeDashoffset={24 * (1 - prog(frame, at(215), 14))} />
              </svg>
              检测通过
            </span>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* 两个词一前一后亮起，中间留空，不加句号 */}
      <Line out={at(218)} y={-440}>
        <Neon value="One key" at={at(211.2)} glow={COLOR.neonCinnabar} size={96} />
        <span style={{ width: 70 }} />
        <Neon value="Ready" at={at(215)} glow={COLOR.green} size={96} />
      </Line>
      <Line out={at(218)} y={-345}>
        <Sub text="一把密钥　即刻就绪" at={at(215.4)} size={30} color={COLOR.nightInk2} />
      </Line>
    </AbsoluteFill>
  );
};
