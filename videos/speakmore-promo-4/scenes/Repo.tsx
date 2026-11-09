import { AbsoluteFill } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Count, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// GitHub 的星标：仓库首页的真截图，镜头从整条推到 Fork 和 Star 两个数上。
const T = TONE.night;
const at = (s: number) => LAND + sec(s);

export const Repo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="night" />
    <div style={{ position: "absolute", left: 116, top: 250 }}>
      <Count at={at(-0.2)} value={194} dur={100} size={330} color={T.ink} />
    </div>
    <Head at={at(0.3)} text="GitHub 星标" color={T.ink} size={84} style={{ position: "absolute", left: 124, top: 588 }} />
    <Sub at={at(0.6)} text="开源 MIT 许可 复刻 57 次" color={T.ink2} style={{ position: "absolute", left: 128, top: 700 }} />
    <Screen
      src={assets.repoHead}
      w={2480}
      h={360}
      box={{ x: 900, y: 430, w: 900, h: 250, r: 18 }}
      bg="#ffffff"
      keys={[
        { f: 0, x: 1240, y: 180, s: 0.363 },
        { f: at(0.9), x: 1240, y: 180, s: 0.363 },
        { f: at(2.4), x: 2215, y: 46, s: 0.95 },
      ]}
    />
  </AbsoluteFill>
);
