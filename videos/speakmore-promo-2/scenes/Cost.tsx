import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { Flash, MotionBlurX, Sfx } from "../components/Fx";
import { deepCamera } from "../components/Stage";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SERIF, SHADOW, b } from "../theme";

// 费用：两拍一切"软件免费""没有订阅"（订阅两个字被朱砂划掉），然后两张小票一行一行打出来：
// 转写 + 润色每天 100 次每月 ¥2.6，数据隐私 ¥0、盖一方"免费"。
// ¥2.6 出自 SpeakMore 官网的 website/src/costs.json（每天 100 次识别，¥2.63 / 月）。

export const COST_FRAMES = b(16);
export const COST_CAMERA = deepCamera(COST_FRAMES);

const T = { free: 0, nosub: b(2), strike: b(2.6), receipts: b(4), stamp: b(11), out: b(15) };

type Line = { k: string; v: string; big?: boolean } | "rule" | { note: string };
const PAID: readonly Line[] = [
  { k: "软件", v: "¥0" },
  { k: "订阅", v: "无" },
  { k: "模型", v: "按用量" },
  "rule",
  { k: "每月", v: "¥2.6", big: true },
  { note: "每天 100 次 · 直付厂商" },
];
const FREE: readonly Line[] = [
  { k: "软件", v: "¥0" },
  { k: "模型", v: "本机运行" },
  { k: "密钥", v: "无需" },
  "rule",
  { k: "每月", v: "¥0", big: true },
  { note: "不联网 · 不上传" },
];
const lineAt = (start: number, i: number) => start + Math.round(i * b(0.5));

export const Cost: React.FC = () => {
  const frame = useCurrentFrame();
  const whip = prog(frame, T.out, 22, EASE.inOut);
  const words = frame < T.receipts;

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <MotionBlurX id="cost-whip" amount={60 * Math.sin(Math.PI * whip)} />
      <AbsoluteFill style={{ transform: `translateX(${1400 * whip}px)`, filter: whip > 0.01 && whip < 0.99 ? "url(#cost-whip)" : undefined, opacity: 1 - whip }}>
        {words ? (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            {frame < T.nosub ? (
              <Big frame={frame} at={T.free}>
                软件免费
              </Big>
            ) : (
              <Big frame={frame} at={T.nosub}>
                没有
                <span style={{ position: "relative" }}>
                  订阅
                  <i
                    style={{
                      position: "absolute",
                      left: -10,
                      top: "54%",
                      height: 16,
                      borderRadius: 8,
                      width: `calc(${interpolate(frame, [T.strike, T.strike + 12], [0, 100], { ...clamp, easing: EASE.outQuint })}% + 20px)`,
                      background: COLOR.cinnabar,
                    }}
                  />
                </span>
              </Big>
            )}
          </AbsoluteFill>
        ) : null}

        {!words ? (
          <>
            <Receipt left={420} title="转写 + 润色" lines={PAID} at={T.receipts} frame={frame} />
            <Receipt left={1000} title="数据隐私" lines={FREE} at={lineAt(T.receipts, 6)} frame={frame} />
            <Stamp frame={frame} />
          </>
        ) : null}
      </AbsoluteFill>

      <Flash frame={frame} at={[T.free, T.nosub]} strength={0.7} />
      <Sfx at={T.free} name="sfxFlash" volume={0.3} />
      <Sfx at={T.nosub} name="sfxFlash" volume={0.3} />
      <Sfx at={T.strike} name="sfxSwish" volume={0.35} />
      {[...PAID.map((_, i) => lineAt(T.receipts, i + 1)), ...FREE.map((_, i) => lineAt(lineAt(T.receipts, 6), i + 1))].map((at, i) => (
        <Sfx key={i} at={at} name="sfxTap" volume={0.22} />
      ))}
      <Sfx at={T.stamp} name="sfxClick" volume={0.32} />
      <Sfx at={T.stamp} name="sfxNote2" volume={0.3} />
      <Sfx at={T.out} name="sfxSwish" volume={0.45} />
    </AbsoluteFill>
  );
};

const Big: React.FC<{ frame: number; at: number; children: React.ReactNode }> = ({ frame, at, children }) => (
  <div
    style={{
      fontSize: 196,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textShadow: SHADOW,
      transform: `scale(${punch(frame, at, 0.06, 24)})`,
      filter: `blur(${6 * (1 - prog(frame, at, 8))}px)`,
    }}
  >
    {children}
  </div>
);

