import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, punch, shake } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { GhosttyApp } from "../components/apps";
import { Callout, Flash, Shock, Sweep } from "../components/fx";
import { FRONT, MacDesktop, toPhone } from "../components/mac";
import { aim, DISPLAY_H, DISPLAY_TOP, Landscape as Land, onStage, Phone, SH, SW, UUToolbar } from "../components/phone";
import { Hero } from "../components/stage";
import { taskAt } from "../components/story";
import { Terminal } from "../components/terminal";
import { deskToScreen, FIT, UULandscape, UUOriginal, UUSnug } from "../components/uu";
import { b, local } from "../theme";
import { LAND_POSE } from "./Landscape";
import { PORTRAIT_POSE } from "./Portrait";

// Snug 亮相（全片第一次砸下）：手机转回竖屏，又是那一大片黑边；音乐抽空的一小节里四周压暗，Snug 的图标从上面落下来、
// 一拍一跳地蓄力，最后一拍扎进手机屏幕 —— 砸下：缩在中间的整块桌面炸开，换成 Snug 手机屏，Ghostty 窗口竖着铺满。
// 随后字号放大、镜头推到字上；拉回来，手机轻轻转着，三条标注依次点出铺满、字号、底部横条；最后手机退到下一场的位置。
const START = 40;
const at = local(START);
const SNAP = at(8);
/** 原版画面里 Ghostty 那个小窗口的中心（手机屏幕点），从这里炸开 */
const O = deskToScreen(FIT, FRONT.x + FRONT.w / 2, FRONT.y + FRONT.h / 2);
export const DUO_BOTTOM = { x: 540, y: 1405, s: 0.86 };
const HOME_Y = 1228;

