import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Count, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 花费：引擎页"推荐组合"的真截图。框就是窗口本身，镜头在窗口里推到本机 + DeepSeek 那一行（¥2.63/月），再移到纯本机（¥0）。
// 数字和 README 的推荐组合表一致：每日 100 次、每月 30 天的估算。
const T = TONE.cinnabar;
const at = (s: number) => LAND + sec(s);

export const Cost: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="cinnabar" />
    <div style={{ position: "absolute", left: 116, top: 262 }}>
      <Count at={at(-0.1)} value={2.63} decimals={2} prefix="¥" dur={100} size={250} color={T.ink} />
    </div>
    <Head at={at(0.35)} text="月均花费" color={T.ink} size={84} style={{ position: "absolute", left: 124, top: 520 }} />
    <Sub at={at(0.6)} text="每日百次估算" color={T.ink2} style={{ position: "absolute", left: 128, top: 632 }} />
    <Sub at={at(4.3)} text="纯本机运行 零花费" color={T.accent} style={{ position: "absolute", left: 128, top: 686 }} />
    <Screen
      src={assets.appPresets}
      w={2320}
      h={1660}
      box={{ x: 735, y: 165, w: 1080, h: 750, r: 14 }}
      bg="#f7f8fa"
      keys={[
        { f: 0, x: 1159, y: 830, s: 0.5 },
        { f: at(0.7), x: 1159, y: 830, s: 0.5 },
        { f: at(1.8), x: 1335, y: 425, s: 1 },
        { f: at(3.5), x: 1335, y: 425, s: 1 },
        { f: at(4.4), x: 1335, y: 1150, s: 1 },
        { f: at(5.8), x: 1335, y: 1150, s: 1 },
        { f: at(7.0), x: 1159, y: 830, s: 0.5 },
      ]}
    />
  </AbsoluteFill>
);