const PAPER = "oklch(0.975 0.008 85)";
const RECEIPT = { width: 500, top: 150 };

/** 一张小票：从顶上的出纸口往下长出来，一行一行打上去，底边是锯齿 */
const Receipt: React.FC<{ left: number; title: string; lines: readonly Line[]; at: number; frame: number }> = ({ left, title, lines, at, frame }) => {
  const printed = lines.filter((_, i) => frame >= lineAt(at, i + 1)).length;
  const height = 200 + printed * 78 + 40;
  const grow = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: EASE.outQuint });
  return (
    <div style={{ position: "absolute", left, top: RECEIPT.top, width: RECEIPT.width, ...show(frame, at, undefined, -30) }}>
      <div
        style={{
          position: "relative",
          height: height * grow,
          overflow: "hidden",
          background: PAPER,
          color: COLOR.paperInk,
          padding: "34px 40px 0",
          boxSizing: "border-box",
          boxShadow: "0 30px 70px oklch(0 0 0 / 0.45)",
          // 底边锯齿
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 14px), 96% 100%, 92% calc(100% - 14px), 88% 100%, 84% calc(100% - 14px), 80% 100%, 76% calc(100% - 14px), 72% 100%, 68% calc(100% - 14px), 64% 100%, 60% calc(100% - 14px), 56% 100%, 52% calc(100% - 14px), 48% 100%, 44% calc(100% - 14px), 40% 100%, 36% calc(100% - 14px), 32% 100%, 28% calc(100% - 14px), 24% 100%, 20% calc(100% - 14px), 16% 100%, 12% calc(100% - 14px), 8% 100%, 4% calc(100% - 14px), 0 100%)",
        }}
      >
        <div style={{ textAlign: "center", fontSize: 34, fontWeight: 700, letterSpacing: "0.04em" }}>SpeakMore</div>
        <div style={{ textAlign: "center", fontSize: 26, color: COLOR.paperInk2, marginTop: 6 }}>{title}</div>
        <div style={{ borderTop: `2px dashed oklch(0.75 0.01 85)`, margin: "26px 0 8px" }} />
        {lines.map((line, i) => {
          if (frame < lineAt(at, i + 1)) return null;
          const k = prog(frame, lineAt(at, i + 1), 10);
          if (line === "rule") return <div key={i} style={{ borderTop: `2px dashed oklch(0.75 0.01 85)`, margin: "18px 0", opacity: k }} />;
          if ("note" in line)
            return (
              <div key={i} style={{ textAlign: "center", fontSize: 24, color: COLOR.paperInk2, marginTop: 14, opacity: k }}>
                {line.note}
              </div>
            );
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14, height: line.big ? 76 : 54, opacity: k, fontSize: line.big ? 32 : 27, fontWeight: line.big ? 700 : 500 }}>
              <span>{line.k}</span>
              <span style={{ flex: 1, borderBottom: "2px dotted oklch(0.8 0.01 85)", transform: "translateY(-8px)" }} />
              <span style={{ fontFamily: MONO_STACK, fontSize: line.big ? 52 : 30, fontWeight: line.big ? 600 : 500 }}>{line.v}</span>
              {line.big && line.v !== "¥0" ? <span style={{ fontSize: 24, color: COLOR.paperInk2 }}>/ 月</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** 数据隐私那张小票上盖一方"免费"：朱砂的框和字，盖下去时略大落回原大 */
const Stamp: React.FC<{ frame: number }> = ({ frame }) => {
  const k = prog(frame, T.stamp, 10, EASE.outQuint);
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 1300,
        top: 560,
        width: 170,
        height: 170,
        borderRadius: 26,
        border: `8px solid ${COLOR.cinnabar}`,
        display: "grid",
        placeItems: "center",
        color: COLOR.cinnabar,
        fontFamily: SERIF,
        fontSize: 64,
        fontWeight: 800,
        letterSpacing: "0.06em",
        opacity: 0.9 * k,
        transform: `rotate(-12deg) scale(${1.5 - 0.5 * k})`,
        mixBlendMode: "multiply",
      }}
    >
      免费
    </div>
  );
};