export const Native: React.FC = () => {
  const f = useCurrentFrame();
  const lines = taskAt(b(START) + f);
  // 转回竖屏
  const r = interpolate(f, [0, at(1.6)], [0, 1], { ...clamp, easing: inOutQuint });
  const land = 1 - interpolate(r, [0.35, 0.65], [0, 1], clamp);
  // 砸下
  const m = interpolate(f, [SNAP, SNAP + 15], [0, 1], { ...clamp, easing: outExpo });
  const size = interpolate(f, [at(9.6), at(10.2)], [13, 17], { ...clamp, easing: outExpo });
  const push = interpolate(f, [at(9.6), at(10.4)], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [at(11.2), at(12.2)], [0, 1], { ...clamp, easing: inOutQuint }));
  const toDuo = interpolate(f, [at(17), at(19.5)], [0, 1], { ...clamp, easing: inOutQuint });
  const settle = interpolate(f, [SNAP, at(11)], [0, 1], { ...clamp, easing: inOutQuint });
  let s = LAND_POSE.s + (PORTRAIT_POSE.s - LAND_POSE.s) * r;
  s = s * punch(f, SNAP, 0.07, 26) + 0.5 * push;
  s = s + (DUO_BOTTOM.s - s) * toDuo;
  const y0 = LAND_POSE.y + (PORTRAIT_POSE.y - LAND_POSE.y) * r + (HOME_Y - PORTRAIT_POSE.y) * settle;
  const pushPose = aim(180, 560, s, 540, 1560);
  let x = 540 + (pushPose.x - 540) * push;
  let y = y0 + (pushPose.y - y0) * push;
  x = x + (DUO_BOTTOM.x - x) * toDuo;
  y = y + (DUO_BOTTOM.y - y) * toDuo;
  const orbit = interpolate(f, [at(11), at(12), at(16.5), at(17.5)], [0, 1, 1, 0], clamp);
  const tiltY = 11 * Math.sin((f - at(11)) / 34) * orbit;
  const sh = shake(f, SNAP, 18, 16, "native");

  // 抽空那一小节：四周压暗；Snug 图标落下、跟着拍子跳，最后一拍扎进屏幕
  const dark = interpolate(f, [at(3), at(7.8), SNAP, SNAP + 10], [0, 0.34, 0.34, 0], clamp);
  const drop = interpolate(f, [at(4), at(5)], [0, 1], { ...clamp, easing: outExpo });
  const dive = interpolate(f, [at(7.25), SNAP], [0, 1], { ...clamp, easing: inOutQuint });
  const beat = [5, 6, 7].reduce((k, n) => k * punch(f, at(n), 0.09, 18), 1);
  const iconY = -300 + (410 + 300) * drop + (y - 410) * dive;
  const iconS = 200 * (1 - 0.78 * dive) * beat;

  const pt = (px: number, py: number) => onStage(x, y, s, px, py);
  const title = pt(toPhone(110, 46).x, toPhone(110, 46).y);
  const text = pt(toPhone(420, 620).x, toPhone(420, 620).y);
  const bar = pt(toPhone(270, 936).x, toPhone(270, 936).y);
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(80% 60% at 50% 55%, rgba(8,16,40,${dark * 0.4}) 0%, rgba(8,16,40,${dark}) 100%)` }} />
      <Phone x={x} y={y} scale={s} rotate={-90 * (1 - r)} tiltY={tiltY} bar={r > 0.5} glow={dive + (1 - m) * 0.6 * (f >= SNAP ? 1 : 0)}>
        {land > 0 ? (
          <Land opacity={land}>
            <UULandscape desk={<MacDesktop front={<Terminal lines={lines} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} />} />
          </Land>
        ) : null}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - land }}>
          <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: -DISPLAY_TOP, width: SW, height: SH }}>
              {m < 1 ? (
                <div style={{ position: "absolute", inset: 0, opacity: 1 - m, transform: `scale(${1 + 1.4 * m})`, transformOrigin: `${O.x}px ${O.y}px` }}>
                  <UUOriginal front={<Terminal lines={lines} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} />
                </div>
              ) : null}
              {m > 0 ? (
                <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, m * 1.4), transform: `scale(${0.5 + 0.5 * m})`, transformOrigin: `${O.x}px ${O.y}px` }}>
                  <UUSnug>
                    <GhosttyApp lines={lines} size={size} />
                  </UUSnug>
                </div>
              ) : null}
            </div>
          </div>
          <UUToolbar />
        </div>
      </Phone>
      {drop > 0 && dive < 1 ? (
        <div style={{ position: "absolute", left: 540 - iconS / 2, top: iconY - iconS / 2, width: iconS, height: iconS, opacity: 1 - interpolate(dive, [0.75, 1], [0, 1], clamp), transform: `rotate(${-14 * dive}deg)` }}>
          <div style={{ position: "absolute", inset: -iconS * 0.6, borderRadius: "50%", background: `radial-gradient(circle, rgba(0,200,255,${0.45 * drop}) 0%, rgba(31,99,255,${0.2 * drop}) 40%, transparent 70%)` }} />
          <Img src={staticFile(assets.snugIcon)} style={{ position: "absolute", inset: 0, width: iconS, height: iconS, filter: "drop-shadow(0 20px 40px rgba(0,30,90,0.4))" }} />
        </div>
      ) : null}
      <Flash at={SNAP} dur={18} max={0.9} y={60} />
      <Shock at={SNAP} x={540} y={y} size={1500} dur={30} />
      <Sweep at={SNAP + 3} />
      <Callout at={at(12)} until={at(16.6)} x={title.x} y={title.y} tx={208} ty={title.y - 130} text="窗口铺满" side="left" />
      <Callout at={at(12.8)} until={at(16.6)} x={text.x} y={text.y} tx={872} ty={text.y - 120} text="字号放大" side="right" />
      <Callout at={at(13.6)} until={at(16.6)} x={bar.x} y={bar.y} tx={208} ty={bar.y - 110} text="底部横条" side="left" />
      <Hero at={SNAP} until={at(17)} eyebrow="WITH SNUG" title="NATIVE" sub="专属竖屏 · 窗口铺满 · 字号放大" />
    </AbsoluteFill>
  );
};
