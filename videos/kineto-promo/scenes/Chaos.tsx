import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ChaosScreen, GLITCH_LEAD, popupTimes } from "../components/ChaosScreen";
import { Cues } from "../components/Sfx";
import { Clawd, type Arms, type Eyes, type Legs, type Pose } from "../components/Clawd";
import { SwampHud } from "../components/Hud";
import { FILE_NAMES, JunkItem, JunkPile, pileTop, type JunkKind } from "../components/Junk";
import { LAPTOP_RATIO, Laptop } from "../components/Laptop";
import { Burst } from "../components/Particles";
import { PixelText } from "../components/PixelText";
import { Coin, FilmStrip, QBlockProp, Signpost, Smoke } from "../components/Props";
import { Bubble, Crt } from "../components/Retro";
import { Sprite } from "../components/Sprite";
import { Bushes, Fog, Ground, Rain, Sky } from "../components/World";
import { backOut, blinking, clamp, easeIn, easeInOut, easeOut, jumpArc, landSquash, runLegs, shake, sumShakes, tween } from "../fx";
import { QBLOCK_GOLD, SWEAT, SWEAT_PAL } from "../sprites";
import { FONT_ARCADE, RED } from "../theme";
import { GROUND_Y, SCENES } from "../timing";

// 第一幕「瞎猜」。主线（0–640 帧）是一个关于帧 f 的纯函数 ChaosMain，
// 后面的快剪蒙太奇直接按倍速重放主线的片段，只改垃圾山大小、血量与尝试次数。
const S = 10;
const PIT = [1640, 1980] as const;
const PILE_X = 1040;
const RESPAWN_X = 1380;
const LAPTOP_DX = 160;
const LAPTOP_SIZE = 130;

const CRUMBLE = 192;
const HEART1 = 206;
const RESPAWN = 236;
const JUMP = 272;
const JUMP_LEN = 26;
const BONK = JUMP + JUMP_LEN / 2;
const JUNK_FLY = 38;
const LAPTOP = 362;
const ZOOM_IN = [380, 396] as const;
const ZOOM_OUT = [560, 576] as const;
const SPIT = [592, 610] as const;
const HEART2 = 600;
const TOSS = [614, 640] as const;
export const MONTAGE = 640;

const JUNK_POP: { kind: JunkKind; dx: number; delay: number; label?: string }[] = [
  { kind: "file", dx: -60, delay: 0, label: FILE_NAMES[0] },
  { kind: "paper", dx: 40, delay: 3 },
  { kind: "sock", dx: -10, delay: 6 },
  { kind: "reel", dx: 90, delay: 9 },
];

// 分段线性插值：keys 为 [帧, 值] 序列
const track = (f: number, keys: readonly (readonly [number, number])[]) =>
  interpolate(
    f,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    clamp,
  );

const WALK_KEYS = [
  [0, 960],
  [20, 960],
  [60, 1260],
  [74, 1260],
  [100, 1460],
  [176, 1460],
  [192, 1740],
] as const;

interface ClawdState {
  x: number;
  y: number;
  eyes: Eyes;
  arms: Arms;
  legs: Legs;
  rotate: number;
  squash: number;
  opacity: number;
}

