import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 语音输入：用 App 自己的界面和悬浮条出的图（口述卡 → 悬浮条 → 写入光标处），口述的话是为这支片子写的生活场景。
// 镜头先看全貌，推到口述卡看原话一行一行出来，移到悬浮条点完成，再移到右边看整理好的一段写出来，最后拉回全貌。
const T = TONE.ochre;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";

export const Dictate: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="ochre" />
    <Head at={at(-0.35)} text="口述成文" color={T.ink} style={{ position: "absolute", left: 118, top: 392 }} />
    <Sub at={at(-0.1)} text="语序理顺 赘字删净" color={T.ink2} style={{ position: "absolute", left: 124, top: 556 }} />
    <Screen
      src={assets.sceneDictate}
      w={1760}
      h={664}
      box={{ x: 690, y: 160, w: 1110, h: 760 }}
      bg="oklch(0.975 0.007 235)"
      keys={[
        { f: 0, x: 880, y: 332, s: 0.6 },
        { f: at(0.4), x: 880, y: 332, s: 0.6 },
        { f: at(1.2), x: 420, y: 232, s: 1.12 },
        { f: at(3.3), x: 430, y: 258, s: 1.12 },
        { f: at(4.0), x: 470, y: 425, s: 1.12 },
        { f: at(4.9), x: 470, y: 425, s: 1.12 },
        { f: at(5.6), x: 1300, y: 400, s: 1.05 },
        { f: at(7.1), x: 1300, y: 400, s: 1.05 },
        { f: at(8.2), x: 880, y: 332, s: 0.6 },
      ]}
      typing={[
        { x: 110, y: 172, w: 615, h: 50, at: at(1.3), dur: sec(0.85), color: CARD },
        { x: 110, y: 222, w: 615, h: 48, at: at(2.15), dur: sec(0.85), color: CARD },
        { x: 110, y: 270, w: 395, h: 50, at: at(3.0), dur: sec(0.55), color: CARD },
        { x: 948, y: 326, w: 700, h: 56, at: at(5.7), dur: sec(0.55), color: CARD },
        { x: 948, y: 382, w: 700, h: 54, at: at(6.25), dur: sec(0.55), color: CARD },
        { x: 948, y: 436, w: 100, h: 54, at: at(6.8), dur: sec(0.2), color: CARD, caret: "#2f5fb8" },
      ]}
      pointer={{
        kind: "arrow",
        show: [at(3.6), at(5.3)],
        keys: [
          { f: at(3.6), x: 720, y: 620 },
          { f: at(4.2), x: 545, y: 497 },
          { f: at(4.75), x: 545, y: 497 },
          { f: at(5.2), x: 640, y: 580 },
        ],
        clicks: [at(4.35)],
      }}
    />
  </AbsoluteFill>
);
