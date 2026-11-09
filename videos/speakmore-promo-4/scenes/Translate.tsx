import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 语音翻译：和语音输入同一套运镜，说的是中文（订餐厅的位子），落下的是英文。中间在悬浮条上点一下目标语言、再点完成。
const T = TONE.night;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";

export const Translate: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="night" />
    <Head at={at(-0.35)} text="语音翻译" color={T.ink} style={{ position: "absolute", left: 118, top: 392 }} />
    <Sub at={at(-0.1)} text="中文口述 外文成稿" color={T.ink2} style={{ position: "absolute", left: 124, top: 556 }} />
    <Screen
      src={assets.sceneTranslate}
      w={1760}
      h={786}
      box={{ x: 690, y: 160, w: 1110, h: 760 }}
      bg="oklch(0.975 0.007 235)"
      keys={[
        { f: 0, x: 880, y: 393, s: 0.62 },
        { f: at(0.4), x: 880, y: 393, s: 0.62 },
        { f: at(1.2), x: 420, y: 215, s: 1.12 },
        { f: at(2.6), x: 420, y: 228, s: 1.12 },
        { f: at(3.3), x: 440, y: 500, s: 1.05 },
        { f: at(4.8), x: 440, y: 500, s: 1.05 },
        { f: at(5.5), x: 1300, y: 470, s: 1.02 },
        { f: at(7.1), x: 1300, y: 470, s: 1.02 },
        { f: at(8.2), x: 880, y: 393, s: 0.62 },
      ]}
      typing={[
        { x: 110, y: 172, w: 600, h: 50, at: at(1.3), dur: sec(0.9), color: CARD },
        { x: 110, y: 222, w: 150, h: 48, at: at(2.2), dur: sec(0.3), color: CARD },
        { x: 948, y: 388, w: 700, h: 54, at: at(5.6), dur: sec(0.55), color: CARD },
        { x: 948, y: 443, w: 670, h: 54, at: at(6.15), dur: sec(0.55), color: CARD },
        { x: 948, y: 498, w: 205, h: 52, at: at(6.7), dur: sec(0.25), color: CARD, caret: "#2f5fb8" },
      ]}
      pointer={{
        kind: "arrow",
        show: [at(3.2), at(5.1)],
        keys: [
          { f: at(3.2), x: 700, y: 330 },
          { f: at(3.7), x: 300, y: 412 },
          { f: at(4.15), x: 300, y: 412 },
          { f: at(4.55), x: 573, y: 619 },
          { f: at(4.85), x: 573, y: 619 },
          { f: at(5.1), x: 660, y: 690 },
        ],
        clicks: [at(3.85), at(4.65)],
      }}
    />
  </AbsoluteFill>
);
