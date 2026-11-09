import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { FinishKey, Waveform } from "../components/bar";
import { LAND, TONE } from "../theme";

// 语音翻译：和语音输入同一套做法，说的是中文（订餐厅的位子），落下的是英文。声波一直在跳、原话跟着认出来；
// 说完按一下键，声波收住，英文整段落进光标处（目标语言在悬浮条的菜单里已经选好英文）。
const T = TONE.night;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";
const DONE = at(3.8);

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
        { f: at(0.3), x: 880, y: 393, s: 0.62 },
        { f: at(1.1), x: 420, y: 370, s: 1.0 },
        { f: at(3.9), x: 430, y: 390, s: 1.0 },
        { f: at(4.7), x: 1300, y: 470, s: 1.02 },
        { f: at(7.1), x: 1300, y: 470, s: 1.02 },
        { f: at(8.2), x: 880, y: 393, s: 0.62 },
      ]}
      typing={[
        { x: 116, y: 172, w: 585, h: 50, at: at(0.5), dur: sec(1.45), color: CARD, step: 29.15 },
        { x: 116, y: 222, w: 146, h: 48, at: at(2.05), dur: sec(0.4), color: CARD, step: 29.15 },
        { x: 948, y: 388, w: 702, h: 164, at: at(4.8), dur: sec(0.25), color: CARD, fade: true },
      ]}
      overlay={
        <>
          <Waveform x={396} cy={618.5} stop={DONE} />
          <FinishKey x={640} y={571} at={DONE} doneX={573} doneY={619} />
        </>
      }
    />
  </AbsoluteFill>
);
