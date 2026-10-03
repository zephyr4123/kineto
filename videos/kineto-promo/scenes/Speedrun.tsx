import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CleanScreen, cleanScreenLength, PER_CHAR, TYPE_AT } from "../components/CleanScreen";
import { Cues } from "../components/Sfx";
import type { SfxName } from "../audio/sfx-map";
import { Clawd, type Arms, type Eyes, type Legs } from "../components/Clawd";
import { Canyon, Cannon, CitySkyline, CityRoad, CloudSea, Island, RainbowTrail, Ring } from "../components/Flight";
import { SpeedHud } from "../components/Hud";
import { LAPTOP_RATIO, Laptop } from "../components/Laptop";
import { Burst, Shockwave, Twinkle } from "../components/Particles";
import { PixelText } from "../components/PixelText";
import { Crt } from "../components/Retro";
import { BILLBOARD, Billboard, BoostPad, CornerHitMini, Crates, Flag, GroundArrows, Shelf, SpeedLines, Studio } from "../components/Speed";
import { Bushes, Ground, Sky } from "../components/World";
import { backOut, blinking, clamp, easeInOut, easeOut, jumpArc, runLegs, shake, sumShakes, tween } from "../fx";
import { CLAWD, FONT_ARCADE, GOLD, RED } from "../theme";
import { GROUND_Y } from "../timing";

// 第二幕「速通」：一镜到底。草原冲刺 → 弹射飞越峡谷 → 第 1 关 → 钻进大炮射上天、穿三个金环 → 浮空岛第 2 关
// → 跳下浮空岛、旋转俯冲穿过云海 → 黄昏城市第 3 关 → 破纪录 → 冲天而起。镜头横向纵向都跟着走。
const S = 10;
const ISLAND_Y = GROUND_Y - 1500;
const ISLAND = { x: 7000, w: 1800 };
const CANYON = [1700, 2800] as const;
const CANNON_X = 4930;
const MUZZLE = { x: CANNON_X + 360 * Math.cos((48 * Math.PI) / 180), y: 745 - 360 * Math.sin((48 * Math.PI) / 180) };
const SEA_Y = -540;
const CITY_FROM = 9600;

const A_FLY = [40, 100] as const;
const A_SKID = [100, 122] as const;
const B_RUN = [232, 282] as const;
const B_FIRE = 286;
const B_FLY = [286, 386] as const;
const B_SKID = [386, 404] as const;
const C_RUN = [580, 633] as const;
const C_DIVE = [633, 733] as const;
const C_SKID = [733, 753] as const;
const LAUNCH = 1050;

const CP1_X = 3490;
const CP2_X = 7569;
const CP3_X = 10999;

// 三个关卡的电脑时刻：掏电脑、推镜进、推镜出
const COMMANDS = [
  { at: 124, x: CP1_X, groundY: GROUND_Y, command: "kineto new promo", result: "VIDEO CREATED", progress: false },
  { at: 406, x: CP2_X, groundY: ISLAND_Y, command: "kineto asset add music.wav --license CC0-1.0", result: "ASSET ADDED", progress: false },
  { at: 755, x: CP3_X, groundY: GROUND_Y, command: "kineto render promo", result: "PROMO.MP4", progress: true },
].map((c) => {
  const len = cleanScreenLength(c.command, c.progress);
  return { ...c, zoomIn: [c.at + 6, c.at + 18] as const, zoomOut: [c.at + 6 + len, c.at + 18 + len] as const };
});

// 推镜进电脑的区间：配乐在这几段压低，让打字、回车、打勾听得清
export const MUSIC_DUCK = COMMANDS.map((c) => [c.zoomIn[0], c.zoomOut[1]] as const);

const STUDIO_AT = 200;
const CRATES_AT = 508;
const BILLBOARD_AT = 848;
const HIT_AT = 930;
const SHELF_AT = 950;
const SLOT_AT = 990;
const STOP_AT = 990;
const RECORD_AT = 995;
const RINGS = [0.28, 0.5, 0.72];

const LAPTOP_SIZE = 130;
const LAPTOP_DX = 170;

