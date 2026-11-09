import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Line, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE, ZH } from "../theme";

// 社区二：已合并的外部贡献（GitHub 上的真列表）。镜头从整页推到前几行，再往下扫；左边按镜头扫到的顺序列出三项新功能。
const T = TONE.paper;
const at = (s: number) => LAND + sec(s);
const ITEMS = [
  { text: "历史记录 2.0", at: at(1.7) },
  { text: "繁体中文", at: at(2.5) },
  { text: "录音预览", at: at(4.3) },
] as const;

export const Code: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="paper" />
    <Head at={at(0)} text="社区共建" color={T.ink} style={{ position: "absolute", left: 118, top: 250 }} />
    <Sub at={at(0.3)} text="七项外部贡献 均已合并" color={T.ink2} style={{ position: "absolute", left: 124, top: 414 }} />
    {ITEMS.map((it, i) => (
      <Line key={it.text} at={it.at} style={{ position: "absolute", left: 124, top: 520 + i * 84 }}>
        <div style={{ fontFamily: ZH, fontSize: 58, lineHeight: 1.2, color: T.accent }}>{it.text}</div>
      </Line>
    ))}
    <Screen
      src={assets.prsMerged}
      w={2463}
      h={1033}
      box={{ x: 690, y: 170, w: 1110, h: 740, r: 20 }}
      bg="#ffffff"
      keys={[
        { f: 0, x: 1231, y: 516, s: 0.45 },
        { f: at(0.6), x: 1231, y: 516, s: 0.45 },
        { f: at(1.5), x: 560, y: 330, s: 1.05 },
        { f: at(3.1), x: 560, y: 330, s: 1.05 },
        { f: at(4.1), x: 560, y: 720, s: 1.05 },
        { f: at(5.8), x: 560, y: 720, s: 1.05 },
        { f: at(7.0), x: 1231, y: 516, s: 0.45 },
      ]}
    />
  </AbsoluteFill>
);
