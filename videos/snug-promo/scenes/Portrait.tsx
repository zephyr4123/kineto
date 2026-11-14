import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { Callout, Chip, Smear, speed } from "../components/fx";
import { FRONT } from "../components/mac";
import { aim, DISPLAY_H, DISPLAY_TOP, onStage, Phone, SW, TOOLBAR_TOP } from "../components/phone";
import { Hero } from "../components/stage";
import { taskAt } from "../components/story";
import { Terminal } from "../components/terminal";
import { DESK_K, UUOriginal } from "../components/uu";
import { DH } from "../components/mac";
import { b, C, local, ZH } from "../theme";

// 原版 UU远程 · 竖屏（照 Snug README 里的实机截图）：整块桌面等比缩到手机宽，夹在一大片黑里，有效画面只占屏幕三成。
// 手机带着一点翻转从下面飞进来；上下两块黑边打上斜纹、标出来；镜头推到中间那一条上，字小到认不出；拉回来，提示横过来。
const START = 12;
const at = local(START);
export const PORTRAIT_POSE = { x: 540, y: 1180, s: 1.27 };
const MID = DISPLAY_TOP + DISPLAY_H / 2;
const BAND = DH * DESK_K;

export const Portrait: React.FC = () => {
  const f = useCurrentFrame();
  const flyAt = (t: number) => interpolate(t, [0, 26], [0, 1], { ...clamp, easing: outExpo });
  const fly = flyAt(f);
  const push = interpolate(f, [at(4), at(5)], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [at(6.4), at(7.4)], [0, 1], { ...clamp, easing: inOutQuint }));
  const s = PORTRAIT_POSE.s * (0.88 + 0.12 * fly) * (1 + 0.85 * push);
  const yOf = (t: number) => 2350 + (PORTRAIT_POSE.y - 2350) * flyAt(t);
  const base = { x: PORTRAIT_POSE.x, y: yOf(f) };
  // 推近时对着中间那一条
  const focus = aim(SW / 2, MID, s, 540, 1060);
  const pose = { x: base.x + (focus.x - base.x) * push, y: base.y + (focus.y - base.y) * push };
  const lines = taskAt(b(START) + f);
  const bars = interpolate(f, [at(2), at(2) + 10], [0, 1], { ...clamp, easing: outExpo }) * (1 - push);
  const bandTop = MID - BAND / 2;
  const bandBottom = MID + BAND / 2;
  const edge = onStage(pose.x, pose.y, s, SW, MID);
  const spin = interpolate(f, [at(6.6), at(8)], [0, 1], { ...clamp, easing: outExpo });
  const barStyle = (top: number, h: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top,
    width: SW,
    height: h,
    opacity: bars,
    background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.13) 0 7px, transparent 7px 16px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: ZH,
    fontSize: 30,
    fontWeight: 600,
    letterSpacing: "0.3em",
    color: "rgba(255,255,255,0.86)",
  });
  return (
    <AbsoluteFill>
      <Smear id="portrait-fly" sx={0} sy={Math.min(26, Math.abs(speed(yOf, f)) * 0.22)}>
        <Phone x={pose.x} y={pose.y} scale={s} tiltX={36 * (1 - fly)} rotate={-12 * (1 - fly)}>
          <UUOriginal front={<Terminal lines={lines} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} />
          <div style={barStyle(DISPLAY_TOP, bandTop - DISPLAY_TOP)}>黑边</div>
          <div style={barStyle(bandBottom, TOOLBAR_TOP - bandBottom)}>黑边</div>
        </Phone>
      </Smear>
      <Chip at={14} until={at(8)} x={96} y={452} text="UU远程 原版" />
      <Callout at={at(3)} until={at(4)} x={edge.x - 6} y={edge.y} tx={edge.x + 34} ty={edge.y - 170} text="有效画面" side="right" />
      {/* 横过来的提示：手机右边一个转圈的箭头 */}
      {spin > 0 ? (
        <svg style={{ position: "absolute", left: 900, top: 1080, opacity: spin, transform: `rotate(${-200 + 200 * spin}deg) scale(${0.6 + 0.4 * spin})` }} width="120" height="120" viewBox="0 0 120 120">
          <path d="M96 60a36 36 0 1 1-12-26.8" fill="none" stroke={C.blue} strokeWidth="9" strokeLinecap="round" />
          <path d="M70 22l16 12-14 15" fill="none" stroke={C.blue} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      <Hero at={10} until={at(8) - 4} title="PORTRAIT" sub="竖屏 · 上下黑边" />
    </AbsoluteFill>
  );
};