type Phase = "ready" | "run" | "fly" | "skid" | "idle" | "cannon" | "dive" | "launch";

interface State {
  x: number;
  y: number;
  phase: Phase;
  speed: number;
  rotate: number;
}

const accel = (t: number, rampFrames: number, v: number) => (t < rampFrames ? (v * t * t) / (2 * rampFrames) : (v * rampFrames) / 2 + v * (t - rampFrames));
const decel = (t: number, frames: number, v0: number) => v0 * t - (v0 * t * t) / (2 * frames);

function stateAt(f: number): State {
  if (f < 0) return { x: 0, y: GROUND_Y, phase: "ready", speed: 0, rotate: 0 };
  if (f < A_FLY[0]) return { x: 34 * f, y: GROUND_Y, phase: "run", speed: 34, rotate: 8 };
  if (f < A_FLY[1]) {
    const p = (f - A_FLY[0]) / (A_FLY[1] - A_FLY[0]);
    return { x: 1360 + 1800 * p, y: GROUND_Y - jumpArc(p, 1, 520), phase: "fly", speed: 30, rotate: 360 * tween(p, [0.2, 0.8], [0, 1], easeInOut) };
  }
  if (f < A_SKID[1]) {
    const t = f - A_SKID[0];
    return { x: 3160 + decel(t, 22, 30), y: GROUND_Y, phase: "skid", speed: 30 * (1 - t / 22), rotate: -14 };
  }
  if (f < B_RUN[0]) return { x: CP1_X, y: GROUND_Y, phase: "idle", speed: 0, rotate: 0 };
  if (f < B_RUN[1]) {
    const t = f - B_RUN[0];
    return { x: CP1_X + accel(t, 16, 34), y: GROUND_Y, phase: "run", speed: Math.min(34, (34 * t) / 16), rotate: 8 };
  }
  if (f < B_FIRE) return { x: CANNON_X, y: GROUND_Y, phase: "cannon", speed: 0, rotate: 0 };
  if (f < B_FLY[1]) {
    const p = (f - B_FLY[0]) / (B_FLY[1] - B_FLY[0]);
    const y = MUZZLE.y + (ISLAND_Y - MUZZLE.y) * p - 4 * 480 * p * (1 - p);
    const dy = ISLAND_Y - MUZZLE.y - 4 * 480 * (1 - 2 * p);
    const tilt = (Math.atan2(dy, 2200) * 180) / Math.PI;
    return { x: MUZZLE.x + 2200 * p, y, phase: "fly", speed: 22, rotate: tilt * 0.6 + 360 * tween(p, [0.42, 0.6], [0, 1], easeInOut) };
  }
  if (f < B_SKID[1]) {
    const t = f - B_SKID[0];
    return { x: MUZZLE.x + 2200 + decel(t, 18, 22), y: ISLAND_Y, phase: "skid", speed: 22 * (1 - t / 18), rotate: -14 };
  }
  if (f < C_RUN[0]) return { x: CP2_X, y: ISLAND_Y, phase: "idle", speed: 0, rotate: 0 };
  if (f < C_RUN[1]) {
    const t = f - C_RUN[0];
    return { x: CP2_X + accel(t, 24, 30), y: ISLAND_Y, phase: "run", speed: Math.min(30, (30 * t) / 24), rotate: 8 };
  }
  if (f < C_DIVE[1]) {
    const p = (f - C_DIVE[0]) / (C_DIVE[1] - C_DIVE[0]);
    return { x: 8799 + 2000 * p, y: ISLAND_Y + 1500 * p * p - 680 * p * (1 - p), phase: "dive", speed: 20 + 20 * p, rotate: 720 * tween(p, [0.08, 0.82], [0, 1], easeInOut) };
  }
  if (f < C_SKID[1]) {
    const t = f - C_SKID[0];
    return { x: 10799 + decel(t, 20, 20), y: GROUND_Y, phase: "skid", speed: 20 * (1 - t / 20), rotate: -14 };
  }
  if (f < LAUNCH) return { x: CP3_X, y: GROUND_Y, phase: "idle", speed: 0, rotate: 0 };
  const t = f - LAUNCH;
  return { x: CP3_X + 6 * t, y: GROUND_Y - 30 * t - 1.6 * t * t, phase: "launch", speed: 40, rotate: -20 };
}

