import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { SafariApp } from "../components/apps";
import { Steps } from "../components/compare";
import { Callout, Shock } from "../components/fx";
import { BACK, DH, DW, FRONT, MacBook, MacDesktop, Pointer, type Rect } from "../components/mac";
import { Phone } from "../components/phone";
import { Headline } from "../components/stage";
import { TASK_DONE } from "../components/story";
import { Terminal } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { PhoneGlyph, WELCOME_DONE, WELCOME_GRANT, WELCOME_H, WELCOME_W, WelcomeWindow } from "../components/welcome";
import { C, local } from "../theme";
import { BOX_HANDOFF_BEAT, BOX_ICON } from "./BoxCard";
import { PLUGIN_PHONE } from "./Browser";

// 开箱即用（照 snug 仓库 README 的「安装」：下载、拖进应用程序打开、按欢迎页授权，之后常驻菜单栏、无需任何操作）：
// 开头是第四章的章节卡（BoxCard，盖在这一段前 2.4 拍上），卡褪掉时 MacBook 从下面升上来，手机缩在下面连着；
// 卡里的 Snug 图标落进 Mac 屏幕、打开成欢迎页，镜头推近；光标点「授权」，那一行变绿「已授权」，
// 再点「完成」，窗口收进菜单栏的 iPhone 图标里，镜头拉回。顶上三步标签跟着一步步弹出：下载安装 · 开启权限 · 此后无需操作。
// 断开即复原：第 10 拍音乐静音一拍，手机在这一拍断开退下，手机屏移除；声音回来时 Safari 从右边回到原来的位置，一支箭头指着它。
const START = 156;
const at = local(START);
const SCREEN_W = 940;
const K = SCREEN_W / DW;
const LEFT = (1080 - SCREEN_W) / 2;
const TOP = 640;
/** 菜单栏里 Snug 图标的中心（桌面点、画面坐标） */
const MENU_DESK = { x: DW - 319, y: 13 };
const MENU_ICON = { x: LEFT + MENU_DESK.x * K, y: TOP + MENU_DESK.y * K };
const SAFARI_AT = { x: LEFT + (BACK.x + BACK.w * 0.6) * K, y: TOP + (BACK.y + BACK.h * 0.75) * K };
/** 欢迎页在桌面上的位置：居中略偏上（NSWindow.center() 的摆法） */
const WIN = { x: (DW - WELCOME_W) / 2, y: (DH - WELCOME_H) / 2 - 40 };
const WIN_C = { x: LEFT + (WIN.x + WELCOME_W / 2) * K, y: TOP + (WIN.y + WELCOME_H / 2) * K };
const ZOOM = 2.4;

/** 章节卡交接：图标从卡里的位置飞进 Mac 屏幕 */
const DROP = at(BOX_HANDOFF_BEAT);
const LAUNCH = at(3.4);
const GRANT = at(5);
const DONE = at(6.3);
const OFF = at(10);

