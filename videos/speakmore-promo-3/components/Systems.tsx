import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { prog } from "../../../engine/motion";
import { MacDesktop, SUNSET_DOCK } from "../../../engine/speakmore/MacDesktop";
import { MacWindow, ScreenCard, WinDesktop, WinWindow, WindowsMark } from "../../../engine/speakmore/Screens";
import { UI } from "../../../engine/speakmore/icons";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS } from "../theme";

// 两个系统（照第二支的两块屏幕）：左边 Mac（他真屏幕的截图，海上日落），右边 Windows（代码画的 Windows 11 桌面），
// 两块屏幕从两边斜着飞进来并排浮着；同一句话同一刻落进两边的窗口，屏幕底下各一个系统标志。用眼睛看，不靠字说。

const SCALE = 0.4;
const CARD = { w: 1920 * SCALE, h: 1080 * SCALE, gap: 90, y: 560 - (1080 * SCALE) / 2 };
// 语音输入那一段的真实成品
const SENTENCE = "我们后天开个会吧，把上个月的数据带上";

export const Systems: React.FC<{ at: number; land: number; out: number }> = ({ at, land, out }) => {
  const frame = useCurrentFrame();
  const z = prog(frame, out, 16, EASE.inOut);
  if (frame < at || z >= 1) return null;
  const shown = Math.floor(prog(frame, land, 16, (t) => t) * [...SENTENCE].length);
  const flash = frame >= land ? Math.exp(-(frame - land) / 14) : 0;
  const cards = [
    { os: "mac", x: 960 - CARD.gap / 2 - CARD.w, enter: at, side: -1 },
    { os: "win", x: 960 + CARD.gap / 2, enter: at + 6, side: 1 },
  ] as const;
  return (
    <AbsoluteFill style={{ perspective: 2200, opacity: 1 - z, filter: z > 0 ? `blur(${10 * z}px)` : undefined }}>
      {cards.map((c) => {
        const a = prog(frame, c.enter, 34, EASE.outExpo);
        // 透明度线性升上来：两块屏幕比夜色亮得多，一下子出来整屏亮度会猛跳
        const fade = prog(frame, c.enter, 30, (t) => t);
        const float = 6 * Math.sin((frame - c.enter) / 26 + (c.os === "mac" ? 0 : 1.4));
        return (
          <div key={c.os} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translateX(${c.side * 700 * (1 - a)}px) rotateY(${-c.side * (10 + 30 * (1 - a))}deg)`, transformOrigin: `${c.x + CARD.w / 2}px 540px`, opacity: fade }}>
            <ScreenCard x={c.x} y={CARD.y + float} scale={SCALE}>
              {c.os === "mac" ? (
                <>
                  <MacDesktop src={staticFile(assets.desktop)} dock={SUNSET_DOCK} clock="10月23日 周四  09:41" fontFamily={SANS} focus={0} />
                  <MacWindow title="会议纪要" width={1000} height={380} style={{ left: 460, top: 220 }}>
                    <Body text={[...SENTENCE].slice(0, shown).join("")} flash={flash} />
                  </MacWindow>
                </>
              ) : (
                <WinDesktop>
                  <WinWindow title="会议纪要.txt" width={1000} height={380} style={{ left: 460, top: 220 }}>
                    <Body text={[...SENTENCE].slice(0, shown).join("")} flash={flash} />
                  </WinWindow>
                </WinDesktop>
              )}
            </ScreenCard>
            <div style={{ position: "absolute", left: c.x, width: CARD.w, top: CARD.y + CARD.h + 36, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, fontFamily: DISPLAY, fontSize: 38, fontWeight: 600, color: COLOR.nightInk, opacity: prog(frame, c.enter + 20, 16) }}>
              {c.os === "mac" ? <Glyph icon={UI.apple} size={40} style={{ marginTop: -6 }} /> : <WindowsMark size={34} />}
              {c.os === "mac" ? "macOS" : "Windows"}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 窗口里的正文；字刚落下时朱砂亮一下 */
const Body: React.FC<{ text: string; flash: number }> = ({ text, flash }) => (
  <div style={{ position: "absolute", inset: 0, padding: "34px 40px", fontFamily: SANS, fontSize: 40, lineHeight: 1.6, color: "oklch(0.21 0.02 255)", background: `oklch(0.74 0.17 32 / ${0.1 * flash})` }}>{text}</div>
);
