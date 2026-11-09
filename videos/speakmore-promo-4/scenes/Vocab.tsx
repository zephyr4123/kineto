import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 词典：医学生口述病例的场景。左边词典里记着几个英文术语和中文专名，右边上下对照：没用词典时音近字乱写，
// 用了词典一次写对。镜头先推到词典里的词一个个出来，再看没用词典的一段，最后看用了词典的一段，收在两段对照上。
const T = TONE.cinnabar;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";

export const Vocab: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="cinnabar" side="left" />
    <Head at={at(-0.35)} text="专业词汇" color={T.ink} style={{ position: "absolute", left: 1312, top: 360 }} />
    <Sub at={at(-0.1)} text="医学术语 人名 小众专名" color={T.ink2} style={{ position: "absolute", left: 1318, top: 524 }} />
    <Sub at={at(4.6)} text="写进词典 一次认准" color={T.accent} style={{ position: "absolute", left: 1318, top: 578 }} />
    <Screen
      src={assets.sceneVocab}
      w={1760}
      h={690}
      box={{ x: 120, y: 160, w: 1110, h: 760 }}
      bg="oklch(0.975 0.007 235)"
      keys={[
        { f: 0, x: 880, y: 345, s: 0.62 },
        { f: at(0.4), x: 880, y: 345, s: 0.62 },
        { f: at(1.0), x: 360, y: 230, s: 1.15 },
        { f: at(2.2), x: 370, y: 236, s: 1.15 },
        { f: at(2.9), x: 1185, y: 230, s: 1.05 },
        { f: at(3.9), x: 1185, y: 240, s: 1.05 },
        { f: at(4.5), x: 1185, y: 500, s: 1.05 },
        { f: at(5.9), x: 1185, y: 510, s: 1.05 },
        { f: at(6.9), x: 1185, y: 345, s: 1.0 },
      ]}
      typing={[
        { x: 108, y: 172, w: 445, h: 76, at: at(1.1), dur: sec(0.5), color: CARD },
        { x: 108, y: 254, w: 460, h: 76, at: at(1.55), dur: sec(0.55), color: CARD },
        { x: 718, y: 178, w: 890, h: 58, at: at(3.0), dur: sec(0.6), color: CARD },
        { x: 718, y: 236, w: 160, h: 58, at: at(3.6), dur: sec(0.2), color: CARD },
        { x: 718, y: 466, w: 820, h: 56, at: at(4.6), dur: sec(0.6), color: CARD },
        { x: 718, y: 522, w: 370, h: 58, at: at(5.2), dur: sec(0.35), color: CARD },
      ]}
    />
  </AbsoluteFill>
);
