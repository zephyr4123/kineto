import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { Seal } from "../../../engine/speakmore/Seal";
import { Backdrop, Line, Sub, sec } from "../components/kit";
import { LAND, NUM, TONE, VERSION } from "../theme";

// 落版：印、品牌字、版本号、仓库和官网。音乐在这张卡上收住，之后静音停着。
const T = TONE.night;
const at = (s: number) => LAND + sec(s);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [16, 8, 0, 8, 16].map((d) => prog(frame, at(-0.35) + d, 34));
  const base = prog(frame, at(0.15), 30);
  return (
    <AbsoluteFill>
      <Backdrop tone="night" />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ marginTop: 190 }}>
          <Seal size={200} bars={bars} base={base} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 36 }}>
          <Line at={at(0.4)}>
            <div style={{ fontFamily: NUM, fontWeight: 700, fontVariationSettings: '"wdth" 100, "opsz" 96', fontSize: 128, lineHeight: 1, letterSpacing: "-0.02em", color: T.ink }}>
              speakmore
            </div>
          </Line>
          <div
            style={{
              padding: "5px 18px",
              borderRadius: 999,
              border: `2px solid ${T.ink2}`,
              fontFamily: NUM,
              fontWeight: 500,
              fontSize: 28,
              color: T.ink2,
              opacity: interpolate(frame, [at(0.8), at(1.2)], [0, 1], { ...clamp, easing: outExpo }),
            }}
          >
            {VERSION}
          </div>
        </div>
        <Sub at={at(1.2)} text="github.com/zephyr4123/speakmore" color={T.ink2} size={30} style={{ marginTop: 56 }} />
        <Sub at={at(1.4)} text="speakmore.zephyrxiang.com" color={T.ink2} size={30} style={{ marginTop: 6 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
