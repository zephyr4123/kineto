import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { shake, sumShakes } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { beat } from "../beat";
import { ColorStrip, Journey, Thermo } from "../components/Gauges";
import { Grid } from "../components/Grid";
import { Flash, Grain, Leak, Vignette } from "../components/Overlays";
import { Shot } from "../components/Shot";
import { Chip, Slam } from "../components/Slam";
import { ESPRESSO } from "../theme";

// 烘焙段（全片高潮，也是风格样片）。四小节一个乐句：
// 1 生豆入锅 → 2 升温变色 → 3 四宫格对比 + 结巴推镜蓄力 → 4 「一爆」落点 → 5 裂开的豆子 → 6 香味收束 → 下一站
// 所有切点写成拍号（beat(n)），换配乐只改 beat.ts 的 BPM。
export const ROAST_BEATS = 26;

// 重拍上的震动：[拍, 幅度]
const HITS = [
  [0, 12],
  [12, 34],
  [13, 10],
  [14, 10],
  [15, 10],
  [16, 14],
  [17, 14],
] as const;

export const Roast: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const jolt = sumShakes(...HITS.map(([at, amp], i) => shake(f, beat(at), 10, amp, `roast-${i}`)));
  const temp = interpolate(f, [beat(4), beat(8), beat(10), beat(11.9), beat(12)], [25, 120, 165, 192, 196], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const roast = interpolate(f, [beat(4), beat(8), beat(12), beat(16), beat(20)], [0.02, 0.28, 0.5, 0.7, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ESPRESSO }}>
      <AbsoluteFill style={{ translate: `${jolt.x}px ${jolt.y}px`, scale: "1.04" }}>
        {/* 1 生豆入锅 */}
        <Sequence name="greenPour" from={beat(0)} durationInFrames={beat(2)} premountFor={fps}>
          <Shot src={assets.greenPour} duration={beat(2)} scale={[1.05, 1.2]} punch={0.2} zoomIn={70} aberration={20} />
        </Sequence>
        <Sequence name="greenHand" from={beat(2)} durationInFrames={beat(3) - beat(2)} premountFor={fps}>
          <Shot src={assets.greenHand} duration={beat(3) - beat(2)} scale={[1.15, 1.25]} x={[30, -20]} />
        </Sequence>
        <Sequence name="greenBin" from={beat(3)} durationInFrames={beat(4) - beat(3)} premountFor={fps}>
          <Shot src={assets.greenBin} duration={beat(4) - beat(3)} scale={[1.1, 1.2]} exitZoom />
        </Sequence>

        {/* 2 升温变色：从缩放穿越里冲出来 */}
        <Sequence name="yellowDrum" from={beat(4)} durationInFrames={beat(6) - beat(4)} premountFor={fps}>
          <Shot src={assets.yellowDrum} duration={beat(6) - beat(4)} scale={[1.3, 1.1]} zoomIn={90} punch={0} />
        </Sequence>
        <Sequence name="goldenDrum" from={beat(6)} durationInFrames={beat(7) - beat(6)} premountFor={fps}>
          <Shot src={assets.goldenDrum} duration={beat(7) - beat(6)} scale={[1.1, 1.22]} rotate={[-2, 1]} />
        </Sequence>
        <Sequence name="paddleDrum" from={beat(7)} durationInFrames={beat(8) - beat(7)} premountFor={fps}>
          <Shot src={assets.paddleDrum} duration={beat(8) - beat(7)} scale={[1.12, 1.2]} y={[0, -40]} />
        </Sequence>

        {/* 3 四宫格：同一批豆子烘到不同程度，半拍弹进一格 */}
        <Sequence name="grid" from={beat(8)} durationInFrames={beat(10) - beat(8)} premountFor={fps}>
          <Grid
            cells={[
              { src: assets.greenBin, label: "生豆", at: 0 },
              { src: assets.yellowDrum, label: "转黄", at: beat(0.5) },
              { src: assets.goldenDrum, label: "肉桂", at: beat(1) },
              { src: assets.macroBeans, label: "中烘", at: beat(1.5) },
            ]}
          />
        </Sequence>
        <Sequence name="controlPanel" from={beat(10)} durationInFrames={beat(11) - beat(10)} premountFor={fps}>
          <Shot src={assets.controlPanel} duration={beat(11) - beat(10)} scale={[1.1, 1.18]} />
        </Sequence>
        {/* 结巴推镜：同一张照片每个十六分音符推近一截，蓄力到落点。细节密的照片放大后色差会糊成彩色马赛克，选色块大的 */}
        <Sequence name="stutter-1" from={beat(11)} durationInFrames={beat(11.25) - beat(11)} premountFor={fps}>
          <Shot src={assets.goldenDrum} duration={beat(11.25) - beat(11)} scale={[1.15, 1.15]} punch={0.05} zoomIn={16} aberration={4} />
        </Sequence>
        <Sequence name="stutter-2" from={beat(11.25)} durationInFrames={beat(11.5) - beat(11.25)} premountFor={fps}>
          <Shot src={assets.goldenDrum} duration={beat(11.5) - beat(11.25)} scale={[1.3, 1.3]} punch={0.05} zoomIn={22} aberration={6} />
        </Sequence>
        <Sequence name="stutter-3" from={beat(11.5)} durationInFrames={beat(11.75) - beat(11.5)} premountFor={fps}>
          <Shot src={assets.goldenDrum} duration={beat(11.75) - beat(11.5)} scale={[1.5, 1.5]} punch={0.05} zoomIn={28} aberration={8} />
        </Sequence>
        <Sequence name="stutter-4" from={beat(11.75)} durationInFrames={beat(12) - beat(11.75)} premountFor={fps}>
          <Shot src={assets.goldenDrum} duration={beat(12) - beat(11.75)} scale={[1.75, 2]} punch={0.05} zoomIn={40} aberration={10} />
        </Sequence>

        {/* 4 一爆：落点 */}
        <Sequence name="smokePour" from={beat(12)} durationInFrames={beat(13) - beat(12)} premountFor={fps}>
          <Shot src={assets.smokePour} duration={beat(13) - beat(12)} scale={[1.08, 1.16]} punch={0.28} zoomIn={120} aberration={50} />
        </Sequence>
        <Sequence name="steamSpill" from={beat(13)} durationInFrames={beat(14) - beat(13)} premountFor={fps}>
          <Shot src={assets.steamSpill} duration={beat(14) - beat(13)} scale={[1.12, 1.2]} punch={0.18} aberration={24} />
        </Sequence>
        <Sequence name="trayPour" from={beat(14)} durationInFrames={beat(15) - beat(14)} premountFor={fps}>
          <Shot src={assets.trayPour} duration={beat(15) - beat(14)} scale={[1.1, 1.22]} punch={0.18} aberration={24} />
        </Sequence>
        <Sequence name="coolingArm" from={beat(15)} durationInFrames={beat(16) - beat(15)} premountFor={fps}>
          <Shot src={assets.coolingArm} duration={beat(16) - beat(15)} scale={[1.1, 1.2]} punch={0.18} aberration={24} exitZoom />
        </Sequence>

        {/* 5 裂开的豆子 */}
        <Sequence name="macroBeans" from={beat(16)} durationInFrames={beat(17) - beat(16)} premountFor={fps}>
          <Shot src={assets.macroBeans} duration={beat(17) - beat(16)} scale={[1.35, 1.2]} zoomIn={90} punch={0} />
        </Sequence>
        <Sequence name="macroDark" from={beat(17)} durationInFrames={beat(18) - beat(17)} premountFor={fps}>
          <Shot src={assets.macroDark} duration={beat(18) - beat(17)} scale={[1.15, 1.3]} punch={0.2} aberration={20} />
        </Sequence>

        {/* 6 香味收束：拉远亮出整碗深烘豆 */}
        <Sequence name="darkBowl" from={beat(18)} durationInFrames={beat(24) - beat(18)} premountFor={fps}>
          <Shot src={assets.darkBowl} duration={beat(24) - beat(18)} scale={[1.45, 1.08]} punch={0.1} zoomIn={60} exitZoom />
        </Sequence>
        <Sequence name="outro" from={beat(24)} durationInFrames={beat(ROAST_BEATS) - beat(24)} premountFor={fps}>
          <AbsoluteFill style={{ backgroundColor: ESPRESSO }} />
        </Sequence>
      </AbsoluteFill>

      {/* 叠加层：颗粒和暗角全程，字与仪表在照片之上、不跟着震 */}
      <Grain />
      <Vignette />

      <Sequence name="title" from={beat(0)} durationInFrames={beat(2)} premountFor={fps}>
        <Slam text="烘焙" size={400} y={860} />
      </Sequence>
      <Sequence name="chip-green" from={beat(2)} durationInFrames={beat(4) - beat(2)} premountFor={fps}>
        <Chip text="生豆：青绿、坚硬、没有咖啡香" y={1180} />
      </Sequence>
      <Sequence name="strip-1" from={beat(4)} durationInFrames={beat(8) - beat(4)} premountFor={fps}>
        <ColorStrip progress={roast} />
      </Sequence>
      <Sequence name="thermo-1" from={beat(4)} durationInFrames={beat(8) - beat(4)} premountFor={fps}>
        <Thermo value={temp} />
      </Sequence>
      <Sequence name="thermo-2" from={beat(10)} durationInFrames={beat(12) - beat(10)} premountFor={fps}>
        <Thermo value={temp} />
      </Sequence>
      <Sequence name="strip-2" from={beat(10)} durationInFrames={beat(24) - beat(10)} premountFor={fps}>
        <ColorStrip progress={roast} />
      </Sequence>

      <Sequence name="crack" from={beat(12)} durationInFrames={beat(14) - beat(12)} premountFor={fps}>
        <Slam text="一爆！" size={420} y={820} tilt={-6} />
      </Sequence>
      <Sequence name="thermo-crack" from={beat(12)} durationInFrames={beat(16) - beat(12)} premountFor={fps}>
        <Thermo value={temp} />
      </Sequence>
      <Sequence name="chip-crack" from={beat(16)} durationInFrames={beat(18) - beat(16)} premountFor={fps}>
        <Chip text="豆子受热膨胀，噼啪裂开" y={1180} />
      </Sequence>
      <Sequence name="aroma-1" from={beat(18)} durationInFrames={beat(24) - beat(18)} premountFor={fps}>
        <Slam text="香味" size={340} y={700} />
      </Sequence>
      <Sequence name="aroma-2" from={beat(19)} durationInFrames={beat(24) - beat(19)} premountFor={fps}>
        <Slam text="是烤出来的" size={150} y={1010} tilt={-4} />
      </Sequence>
      <Sequence name="next" from={beat(24)} durationInFrames={beat(ROAST_BEATS) - beat(24)} premountFor={fps}>
        <Slam text={"下一站\n研磨"} size={200} y={900} />
      </Sequence>

      <Journey active={3} fill={interpolate(f, [beat(24), beat(25.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

      {/* 闪白只放在乐句的重拍上 */}
      <Sequence name="flash-0" from={beat(0)} durationInFrames={6} premountFor={fps}>
        <Flash />
      </Sequence>
      <Sequence name="flash-crack" from={beat(12)} durationInFrames={8} premountFor={fps}>
        <Flash hold={2} fade={5} />
      </Sequence>
      <Sequence name="flash-aroma" from={beat(18)} durationInFrames={6} premountFor={fps}>
        <Flash color="#ffd9a8" />
      </Sequence>
      <Sequence name="leak-crack" from={beat(12)} durationInFrames={beat(15) - beat(12)} premountFor={fps}>
        <Leak duration={beat(15) - beat(12)} seed={4} />
      </Sequence>
      <Sequence name="leak-aroma" from={beat(18)} durationInFrames={beat(21) - beat(18)} premountFor={fps}>
        <Leak duration={beat(21) - beat(18)} seed={9} opacity={0.55} />
      </Sequence>
    </AbsoluteFill>
  );
};