function clawdAt(f: number): ClawdState {
  const st: ClawdState = { x: 960, y: GROUND_Y, eyes: blinking(f, 40) ? "closed" : "center", arms: "side", legs: "stand", rotate: 0, squash: 1, opacity: 1 };
  if (f < RESPAWN) {
    st.x = track(f, WALK_KEYS);
    const walking = (f >= 20 && f < 60) || (f >= 74 && f < 100) || (f >= 176 && f < CRUMBLE);
    if (walking) {
      st.legs = runLegs(f, 7);
      st.y -= st.legs === "runB" ? S : 0;
    }
    if (f < 8) st.eyes = "left";
    else if (f < 16) st.eyes = "right";
    else if (f >= 60 && f < 74) st.eyes = "up";
    else if (f >= 100 && f < 132) st.eyes = Math.floor(f / 8) % 2 ? "left" : "right";
    else if (f >= 132 && f < 172) st.eyes = "up";
    if (f >= CRUMBLE) {
      const t = f - CRUMBLE;
      st.y = GROUND_Y + 0.9 * t * t;
      st.rotate = t * 7;
      st.eyes = "wide";
      st.arms = "up";
      st.legs = "tuck";
    }
    return st;
  }
  st.x = RESPAWN_X;
  if (f < LAPTOP) {
    const r = f - RESPAWN;
    if (r < 30 && Math.floor(r / 3) % 2 === 1) st.opacity = 0.15;
    const jt = f - JUMP;
    st.y = GROUND_Y - jumpArc(jt, JUMP_LEN, 160);
    if (jt > 0 && jt < JUMP_LEN) {
      st.legs = "tuck";
      st.arms = "up";
      st.eyes = jt < JUMP_LEN / 2 ? "up" : "wide";
    }
    st.squash = landSquash(f, JUMP + JUMP_LEN);
    if (f >= JUMP + JUMP_LEN) st.eyes = "left";
    return st;
  }
  // 掏电脑：先盯着屏幕，崩了以后发抖
  st.eyes = "right";
  if (f >= ZOOM_OUT[1]) {
    st.x += Math.sin(f * 2.7) * 3;
    st.eyes = "wide";
    st.arms = "down";
  }
  if (f >= TOSS[0] && f < TOSS[0] + 14) {
    st.arms = "up";
    st.eyes = "closed";
  }
  return st;
}

// 镜头：跟着 Clawd 走，取最近 12 帧的平均位置做平滑；锚点从屏幕中间慢慢挪到左边三分之一
function camAt(f: number): number {
  let sum = 0;
  for (let k = 0; k < 12; k++) sum += clawdAt(Math.max(0, f - k)).x;
  const anchor = interpolate(f, [0, 50], [960, 760], { ...clamp, easing: easeInOut });
  return sum / 12 - anchor;
}

const defaultJunk = (f: number) => (f < BONK + JUNK_FLY + 10 ? 0 : f < TOSS[1] ? 4 : 5);