const airborne = (p: Phase) => p === "fly" || p === "dive" || p === "launch";

// 镜头目标：地上时脚底对准屏幕 820，空中时人在屏幕中间；第 3 关把镜头往右让出大屏幕和片库
function camTarget(f: number) {
  const st = stateAt(f);
  const ax = f >= C_SKID[0] && f < LAUNCH ? interpolate(f, [C_SKID[0], C_SKID[1] + 30], [620, 320], { ...clamp, easing: easeInOut }) : 620;
  // 冲天那一下镜头不跟：Clawd 拖着彩虹飞出画面顶端，下一幕在夜空里接住他
  if (st.phase === "launch") return { x: CP3_X - 320, y: 0 };
  const ay = airborne(st.phase) ? 600 : GROUND_Y;
  return { x: st.x - ax, y: st.y - ay };
}
function camAt(f: number) {
  let x = 0;
  let y = 0;
  for (let k = 0; k < 16; k++) {
    const t = camTarget(f - k);
    if (k < 10) x += t.x / 10;
    y += t.y / 16;
  }
  return { x, y: Math.min(0, y) };
}

// 空中把镜头拉远一点，更有飞的感觉
const zoomAt = (f: number) => {
  let air = 0;
  for (let k = 0; k < 20; k++) air += airborne(stateAt(f - k).phase) ? 1 / 20 : 0;
  return 1 - 0.16 * easeInOut(air);
};

const trailPoints = (f: number) => {
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k < 30; k++) {
    const st = stateAt(f - k);
    if (!airborne(st.phase)) break;
    pts.push({ x: st.x, y: st.y - 5 * S });
  }
  return pts;
};

