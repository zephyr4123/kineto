import { AbsoluteFill } from "remotion";
import { Clawd } from "../components/Clawd";
import { CitySkyline, RainbowTrail } from "../components/Flight";
import { PixelText } from "../components/PixelText";
import { Crt } from "../components/Retro";
import { Sprite } from "../components/Sprite";
import { Sky } from "../components/World";
import { LOGO } from "../logo";
import { STAR, STAR_GOLD } from "../sprites";
import { CLAWD, CREAM, FONT_BODY, FONT_MONO, GOLD } from "../theme";
import { LogoArt, Stars, SUBLINE, TAGLINE } from "./Logo";

// 发布用的封面：夜空 + 城市，行书 kineto 立体字，Clawd 站在 i 上当点，
// 一道彩虹从左下角划上来接到他身上。横版 16:9（抖音 / 视频号 / X），竖版 3:4（小红书）。

// 一段二次贝塞尔曲线上的点，头在前（RainbowTrail 头部最亮最粗）
const arc = (from: { x: number; y: number }, ctrl: { x: number; y: number }, to: { x: number; y: number }, n = 48) =>
  Array.from({ length: n }, (_, i) => {
    const t = 1 - i / (n - 1);
    const u = 1 - t;
    return { x: u * u * from.x + 2 * u * t * ctrl.x + t * t * to.x, y: u * u * from.y + 2 * u * t * ctrl.y + t * t * to.y };
  });

const DOT = { x: LOGO.iDot.x, y: LOGO.iDot.y + 30 };

// 1920×1080 的主画面：logo、Clawd、彩虹、星星都按这个坐标系画
const Hero: React.FC<{ trailFrom: { x: number; y: number }; trailCtrl: { x: number; y: number } }> = ({ trailFrom, trailCtrl }) => (
  <>
    <RainbowTrail points={arc(trailFrom, trailCtrl, { x: DOT.x, y: DOT.y - 30 })} band={13} />
    <LogoArt main={1} cross={1} solid={1} />
    <div style={{ position: "absolute", left: DOT.x - 150, top: DOT.y - 180, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,210,74,0.45) 0%, rgba(255,210,74,0) 65%)" }} />
    <Clawd x={DOT.x} y={DOT.y} scale={6} pose={{ eyes: "center", arms: "up", legs: "stand" }} />
    {[
      [1640, 250, 6],
      [300, 230, 5],
      [1500, 760, 4],
    ].map(([x, y, s], i) => (
      <div key={i} style={{ position: "absolute", left: x, top: y, transform: `rotate(${i * 12 - 10}deg)` }}>
        <Sprite grid={STAR} palette={STAR_GOLD} scale={s} />
      </div>
    ))}
  </>
);

const Taglines: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.32 }}>
    <PixelText size={size} font={FONT_BODY} color={CREAM} outline={Math.round(size / 15)} outlineColor="#141019" shadow={Math.round(size / 12)} shadowColor={CLAWD}>
      {TAGLINE}
    </PixelText>
    <PixelText size={Math.round(size * 0.45)} font={FONT_MONO} color="#d4dcff" outline={3} outlineColor="#141a44">
      {SUBLINE}
    </PixelText>
  </div>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Sky camX={9000} camY={-2600} frame={0} mood={0} sunset={1} sunY={2000} clouds={0.12} />
    <Stars frame={20} opacity={1} />
    <CitySkyline camX={11000} camY={-2400} opacity={1} frame={0} />
    <Hero trailFrom={{ x: -120, y: 1120 }} trailCtrl={{ x: 260, y: 160 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
      <Taglines size={76} />
    </div>
    <div style={{ position: "absolute", right: 48, bottom: 40 }}>
      <PixelText size={24} font={FONT_MONO} color={GOLD} outline={3}>
        github.com/zephyr4123/kineto
      </PixelText>
    </div>
    <Crt strength={0.6} />
  </AbsoluteFill>
);

// 竖版：同一套画面缩小放在上半部，标语放大压在下面
const PW = 1080;
const PH = 1440;
const K = 0.72;
export const CoverPortrait: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Sky camX={9000} camY={-2900} frame={0} mood={0} sunset={1} sunY={2400} clouds={0.08} />
    <Stars frame={20} opacity={1} />
    <div style={{ position: "absolute", left: 0, top: PH - 1080, width: 1920, height: 1080 }}>
      <CitySkyline camX={11000} camY={-2400} opacity={1} frame={0} />
    </div>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(${PW / 2 - 960 * K}px, ${545 - 470 * K}px) scale(${K})` }}>
      <Hero trailFrom={{ x: 300, y: 1500 }} trailCtrl={{ x: 380, y: 300 }} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center" }}>
      <Taglines size={64} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, textAlign: "center" }}>
      <PixelText size={26} font={FONT_MONO} color={GOLD} outline={3}>
        github.com/zephyr4123/kineto
      </PixelText>
    </div>
    <Crt strength={0.6} />
  </AbsoluteFill>
);
