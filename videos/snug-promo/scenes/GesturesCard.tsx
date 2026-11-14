import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { backOut, clamp, easeIn, outExpo } from "../../../engine/motion";
import { CardTitle, cardAt, ChapterTag } from "../components/chapter";
import { HOLD } from "../components/gesture";
import { C, SF, ZH } from "../theme";
import { DUO_SNUG } from "./Native";

// 第一章「原生手势」：手指在手机屏上一点，一片深蓝从指尖漾开铺满整屏，一圈圈触控涟漪往外扩。
// 中间是大标题，下面两个手势各自循环演着：左边一指上划（拖出一道光痕），右边长按（外圈走满、弹出一个小菜单），
// 底下各挂一个标签「单指滚动」「长按拷贝」—— 就是这一章要演的两件事。最后整片蓝收回成一个点，落进下一段的手机里。
const START = 60;
const at = cardAt(START);
const END = at(4);
/** 指尖点下去的地方：上一段最后手机停在 DUO_SNUG，点在屏幕偏上 */
const TAP = { x: DUO_SNUG.x, y: DUO_SNUG.y - 40 };
const R_MAX = 2400;
const TAG_Y = 560;
const TITLE_Y = 640;
const SWIPE = { x: 270, top: 1110, bottom: 1370 };
const PRESS = { x: 810, y: 1240 };
const CHIP_Y = 1470;

/** 指尖：白色圆点，外面一圈柔光 */
const Finger: React.FC<{ x: number; y: number; o: number; s?: number }> = ({ x, y, o, s = 1 }) => (
  <div style={{ position: "absolute", left: x - 38, top: y - 38, width: 76, height: 76, borderRadius: 38, opacity: o, transform: `scale(${s})`, background: "radial-gradient(circle, #ffffff 0%, #eaf3ff 55%, rgba(255,255,255,0.9) 100%)", boxShadow: "0 0 0 10px rgba(255,255,255,0.16), 0 0 50px rgba(160,220,255,0.8)" }} />
);

