import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Burst, Shockwave, Twinkle } from "../components/Particles";
import { Cues } from "../components/Sfx";
import { PixelText } from "../components/PixelText";
import { Coin } from "../components/Props";
import { Crt } from "../components/Retro";
import { backOut, easeIn, easeInOut, easeOut, jumpArc, shake, sumShakes, tween } from "../fx";
import { CLAWD, CREAM, FONT_ARCADE, GOLD, INK, RED } from "../theme";
import { GIVEUP_CLAWD, GIVEUP_LEN, GiveUp } from "./Chaos";
import { SpeedMain } from "./Speedrun";

// 转场：灰掉的世界里弹出 CONTINUE? 倒计时。第一幕用来瞎猜的那枚硬币，这次投进 kineto 的投币口——
// 颜色从投币口炸开，晴天的跑道一圈圈露出来，READY? GO!
const ZOOM = [4, 50] as const;
const COIN_UP = 70;
const SLOT_IN = [92, 114] as const;
const THROW = [126, 170] as const;
const INSERT = 170;
const WIPE = [188, 222] as const;
const READY = 222;
const GO = 246;
const SLOT = { x: 1480, y: 560 };

const CUES = [
  [0, "hit"],
  ...[10, 40, 70, 100, 130, 160].map((t) => [t, "beep", 0.7] as const),
  [COIN_UP, "coin"],
  [SLOT_IN[0], "whoosh", 0.7],
  [THROW[0], "whoosh", 0.6],
  [INSERT, "insert"],
  [INSERT + 2, "powerup"],
  [WIPE[0], "whoosh"],
  [READY, "ready"],
  [GO, "go"],
] as const;

export const Continue: React.FC = () => {
  const f = useCurrentFrame();

  // 推镜到垃圾山顶的 Clawd
  const zp = tween(f, ZOOM, [0, 1], easeInOut);
  const Zs = 1 + 0.9 * zp;
  const clawdScreen = {
    x: GIVEUP_CLAWD.pushOrigin.x + (GIVEUP_CLAWD.x - GIVEUP_CLAWD.pushOrigin.x) * GIVEUP_CLAWD.push,
    y: GIVEUP_CLAWD.pushOrigin.y + (GIVEUP_CLAWD.y - 60 - GIVEUP_CLAWD.pushOrigin.y) * GIVEUP_CLAWD.push,
  };
  const target = { x: 700, y: 640 };
  const tx = (target.x - clawdScreen.x) * zp;
  const ty = (target.y - clawdScreen.y) * zp;
  // Clawd 在屏幕上的位置（推镜之后）
  const cs = { x: clawdScreen.x + tx, y: clawdScreen.y + ty };

  const flood = tween(f, [INSERT + 2, INSERT + 26], [1, 0], easeOut);
  const hasCoin = f >= COIN_UP && f < THROW[0];
  const throwP = tween(f, THROW, [0, 1]);
  const pose =
    f >= INSERT
      ? ({ eyes: "wide", arms: "up", legs: "tuck" } as const)
      : f >= THROW[0] && f < THROW[0] + 16
        ? ({ eyes: "right", arms: "up", legs: "tuck" } as const)
        : f >= COIN_UP
          ? ({ eyes: "up", arms: "down", legs: "tuck" } as const)
          : undefined;

  const count = f < INSERT ? Math.max(0, 9 - Math.floor(Math.max(0, f - 10) / 30)) : Math.max(0, 9 - Math.floor((INSERT - 10) / 30));
  const tick = f < INSERT ? (f - 10) % 30 : 99;
  const s = sumShakes(shake(f, INSERT, 20, 22, "insert"), shake(f, GO, 14, 14, "go"));
  const wipeR = tween(f, WIPE, [0, 2300], easeIn);
  const overlays = 1 - tween(f, [WIPE[0] + 6, WIPE[0] + 18], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: INK }}>
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
        {/* 灰掉的世界，投币后颜色回来 */}
        <AbsoluteFill style={{ transformOrigin: `${clawdScreen.x}px ${clawdScreen.y}px`, transform: `translate(${tx}px, ${ty}px) scale(${Zs})` }}>
          <GiveUp frame={GIVEUP_LEN + f} gray={flood} pose={pose} rain={1.4 * flood} sweat={f < COIN_UP} hud={false} />
        </AbsoluteFill>
        <AbsoluteFill style={{ backgroundColor: "rgba(8,12,40,0.28)", opacity: flood }} />

        {/* 举起硬币：全画面唯一有颜色的东西 */}
        {hasCoin ? <Coin x={cs.x} y={cs.y - 150 - 8 * Math.sin(f / 6)} spin={f * 0.2} scale={12} glow={1} /> : null}
        <Twinkle x={cs.x + 30} y={cs.y - 190} frame={f} start={COIN_UP + 8} size={12} color="#fff7c2" />
        {f >= THROW[0] && f < INSERT ? (
          <>
            <Coin
              x={interpolate(throwP, [0, 1], [cs.x, SLOT.x])}
              y={interpolate(throwP, [0, 1], [cs.y - 150, SLOT.y - 60]) - jumpArc(throwP, 1, 300)}
              spin={f * 0.7}
              scale={12}
              glow={1}
            />
            {[3, 6, 9].map((k) => {
              const p = Math.max(0, throwP - k / 44);
              return (
                <Coin
                  key={k}
                  x={interpolate(p, [0, 1], [cs.x, SLOT.x])}
                  y={interpolate(p, [0, 1], [cs.y - 150, SLOT.y - 60]) - jumpArc(p, 1, 300)}
                  spin={(f - k) * 0.7}
                  scale={12 - k / 2}
                  glow={0}
                  palette={{ g: "rgba(255,210,74,0.3)", y: "rgba(255,210,74,0.3)", w: "rgba(255,210,74,0.3)", G: "rgba(255,210,74,0.3)" }}
                />
              );
            })}
          </>
        ) : null}

        {/* CONTINUE? + 倒计时 */}
        <div style={{ opacity: overlays }}>
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 110 }}>
            <PixelText
              size={104}
              font={FONT_ARCADE}
              color="white"
              outline={8}
              shadow={10}
              shadowColor={RED}
              style={{ transform: `scale(${tween(f, [0, 12], [2.4, 1], backOut)})`, opacity: tween(f, [0, 4], [0, 1]) }}
            >
              CONTINUE?
            </PixelText>
          </AbsoluteFill>
          {f >= 10 ? (
            <div style={{ position: "absolute", left: 120, top: 380 }}>
              <PixelText
                size={230}
                font={FONT_ARCADE}
                color={f >= INSERT ? GOLD : CREAM}
                outline={10}
                shadow={12}
                shadowColor={f >= INSERT ? CLAWD : "#3a4a8c"}
                style={{ transform: `scale(${tick < 8 ? tween(tick, [0, 8], [1.4, 1], backOut) : 1})` }}
              >
                {String(count)}
              </PixelText>
            </div>
          ) : null}
          {/* kineto 投币口 */}
          {f >= SLOT_IN[0] ? <CoinSlot frame={f} x={SLOT.x + tween(f, SLOT_IN, [700, 0], backOut)} y={SLOT.y} lit={f >= INSERT} /> : null}
        </div>
        <Shockwave x={SLOT.x} y={SLOT.y} frame={f} start={INSERT} life={30} maxSize={2600} color={GOLD} thickness={30} />
        <Burst frame={f} start={INSERT} x={SLOT.x} y={SLOT.y - 40} seed="insert" colors={[GOLD, CREAM, CLAWD, "#5ec8ff"]} count={50} speed={[10, 28]} angle={[-180, 180]} gravity={0.3} life={44} size={[12, 22]} />
      </AbsoluteFill>

      {/* 圆形擦除：晴天的跑道从投币口那里一圈圈露出来 */}
      {f >= WIPE[0] ? (
        <AbsoluteFill style={{ clipPath: `circle(${wipeR}px at ${SLOT.x}px ${SLOT.y}px)` }}>
          <SpeedMain f={-1} hud={false} />
        </AbsoluteFill>
      ) : null}
      {f >= WIPE[0] && f < WIPE[1] ? (
        <div
          style={{
            position: "absolute",
            left: SLOT.x - wipeR,
            top: SLOT.y - wipeR,
            width: wipeR * 2,
            height: wipeR * 2,
            borderRadius: "50%",
            boxShadow: `0 0 0 18px ${CREAM}, 0 0 0 36px ${CLAWD}`,
          }}
        />
      ) : null}
      {f >= INSERT && f < INSERT + 5 ? <AbsoluteFill style={{ backgroundColor: "white", opacity: 0.85 * (1 - (f - INSERT) / 5) }} /> : null}

      {/* READY? GO! */}
      {f >= READY ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <PixelText
            size={f >= GO ? 220 : 130}
            font={FONT_ARCADE}
            color={f >= GO ? GOLD : "white"}
            outline={10}
            shadow={14}
            shadowColor={f >= GO ? RED : "#2b3f8f"}
            style={{ transform: `scale(${f >= GO ? tween(f, [GO, GO + 10], [2.6, 1], backOut) : tween(f, [READY, READY + 10], [0, 1], backOut)}) rotate(${f >= GO ? -4 : 0}deg)` }}
          >
            {f >= GO ? "GO!" : "READY?"}
          </PixelText>
        </AbsoluteFill>
      ) : null}
      <Crt />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};

