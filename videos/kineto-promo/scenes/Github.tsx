import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { assets } from "../assets.gen";
import { Clawd } from "../components/Clawd";
import { Cues } from "../components/Sfx";
import { Burst, Shockwave, Twinkle } from "../components/Particles";
import { PixelText } from "../components/PixelText";
import { Crt, PixelBox } from "../components/Retro";
import { Sprite } from "../components/Sprite";
import { backOut, blinking, easeInOut, jumpArc, landSquash, shake, tween } from "../fx";
import { LOGO } from "../logo";
import { STAR, STAR_GOLD } from "../sprites";
import { CLAWD, CREAM, FONT_ARCADE, FONT_BODY, FONT_MONO, GOLD, INK } from "../theme";
import { LogoArt, NightSky, SUBLINE, TAGLINE } from "./Logo";

// 收尾：标题缩到顶上，GitHub 页面的窗口升上来；Clawd 从 i 上跳下去，一脚踩在真实的 Star 按钮上，
// 蹦出一颗星星；再跳回 i 头上。最后是仓库地址。
const SHOT = { w: 1440, h: 844 };
const WIN = { x: 320, y: 250, w: 1280, chrome: 56 };
const K = WIN.w / SHOT.w;
// Star 按钮在截图里的位置（用浏览器量出来的，1440 宽视口）
const STAR_BTN = { x: 1304, y: 88, w: 104, h: 28 };
const BTN = { x: WIN.x + STAR_BTN.x * K, y: WIN.y + WIN.chrome + STAR_BTN.y * K, w: STAR_BTN.w * K, h: STAR_BTN.h * K };

const SHRINK = [0, 36] as const;
const RISE = [16, 48] as const;
const HOP_DOWN = [66, 96] as const;
const STOMP = HOP_DOWN[1];
const STAR_FLY = [STOMP + 2, STOMP + 56] as const;
const HOP_UP = [150, 178] as const;
const CARD = 176;

const LOGO_SCALE = 0.42;
const LOGO_TO_Y = 150;
const LOGO_CENTER = { x: 960, y: 470 };
const CLAWD_S = 5;

// 缩小后的 logo 里，i 上那个点在屏幕上的位置
const shrinkPoint = (p: { x: number; y: number }, k: number, dy: number) => ({
  x: LOGO_CENTER.x + (p.x - LOGO_CENTER.x) * k,
  y: LOGO_CENTER.y + (p.y - LOGO_CENTER.y) * k + dy,
});

const CUES = [
  [RISE[0], "whoosh"],
  [HOP_DOWN[0], "jump"],
  [STOMP, "bonk"],
  [STAR_FLY[0], "star"],
  [HOP_UP[0], "jump"],
  [HOP_UP[1], "pop"],
  [CARD, "success"],
] as const;