export const ChaosMain: React.FC<{ f: number; junkBase?: number; heartsBase?: number; attempt?: number; hud?: boolean }> = ({
  f,
  junkBase = 0,
  heartsBase = 3,
  attempt,
  hud = true,
}) => {
  const c = clawdAt(f);
  const camX = camAt(f);
  const mood = tween(f, [10, 110], [0, 1], easeInOut);
  const rain = tween(f, [50, 140], [0, 0.85]);
  const fog = tween(f, [30, 120], [0, 1]);
  const hearts = Math.max(0, heartsBase - (f >= HEART1 ? 1 : 0) - (f >= HEART2 ? 1 : 0));
  const att = attempt ?? (f < RESPAWN ? 1 : 2);
  const junk = junkBase + defaultJunk(f);

  const s = sumShakes(shake(f, CRUMBLE + 2, 16, 14, "crumble"), shake(f, BONK, 10, 10, "bonk"), shake(f, 104, 10, 8, "thunder"), shake(f, ZOOM_OUT[1], 30, 10, "smoke"));
  const lightning = (f >= 104 && f < 108) || (f >= 112 && f < 115);

  // 推镜进屏幕：整个世界以电脑屏幕为中心放大，屏幕里的乱码画面跟着一起放大到铺满
  const laptopX = RESPAWN_X + LAPTOP_DX;
  const bezel = Math.max(4, Math.round(LAPTOP_SIZE / 16));
  const screenW = LAPTOP_SIZE - bezel * 2;
  const screenH = LAPTOP_SIZE * LAPTOP_RATIO;
  const laptopBaseY = GROUND_Y - bezel * 2.4;
  const rcx = laptopX - camX;
  const rcy = laptopBaseY - bezel - screenH / 2;
  const s0 = screenW / 1920;
  const zoomP = f < ZOOM_IN[0] ? 0 : f < ZOOM_OUT[0] ? tween(f, ZOOM_IN, [0, 1], easeIn) : tween(f, ZOOM_OUT, [1, 0], easeOut);
  const fullScreen = f >= ZOOM_IN[1] && f < ZOOM_OUT[0];
  const Z = Math.pow(1 / s0, zoomP);
  const worldTransform = `translate(${(960 - rcx) * zoomP}px, ${(540 - rcy) * zoomP}px) scale(${Z})`;
  const screenT = f - ZOOM_IN[0];
  const screenLen = ZOOM_OUT[1] - ZOOM_IN[0];

  if (fullScreen) {
    return (
      <AbsoluteFill>
        <ChaosScreen t={screenT} duration={screenLen} />
        <Crt />
      </AbsoluteFill>
    );
  }

  const laptopOpen = tween(f, [LAPTOP, LAPTOP + 10], [0, 1], backOut);
  const tossP = tween(f, TOSS, [0, 1]);
  const stripLen = tween(f, SPIT, [0, 280], easeOut);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: `${rcx}px ${rcy}px`, transform: worldTransform }}>
        <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
          <Sky camX={camX} frame={f} mood={mood} />
          <Bushes camX={camX} mood={mood} />
          <Ground camX={camX} mood={mood} pits={[PIT]} />
          <AbsoluteFill style={{ transform: `translateX(${-camX}px)` }}>
            {/* 坑 */}
            <div style={{ position: "absolute", left: PIT[0], top: GROUND_Y, width: PIT[1] - PIT[0], height: 400, background: "linear-gradient(#1a2350, #0d1230)" }} />
            {/* 一座会越堆越高的垃圾山 */}
            <JunkPile x={PILE_X} groundY={GROUND_Y} count={junk} />
            {/* 岔路口：一根指路牌，五块牌子五个方向，全是问号 */}
            <Signpost x={1580} frame={f} sway={mood} />
            {/* 坑上的桥：一踩就塌 */}
            {Array.from({ length: 8 }, (_, i) => {
              const w = (PIT[1] - PIT[0]) / 8;
              const t = f - CRUMBLE - i * 2;
              const fallY = t > 0 ? 0.8 * t * t : 0;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: PIT[0] + i * w,
                    top: GROUND_Y + fallY,
                    width: w - 4,
                    height: 26,
                    backgroundColor: "#9c7a5c",
                    boxShadow: "inset 0 -8px 0 #6b4f3a",
                    transform: `rotate(${t > 0 ? t * (i % 2 ? 6 : -5) : 0}deg)`,
                  }}
                />
              );
            })}
            {/* 问号方块：顶出来的是垃圾 */}
            <QBlockProp x={RESPAWN_X} y={560} bump={f >= BONK && f < BONK + 8 ? 18 * Math.sin(((f - BONK) / 8) * Math.PI) : 0} palette={f < BONK ? QBLOCK_GOLD : USED_BLOCK} />
            {JUNK_POP.map((j, i) => {
              const t = f - BONK - 2 - j.delay;
              if (t < 0 || t > JUNK_FLY) return null;
              const p = t / JUNK_FLY;
              const x = interpolate(p, [0, 1], [RESPAWN_X, PILE_X + j.dx]);
              const y = interpolate(p, [0, 1], [450, GROUND_Y - 70]) - 4 * 300 * p * (1 - p);
              return (
                <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${t * (i % 2 ? 14 : -11)}deg)` }}>
                  <JunkItem kind={j.kind} />
                </div>
              );
            })}
            {/* 文件名单独画，不跟着转 */}
            {(() => {
              const t = f - BONK - 2;
              if (t < 0 || t > JUNK_FLY + 16) return null;
              const p = Math.min(1, t / JUNK_FLY);
              const x = interpolate(p, [0, 1], [RESPAWN_X, PILE_X - 60]);
              const y = interpolate(p, [0, 1], [450, GROUND_Y - 70]) - 4 * 300 * p * (1 - p);
              return (
                <PixelText size={40} color="#ffd24a" outline={5} style={{ position: "absolute", left: x, top: y - 110, transform: "translateX(-50%)", opacity: tween(t, [JUNK_FLY, JUNK_FLY + 16], [1, 0]) }}>
                  {FILE_NAMES[0]}
                </PixelText>
              );
            })()}
            {/* 掏出来的电脑 */}
            {f >= LAPTOP ? (
              <>
                <Laptop x={laptopX} y={laptopBaseY} size={LAPTOP_SIZE} screen={f >= ZOOM_IN[0] ? "chaos" : "off"} frame={f} open={laptopOpen} />
                <Burst frame={f} start={LAPTOP} x={laptopX} y={GROUND_Y} seed="laptop" colors={["#cfd8f5", "#9aa8d8"]} count={12} speed={[3, 9]} angle={[-170, -10]} gravity={0.3} life={26} size={[8, 14]} />
                <Smoke x={laptopX} y={laptopBaseY - screenH - 20} frame={f} start={ZOOM_OUT[1]} count={14} />
              </>
            ) : null}
            {/* 吐出来的雪花胶片，被一把扔到垃圾山上 */}
            {f >= SPIT[0] && f < TOSS[1] ? (
              <FilmStrip
                x={interpolate(tossP, [0, 1], [laptopX, PILE_X + 30])}
                y={interpolate(tossP, [0, 1], [laptopBaseY - screenH - 30, GROUND_Y - 120]) - 4 * 260 * tossP * (1 - tossP)}
                length={stripLen}
                frame={f}
                rotate={tossP * -540}
              />
            ) : null}
            {/* Clawd */}
            <Clawd x={c.x} y={c.y} scale={S} pose={{ eyes: c.eyes, arms: c.arms, legs: c.legs }} rotate={c.rotate} squash={c.squash} opacity={c.opacity} />
            {/* 硬币：抛起来决定走哪条路 */}
            {f >= 132 && f < 176 ? (
              <Coin x={1460 + 70} y={GROUND_Y - 130 - jumpArc(f - 132, 40, 330)} spin={(f - 132) * 0.55} scale={10} glow={1} />
            ) : null}
            <Bubble x={1460} y={GROUND_Y - 10 * S - 24} text="?" scale={tween(f, [100, 110], [0, 1], backOut) * tween(f, [128, 134], [1, 0])} />
            {/* 冒汗 */}
            {[300, 318, 590, 612, 630].map((at, i) => {
              const t = f - at;
              if (t < 0 || t > 22) return null;
              return (
                <div key={i} style={{ position: "absolute", left: c.x + (i % 2 ? -70 : 60), top: c.y - 10 * S - 10 + t * 2.2, opacity: 1 - t / 22 }}>
                  <Sprite grid={SWEAT} palette={SWEAT_PAL} scale={7} />
                </div>
              );
            })}
            {/* -1 */}
            {f >= CRUMBLE + 8 && f < CRUMBLE + 44 ? (
              <PixelText size={64} color={RED} outline={6} style={{ position: "absolute", left: 1740, top: GROUND_Y - 180 - (f - CRUMBLE) * 2, transform: "translateX(-50%)" }}>
                -1
              </PixelText>
            ) : null}
            <Burst frame={f} start={BONK} x={RESPAWN_X} y={560} seed="bonk" colors={["#ffd24a", "#fff3e0"]} count={10} speed={[4, 10]} angle={[-170, -10]} gravity={0.4} life={22} size={[8, 12]} />
          </AbsoluteFill>
          <Fog camX={camX} frame={f} amount={fog} />
          <Rain frame={f} amount={rain} />
        </AbsoluteFill>
        {/* 屏幕里的画面：缩在电脑屏幕上，跟着世界一起放大 */}
        {zoomP > 0 ? (
          <div
            style={{
              position: "absolute",
              left: rcx - 960,
              top: rcy - 540,
              width: 1920,
              height: 1080,
              transform: `scale(${s0})`,
              opacity: tween(zoomP, [0, 0.25], [0, 1]),
            }}
          >
            <ChaosScreen t={screenT} duration={screenLen} />
          </div>
        ) : null}
      </AbsoluteFill>
      {lightning ? <AbsoluteFill style={{ backgroundColor: "#e8eeff", opacity: 0.55 }} /> : null}
      {hud && zoomP < 0.5 ? <SwampHud frame={f} hearts={hearts} attempt={att} breakingAt={f >= HEART2 ? HEART2 : HEART1} /> : null}
      <Crt />
    </AbsoluteFill>
  );
};

const USED_BLOCK = { b: "#3b2a1e", y: "#8a6a4f", w: "#8a6a4f", d: "#3b2a1e" } as const;

// 快剪：同样的错，一遍比一遍快
const CUTS = [
  { at: 640, len: 38, from: 150, speed: 2.2, junk: 6, hearts: 1, attempt: 3 },
  { at: 678, len: 32, from: 262, speed: 2.2, junk: 14, hearts: 0, attempt: 4 },
  { at: 710, len: 26, screen: 70, speed: 3, attempt: 5 },
  { at: 736, len: 20, from: 176, speed: 2.6, junk: 24, hearts: 0, attempt: 6 },
  { at: 756, len: 16, from: 268, speed: 3.5, junk: 34, hearts: 0, attempt: 7 },
  { at: 772, len: 12, screen: 140, speed: 3, attempt: 8 },
] as const;

export const FINAL = 784;
const SCREEN_LEN = ZOOM_OUT[1] - ZOOM_IN[0];
const CUES = [
  [100, "pop", 0.6],
  [104, "thunder", 0.9],
  [132, "coin"],
  [CRUMBLE, "fall"],
  [HEART1, "hurt"],
  [RESPAWN, "sparkle", 0.7],
  [JUMP, "jump"],
  [BONK, "bonk"],
  ...JUNK_POP.map((j) => [BONK + 2 + j.delay, "pop", 0.6] as const),
  [BONK + JUNK_FLY + 4, "thud", 0.35],
  [LAPTOP, "pop", 0.7],
  [ZOOM_IN[0], "whoosh", 0.7],
  ...popupTimes(SCREEN_LEN).map((t) => [ZOOM_IN[0] + t, "error", 0.45] as const),
  [ZOOM_IN[0] + SCREEN_LEN - GLITCH_LEAD, "glitch"],
  [ZOOM_OUT[0], "whoosh", 0.6],
  [ZOOM_OUT[1], "fizz"],
  [SPIT[0], "pop", 0.6],
  [HEART2, "hurt"],
  [TOSS[0], "whoosh", 0.6],
  [TOSS[1], "thud", 0.4],
  // 快剪
  [640, "hit"],
  [659, "fall", 0.7],
  [678, "hit"],
  [688, "bonk"],
  [710, "hit"],
  [712, "error", 0.5],
  [718, "error", 0.5],
  [724, "glitch", 0.7],
  [736, "hit"],
  [742, "fall", 0.6],
  [756, "hit"],
  [761, "bonk"],
  [772, "hit"],
  [774, "glitch", 0.7],
  [FINAL + 6, "thunder"],
  [FINAL + 8, "sad"],
] as const;

export const Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ChaosBody frame={frame} />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};

const ChaosBody: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < MONTAGE) return <ChaosMain f={frame} />;
  if (frame >= FINAL) return <GiveUp frame={frame - FINAL} />;
  const cut = [...CUTS].reverse().find((c) => frame >= c.at)!;
  const local = frame - cut.at;
  const flash = local < 3 ? 0.7 * (1 - local / 3) : 0;
  return (
    <AbsoluteFill>
      {"screen" in cut ? (
        <AbsoluteFill>
          <ChaosScreen t={cut.screen + local * cut.speed} duration={196} />
          <SwampHud frame={frame} hearts={0} attempt={cut.attempt} />
          <Crt />
        </AbsoluteFill>
      ) : (
        <ChaosMain f={cut.from + local * cut.speed} junkBase={cut.junk} heartsBase={cut.hearts} attempt={cut.attempt} />
      )}
      <AttemptStamp attempt={cut.attempt} local={local} />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

// 每一刀切进来时，屏幕中间盖一个大大的「#N」
const AttemptStamp: React.FC<{ attempt: number; local: number }> = ({ attempt, local }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
    <PixelText
      size={120}
      font={FONT_ARCADE}
      color="white"
      outline={10}
      shadow={10}
      shadowColor={RED}
      style={{ transform: `scale(${tween(local, [0, 6], [1.8, 1], easeOut)}) rotate(-6deg)`, opacity: tween(local, [8, 14], [1, 0]) }}
    >
      {`TRY #${attempt}`}
    </PixelText>
  </AbsoluteFill>
);

// 结尾：镜头拉远，Clawd 瘫坐在一座垃圾山顶上，大雨，画面褪成灰
export const GIVEUP_LEN = SCENES.chaos - FINAL;
const PILE_COUNT = 160;
const PILE_S = 1.45;
// 垃圾山顶上 Clawd 的脚底（世界坐标；GiveUp 的推镜以 (960, 648) 为原点放大到 1.08）
export const GIVEUP_CLAWD = { x: 960, y: GROUND_Y - (pileTop(PILE_COUNT) + 50) * PILE_S + 30, pushOrigin: { x: 960, y: 648 }, push: 1.08 };
export const GiveUp: React.FC<{ frame: number; gray?: number; pose?: Pose; rain?: number; sweat?: boolean; hud?: boolean }> = ({ frame, gray, pose, rain = 1.4, sweat = true, hud = true }) => {
  const g = gray ?? tween(frame, [GIVEUP_LEN - 50, GIVEUP_LEN], [0, 1], easeIn);
  const push = tween(frame, [0, GIVEUP_LEN], [1, GIVEUP_CLAWD.push]);
  const topY = GIVEUP_CLAWD.y;
  const lightning = frame >= 6 && frame < 10;
  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: `grayscale(${g}) brightness(${1 - 0.25 * g})` }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 60%" }}>
        <Sky camX={2400} frame={frame + 900} mood={1} />
        <Bushes camX={2400} mood={1} />
        <Ground camX={0} mood={1} />
        <JunkPile x={960} groundY={GROUND_Y} count={PILE_COUNT} s={PILE_S} mound />
        <Clawd x={960} y={topY} scale={S} pose={pose ?? { eyes: "closed", arms: "down", legs: "tuck" }} squash={pose ? 1 : 1.06} />
        {sweat ? (
          <div style={{ position: "absolute", left: 1030, top: topY - 120 + ((frame * 2) % 40), opacity: 0.9 }}>
            <Sprite grid={SWEAT} palette={SWEAT_PAL} scale={7} />
          </div>
        ) : null}
        <Fog camX={frame * 3} frame={frame} amount={1} />
        <Rain frame={frame} amount={rain} density={110} />
      </AbsoluteFill>
      {lightning ? <AbsoluteFill style={{ backgroundColor: "#e8eeff", opacity: 0.6 }} /> : null}
      {hud ? <SwampHud frame={frame} hearts={0} attempt={9} /> : null}
      <Crt />
    </AbsoluteFill>
  );
};
