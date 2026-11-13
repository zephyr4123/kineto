import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { DH, DW, FRONT, MacDesktop, type Rect } from "../components/mac";
import { Phone } from "../components/phone";
import { WIN, WindowList } from "../components/snug";
import { Hero } from "../components/stage";
import { SESSION, Terminal } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { C, local, SF, ZH } from "../theme";
import { OTHERS } from "./List";

// Mac 端零操作：Snug 常驻菜单栏，连上就用，Mac 上什么都不用点。
// 断开即复原：手机一断开，手机屏移除，窗口从右边回到原来的位置，字号缩回原样。
const at = local(128);
const SCREEN_W = 940;
const K = SCREEN_W / DW;
const SCREEN_H = DH * K;
const LEFT = (1080 - SCREEN_W) / 2;
const TOP = 640;

const MacBook: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: LEFT - 22, top: TOP - 22 }}>
    <div style={{ width: SCREEN_W + 44, height: SCREEN_H + 40, borderRadius: 30, background: "#0d0f14", border: "2px solid #3b4257", boxShadow: "0 40px 90px rgba(20,40,90,0.3)", position: "relative" }}>
      <div style={{ position: "absolute", left: 22, top: 22, width: SCREEN_W, height: SCREEN_H, borderRadius: 10, overflow: "hidden" }}>{children}</div>
    </div>
    <div style={{ width: SCREEN_W + 120, height: 26, marginLeft: -38, borderRadius: "0 0 26px 26px", background: "linear-gradient(180deg,#a8b2c8,#5d667c)" }} />
  </div>
);

export const Restore: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: outExpo });
  const pulse = interpolate(f % 56, [0, 56], [0, 1]);
  const off = interpolate(f, [at(8), at(8) + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const back = interpolate(f, [at(9), at(11)], [0, 1], { ...clamp, easing: inOutQuint });
  // 窗口从右边（手机屏那块虚拟屏）回到原位
  const rect: Rect = { x: FRONT.x + (DW + 40 - FRONT.x) * (1 - back), y: FRONT.y, w: FRONT.w, h: FRONT.h };
  const size = 13 + 4 * (1 - back);
  const menuIcon = (
    <div style={{ position: "absolute", left: DW - 330, top: 2, width: 22, height: 22 }}>
      <Img src={staticFile(assets.snugIcon)} style={{ width: 22, height: 22 }} />
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ opacity: on, transform: `translateY(${(1 - on) * 60}px)` }}>
        <MacBook>
          <div style={{ width: DW, height: DH, transform: `scale(${K})`, transformOrigin: "0 0" }}>
            <MacDesktop front={<Terminal lines={SESSION} size={size} width={rect.w} height={rect.h - 33} />} frontRect={rect} menuIcon={menuIcon} />
          </div>
        </MacBook>
        {/* 菜单栏里的 Snug 图标：一圈光提示它在那里 */}
        <div style={{ position: "absolute", left: LEFT + (DW - 319) * K - 30, top: TOP + 13 * K - 30, width: 60, height: 60, borderRadius: 30, border: `3px solid rgba(31,99,255,${(1 - pulse) * (1 - off)})`, transform: `scale(${0.6 + 0.8 * pulse})` }} />
        <div style={{ position: "absolute", left: LEFT + (DW - 319) * K - 200, top: TOP + 60, width: 400, textAlign: "center", opacity: 1 - off }}>
          <span style={{ display: "inline-block", padding: "8px 20px", borderRadius: 22, background: "#ffffff", boxShadow: "0 8px 24px rgba(20,40,90,0.18)", fontFamily: ZH, fontSize: 30, fontWeight: 600, color: C.blue }}>Snug 常驻菜单栏</span>
        </div>
      </div>
      {/* 连着的手机，断开时往下退掉 */}
      <div style={{ opacity: 1 - off, transform: `translateY(${off * 160}px)` }}>
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
          <path d="M 540 1260 L 540 1330" stroke={C.blue} strokeWidth="5" strokeDasharray="10 10" strokeDashoffset={-f} />
        </svg>
        <Phone x={540} y={1590} scale={0.58} glow={0.6}>
          <UUSnug>
            <WindowList current={WIN.ghostty} others={OTHERS} />
          </UUSnug>
        </Phone>
      </div>
      {off > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1380, textAlign: "center", fontFamily: SF, fontWeight: 700, fontSize: 40, color: C.ink2, opacity: back }}>
          <span style={{ fontFamily: ZH }}>窗口归位 · 字号复原</span>
        </div>
      ) : null}
      <Hero at={2} until={at(8) - 6} title="ZERO SETUP" sub="Mac 端 无需任何操作" />
      <Hero at={at(8)} until={at(16) - 6} title="AUTO RESTORE" sub="断开即复原" />
    </AbsoluteFill>
  );
};