export const Github: React.FC = () => {
  const f = useCurrentFrame();
  const sp = tween(f, SHRINK, [0, 1], easeInOut);
  const k = interpolate(sp, [0, 1], [1, LOGO_SCALE]);
  const dy = interpolate(sp, [0, 1], [0, LOGO_TO_Y - LOGO_CENTER.y]);
  const winY = tween(f, RISE, [1100, WIN.y], backOut);
  const cardP = tween(f, [CARD, CARD + 20], [0, 1], easeInOut);

  // Clawd：i 上的点 → 跳到 Star 按钮上踩一脚 → 跳回 i
  const dot = shrinkPoint({ x: LOGO.iDot.x, y: LOGO.iDot.y + 30 }, k, dy);
  const onStar = { x: BTN.x + BTN.w / 2, y: BTN.y + 2 };
  let cx = dot.x;
  let cy = dot.y;
  let scale = interpolate(sp, [0, 1], [6, 6 * LOGO_SCALE]);
  if (f >= HOP_DOWN[0] && f < HOP_UP[1]) {
    const down = tween(f, HOP_DOWN, [0, 1], easeInOut);
    const up = tween(f, HOP_UP, [0, 1], easeInOut);
    const p = f < HOP_UP[0] ? down : 1 - up;
    cx = interpolate(p, [0, 1], [dot.x, onStar.x]);
    cy = interpolate(p, [0, 1], [dot.y, onStar.y]) - (f < HOP_UP[0] ? jumpArc(down, 1, 220) : jumpArc(up, 1, 260));
    scale = interpolate(p, [0, 1], [6 * LOGO_SCALE, CLAWD_S]);
  }
  const press = f >= STOMP && f < STOMP + 10 ? 6 * Math.sin(((f - STOMP) / 10) * Math.PI) : 0;
  const airborne = (f >= HOP_DOWN[0] && f < HOP_DOWN[1]) || (f >= HOP_UP[0] && f < HOP_UP[1]);
  const s = shake(f, STOMP, 12, 10, "stomp");

  // 星星：从按钮里蹦出来，转着飞到片尾卡片的位置
  const starP = tween(f, STAR_FLY, [0, 1], easeInOut);
  const starAt = { x: interpolate(starP, [0, 1], [onStar.x, 960]), y: interpolate(starP, [0, 1], [BTN.y - 20, 560]) - jumpArc(starP, 1, 260) };
  const starScale = interpolate(starP, [0, 1], [3, 12]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <NightSky frame={f + 450} camY={-2600} cityCamY={-2400} />
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
        {/* 标题缩到顶上 */}
        <AbsoluteFill style={{ transformOrigin: `${LOGO_CENTER.x}px ${LOGO_CENTER.y}px`, transform: `translateY(${dy}px) scale(${k})` }}>
          <LogoArt progress={LOGO.strokes.map(() => 1)} solid={1} />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: 800 + 80 * sp, textAlign: "center", opacity: 1 - sp }}>
          <PixelText size={76} font={FONT_BODY} color={CREAM} outline={5} outlineColor={INK} shadow={6} shadowColor={CLAWD}>
            {TAGLINE}
          </PixelText>
          <PixelText size={34} font={FONT_MONO} color="#a9b8f0" style={{ marginTop: 26 }}>
            {SUBLINE}
          </PixelText>
        </div>

        {/* GitHub 页面 */}
        <div style={{ position: "absolute", left: WIN.x, top: winY, opacity: 1 - 0.55 * cardP, transform: `scale(${1 - 0.06 * cardP})`, transformOrigin: "50% 0" }}>
          <PixelBox x={0} y={0} w={WIN.w} h={WIN.chrome + SHOT.h * K} border={10} color="#e8ecff" fill="#ffffff" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ height: WIN.chrome, backgroundColor: "#1b2350", display: "flex", alignItems: "center", gap: 14, paddingLeft: 22 }}>
              {["#ff4f5e", GOLD, "#5dffa0"].map((c) => (
                <div key={c} style={{ width: 18, height: 18, backgroundColor: c }} />
              ))}
              <div style={{ marginLeft: 26, height: 34, flex: 1, marginRight: 22, backgroundColor: "#0b1433", display: "flex", alignItems: "center", paddingLeft: 18 }}>
                <PixelText size={24} font={FONT_MONO} color="#c9d3ff">
                  github.com/zephyr4123/kineto
                </PixelText>
              </div>
            </div>
            <Img src={staticFile(assets.github)} style={{ display: "block", width: WIN.w, height: SHOT.h * K }} />
          </PixelBox>
          {/* 被踩下去的 Star 按钮：从截图里裁出同一块，往下一沉、变暗 */}
          <div
            style={{
              position: "absolute",
              left: BTN.x - WIN.x,
              top: BTN.y - WIN.y + press,
              width: BTN.w,
              height: BTN.h,
              overflow: "hidden",
              filter: press > 0 ? "brightness(0.85)" : undefined,
              boxShadow: f >= STOMP && f < STOMP + 30 ? `0 0 0 4px ${GOLD}, 0 0 30px ${GOLD}` : undefined,
            }}
          >
            <Img src={staticFile(assets.github)} style={{ position: "absolute", left: -STAR_BTN.x * K, top: -STAR_BTN.y * K, width: WIN.w, height: SHOT.h * K, maxWidth: "none" }} />
          </div>
        </div>

        <Burst frame={f} start={STOMP} x={onStar.x} y={BTN.y} seed="stomp" colors={[GOLD, "#ffffff", CLAWD]} count={24} speed={[6, 16]} angle={[-170, -10]} gravity={0.45} life={30} size={[8, 14]} />
        <Shockwave x={onStar.x} y={BTN.y + BTN.h / 2} frame={f} start={STOMP} life={20} maxSize={500} color={GOLD} thickness={12} />

        {/* 片尾卡片 */}
        {f >= CARD ? (
          <div style={{ position: "absolute", left: 960, top: 690, transform: `translate(-50%, -50%) scale(${tween(f, [CARD, CARD + 14], [0.6, 1], backOut)})`, opacity: cardP }}>
            <PixelBox x={0} y={0} w={1240} h={420} border={12} color={GOLD} fill="rgba(11,20,51,0.94)" style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, paddingTop: 130 }}>
                <PixelText size={40} font={FONT_ARCADE} color={GOLD} outline={4}>
                  STAR ON GITHUB
                </PixelText>
                <PixelText size={66} font={FONT_MONO} color={CREAM} outline={5} shadow={6} shadowColor={CLAWD}>
                  github.com/zephyr4123/kineto
                </PixelText>
                <PixelText size={38} font={FONT_BODY} color="#a9b8f0">
                  This video was made with kineto.
                </PixelText>
              </div>
            </PixelBox>
          </div>
        ) : null}

        {/* 星星 */}
        {f >= STAR_FLY[0] ? (
          <div style={{ position: "absolute", left: starAt.x, top: f >= STAR_FLY[1] ? 560 : starAt.y, transform: `translate(-50%, -50%) rotate(${f < STAR_FLY[1] ? starP * 720 : Math.sin(f / 10) * 8}deg) scale(${f >= STAR_FLY[1] ? 1 + 0.05 * Math.sin(f / 6) : 1})` }}>
            <div style={{ position: "absolute", left: -90, top: -90, width: 180 + 11 * starScale, height: 180 + 11 * starScale, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,210,74,0.55) 0%, rgba(255,210,74,0) 65%)" }} />
            <Sprite grid={STAR} palette={STAR_GOLD} scale={f >= STAR_FLY[1] ? 12 : starScale} />
          </div>
        ) : null}
        {[0, 1, 2, 3].map((i) => (
          <Twinkle key={i} x={760 + i * 140} y={520 + (i % 2) * 60} frame={f} start={STAR_FLY[1] + i * 7} size={10} color={i % 2 ? GOLD : "white"} />
        ))}

        <Clawd
          x={cx}
          y={cy}
          scale={scale}
          pose={{ eyes: airborne ? "wide" : blinking(f, 50) ? "closed" : f >= STOMP && f < HOP_UP[0] ? "up" : "center", arms: airborne || (f >= STOMP && f < STOMP + 24) ? "up" : "side", legs: airborne ? "tuck" : "stand" }}
          squash={Math.max(landSquash(f, STOMP), landSquash(f, HOP_UP[1]))}
        />
      </AbsoluteFill>
      <Crt />
      <Cues cues={CUES} />
    </AbsoluteFill>
  );
};

