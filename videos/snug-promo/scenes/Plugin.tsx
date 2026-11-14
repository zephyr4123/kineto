import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { SafariApp } from "../components/apps";
import { BACK, DW, FRONT, MacBook, MacDesktop, type Rect } from "../components/mac";
import { Phone } from "../components/phone";
import { Hero } from "../components/stage";
import { TASK_DONE } from "../components/story";
import { Terminal } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { C, local, ZH } from "../theme";
import { PLUGIN_PHONE } from "./Browser";

// 插件本分：Mac 端零操作，Snug 常驻菜单栏，连上就用。MacBook 升上来，手机缩在下面连着，屏上还是刚才那页 GitHub
// （Safari 这会儿在 Snug 手机屏上，所以 Mac 桌面上没有它）。
// 断开即复原：第 10 拍音乐静音一拍，手机在这一拍断开退下，手机屏移除；声音回来时 Safari 从右边回到原来的位置。
const START = 140;
const at = local(START);
const SCREEN_W = 940;
const K = SCREEN_W / DW;
const LEFT = (1080 - SCREEN_W) / 2;
const TOP = 640;

export const Plugin: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: outExpo });
  const pulse = interpolate(f % 56, [0, 56], [0, 1]);
  const off = interpolate(f, [at(10), at(10) + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const back = interpolate(f, [at(11), at(13)], [0, 1], { ...clamp, easing: inOutQuint });
  // Safari 从右边（手机屏那块虚拟屏）回到原位
  const rect: Rect = { x: BACK.x + (DW + 40 - BACK.x) * (1 - back), y: BACK.y, w: BACK.w, h: BACK.h };
  const push = interpolate(f, [0, at(10)], [0, 1], clamp);
  const menuIcon = (
    <div style={{ position: "absolute", left: DW - 330, top: 2, width: 22, height: 22 }}>
      <Img src={staticFile(assets.snugIcon)} style={{ width: 22, height: 22 }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.04 * push})`, transformOrigin: "50% 60%" }}>
      <div style={{ opacity: on, transform: `translateY(${(1 - on) * 60}px)` }}>
        <MacBook left={LEFT} top={TOP} width={SCREEN_W}>
          <MacDesktop front={<Terminal lines={TASK_DONE} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} backRect={rect} menuIcon={menuIcon} />
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
        <Phone x={PLUGIN_PHONE.x} y={PLUGIN_PHONE.y} scale={PLUGIN_PHONE.s} glow={0.6}>
          <UUSnug>
            <SafariApp page="repo" scroll={700} />
          </UUSnug>
        </Phone>
      </div>
      {off > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1380, textAlign: "center", fontFamily: ZH, fontWeight: 700, fontSize: 40, color: C.ink2, opacity: back }}>
          窗口归位 · 手机屏移除
        </div>
      ) : null}
      <Hero at={2} until={at(10) - 6} title="ZERO SETUP" sub="Mac 端 · 零操作" />
      <Hero at={at(10)} until={at(16) - 6} title="AUTO RESTORE" sub="断开即复原" />
    </AbsoluteFill>
  );
};
