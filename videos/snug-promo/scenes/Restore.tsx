import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { GhosttyApp } from "../components/apps";
import { DW, FRONT, MacBook, MacDesktop, type Rect } from "../components/mac";
import { flick } from "../components/gesture";
import { Phone, Touch } from "../components/phone";
import { Hero } from "../components/stage";
import { followAt } from "../components/story";
import { Terminal } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { b, C, local, SF, ZH } from "../theme";

// Mac 端零操作：Snug 常驻菜单栏，连上就用，Mac 上什么都不用点。手机上还是刚才答完的那个终端，
// 手指往下甩一下翻回去重看一段，再往上甩回到底；镜头慢慢推近。
// 断开即复原：第 14 拍音乐静音一拍，手机在这一拍断开退下，手机屏移除；声音回来时窗口从右边回到原来的位置，字号缩回原样。
const START = 208;
const at = local(START);
const SCREEN_W = 940;
const K = SCREEN_W / DW;
const LEFT = (1080 - SCREEN_W) / 2;
const TOP = 640;

export const Restore: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: outExpo });
  const pulse = interpolate(f % 56, [0, 56], [0, 1]);
  const off = interpolate(f, [at(14), at(14) + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const back = interpolate(f, [at(15), at(17)], [0, 1], { ...clamp, easing: inOutQuint });
  // 窗口从右边（手机屏那块虚拟屏）回到原位
  const rect: Rect = { x: FRONT.x + (DW + 40 - FRONT.x) * (1 - back), y: FRONT.y, w: FRONT.w, h: FRONT.h };
  const size = 13 + 4 * (1 - back);
  const lines = followAt(b(START) + f);
  // 手机上甩两下：往下翻回去（anchor 贴底，往回翻是负的 scroll），再甩回底部
  const scroll = -Math.max(0, Math.min(260, flick(f, at(4), 8, 150) - flick(f, at(8.5), 8, 150)));
  const swipe = (t0: number, dir: number) => ({
    y: interpolate(f, [t0, t0 + 8], [0, 150], clamp) * dir,
    show: interpolate(f, [t0 - 6, t0, t0 + 8, t0 + 14], [0, 1, 1, 0], clamp),
  });
  const w1 = swipe(at(4), 1);
  const w2 = swipe(at(8.5), -1);
  const push = interpolate(f, [0, at(14)], [0, 1], clamp);
  const menuIcon = (
    <div style={{ position: "absolute", left: DW - 330, top: 2, width: 22, height: 22 }}>
      <Img src={staticFile(assets.snugIcon)} style={{ width: 22, height: 22 }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.04 * push})`, transformOrigin: "50% 60%" }}>
      <div style={{ opacity: on, transform: `translateY(${(1 - on) * 60}px)` }}>
        <MacBook left={LEFT} top={TOP} width={SCREEN_W}>
          <MacDesktop front={<Terminal lines={lines} size={size} width={rect.w} height={rect.h - 33} anchor="bottom" />} frontRect={rect} menuIcon={menuIcon} />
        </MacBook>
        {/* 菜单栏里的 Snug 图标：一圈光提示它在那里 */}
        <div style={{ position: "absolute", left: LEFT + (DW - 319) * K - 30, top: TOP + 13 * K - 30, width: 60, height: 60, borderRadius: 30, border: `3px solid rgba(31,99,255,${(1 - pulse) * (1 - off)})`, transform: `scale(${0.6 + 0.8 * pulse})` }} />
        <div style={{ position: "absolute", left: LEFT + (DW - 319) * K - 200, top: TOP + 60, width: 400, textAlign: "center", opacity: 1 - off }}>
          <span style={{ display: "inline-block", padding: "8px 20px", borderRadius: 22, background: "#ffffff", boxShadow: "0 8px 24px rgba(20,40,90,0.18)", fontFamily: ZH, fontSize: 30, fontWeight: 600, color: C.blue }}>常驻菜单栏</span>
        </div>
      </div>
      {/* 连着的手机，断开时往下退掉 */}
      <div style={{ opacity: 1 - off, transform: `translateY(${off * 160}px)` }}>
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
          <path d="M 540 1260 L 540 1330" stroke={C.blue} strokeWidth="5" strokeDasharray="10 10" strokeDashoffset={-f} />
        </svg>
        <Phone x={540} y={1590} scale={0.58} glow={0.6}>
          <UUSnug>
            <GhosttyApp lines={lines} size={17} scroll={scroll} />
          </UUSnug>
          <Touch x={260} y={330 + w1.y} press={1} show={w1.show} />
          <Touch x={260} y={520 + w2.y} press={1} show={w2.show} />
        </Phone>
      </div>
      {off > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1380, textAlign: "center", fontFamily: SF, fontWeight: 700, fontSize: 40, color: C.ink2, opacity: back }}>
          <span style={{ fontFamily: ZH }}>窗口归位 · 字号复原</span>
        </div>
      ) : null}
      <Hero at={2} until={at(14) - 6} title="ZERO SETUP" sub="Mac 端 · 零操作" />
      <Hero at={at(14)} until={at(20) - 6} title="AUTO RESTORE" sub="断开即复原" />
    </AbsoluteFill>
  );
};
