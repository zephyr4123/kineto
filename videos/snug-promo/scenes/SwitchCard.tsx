import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { backOut, clamp, easeIn, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { CardTitle, cardAt, ChapterTag, MINIS, MiniScreen, type Mini } from "../components/chapter";
import { C, SF, ZH } from "../theme";

// 第二章「流转自如」：一块浅青的底从右边斜着推进来。左上大标题；下面是一排竖着的窗口卡片，像 iPhone 的多任务界面
// （Snug 的窗口列表就是照它做的）：先点一下底部指示条，卡片从指示条那里升起、向两边铺开，整排缓缓往左流；
// 最后轻点正中那一张，它浮起来亮一下。背后几道横向的光痕一直往左流。退场时整块底接着往左斜着推走，露出下一段。
const START = 84;
const at = cardAt(START);
const END = at(4);
const SLANT = 300;
const CARD_W = 360;
const CARD_H = 650;
const SP = 400;
const ROW_Y = 1160;
const BAR_Y = 1690;
const BAR_TAP = at(0.5);
const PICK = at(2.5);
const DRIFT = 2.2;

const WINS: readonly Mini[] = [MINIS[1], MINIS[2], MINIS[3], MINIS[8], MINIS[4], MINIS[6], MINIS[5], MINIS[7]];
const CENTER = 3;

const Card: React.FC<{ win: Mini; i: number; x: number; rise: number; lift: number }> = ({ win, i, x, rise, lift }) => {
  const d = (x - 540) / SP;
  const s = (1 - 0.07 * Math.min(Math.abs(d), 3)) * (0.7 + 0.3 * rise) * (1 + 0.06 * lift);
  return (
    <div
      style={{
        position: "absolute",
        left: x - CARD_W / 2,
        top: ROW_Y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        zIndex: 100 - Math.round(Math.abs(d) * 10),
        opacity: Math.min(1, rise * 1.4),
        transform: `translateY(${(1 - rise) * (BAR_Y - ROW_Y) - 30 * lift}px) scale(${s})`,
      }}
    >
      {/* 卡片上面：App 图标、App 名、窗口名（Snug 窗口列表里每一行的写法） */}
      <div style={{ position: "absolute", left: 6, top: -96, display: "flex", alignItems: "center", gap: 14, width: CARD_W + 40 }}>
        <Img src={staticFile(assets[win.icon])} style={{ width: 54, height: 54 }} />
        <div>
          <div style={{ fontFamily: SF, fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>{win.app}</div>
          <div style={{ fontFamily: SF, fontSize: 22, color: "#4b5568", whiteSpace: "nowrap", maxWidth: CARD_W - 70, overflow: "hidden", textOverflow: "ellipsis" }}>{win.title}</div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: 38, overflow: "hidden", boxShadow: `0 24px 60px rgba(20,50,110,0.22), 0 0 0 ${7 * lift}px rgba(31,99,255,${0.5 * lift})` }}>
        <MiniScreen win={win} w={CARD_W} h={CARD_H} seed={i} />
      </div>
    </div>
  );
};

export const SwitchCard: React.FC = () => {
  const f = useCurrentFrame();
  const pin = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: outExpo });
  const pout = interpolate(f, [END, END + 14], [0, 1], { ...clamp, easing: easeIn });
  if (pout >= 1) return null;
  // 斜边：进场时左边缘从右往左扫，退场时右边缘从右往左扫
  const xl = 1080 + SLANT - (1080 + 2 * SLANT) * pin;
  const xr = 1080 + SLANT - (1080 + 2 * SLANT) * pout;
  const clip = pout > 0 ? `polygon(-400px 0, ${xr}px 0, ${xr - SLANT}px 1920px, -400px 1920px)` : `polygon(${xl + SLANT}px 0, 1500px 0, 1500px 1920px, ${xl}px 1920px)`;
  const edge = pout > 0 ? xr : xl;
  const lift = interpolate(f, [PICK + 2, PICK + 12], [0, 1], { ...clamp, easing: backOut });
  const tapP = interpolate(f, [BAR_TAP - 2, BAR_TAP + 20], [0, 1], clamp);
  const pickP = interpolate(f, [PICK - 2, PICK + 22], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: clip }}>
        <AbsoluteFill style={{ background: "linear-gradient(170deg, #f8fdff 0%, #e4f5ff 52%, #cfe9ff 100%)" }} />
        {/* 两团慢慢往左漂的光 */}
        <AbsoluteFill style={{ background: `radial-gradient(40% 22% at ${90 - f * 0.35}% 62%, rgba(0,200,255,0.30) 0%, transparent 70%), radial-gradient(36% 20% at ${30 - f * 0.25 + 60}% 30%, rgba(31,99,255,0.16) 0%, transparent 70%)`, filter: "blur(20px)" }} />
        {/* 横向的光痕，一直往左流 */}
        {Array.from({ length: 9 }, (_, i) => {
          const len = 260 + ((i * 173) % 420);
          const y = 620 + ((i * 211) % 1180);
          const v = 6 + ((i * 7) % 9);
          const x = 1400 - ((f * v + i * 397) % 2200);
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: len, height: 3 + (i % 3), borderRadius: 3, background: `linear-gradient(90deg, rgba(0,184,234,0) 0%, rgba(0,184,234,${0.32 + 0.1 * (i % 2)}) 45%, rgba(31,99,255,0) 100%)` }} />;
        })}
        {/* 一排窗口卡片 */}
        {WINS.map((win, i) => {
          const x = 540 + (i - CENTER) * SP - DRIFT * (f - PICK);
          if (x < -CARD_W || x > 1080 + CARD_W) return null;
          const rise = interpolate(f, [BAR_TAP + 4 + Math.abs(i - CENTER) * 3, BAR_TAP + 22 + Math.abs(i - CENTER) * 3], [0, 1], { ...clamp, easing: inOutQuint });
          return <Card key={i} win={win} i={i} x={x} rise={rise} lift={i === CENTER ? lift : 0} />;
        })}
        {/* 轻点正中那一张 */}
        {pickP > 0 && pickP < 1 ? <div style={{ position: "absolute", left: 540 - 46 - 60 * pickP, top: ROW_Y + 60 - 46 - 60 * pickP, width: 92 + 120 * pickP, height: 92 + 120 * pickP, borderRadius: "50%", zIndex: 200, background: `rgba(255,255,255,${0.22 * (1 - pickP)})`, border: `5px solid rgba(255,255,255,${0.9 * (1 - pickP)})`, boxShadow: `0 0 30px rgba(31,99,255,${0.7 * (1 - pickP)})` }} /> : null}
        {/* 底部指示条，先被点一下 */}
        <div style={{ position: "absolute", left: 540 - 150, top: BAR_Y - 7, width: 300, height: 14, borderRadius: 7, background: C.ink, opacity: 0.85 }} />
        {tapP > 0 && tapP < 1 ? <div style={{ position: "absolute", left: 540 - 40 - 70 * tapP, top: BAR_Y - 40 - 70 * tapP, width: 80 + 140 * tapP, height: 80 + 140 * tapP, borderRadius: "50%", border: `4px solid rgba(31,99,255,${0.7 * (1 - tapP)})`, background: `rgba(31,99,255,${0.12 * (1 - tapP)})` }} /> : null}
        <ChapterTag at={at(0) + 4} until={END} n={2} text="SEAMLESS SWITCHING" x={84} y={180} color={C.deep} align="left" />
        <CardTitle at={at(0) + 6} until={END} text="流转自如" x={78} y={256} size={200} color={C.ink} align="left" />
        <div style={{ position: "absolute", left: 88, top: 508, fontFamily: ZH, fontWeight: 600, fontSize: 52, letterSpacing: "0.06em", color: C.ink2, opacity: interpolate(f, [at(0.6), at(0.6) + 10], [0, 1], clamp) }}>指示条 · 窗口列表</div>
      </AbsoluteFill>
      {/* 斜边上一道青光 */}
      <svg style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} width={1080} height={1920}>
        <line x1={edge + SLANT} y1={0} x2={edge} y2={1920} stroke="rgba(0,200,255,0.9)" strokeWidth={8} style={{ filter: "drop-shadow(0 0 18px rgba(0,184,234,0.9))" }} opacity={pin < 1 || pout > 0 ? 1 : 0} />
      </svg>
    </AbsoluteFill>
  );
};
