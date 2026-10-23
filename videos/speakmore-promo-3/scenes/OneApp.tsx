import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Panel } from "../components/Panel";
import { Gallery } from "../components/Gallery";
import { NeonKey, TRIO } from "../components/NeonKey";
import { Line, Neon, Reel } from "../components/Type";
import { Sub } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS, b } from "../theme";

// 暗场（第 192–224 拍，原曲的过门、低音全撤）：
// "One APP" / "Three features" 上下两行霓虹描字，压在首页深色真截图上 → 三行霓虹键帽：右⌥ 语音输入、右⌥ 空格 语音翻译、右⌥ 回车 划词翻译
// → "Rebind any key"（key 滚过 ⌥ ⌘ F5 Caps）配设置·快捷键的真截图 → "Choose any model"：各家标志排成一列往深处退，DeepSeek 打头，一家家走到前面
// → "One key" "Ready"：密钥面板的真截图，一把密钥粘进去、打勾 → 第 222 拍起一切收向中间，等第 224 拍砸下。
const START = 192;
const at = (n: number) => b(n - START);
export const ONEAPP_FRAMES = b(32);

export const OneApp: React.FC = () => {
  const frame = useCurrentFrame();
  const gather = prog(frame, at(222), b(2), easeIn);
  const keyTyped = Math.floor(prog(frame, at(216.6), 26, (t) => t) * 20);

  return (
    <AbsoluteFill style={{ transform: `scale(${1 - 0.85 * gather})`, opacity: 1 - gather, filter: gather > 0 ? `blur(${12 * gather}px)` : undefined }}>
      {/* One APP / Three features：上下两行，压在首页深色真截图上，推近到顶上那排热键 */}
      <Panel fadeIn={30} src={assets.appHomeDark} w={1240} h={(1240 * 1500) / 2160} y={190} rotY={-12} rotX={8} at={0} out={at(196.4)} neon={COLOR.neonIndigo} zoom={{ at: at(194), dur: 40, rect: { x: 0.24, y: 0.07, w: 0.56, h: 0.16 } }} />
      <Line out={at(196.2)} y={-440}>
        <Neon value="One APP" at={at(192.4)} glow={COLOR.neonIndigo} size={96} />
      </Line>
      <Line out={at(196.2)} y={-335}>
        <Neon value="Three features" at={at(193.6)} glow={COLOR.neonCinnabar} size={96} color={COLOR.nightInk2} />
      </Line>

      {/* 三行霓虹键帽，每拍按下一行 */}
      {frame >= at(196.4) && frame < at(200.6) ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, opacity: 1 - prog(frame, at(199.8), 12) }}>
          {TRIO.map((row, i) => {
            const t = prog(frame, at(196.4) + i * 8, 18, EASE.outExpo);
            return (
              <div key={row.name} style={{ display: "flex", alignItems: "center", gap: 18, width: 1460, whiteSpace: "nowrap", opacity: t, transform: `translateX(${-200 * (1 - t)}px)`, filter: t < 1 ? `blur(${8 * (1 - t)}px)` : undefined }}>
                <div style={{ display: "flex", gap: 16, width: 420, justifyContent: "flex-end" }}>
                  {row.keys.map((k) => (
                    <NeonKey key={k} label={k} color={row.color} press={at(197 + i * 0.8)} />
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
      <Panel fadeIn={30} src={assets.appSetHotkeys} w={1180} h={(1180 * 1216) / 1664} y={90} rotY={12} rotX={7} from="left" at={at(200)} out={at(204.2)} neon={COLOR.neonCinnabar} spot={{ at: at(201), rect: { x: 0.26, y: 0.12, w: 0.72, h: 0.3 }, dark: true }} />
      <Line out={at(204)} y={-430}>
        <span style={{ fontFamily: DISPLAY, fontSize: 96, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.nightInk, whiteSpace: "pre", opacity: prog(frame, at(200.2), 10) }}>Rebind any </span>
        <Reel words={["⌥", "⌘", "F5", "Caps", "key"]} at={at(200.4)} hold={6} size={96} color={COLOR.nightInk} land={COLOR.neonCinnabar} />
      </Line>

      {/* Choose any model：各家标志的画廊，前后虚影，DeepSeek 打头 */}
      <Line out={at(214.4)} y={-430}>
        <span style={{ fontFamily: DISPLAY, fontSize: 96, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.nightInk, whiteSpace: "pre", opacity: prog(frame, at(204.4), 10) }}>Choose any </span>
        <Neon value="model" at={at(204.8)} glow={COLOR.neonIndigo} size={96} />
      </Line>
      <Gallery at={at(204.2)} first={at(206.4)} step={16} out={at(214.6)} />

      {/* One key  Ready：密钥面板，粘进一把密钥 */}
      <Panel fadeIn={30} src={assets.appKeys} w={1180} h={(1180 * 1500) / 2160} y={170} rotY={-10} rotX={7} at={at(214.8)} out={at(222.4)} neon={COLOR.neonCinnabar} spot={{ at: at(215.6), rect: { x: 0.52, y: 0.02, w: 0.47, h: 0.96 }, dark: true }} />
      {frame >= at(216) ? (
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
              opacity: prog(frame, at(216), 12),
              transform: `translateY(${30 * (1 - prog(frame, at(216), 16))}px)`,
            }}
          >
            <span style={{ fontSize: 26, color: COLOR.nightInk2, whiteSpace: "nowrap" }}>DeepSeek</span>
            <span style={{ flex: 1, fontSize: 34, letterSpacing: "0.12em", fontFamily: DISPLAY }}>{"•".repeat(keyTyped)}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 26, fontWeight: 600, whiteSpace: "nowrap", flex: "none", color: COLOR.green, opacity: prog(frame, at(219), 8) }}>
              <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" strokeDasharray={24} strokeDashoffset={24 * (1 - prog(frame, at(219), 14))} />
              </svg>
              检测通过
            </span>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* 两个词一前一后亮起，中间留空，不加句号 */}
      <Line out={at(222)} y={-440}>
        <Neon value="One key" at={at(215.2)} glow={COLOR.neonCinnabar} size={96} />
        <span style={{ width: 70 }} />
        <Neon value="Ready" at={at(219)} glow={COLOR.green} size={96} />
      </Line>
      <Line out={at(222)} y={-345}>
        <Sub text="一把密钥　即刻就绪" at={at(219.4)} size={30} color={COLOR.nightInk2} />
      </Line>
    </AbsoluteFill>
  );
};
