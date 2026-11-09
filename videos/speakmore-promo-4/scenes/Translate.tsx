import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 语音翻译：同一套运镜，说的是中文，落下的是英文。中间在悬浮条上点一下目标语言、再点完成。
const T = TONE.night;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";

export const Translate: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="night" />
    <Head at={at(0)} text="语音翻译" color={T.ink} style={{ position: "absolute", left: 1330, top: 392 }} />
    <Sub at={at(0.3)} text="中文口述 外文成稿" color={T.ink2} style={{ position: "absolute", left: 1336, top: 556 }} />
    <Screen
      src={assets.appTranslateLight}
      w={1760}
      h={738}
      box={{ x: 120, y: 160, w: 1110, h: 760 }}
      bg="oklch(0.975 0.007 235)"
      keys={[
        { f: 0, x: 880, y: 369, s: 0.62 },
        { f: at(0.4), x: 880, y: 369, s: 0.62 },
        { f: at(1.2), x: 420, y: 175, s: 1.12 },
        { f: at(2.7), x: 420, y: 190, s: 1.12 },
        { f: at(3.4), x: 430, y: 455, s: 1.1 },
        { f: at(4.8), x: 430, y: 455, s: 1.1 },
        { f: at(5.5), x: 1300, y: 440, s: 1.02 },
        { f: at(6.6), x: 1300, y: 440, s: 1.02 },
        { f: at(7.6), x: 880, y: 369, s: 0.62 },
      ]}
      typing={[
        { x: 110, y: 168, w: 615, h: 56, at: at(1.35), dur: sec(1.2), color: CARD },
        { x: 948, y: 389, w: 710, h: 54, at: at(5.6), dur: sec(0.7), color: CARD },
        { x: 948, y: 444, w: 570, h: 54, at: at(6.3), dur: sec(0.5), color: CARD, caret: "#2f5fb8" },
      ]}
      pointer={{
        kind: "arrow",
        show: [at(3.2), at(5.1)],
        keys: [
          { f: at(3.2), x: 700, y: 300 },
          { f: at(3.7), x: 330, y: 366 },
          { f: at(4.15), x: 330, y: 366 },
          { f: at(4.55), x: 573, y: 572 },
          { f: at(4.85), x: 573, y: 572 },
          { f: at(5.1), x: 660, y: 640 },
        ],
        clicks: [at(3.85), at(4.65)],
      }}
    />
  </AbsoluteFill>
);
