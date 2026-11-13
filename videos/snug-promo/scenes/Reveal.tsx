import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { C, local, SF, ZH } from "../theme";

// 三条路一拍一个砸回来、划掉；音乐抽空的那一小节里 Snug 亮相：图标从暗处浮起，光圈越涨越亮，名字和一句定位跟上。
const at = local(40);
const WORDS = ["TOO SMALL", "ONE AI ONLY", "CUT OFF"];

export const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const gone = interpolate(f, [at(4) - 2, at(4) + 4], [0, 1], clamp);
  const icon = interpolate(f, [at(4) + 2, at(4) + 26], [0, 1], { ...clamp, easing: outExpo });
  const swell = interpolate(f, [at(4), at(8)], [0, 1], clamp);
  const name = interpolate(f, [at(5.5), at(5.5) + 14], [0, 1], { ...clamp, easing: outExpo });
  const sub = interpolate(f, [at(6.5), at(6.5) + 14], [0, 1], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill>
      {WORDS.map((w, i) => {
        const p = interpolate(f, [at(i), at(i) + 9], [0, 1], { ...clamp, easing: outExpo });
        const strike = interpolate(f, [at(3) + i * 3, at(3) + i * 3 + 8], [0, 1], { ...clamp, easing: outExpo });
        return (
          <div
            key={w}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 700 + i * 190,
              textAlign: "center",
              opacity: p * (1 - 0.55 * strike) * (1 - gone),
              transform: `scale(${(1 + 0.5 * (1 - p)) * (1 - 0.1 * gone)})`,
              filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
            }}
          >
            <span style={{ position: "relative", fontFamily: SF, fontWeight: 900, fontSize: 130, letterSpacing: "-0.035em", color: C.ink }}>
              {w}
              <span style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 10, background: C.red, transform: `scaleX(${strike})`, transformOrigin: "0 50%", borderRadius: 5 }} />
            </span>
          </div>
        );
      })}
      {/* 亮相 */}
      <div style={{ position: "absolute", left: 540 - 450, top: 780 - 450, width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, rgba(34,216,255,${0.32 * swell * swell}) 0%, rgba(42,109,255,${0.25 * swell}) 35%, transparent 68%)`, transform: `scale(${0.6 + 0.7 * swell})`, opacity: icon }} />
      <div
        style={{
          position: "absolute",
          left: 540 - 180,
          top: 780 - 180,
          width: 360,
          height: 360,
          borderRadius: "50%",
          border: `2.5px solid rgba(31,99,255,${0.5 * swell})`,
          transform: `scale(${0.7 + 0.9 * swell * swell})`,
          opacity: icon * (1 - 0.6 * swell),
        }}
      />
      <Img
        src={staticFile(assets.snugIcon)}
        style={{
          position: "absolute",
          left: 540 - 200,
          top: 780 - 200,
          width: 400,
          height: 400,
          opacity: icon,
          transform: `translateY(${(1 - icon) * 60}px) scale(${(0.72 + 0.28 * icon) * (1 + 0.06 * swell)})`,
          filter: "drop-shadow(0 30px 60px rgba(20,50,120,0.28))",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1030, textAlign: "center", fontFamily: SF, fontWeight: 800, fontSize: 190, letterSpacing: "-0.04em", color: C.ink, opacity: name, transform: `translateY(${(1 - name) * 40}px)`, filter: name < 1 ? `blur(${(1 - name) * 10}px)` : undefined }}>
        Snug
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1280, textAlign: "center", fontFamily: ZH, fontWeight: 600, fontSize: 50, letterSpacing: "0.1em", color: C.ink2, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
        UU远程 专属手机屏
      </div>
    </AbsoluteFill>
  );
};