const Chip: React.FC<{ at: number; x: number; text: string }> = ({ at: t, x, text }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [t, t + 10], [0, 1], { ...clamp, easing: backOut });
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: CHIP_Y, transform: `translateX(-50%) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 1.5), padding: "16px 34px", borderRadius: 40, background: "#ffffff", boxShadow: "0 16px 40px rgba(0,10,60,0.35)", fontFamily: ZH, fontWeight: 600, fontSize: 48, letterSpacing: "0.04em", color: C.deep, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

export const GesturesCard: React.FC = () => {
  const f = useCurrentFrame();
  // 一点、漾开；最后收回成一个点
  const press = interpolate(f, [0, 4, 10], [0, 1, 0.7], clamp);
  const open = interpolate(f, [4, 22], [0, 1], { ...clamp, easing: outExpo });
  const close = interpolate(f, [END, END + 12], [0, 1], { ...clamp, easing: easeIn });
  const r = R_MAX * open * (1 - close);
  if (r <= 0 && f > 10) return null;

  // 一指上划：每拍一次，指尖从下往上走，后面拖一道光
  const swipeT = f - at(0.6);
  const cyc = ((swipeT % 28) + 28) % 28;
  const sp = interpolate(cyc, [0, 14], [0, 1], { ...clamp, easing: outExpo });
  const swipeY = SWIPE.bottom + (SWIPE.top - SWIPE.bottom) * sp;
  const swipeO = swipeT < 0 ? 0 : interpolate(cyc, [0, 3, 18, 26], [0, 1, 1, 0], clamp);
  // 长按：两拍一次，外圈走满一圈后弹出小菜单
  const pressT = f - at(0.9);
  const pc = ((pressT % 56) + 56) % 56;
  const ring = interpolate(pc, [4, 4 + HOLD], [0, 1], clamp);
  const menu = interpolate(pc, [HOLD + 4, HOLD + 12], [0, 1], { ...clamp, easing: backOut }) * interpolate(pc, [48, 55], [1, 0], clamp);
  const pressO = pressT < 0 ? 0 : interpolate(pc, [0, 4, 48, 55], [0, 1, 1, 0], clamp);
  const RING_R = 64;
  const CIRC = 2 * Math.PI * RING_R;

  return (
    <AbsoluteFill>
      {/* 指尖点下去 */}
      {open < 0.6 ? <Finger x={TAP.x} y={TAP.y} o={press} s={1 - 0.15 * press} /> : null}
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${close > 0 ? DUO_SNUG.x : TAP.x}px ${close > 0 ? DUO_SNUG.y : TAP.y}px)` }}>
        <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 8% 4%, rgba(0,190,255,0.32) 0%, transparent 70%), radial-gradient(60% 40% at 92% 96%, rgba(130,120,255,0.34) 0%, transparent 70%), linear-gradient(165deg, #0a3be6 0%, ${C.deep} 45%, #0a28a8 100%)` }} />
        {/* 背后一个很淡的大号「01」 */}
        <div style={{ position: "absolute", right: -60 + 20 * Math.sin(f / 40), bottom: -200, fontFamily: SF, fontWeight: 900, fontSize: 1000, lineHeight: 1, letterSpacing: "-0.06em", color: "rgba(255,255,255,0.05)" }}>01</div>
        {/* 触控涟漪：从指尖那一点一圈圈扩开 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const t = (f - 4 - i * 22) / 70;
          if (t < 0 || t > 1) return null;
          const rr = 60 + 1100 * outExpo(t);
          return <div key={i} style={{ position: "absolute", left: TAP.x - rr, top: TAP.y - rr, width: 2 * rr, height: 2 * rr, borderRadius: "50%", border: `${3 + 6 * (1 - t)}px solid rgba(255,255,255,${0.28 * (1 - t)})` }} />;
        })}
        {/* 一指上划 */}
        <div style={{ position: "absolute", left: SWIPE.x - 30, top: swipeY, width: 60, height: Math.max(0, SWIPE.bottom - swipeY + 30), borderRadius: 30, opacity: swipeO * 0.9, background: "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(160,220,255,0.25) 60%, rgba(160,220,255,0) 100%)" }} />
        <Finger x={SWIPE.x} y={swipeY} o={swipeO} />
        {/* 长按：外圈走满，弹出菜单 */}
        <svg style={{ position: "absolute", left: PRESS.x - 90, top: PRESS.y - 90, opacity: pressO }} width={180} height={180}>
          <circle cx={90} cy={90} r={RING_R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={8} />
          <circle cx={90} cy={90} r={RING_R} fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - ring)} transform="rotate(-90 90 90)" />
        </svg>
        <Finger x={PRESS.x} y={PRESS.y} o={pressO} s={1 - 0.1 * ring} />
        {menu > 0 ? (
          <div style={{ position: "absolute", left: PRESS.x - 210, top: PRESS.y - 230, width: 170, padding: "14px 0", borderRadius: 18, background: "rgba(255,255,255,0.96)", boxShadow: "0 18px 40px rgba(0,10,60,0.35)", opacity: menu, transform: `scale(${0.7 + 0.3 * menu})`, transformOrigin: "100% 100%" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ margin: "8px 18px", height: 14, borderRadius: 7, width: i === 0 ? 96 : 120 - i * 18, background: i === 0 ? C.blue : "#c9d3e6" }} />
            ))}
          </div>
        ) : null}
        <Chip at={at(1)} x={SWIPE.x} text="单指滚动" />
        <Chip at={at(1.3)} x={PRESS.x} text="长按拷贝" />
        <ChapterTag at={at(0) + 2} until={END} n={1} text="NATIVE GESTURES" x={0} y={TAG_Y} color="#ffffff" />
        <CardTitle at={at(0) + 4} until={END} text="原生手势" x={0} y={TITLE_Y} size={220} color="#ffffff" shadow="0 10px 40px rgba(0,10,80,0.35)" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
