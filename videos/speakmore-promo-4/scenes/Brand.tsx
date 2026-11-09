import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { Seal } from "../../../engine/speakmore/Seal";
import { Backdrop, Head, Line, Sub, sec } from "../components/kit";
import { LAND, NUM, TONE, VERSION } from "../theme";

// 品牌：鼓进来的那一拍，印上的五道声波立起、印底落下，接着出品牌字、版本号和一句定位。
const T = TONE.paper;
const at = (s: number) => LAND + sec(s);

export const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [16, 8, 0, 8, 16].map((d) => prog(frame, at(-0.35) + d, 34));
  const base = prog(frame, at(0.15), 30);
  const lift = interpolate(frame, [at(0), at(8)], [0, -14], clamp);
  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <AbsoluteFill style={{ alignItems: "center", transform: `translateY(${lift}px)` }}>
        <div style={{ marginTop: 150 }}>
          <Seal size={230} bars={bars} base={base} />
        </div>
        <Line at={at(0.45)} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: NUM, fontWeight: 700, fontVariationSettings: '"wdth" 100, "opsz" 96', fontSize: 150, lineHeight: 1, letterSpacing: "-0.02em", color: T.ink }}>
            speakmore
          </div>
        </Line>
        <div
          style={{
            marginTop: 26,
            padding: "6px 20px",
            borderRadius: 999,
            border: `2px solid ${T.ink2}`,
            fontFamily: NUM,
            fontWeight: 500,
            fontSize: 30,
            color: T.ink2,
            opacity: interpolate(frame, [at(0.8), at(1.2)], [0, 1], { ...clamp, easing: outExpo }),
          }}
        >
          {VERSION}
        </div>
        <Head at={at(1.3)} text="语音输入 语音翻译 划词翻译" color={T.ink} size={58} style={{ marginTop: 44 }} />
        <Sub at={at(1.6)} text="开源 免费 Mac 与 Windows" color={T.ink2} style={{ marginTop: 16 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
