import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { FinishKey, KEY, Waveform } from "../components/bar";
import { LAND, TONE } from "../theme";

// 语音输入：用 App 自己的界面和悬浮条出的图（口述卡 → 悬浮条 → 写入光标处），口述的话是为这支片子写的生活场景。
// 要让人一眼看出是在说话：悬浮条的声波一直在跳，口述卡里的原话跟着一个字一个字认出来；说完再按一下右 ⌥（和悬浮条上方的提示一致），声波收住，
// 整理好的一段整段落进右边的光标处（App 是粘贴进去的，不是一个字一个字打）。最后拉回全貌。
const T = TONE.ochre;
const at = (s: number) => LAND + sec(s);
const CARD = "#f9fbfc";
const DONE = at(4.6);

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
        { f: at(0.3), x: 880, y: 332, s: 0.6 },
        { f: at(1.1), x: 430, y: 300, s: 1.0 },
        { f: at(3.9), x: 440, y: 320, s: 1.0 },
        { f: at(4.7), x: 450, y: 340, s: 1.04 },
        { f: at(5.4), x: 1300, y: 400, s: 1.05 },
        { f: at(7.1), x: 1300, y: 400, s: 1.05 },
        { f: at(8.2), x: 880, y: 332, s: 0.6 },
      ]}
      typing={[
        { x: 116, y: 172, w: 600, h: 50, at: at(0.5), dur: sec(1.35), color: CARD, step: 29.9 },
        { x: 116, y: 222, w: 600, h: 48, at: at(1.95), dur: sec(1.35), color: CARD, step: 29.9 },
        { x: 116, y: 270, w: 390, h: 50, at: at(3.4), dur: sec(0.85), color: CARD, step: 29.9 },
        { x: 948, y: 326, w: 700, h: 164, at: at(5.5), dur: sec(0.25), color: CARD, fade: true },
      ]}
      overlay={
        <>
          <Waveform x={368} cy={496.5} stop={DONE} />
          <FinishKey cx={426} y={560} at={DONE} doneX={545} doneY={497} keys={[KEY.rightOption]} />
        </>
      }
    />
  </AbsoluteFill>
);
