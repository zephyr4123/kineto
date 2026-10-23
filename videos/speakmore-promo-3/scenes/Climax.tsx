import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { easeIn, prog, punch } from "../../../engine/motion";
import { Collide, Focus, Line, Scramble } from "../components/Type";
import { Ring } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS, b } from "../theme";

// 高潮（第 168–188 拍，过门之后砸下）：三个发光圆环依次点亮——语音输入、语音翻译、划词翻译——每拍脉动一下；
// 然后 "Open source."（解码）、"Free."（顶一下）、"macOS & Windows."（两边对撞）；接着六张 App 真截图围成一圈转，中间 speakmore；
// 最后这一整页夜色像翻书一样从右往左翻走，露出底下浅色的雾，进落版。
const START = 168;
const at = (n: number) => b(n - START);
export const CLIMAX_FRAMES = b(20);

const RINGS = [
  { name: "Voice input", zh: "语音输入", color: COLOR.neonCinnabar, x: -520 },
  { name: "Voice translation", zh: "语音翻译", color: COLOR.neonIndigo, x: 0 },
  { name: "Selection translation", zh: "划词翻译", color: COLOR.ochre, x: 520 },
] as const;

const CAROUSEL = [assets.appHome, assets.appHistory, assets.appEngineLookup, assets.appSetLookup, assets.appHomeDark, assets.appPresets] as const;

export const Climax: React.FC = () => {
  const frame = useCurrentFrame();
  const ringsOut = prog(frame, at(171.6), 14, EASE.inOut);
  const spin = prog(frame, at(178), b(7.6), (t) => t);
  const carouselIn = prog(frame, at(177.8), 20);
  // 翻页：整页夜色绕左边翻走
  const turn = prog(frame, at(185.8), b(2), easeIn);

  return (
    <AbsoluteFill style={{ perspective: 2400 }}>
      <AbsoluteFill
        style={{
          background: COLOR.night,
          transformOrigin: "left center",
          transform: `rotateY(${-100 * turn}deg)`,
          opacity: 1 - prog(frame, at(186.8), 40),
          boxShadow: turn > 0 ? `0 0 120px oklch(0 0 0 / ${0.4 * turn})` : undefined,
        }}
      >
        {/* 三个圆环 */}
        {ringsOut < 1
          ? RINGS.map((r, i) => (
              <AbsoluteFill key={r.name} style={{ alignItems: "center", justifyContent: "center", transform: `translate(${r.x * (1 - 0.3 * ringsOut)}px, ${-200 * ringsOut}px) scale(${(1 - 0.5 * ringsOut) * punch(frame, at(168) + i * 12, 0.06, 18)})`, opacity: 1 - ringsOut }}>
                <Ring size={400} color={r.color} at={at(168) + i * 12} period={24} />
                <div style={{ textAlign: "center", opacity: prog(frame, at(168) + i * 12 + 4, 14) }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 42, fontWeight: 600, letterSpacing: "-0.015em", color: COLOR.nightInk, width: 340, lineHeight: 1.15 }}>{r.name}</div>
                  <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 24, letterSpacing: "0.16em", color: COLOR.nightInk2 }}>{r.zh}</div>
                </div>
              </AbsoluteFill>
            ))
          : null}

        {/* Open source. / Free. / macOS & Windows. */}
        <Line out={at(173.8)} y={-20}>
          <Scramble value="Open source." at={at(172)} frames={16} size={150} color={COLOR.nightInk} />
        </Line>
        <Line out={at(175.8)} y={-20}>
          <span style={{ display: "inline-block", transform: `scale(${punch(frame, at(174), 0.12, 16)})` }}>
            <Focus value="Free." at={at(174)} frames={10} size={190} weight={700} color={COLOR.neonCinnabar} />
          </span>
        </Line>
        <Line out={at(177.8)} y={-20}>
          <Collide left="macOS" mid="&" right="Windows" at={at(176)} size={150} />
        </Line>

        {/* 六张真截图围成一圈转，中间 speakmore */}
        {carouselIn > 0 ? (
          <AbsoluteFill style={{ perspective: 2600, alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 0, height: 0, transformStyle: "preserve-3d", transform: `translateZ(-900px) rotateX(-8deg) rotateY(${-40 - 110 * spin}deg)` }}>
              {CAROUSEL.map((src, i) => {
                const angle = (i / CAROUSEL.length) * 360;
                return (
                  <div
                    key={src}
                    style={{
                      position: "absolute",
                      left: -360,
                      top: -250,
                      width: 720,
                      height: 500,
                      borderRadius: 18,
                      overflow: "hidden",
                      transform: `rotateY(${angle}deg) translateZ(1050px)`,
                      backfaceVisibility: "hidden",
                      opacity: carouselIn,
                      boxShadow: `0 0 0 1.5px ${i % 2 ? COLOR.neonIndigo : COLOR.neonCinnabar}, 0 0 40px color-mix(in oklab, ${i % 2 ? COLOR.neonIndigo : COLOR.neonCinnabar} 35%, transparent)`,
                    }}
                  >
                    <Img src={staticFile(src)} style={{ width: 720, height: 500, display: "block", filter: "brightness(0.42) saturate(0.8)" }} />
                  </div>
                );
              })}
            </div>
          </AbsoluteFill>
        ) : null}
        <Line y={-10}>
          <span style={{ textShadow: `0 0 30px ${COLOR.night}, 0 0 60px ${COLOR.night}, 0 0 120px ${COLOR.night}` }}>
            <Focus value="speakmore" at={at(179)} frames={20} size={200} weight={650} color={COLOR.nightInk} style={{ letterSpacing: "-0.04em" }} />
          </span>
        </Line>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
