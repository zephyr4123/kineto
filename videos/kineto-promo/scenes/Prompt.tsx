import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Clawd } from "../components/Clawd";
import { Cues } from "../components/Sfx";
import { Burst, Twinkle } from "../components/Particles";
import { PixelText } from "../components/PixelText";
import { Bubble, Crt, PixelBox } from "../components/Retro";
import { backOut, blinking, clamp, easeIn, easeInOut, easeOut, jumpArc, landSquash, mix, shake, sumShakes, tween, typed } from "../fx";
import { Ground, palette, Sky } from "../components/World";
import { CLAWD, CREAM, FONT_ARCADE, FONT_MONO, GOLD, INK } from "../theme";
import { GROUND_Y } from "../timing";

// 开场：Clawd 从天而降砸在输入框上 → 输入「帮我做一个视频」→ 回车变成任务卷轴 → Clawd 跳起接住
// → 输入框压扁、拉宽，变成第一幕的地平线。
const PROMPT = "make me a video";
const BOX = { cx: 960, cy: 620, w: 1240, h: 150 };
const SCALE = 14;

const LAND = 22;
const TYPE_START = 44;
const PER_CHAR = 4;
const ENTER = 118;
const CARD_POP = 132;
const ALERT = 146;
const JUMP = 168;
const JUMP_LEN = 34;
const GRAB = JUMP + JUMP_LEN / 2;
const COLLAPSE = [206, 232] as const;

const CUES = [
  [LAND, "thud"],
  ...Array.from(PROMPT, (_, i) => [TYPE_START + i * PER_CHAR, "key", 0.45] as const),
  [ENTER, "enter"],
  [CARD_POP, "quest"],
  [ALERT, "pop", 0.7],
  [JUMP, "jump"],
  [GRAB, "sparkle"],
  [JUMP + JUMP_LEN, "thud", 0.4],
  [COLLAPSE[0], "whoosh", 0.8],
  [COLLAPSE[1], "thud", 0.7],
] as const;