export const SpeedMain: React.FC<{ f: number; hud?: boolean }> = ({ f, hud = true }) => {
  const st = stateAt(f);
  const cam = camAt(f);
  const zoom = zoomAt(f);

  // 天气与地域：穿过云海那一刻从白天切到黄昏
  const sunset = f >= C_DIVE[1] ? 1 : tween(st.y, [SEA_Y + 120, SEA_Y + 260], [0, 1]) * (f >= C_DIVE[0] ? 1 : 0);
  const inCloud = f >= C_DIVE[0] && f < C_DIVE[1] ? tween(Math.abs(st.y - (SEA_Y + 150)), [120, 320], [1, 0]) : 0;

  // 电脑时刻
  const active = COMMANDS.find((c) => f >= c.at && f < c.zoomOut[1] + 4);
  const zoomP = active ? (f < active.zoomOut[0] ? tween(f, active.zoomIn, [0, 1], Easing2.in) : tween(f, active.zoomOut, [1, 0], Easing2.out)) : 0;
  const fullScreen = active && f >= active.zoomIn[1] && f < active.zoomOut[0];
  const bezel = Math.max(4, Math.round(LAPTOP_SIZE / 16));
  const screenW = LAPTOP_SIZE - bezel * 2;
  const screenH = LAPTOP_SIZE * LAPTOP_RATIO;
  const s0 = screenW / 1920;

  // 速通计时
  const seconds = Math.max(0, Math.min(f, STOP_AT)) / 60;
  const progress = (f >= STUDIO_AT + 5 ? 1 : 0) + (f >= CRATES_AT + 64 ? 1 : 0) + (f >= SLOT_AT ? 1 : 0);

  const s = sumShakes(
    shake(f, B_FIRE, 18, 24, "fire"),
    shake(f, A_FLY[1], 10, 12, "landA"),
    shake(f, B_FLY[1], 10, 12, "landB"),
    shake(f, C_DIVE[1], 14, 18, "landC"),
    shake(f, STUDIO_AT + 14, 10, 10, "studio"),
    shake(f, BILLBOARD_AT + 18, 12, 12, "billboard"),
    shake(f, HIT_AT, 14, 10, "hit"),
    shake(f, LAUNCH, 20, 16, "launch"),
  );

  if (active && fullScreen) {
    return (
      <AbsoluteFill>
        <CleanScreen t={f - active.zoomIn[0]} command={active.command} result={active.result} progress={active.progress} />
        <Crt />
      </AbsoluteFill>
    );
  }

  // 屏幕坐标里的电脑屏幕中心（推镜围绕它）
  const laptopX = active ? active.x + LAPTOP_DX : 0;
  const laptopBaseY = active ? active.groundY - bezel * 2.4 : 0;
  const rcx = (laptopX - cam.x - 960) * zoom + 960;
  const rcy = (laptopBaseY - bezel - screenH / 2 - cam.y - 540) * zoom + 540;
  const Z = Math.pow(1 / (s0 * zoom), zoomP);

  // Clawd 的姿势
  const cheering = (f >= STUDIO_AT + 10 && f < STUDIO_AT + 36) || (f >= CRATES_AT + 64 && f < CRATES_AT + 84) || (f >= HIT_AT && f < HIT_AT + 30) || (f >= RECORD_AT && f < RECORD_AT + 40);
  let eyes: Eyes = blinking(f, 20) ? "closed" : "right";
  let arms: Arms = "side";
  let legs: Legs = "stand";
  let y = st.y;
  if (st.phase === "run") {
    legs = runLegs(f, 3);
    y -= legs === "runB" ? S : 0;
  } else if (airborne(st.phase)) {
    arms = "up";
    legs = "tuck";
    eyes = st.phase === "dive" ? "wide" : "right";
  } else if (st.phase === "ready") {
    eyes = "right";
  }
  if (cheering && !airborne(st.phase)) {
    arms = "up";
    eyes = "closed";
    y -= jumpArc((f - (f >= HIT_AT && f < HIT_AT + 30 ? HIT_AT : f >= RECORD_AT ? RECORD_AT : f)) % 30, 30, 90);
  }
  const powerUp = f >= LAUNCH - 40;
  const glow = powerUp ? 0.5 + 0.5 * Math.sin(f / 2) : 0;

  const ghosts = st.phase === "run" && st.speed > 14 ? [3, 6, 9] : [];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: `${rcx}px ${rcy}px`, transform: `translate(${(960 - rcx) * zoomP}px, ${(540 - rcy) * zoomP}px) scale(${Z})` }}>
        <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
          <Sky camX={cam.x} camY={cam.y} frame={f} mood={0} sunset={sunset} sunY={620} />
          <FarIslands camX={cam.x} camY={cam.y} frame={f} />
          <CitySkyline camX={cam.x} camY={cam.y} opacity={sunset} frame={f} />
          <div style={{ opacity: 1 - sunset }}>
            <Bushes camX={cam.x} camY={cam.y} mood={0} />
          </div>
          {/* 世界层：按镜头平移，空中时整体缩小 */}
          <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "960px 540px" }}>
            <Ground camX={cam.x} camY={cam.y} mood={0} pits={[CANYON]} to={6200} />
            <AbsoluteFill style={{ transform: `translate(${-cam.x}px, ${-cam.y}px)` }}>
              <Canyon from={CANYON[0]} to={CANYON[1]} />
              <GroundArrows from={Math.max(0, cam.x - 200)} to={Math.min(CANYON[0] - 100, cam.x + 2400)} />
              <CityRoad from={CITY_FROM} to={14000} frame={f} />
              <BoostPad x={1360 - 60} frame={f} hitAt={A_FLY[0] - 2} />
              <Flag x={CP1_X - 90} n={1} frame={f} doneAt={A_SKID[1]} />
              <Studio x={CP1_X + 300} frame={f} at={STUDIO_AT} />
              <Cannon x={CANNON_X} frame={f} fireAt={B_FIRE} />
              {RINGS.map((p, i) => {
                const at = B_FLY[0] + p * 100;
                const pos = stateAt(at);
                return <Ring key={i} x={pos.x} y={pos.y - 5 * S} frame={f} hitAt={at} />;
              })}
              <Island x={ISLAND.x} y={ISLAND_Y} w={ISLAND.w} frame={0} />
              <Flag x={CP2_X - 90} n={2} frame={f} doneAt={B_SKID[1]} groundY={ISLAND_Y} />
              <Crates
                x={CP2_X + 330}
                frame={f}
                at={CRATES_AT}
                crates={[
                  { label: "MUSIC", license: "CC0-1.0", item: "note" },
                  { label: "IMAGE", license: "CC-BY-4.0", item: "image" },
                  { label: "FONT", license: "OFL-1.1", item: "font" },
                ]}
                groundY={ISLAND_Y}
              />
              <CloudSea y={SEA_Y} from={ISLAND.x - 1200} to={13000} frame={f} />
              <Flag x={CP3_X - 90} n={3} frame={f} doneAt={C_SKID[1]} />
              <Billboard x={CP3_X + 300} frame={f} at={BILLBOARD_AT}>
                <CornerHitMini frame={f} hitAt={HIT_AT} w={BILLBOARD.w - BILLBOARD.border * 2} h={BILLBOARD.h - BILLBOARD.border * 2} />
              </Billboard>
              <Shelf x={CP3_X + 1130} frame={f} at={SHELF_AT} slotAt={SLOT_AT} />
              <ReelToShelf f={f} from={{ x: CP3_X + 700, y: GROUND_Y - 480 }} to={{ x: CP3_X + 1130 + 30 + 2 * 100 + 42, y: GROUND_Y - 520 + 40 + 240 + 42 }} start={HIT_AT + 30} end={SLOT_AT} />

              {/* 电脑 */}
              {COMMANDS.map((c, i) =>
                f >= c.at && f < c.zoomOut[1] + 40 ? (
                  <Laptop key={i} x={c.x + LAPTOP_DX} y={c.groundY - bezel * 2.4} size={LAPTOP_SIZE} screen={f >= c.zoomIn[0] ? "clean" : "off"} frame={f} open={tween(f, [c.at, c.at + 8], [0, 1], backOut)} />
                ) : null,
              )}

              {/* 彩虹尾迹 + 残影 + Clawd */}
              <RainbowTrail points={trailPoints(f)} band={11} />
              {ghosts.map((k) => {
                const g = stateAt(f - k);
                return <Clawd key={k} x={g.x} y={g.y} scale={S} pose={{ legs: runLegs(f - k, 3) }} rotate={g.rotate} color="#ffd0bd" eyeColor="#ffd0bd" opacity={0.45 - k * 0.04} />;
              })}
              {st.phase !== "cannon" ? (
                <>
                  {glow > 0 ? (
                    <div style={{ position: "absolute", left: st.x - 160, top: y - 210, width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,210,74,${0.7 * glow}) 0%, rgba(255,210,74,0) 65%)` }} />
                  ) : null}
                  <Clawd x={st.x} y={y} scale={S} pose={{ eyes, arms, legs }} rotate={st.rotate} />
                </>
              ) : null}

              {/* 粒子 */}
              {st.phase === "run" ? <Burst frame={f} start={Math.floor(f / 5) * 5} x={st.x - 60} y={st.y} seed={`dust-${Math.floor(f / 5)}`} colors={["#ffe2c4", "#ffffff"]} count={4} speed={[2, 6]} angle={[-170, -120]} gravity={0.2} life={16} size={[8, 14]} /> : null}
              {st.phase === "skid" ? <Burst frame={f} start={Math.floor(f / 3) * 3} x={st.x + 60} y={st.y} seed={`spark-${Math.floor(f / 3)}`} colors={[GOLD, "#fff3e0", CLAWD]} count={6} speed={[6, 14]} angle={[-170, -100]} gravity={0.5} life={18} size={[6, 10]} /> : null}
              <Burst frame={f} start={B_FIRE} x={MUZZLE.x} y={MUZZLE.y} seed="fire" colors={["#ffffff", "#ffd24a", "#ff9f43", "#c3c8dc"]} count={36} speed={[6, 24]} angle={[-120, 20]} gravity={0.15} life={40} size={[16, 30]} />
              <Shockwave x={MUZZLE.x} y={MUZZLE.y} frame={f} start={B_FIRE} life={22} maxSize={700} color="white" />
              {RINGS.map((p, i) => {
                const at = B_FLY[0] + p * 100;
                const pos = stateAt(at);
                return <Burst key={i} frame={f} start={at} x={pos.x} y={pos.y - 5 * S} seed={`ring-${i}`} colors={[GOLD, "#ffffff"]} count={18} speed={[6, 16]} angle={[-180, 180]} gravity={0.1} life={28} size={[8, 14]} />;
              })}
              <Burst frame={f} start={STUDIO_AT + 14} x={CP1_X + 600} y={GROUND_Y} seed="studio" colors={["#ffe2c4", "#ffffff"]} count={24} speed={[5, 16]} angle={[-175, -5]} gravity={0.35} life={34} size={[12, 22]} />
              <Burst frame={f} start={C_DIVE[1]} x={10799} y={GROUND_Y} seed="landC" colors={["#ffb38a", "#ffffff", "#ff8fb0"]} count={22} speed={[5, 16]} angle={[-175, -5]} gravity={0.4} life={30} size={[12, 20]} />
              <Burst frame={f} start={HIT_AT} x={CP3_X + 300 + BILLBOARD.w} y={GROUND_Y - 230 - 20} seed="hit" colors={["#ff4f5e", "#ffd24a", "#5dffa0", "#5ec8ff", "#b57bff"]} count={40} speed={[8, 22]} angle={[-170, -30]} gravity={0.45} life={60} size={[12, 20]} />
              {[0, 1, 2].map((i) => (
                <Twinkle key={i} x={CP3_X + 600 + i * 300} y={GROUND_Y - 600 + i * 40} frame={f} start={RECORD_AT + i * 6} size={12} color={GOLD} />
              ))}
            </AbsoluteFill>
          </AbsoluteFill>
        </AbsoluteFill>
        {/* 电脑屏幕里的画面：跟着世界一起放大到铺满 */}
        {active && zoomP > 0 ? (
          <div style={{ position: "absolute", left: rcx - 960, top: rcy - 540, width: 1920, height: 1080, transform: `scale(${s0 * zoom})`, opacity: tween(zoomP, [0, 0.25], [0, 1]) }}>
            <CleanScreen t={f - active.zoomIn[0]} command={active.command} result={active.result} progress={active.progress} />
          </div>
        ) : null}
      </AbsoluteFill>

      <SpeedLines frame={f} amount={(st.speed / 34) * (st.phase === "skid" || st.phase === "idle" ? 0 : 1)} />
      {/* 穿云：整屏一白 */}
      {inCloud > 0 ? <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: 0.92 * inCloud }} /> : null}
      {f >= B_FIRE && f < B_FIRE + 5 ? <AbsoluteFill style={{ backgroundColor: "white", opacity: 0.7 * (1 - (f - B_FIRE) / 5) }} /> : null}
      {hud && zoomP < 0.5 ? <SpeedHud seconds={seconds} stopped={f >= STOP_AT} frame={f} progress={progress} labels={LABELS} /> : null}
      {f >= RECORD_AT && f < LAUNCH + 20 ? <NewRecord t={f - RECORD_AT} /> : null}
      <Crt />
    </AbsoluteFill>
  );
};

const LABELS = ["SET UP", "ASSETS", "RENDER"] as const;
const Easing2 = { in: (t: number) => t * t * t, out: easeOut };

// 「NEW RECORD!」砸进屏幕
const NewRecord: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: 900, pointerEvents: "none" }}>
    <PixelText
      size={76}
      font={FONT_ARCADE}
      color={Math.floor(t / 6) % 2 ? GOLD : "white"}
      outline={8}
      shadow={10}
      shadowColor={RED}
      style={{ transform: `scale(${tween(t, [0, 10], [2.4, 1], backOut)}) rotate(-4deg)` }}
    >
      NEW RECORD!
    </PixelText>
  </AbsoluteFill>
);

// 片子从大屏幕弹出，划一道弧飞进片库
const ReelToShelf: React.FC<{ f: number; from: { x: number; y: number }; to: { x: number; y: number }; start: number; end: number }> = ({ f, from, to, start, end }) => {
  if (f < start || f >= end) return null;
  const p = (f - start) / (end - start);
  const x = interpolate(p, [0, 1], [from.x, to.x]);
  const yy = interpolate(p, [0, 1], [from.y, to.y]) - 4 * 260 * p * (1 - p);
  return (
    <div style={{ position: "absolute", left: x - 42, top: yy - 42, width: 84, height: 84, borderRadius: "50%", backgroundColor: CLAWD, boxShadow: "inset 0 0 0 10px rgba(0,0,0,0.25), 0 0 30px rgba(255,210,74,0.8)", transform: `rotate(${p * 720}deg)` }}>
      <div style={{ position: "absolute", left: 34, top: 8, width: 16, height: 16, backgroundColor: "#1b1446" }} />
      <div style={{ position: "absolute", left: 34, top: 60, width: 16, height: 16, backgroundColor: "#1b1446" }} />
    </div>
  );
};

// 高空才看得见的远处浮岛
const FarIslands: React.FC<{ camX: number; camY: number; frame: number }> = ({ camX, camY, frame }) => {
  const top = -camY * 0.3 - 420;
  if (top < -700) return null;
  return (
    <div style={{ position: "absolute", left: -((camX * 0.3) % 2400), top, width: 4800 }}>
      {[0, 2400].map((dx) =>
        [
          [300, 120, 260],
          [1100, 260, 180],
          [1800, 60, 320],
        ].map(([x, y, w], i) => (
          <div key={`${dx}-${i}`} style={{ position: "absolute", left: dx + x, top: y + Math.sin(frame / 40 + i) * 8, opacity: 0.55 }}>
            <div style={{ width: w, height: 18, backgroundColor: "#7fc9e0" }} />
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ marginLeft: (w * k) / 7, width: w - (w * 2 * k) / 7, height: 22, backgroundColor: "#6f74b8" }} />
            ))}
          </div>
        )),
      )}
    </div>
  );
};

// 电脑时刻的音效：掏出、推镜、打字、回车、打勾、拉回
const commandCues = COMMANDS.flatMap((c) => {
  const enter = c.zoomIn[0] + TYPE_AT + c.command.length * PER_CHAR + 6;
  const typing: (readonly [number, SfxName, number?])[] = [];
  for (let t = c.zoomIn[0] + TYPE_AT; t < enter - 6; t += 30) typing.push([t, "type", 0.8]);
  return [[c.at, "pop", 0.6] as const, [c.zoomIn[0], "whoosh", 0.6] as const, ...typing, [enter, "enter"] as const, [enter + (c.progress ? 16 : 2), "success"] as const, [c.zoomOut[0], "whoosh", 0.5] as const];
});
const CUES = [
  [A_FLY[0] - 2, "boing"],
  [A_FLY[0], "whoosh"],
  [A_FLY[1], "thud", 0.6],
  [A_SKID[0], "skid"],
  ...commandCues,
  [STUDIO_AT + 14, "build"],
  [B_RUN[1] - 4, "whoosh", 0.6],
  [B_FIRE, "cannon", 0.7],
  ...RINGS.map((p) => [B_FLY[0] + p * 100, "ring"] as const),
  [B_FLY[1], "thud", 0.6],
  [B_SKID[0], "skid"],
  ...[0, 1, 2].map((i) => [CRATES_AT + i * 6 + 12, "stamp", 0.6] as const),
  ...[0, 1, 2].map((i) => [CRATES_AT + 22 + i * 10, "pop", 0.6] as const),
  ...[0, 1, 2].map((i) => [CRATES_AT + 44 + i * 10, "stamp"] as const),
  [C_DIVE[0], "whoosh"],
  [C_DIVE[0] + 46, "whoosh", 0.8],
  [C_DIVE[1], "thud", 0.7],
  [C_SKID[0], "skid"],
  [BILLBOARD_AT + 18, "build"],
  [HIT_AT, "corner"],
  [HIT_AT + 30, "whoosh", 0.6],
  [SLOT_AT, "stamp"],
  [RECORD_AT, "record"],
  [LAUNCH - 40, "powerup"],
  [LAUNCH, "launch"],
] as const;

export const Speedrun: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SpeedMain f={frame} />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};
