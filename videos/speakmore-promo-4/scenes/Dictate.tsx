import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 语音输入：README 的真图（口述卡 → 悬浮条 → 写入光标处）。镜头先看全貌，推到口述卡看原话一个字一个字出来，
// 移到悬浮条点完成，再移到右边看整理好的一句写出来，最后拉回全貌。
const T = TONE.ochre;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";

export const Dictate: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="ochre" />
    <Head at={at(-0.35)} text="口述成文" color={T.ink} style={{ position: "absolute", left: 118, top: 392 }} />
    <Sub at={at(-0.1)} text="口头禅与改口 即时理顺" color={T.ink2} style={{ position: "absolute", left: 124, top: 556 }} />
    <Screen
      src={assets.appDictateLight}
      w={1760}
      h={615}
      box={{ x: 690, y: 160, w: 1110, h: 760 }}
      bg="oklch(0.975 0.007 235)"
      keys={[
        { f: 0, x: 880, y: 307, s: 0.6 },
        { f: at(0.4), x: 880, y: 307, s: 0.6 },
        { f: at(1.2), x: 420, y: 222, s: 1.12 },
        { f: at(3.1), x: 430, y: 240, s: 1.12 },
        { f: at(3.8), x: 470, y: 465, s: 1.12 },
        { f: at(4.6), x: 470, y: 465, s: 1.12 },
        { f: at(5.4), x: 1290, y: 360, s: 1.05 },
        { f: at(6.1), x: 1290, y: 360, s: 1.05 },
        { f: at(7.3), x: 880, y: 307, s: 0.6 },
      ]}
      typing={[
        { x: 110, y: 170, w: 610, h: 51, at: at(1.35), dur: sec(1.15), color: CARD },
        { x: 110, y: 221, w: 430, h: 50, at: at(2.5), dur: sec(0.65), color: CARD },
        { x: 948, y: 350, w: 650, h: 62, at: at(5.5), dur: sec(0.8), color: CARD, caret: "#2f5fb8" },
      ]}
      pointer={{
        kind: "arrow",
        show: [at(3.3), at(5)],
        keys: [
          { f: at(3.3), x: 720, y: 610 },
          { f: at(3.95), x: 548, y: 455 },
          { f: at(4.55), x: 548, y: 455 },
          { f: at(5), x: 640, y: 540 },
        ],
        clicks: [at(4.1)],
      }}
    />
  </AbsoluteFill>
);