// 投币口：街机投币门，顶上亮着 kineto
const CoinSlot: React.FC<{ frame: number; x: number; y: number; lit: boolean }> = ({ frame, x, y, lit }) => (
  <div style={{ position: "absolute", left: x - 200, top: y - 300 }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 400, height: 560, backgroundColor: "#262f66", boxShadow: `inset 0 0 0 14px #141a44, 0 0 ${lit ? 120 : 40}px rgba(215,119,87,${lit ? 0.9 : 0.4})` }} />
    {[
      [26, 26],
      [352, 26],
      [26, 512],
      [352, 512],
    ].map(([l, t], i) => (
      <div key={i} style={{ position: "absolute", left: l, top: t, width: 22, height: 22, backgroundColor: "#8e98c8" }} />
    ))}
    <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
      <PixelText size={62} font={FONT_ARCADE} color={CLAWD} style={{ textShadow: `0 0 ${lit ? 40 : 18}px ${CLAWD}, 6px 6px 0 #5a2618` }}>
        kineto
      </PixelText>
    </div>
    <div
      style={{
        position: "absolute",
        left: 170,
        top: 200,
        width: 60,
        height: 180,
        backgroundColor: "#06081e",
        boxShadow: `0 0 0 12px ${lit ? "#ffffff" : GOLD}, 0 0 ${lit ? 80 : 30}px 16px rgba(255,210,74,0.8)`,
      }}
    />
    <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", opacity: lit || Math.floor(frame / 12) % 2 ? 1 : 0.15 }}>
      <PixelText size={30} font={FONT_ARCADE} color={lit ? "#5dffa0" : CREAM}>
        {lit ? "CREDIT 1" : "INSERT COIN"}
      </PixelText>
    </div>
  </div>
);