export const Prompt: React.FC = () => {
  const frame = useCurrentFrame();

  // 输入框：落地时被砸得一沉，最后压成地平线
  const dip = frame >= LAND ? 14 * Math.exp(-(frame - LAND) / 5) * Math.cos((frame - LAND) / 2.5) : 0;
  const collapse = tween(frame, COLLAPSE, [0, 1], easeInOut);
  const boxW = interpolate(collapse, [0, 1], [BOX.w, 1920 + 40]);
  const boxH = interpolate(collapse, [0, 1], [BOX.h, 12]);
  const boxCy = interpolate(collapse, [0, 1], [BOX.cy, GROUND_Y + 6]) + dip;
  const boxTop = boxCy - boxH / 2;
  const enterFlash = frame >= ENTER && frame < ENTER + 6;
  const border = interpolate(collapse, [0.6, 1], [0, 1], clamp);
  const sky = palette(0);
  const borderColor = enterFlash ? "white" : mix(CLAWD, sky.groundTop, border);

  // Clawd：坠落 → 落地 → 看字 → 抬头 → 跳起抓卷轴 → 落回，随输入框下沉
  const fallP = tween(frame, [0, LAND], [0, 1], easeIn);
  const startX = BOX.cx + BOX.w / 2 - 150;
  const jumpT = frame - JUMP;
  const cx = frame < JUMP ? startX : interpolate(jumpT, [0, JUMP_LEN], [startX, 960], { ...clamp, easing: easeInOut });
  const restY = boxTop - 6;
  const cy = frame < LAND ? interpolate(fallP, [0, 1], [-160, BOX.cy - BOX.h / 2]) : restY - jumpArc(jumpT, JUMP_LEN, 340);
  const landedAgain = JUMP + JUMP_LEN;
  const squash = frame < landedAgain ? landSquash(frame, LAND) : landSquash(frame, landedAgain);
  const airborne = frame < LAND || (jumpT > 0 && jumpT < JUMP_LEN);
  const eyes = frame < LAND ? "wide" : frame >= ALERT && frame < landedAgain ? "up" : frame >= TYPE_START - 10 && frame < ENTER + 10 ? "down" : blinking(frame) ? "closed" : "center";
  const arms = airborne || (frame >= GRAB && frame < landedAgain + 20) ? "up" : "side";

  const s = sumShakes(shake(frame, LAND, 18, 18, "land"), shake(frame, landedAgain, 10, 8, "land2"), shake(frame, COLLAPSE[1], 12, 10, "collapse"));

  // 卷轴：文字从输入框升起，变成任务卡；Clawd 碰到它时缩进身体里
  const textLift = tween(frame, [ENTER, ENTER + 18], [0, 1], easeOut);
  const cardScale = frame < GRAB ? tween(frame, [CARD_POP, CARD_POP + 14], [0, 1], backOut) : tween(frame, [GRAB, GRAB + 8], [1, 0], easeIn);
  const cardY = 290 + Math.sin(frame / 9) * 6;

  // 镜头一直缓缓右移，背景按视差跟着走；到本场结束时正好归零，与第一幕开头接上
  const camX = (frame - 240) * 2.5;
  const groundRise = tween(frame, COLLAPSE, [320, 0], easeInOut);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sky camX={camX} frame={frame} mood={0} />
      {frame >= COLLAPSE[0] ? (
        <AbsoluteFill style={{ transform: `translateY(${groundRise}px)` }}>
          <Ground camX={0} mood={0} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
        {/* 输入框 → 地平线 */}
        <PixelBox x={960 - boxW / 2} y={boxTop} w={boxW} h={boxH} border={6} color={borderColor} fill={mix("#1b2a5c", sky.ground, border)} style={{ opacity: frame >= COLLAPSE[1] ? 0 : 0.94 }}>
          <div
            style={{
              position: "absolute",
              left: 44,
              top: 0,
              height: BOX.h,
              display: "flex",
              alignItems: "center",
              gap: 26,
              opacity: 1 - tween(frame, [ENTER, ENTER + 10], [0, 1]),
            }}
          >
            <PixelText size={72} color={CLAWD} font={FONT_MONO}>
              ❯
            </PixelText>
            <PixelText size={72} color={CREAM} font={FONT_MONO}>
              {typed(PROMPT, frame, TYPE_START, PER_CHAR)}
            </PixelText>
            <div style={{ width: 36, height: 78, backgroundColor: CLAWD, opacity: frame < ENTER && Math.floor(frame / 15) % 2 === 0 ? 1 : 0, marginLeft: -16 }} />
          </div>
        </PixelBox>
        {/* 回车后文字升起 */}
        {frame >= ENTER && frame < CARD_POP + 6 ? (
          <div
            style={{
              position: "absolute",
              left: BOX.cx - BOX.w / 2 + 130,
              top: BOX.cy - 44 - 260 * textLift,
              transform: `scale(${1 + 0.25 * textLift})`,
              transformOrigin: "0 50%",
              opacity: 1 - tween(frame, [CARD_POP - 2, CARD_POP + 6], [0, 1]),
            }}
          >
            <PixelText size={72} color={CREAM} font={FONT_MONO}>
              {PROMPT}
            </PixelText>
          </div>
        ) : null}
        {/* 任务卡：背后一圈旋转的光芒，像游戏里拿到道具 */}
        {cardScale > 0.01 ? (
          <div
            style={{
              position: "absolute",
              left: 960 - 900,
              top: cardY - 900,
              width: 1800,
              height: 1800,
              transform: `rotate(${frame * 0.6}deg) scale(${cardScale})`,
              background: `repeating-conic-gradient(rgba(255,210,74,0.16) 0deg 9deg, rgba(255,210,74,0) 9deg 22.5deg)`,
              maskImage: "radial-gradient(circle, black 0%, black 18%, transparent 60%)",
            }}
          />
        ) : null}
        {cardScale > 0.01 ? (
          <div style={{ position: "absolute", left: 960, top: cardY, transform: `translate(-50%, -50%) scale(${cardScale})` }}>
            <PixelBox x={0} y={0} w={800} h={240} border={10} color={GOLD} fill="#2a1d0e" style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
                <PixelText size={44} font={FONT_ARCADE} color={GOLD} shadow={5} shadowColor="#6b3d00">
                  NEW QUEST!
                </PixelText>
                <PixelText size={54} font={FONT_ARCADE} color={CREAM} shadow={6} shadowColor={INK}>
                  MAKE A VIDEO
                </PixelText>
              </div>
            </PixelBox>
          </div>
        ) : null}
        <Burst frame={frame} start={CARD_POP} x={960} y={290} seed="card" colors={[GOLD, CREAM]} count={16} speed={[6, 16]} angle={[-180, 180]} gravity={0.2} life={30} />
        <Burst frame={frame} start={GRAB} x={960} y={cy - 60} seed="grab" colors={[GOLD, CREAM, CLAWD]} count={22} speed={[6, 20]} angle={[-180, 180]} gravity={0.3} life={36} />
        <Twinkle x={900} y={250} frame={frame} start={GRAB + 2} size={10} />
        <Twinkle x={1040} y={330} frame={frame} start={GRAB + 6} size={8} color={GOLD} />

        <Clawd x={cx} y={cy} scale={SCALE} pose={{ eyes, arms, legs: airborne ? "tuck" : "stand" }} squash={squash} />
        <Bubble x={cx} y={cy - 10 * SCALE - 18} text="!" scale={frame < landedAgain ? tween(frame, [ALERT, ALERT + 10], [0, 1], backOut) * tween(frame, [JUMP - 4, JUMP], [1, 0]) : 0} color={GOLD} />
        <Burst frame={frame} start={LAND} x={startX} y={BOX.cy - BOX.h / 2} seed="dust" colors={["#8a8399", "#cfc8dc"]} count={14} speed={[3, 10]} angle={[-170, -10]} gravity={0.35} life={30} size={[10, 18]} />
      </AbsoluteFill>
      {/* 回车时整屏一闪 */}
      <AbsoluteFill style={{ backgroundColor: "white", opacity: tween(frame, [ENTER, ENTER + 8], [0.35, 0]) * (frame >= ENTER ? 1 : 0) }} />
      <Crt />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};

