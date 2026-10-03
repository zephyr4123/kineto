import { AbsoluteFill, random } from "remotion";
import { backOut, shake, tween } from "../fx";
import { CROSS, CROSS_RED } from "../sprites";
import { CREAM, FONT_ARCADE, FONT_MONO, GOLD, INK, RED } from "../theme";
import { PixelText } from "./PixelText";
import { PixelBox } from "./Retro";
import { Sprite } from "./Sprite";

// 推镜进电脑后看到的「乱」：看不清的乱码色块往上狂刷、红叉越冒越多、报错弹窗一层叠一层、
// 进度条永远卡在 99%，最后整屏故障。全是质感，没有一行能读的代码。t 是本段的局部帧。
const MESSAGES = ["Something broke", "File not found", "Wrong version?", "Unknown format", "Render failed", "Broke again", "Out of memory", "Unknown error", "Try again?", "Nope.", "You again?", "ERROR", "ERROR", "ERROR"];
const LINE_H = 40;
const WORD_COLORS = ["#6f7bb0", "#6f7bb0", "#8fa0e0", "#55608f", RED, GOLD];

const GarbageLine: React.FC<{ index: number; y: number }> = ({ index, y }) => {
  const words: React.ReactNode[] = [];
  let x = 60 + 40 * Math.floor(random(`gi-${index}`) * 4);
  for (let k = 0; x < 1700 && k < 12; k++) {
    const w = 30 + 150 * random(`gw-${index}-${k}`);
    if (random(`gs-${index}-${k}`) > 0.82) break;
    const red = random(`gr-${index}`) > 0.86;
    words.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: x,
          top: y + 12,
          width: w,
          height: 16,
          backgroundColor: red ? RED : WORD_COLORS[Math.floor(random(`gc-${index}-${k}`) * WORD_COLORS.length)],
          opacity: red ? 0.95 : 0.75,
        }}
      />,
    );
    x += w + 22;
  }
  return <>{words}</>;
};

// 弹窗越来越密：开始 9 帧一个，后来 3 帧一个（音效也按这个时间响）
export const popupTimes = (duration: number) => {
  const out: number[] = [];
  for (let at = 18, gap = 9; at < duration && out.length < 26; at += gap, gap = Math.max(3, gap - 0.5)) out.push(Math.round(at));
  return out;
};
export const GLITCH_LEAD = 34;

export const ChaosScreen: React.FC<{ t: number; duration: number }> = ({ t, duration }) => {
  const scroll = t * 16;
  const first = Math.floor(scroll / LINE_H);
  const lines = Array.from({ length: 30 }, (_, k) => first + k);
  const intensity = Math.min(1, t / duration);
  const s = shake(t, 0, 100000, 4 + 26 * intensity * intensity, "chaos");
  const glitching = t > duration - GLITCH_LEAD;

  const popTimes = popupTimes(duration);
  const crosses = Array.from({ length: 40 }, (_, i) => ({ at: 8 + i * 4, x: random(`cx-${i}`) * 1780 + 40, y: random(`cy-${i}`) * 900 + 120 }));

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f1430", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
        {/* 标题栏 */}
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 64, backgroundColor: "#26305e", display: "flex", alignItems: "center", paddingLeft: 28, gap: 16 }}>
          {[RED, GOLD, "#5dffa0"].map((c) => (
            <div key={c} style={{ width: 22, height: 22, backgroundColor: c }} />
          ))}
          <PixelText size={32} color="#9fb0ea" font={FONT_MONO} style={{ marginLeft: 20 }}>
            ~/my-video — guessing…
          </PixelText>
        </div>
        {/* 乱码往上刷 */}
        <div style={{ position: "absolute", left: 0, top: 64, right: 0, bottom: 0, overflow: "hidden" }}>
          {lines.map((i) => (
            <GarbageLine key={i} index={i} y={i * LINE_H - scroll} />
          ))}
        </div>
        {/* 红叉 */}
        {crosses.map((c, i) =>
          t >= c.at ? (
            <div key={i} style={{ position: "absolute", left: c.x, top: c.y, transform: `scale(${tween(t, [c.at, c.at + 6], [0, 1], backOut)})` }}>
              <Sprite grid={CROSS} palette={CROSS_RED} scale={9} />
            </div>
          ) : null,
        )}
        {/* 卡在 99% 的进度条 */}
        {t > 30 ? (
          <PixelBox x={460} y={860} w={1000} h={120} border={8} color={CREAM} fill={INK}>
            <div style={{ position: "absolute", left: 24, top: 24, right: 24, height: 36, backgroundColor: "#26305e" }}>
              <div style={{ width: "99%", height: "100%", backgroundColor: Math.floor(t / 10) % 2 ? GOLD : "#d9a520" }} />
            </div>
            <PixelText size={34} color={CREAM} font={FONT_MONO} style={{ position: "absolute", left: 24, top: 66 }}>
              Rendering…
            </PixelText>
            <PixelText size={30} font={FONT_ARCADE} color={Math.floor(t / 15) % 2 ? RED : CREAM} style={{ position: "absolute", right: 24, top: 70 }}>
              99%
            </PixelText>
          </PixelBox>
        ) : null}
        {/* 报错弹窗一层叠一层 */}
        {popTimes.map((at, i) => {
          if (t < at) return null;
          const col = i % 7;
          const row = Math.floor(i / 7);
          const x = 140 + col * 190 + row * 90 + (random(`px-${i}`) - 0.5) * 80;
          const y = 120 + col * 70 + row * 40 + (random(`py-${i}`) - 0.5) * 60;
          const scale = tween(t, [at, at + 7], [0.2, 1], backOut);
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>
              <PixelBox x={0} y={0} w={560} h={210} border={7} color={INK} fill="#e9e6f5" style={{ position: "relative" }}>
                <div style={{ height: 52, backgroundColor: RED, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
                  <PixelText size={22} color="white" font={FONT_ARCADE}>
                    ERROR
                  </PixelText>
                  <div style={{ width: 30, height: 30, backgroundColor: "#a3202c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sprite grid={CROSS} palette={{ r: "white" }} scale={3} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "30px 30px" }}>
                  <Sprite grid={CROSS} palette={CROSS_RED} scale={8} />
                  <PixelText size={48} color={INK}>
                    {MESSAGES[i % MESSAGES.length]}
                  </PixelText>
                </div>
              </PixelBox>
            </div>
          );
        })}
      </AbsoluteFill>
      {/* 崩溃前的故障：色块撕裂 + 反色闪 */}
      {glitching ? (
        <AbsoluteFill>
          {Array.from({ length: 10 }, (_, i) => {
            const r = (k: string) => random(`gl-${i}-${k}-${Math.floor(t / 2)}`);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: r("x") * 1600 - 200,
                  top: r("y") * 1080,
                  width: 300 + r("w") * 1200,
                  height: 10 + r("h") * 70,
                  backgroundColor: [RED, "#5ef2ff", GOLD, "white", "#0f1430"][Math.floor(r("c") * 5)],
                  mixBlendMode: "difference",
                }}
              />
            );
          })}
          {Math.floor(t / 3) % 3 === 0 ? <AbsoluteFill style={{ backgroundColor: "white", mixBlendMode: "difference" }} /> : null}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