export const Plugin: React.FC = () => {
  const f = useCurrentFrame();
  const on = interpolate(f, [DROP - 12, DROP + 4], [0, 1], { ...clamp, easing: outExpo });
  const off = interpolate(f, [OFF, OFF + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const back = interpolate(f, [at(11), at(13)], [0, 1], { ...clamp, easing: inOutQuint });
  // Safari 从右边（手机屏那块虚拟屏）回到原位
  const rect: Rect = { x: BACK.x + (DW + 40 - BACK.x) * (1 - back), y: BACK.y, w: BACK.w, h: BACK.h };

  // 图标从章节卡里的位置落进 Mac 屏幕，再打开成欢迎页
  const drop = interpolate(f, [DROP, DROP + 18], [0, 1], { ...clamp, easing: inOutQuint });
  const launch = interpolate(f, [LAUNCH, LAUNCH + 12], [0, 1], { ...clamp, easing: outExpo });
  const iconX = BOX_ICON.x + (WIN_C.x - BOX_ICON.x) * drop;
  const iconY = BOX_ICON.y + (WIN_C.y - BOX_ICON.y) * drop;
  const iconS = (BOX_ICON.size + (220 - BOX_ICON.size) * drop) * (1 - 0.7 * launch);
  // 欢迎页：打开时从小放大；点「完成」后缩进菜单栏图标
  const granted = interpolate(f, [GRANT + 6, GRANT + 14], [0, 1], clamp);
  const close = interpolate(f, [DONE + 6, DONE + 24], [0, 1], { ...clamp, easing: inOutQuint });
  const winScale = (0.6 + 0.4 * launch) * (1 - 0.9 * close);
  const winOpen = f >= LAUNCH && close < 1;
  const toMenu = { x: (MENU_DESK.x - (WIN.x + WELCOME_W / 2)) * close, y: (MENU_DESK.y - (WIN.y + WELCOME_H / 2)) * close };
  // 光标：从右下进来，点「授权」，再点「完成」
  // 箭头尖停在按钮右下角，不挡按钮上的字
  const grantPt = { x: WIN.x + WELCOME_GRANT.x + 14, y: WIN.y + WELCOME_GRANT.y + 8 };
  const donePt = { x: WIN.x + WELCOME_DONE.x + 14, y: WIN.y + WELCOME_DONE.y + 8 };
  const ptT = [LAUNCH + 8, GRANT - 4, GRANT + 16, DONE - 4];
  const ptr = {
    x: interpolate(f, ptT, [DW - 260, grantPt.x, grantPt.x, donePt.x], { ...clamp, easing: inOutQuint }),
    y: interpolate(f, ptT, [DH - 160, grantPt.y, grantPt.y, donePt.y], { ...clamp, easing: inOutQuint }),
  };
  const down = (t: number) => interpolate(f, [t - 2, t, t + 6], [0, 1, 0], clamp);

  // 镜头：欢迎页打开时推近到窗口，关掉后拉回；之后慢慢往前推一点
  const zoom = 1 + (ZOOM - 1) * interpolate(f, [LAUNCH, LAUNCH + 24], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [DONE + 8, DONE + 38], [0, 1], { ...clamp, easing: inOutQuint }));
  const push = 1 + 0.04 * interpolate(f, [DONE + 38, OFF], [0, 1], clamp);
  /** 镜头推拉以后，画面上 p 那一点实际在哪（标注的箭头跟着它） */
  const cam = (p: { x: number; y: number }) => ({ x: WIN_C.x + (p.x - WIN_C.x) * zoom * push, y: WIN_C.y + (p.y - WIN_C.y) * zoom * push });
  const menuAt = cam(MENU_ICON);
  const safariAt = cam(SAFARI_AT);
  // 窗口收进菜单栏以后，图标外面一圈光一下下漾开
  const ring = f >= DONE + 22 ? ((f - DONE - 22) % 56) / 56 : -1;

  const menuIcon = (
    <div style={{ position: "absolute", left: MENU_DESK.x - 11, top: 2, width: 22, height: 22 }}>
      <PhoneGlyph size={22} color="#eee" />
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom * push})`, transformOrigin: `${WIN_C.x}px ${WIN_C.y}px` }}>
        <div style={{ opacity: on, transform: `translateY(${(1 - on) * 60}px)` }}>
          <MacBook left={LEFT} top={TOP} width={SCREEN_W}>
            <MacDesktop front={<Terminal lines={TASK_DONE} size={13} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} backRect={rect} menuIcon={menuIcon} />
            {winOpen ? (
              <div style={{ position: "absolute", left: WIN.x, top: WIN.y, opacity: Math.min(launch * 1.5, 1) * (1 - close), transform: `translate(${toMenu.x}px, ${toMenu.y}px) scale(${winScale})` }}>
                <WelcomeWindow granted={granted} grantPress={down(GRANT)} donePress={down(DONE)} />
              </div>
            ) : null}
            {f >= LAUNCH + 8 && f < DONE + 10 ? <Pointer x={ptr.x} y={ptr.y} down={down(GRANT) + down(DONE)} /> : null}
          </MacBook>
          {ring >= 0 ? <div style={{ position: "absolute", left: MENU_ICON.x - 30, top: MENU_ICON.y - 30, width: 60, height: 60, borderRadius: 30, border: `3px solid rgba(31,99,255,${(1 - ring) * (1 - off)})`, transform: `scale(${0.6 + 0.8 * ring})` }} /> : null}
        </div>
        {/* 连着的手机，跟 MacBook 一起升上来，断开时往下退掉 */}
        <div style={{ opacity: on * (1 - off), transform: `translateY(${off * 160 + (1 - on) * 60}px)` }}>
          <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
            <path d="M 540 1260 L 540 1330" stroke={C.blue} strokeWidth="5" strokeDasharray="10 10" strokeDashoffset={-f} />
          </svg>
          <Phone x={PLUGIN_PHONE.x} y={PLUGIN_PHONE.y} scale={PLUGIN_PHONE.s} glow={0.6}>
            <UUSnug>
              <SafariApp page="repo" scroll={700} />
            </UUSnug>
          </Phone>
        </div>
      </div>
      {/* Snug 的图标落进屏幕，打开成欢迎页 */}
      {f >= DROP && launch < 1 ? (
        <Img src={staticFile(assets.snugIcon)} style={{ position: "absolute", left: iconX - iconS / 2, top: iconY - iconS / 2, width: iconS, height: iconS, opacity: 1 - launch, filter: "drop-shadow(0 26px 50px rgba(20,50,120,0.35))" }} />
      ) : null}
      <Shock at={DROP + 16} x={WIN_C.x} y={WIN_C.y} size={900} />
      <Steps
        items={[
          { at: DROP, text: "下载安装" },
          { at: GRANT, text: "开启权限" },
          { at: DONE + 20, text: "此后无需操作" },
        ]}
        until={OFF - 6}
        x={40}
        y={190}
        w={1000}
        size={46}
      />
      <Callout at={DONE + 36} until={OFF} x={menuAt.x} y={menuAt.y + 16} tx={menuAt.x - 60} ty={TOP - 40} side="up" text="常驻菜单栏" bend={-0.15} />
      <Callout at={at(12.6)} until={at(16) - 6} x={safariAt.x} y={safariAt.y} tx={760} ty={1380} side="down" text="窗口归位" bend={0.15} />
      <Headline at={OFF} until={at(16) - 6} title="断开即复原" sub="窗口归位 · 字号复原" />
    </AbsoluteFill>
  );
};
