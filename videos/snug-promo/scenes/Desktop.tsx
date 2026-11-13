import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, outQuint } from "../../../engine/motion";
import { Keyboard, KB_TOP, PC_TAB, PcKeyboard, pcKeyPos } from "../components/keyboard";
import { FRONT } from "../components/mac";
import { DISPLAY_H, DISPLAY_TOP, Phone, TOOLBAR_TOP, Touch } from "../components/phone";
import { press01 } from "../components/snug";
import { Hero, HOME, Note } from "../components/stage";
import { taskAt } from "../components/story";
import { contentHeight, layout, LINE_H, Terminal } from "../components/terminal";
import { DESK_K, FIT, mixView, screenToDesk, UUOriginal, type DeskView } from "../components/uu";
import { b, local } from "../theme";

// 落差，照实演、不带情绪：UU远程 把整台 Mac 原样搬上手机，操作方式也是电脑的那一套。同一台手机上连着三个动作：
// ① 整块桌面缩在屏里，双指张开放大才看得清；② 单指一滑是鼠标拖拽，选中一片字；换双指滑，才是滚动；
// ③ 想拷贝选中的字：点「键盘」→ 切到「电脑键盘」→ 勾「组合键模式」→ 按 ⌘ → 按 C。
// 电脑键盘的排布照公开测评里的实机截图（见 components/keyboard.tsx）。镜头不动，放大是 UU 自己在屏里放大。
const START = 16;
const at = local(START);
const SIZE = 13;
const TERM_W = FRONT.w;
const TERM_H = FRONT.h - 33;
const LH = SIZE * LINE_H;
/** 终端第一排字的顶（桌面点）：窗口顶 + 标题栏 33 + 内边距 14 */
const LINE0 = FRONT.y + 33 + 14;
const MID = DISPLAY_TOP + DISPLAY_H / 2;
// 放大以后对着 Ghostty 窗口左半边的正文；键盘弹起来时 UU 把画面往上推
const ZOOM: DeskView = { z: 3.6, fx: FRONT.x + 210, fy: FRONT.y + 430, sy: MID };
const ZOOM_KB: DeskView = { ...ZOOM, sy: 330 };

const PINCH = at(1);
const SWIPE1 = at(6.5);
const SWIPE2 = at(10);
const KB_TAP = at(13.5);
const TAB_TAP = at(15);
const COMBO_TAP = at(16.5);
const CMD_TAP = at(18);
const C_TAP = at(19.5);

export const Desktop: React.FC = () => {
  const f = useCurrentFrame();
  const lines = taskAt(b(START) + f);
  const zoom = interpolate(f, [PINCH + 2, PINCH + 30], [0, 1], { ...clamp, easing: inOutQuint });
  const kb = interpolate(f, [KB_TAP + 4, KB_TAP + 16], [0, 1], { ...clamp, easing: outExpo });
  const view = mixView(mixView(FIT, ZOOM, zoom), ZOOM_KB, kb);
  // 双指滚动：内容跟着手指往下走 160 点（换算成桌面点），往回翻
  const scroll = -interpolate(f, [SWIPE2, SWIPE2 + 18], [0, 160 / (DESK_K * ZOOM.z)], { ...clamp, easing: outQuint });

  // 单指一滑被当成鼠标拖拽：从按下那排选到手指松开那排（排号按松手那一刻的内容算，之后不跟着变）
  const y1 = interpolate(f, [SWIPE1, SWIPE1 + 16], [330, 470], { ...clamp, easing: outQuint });
  const rowAt = (sy: number, at: number) => {
    const off = Math.max(0, contentHeight(layout(taskAt(b(START) + at), SIZE, TERM_W)) - TERM_H);
    return Math.floor((screenToDesk(ZOOM, 140, sy).y - LINE0 + off) / LH);
  };
  const r0 = rowAt(330, SWIPE1 + 16);
  const r1 = rowAt(Math.max(330, f < SWIPE1 + 16 ? y1 : 470), SWIPE1 + 16);
  // 拷贝那一下，选区闪一下
  const flash = interpolate(f, [C_TAP + 2, C_TAP + 8, C_TAP + 16], [0, 1, 0], clamp);
  const selRows: [number, number] | undefined = f >= SWIPE1 + 2 ? [Math.min(r0, r1), Math.max(r0, r1)] : undefined;

  const pc = f >= TAB_TAP + 2;
  const combo = f >= COMBO_TAP + 2;
  const held = f >= CMD_TAP + 2 && f < C_TAP + 12 ? ["CMD"] : [];
  const pressed = f >= COMBO_TAP && f < COMBO_TAP + 8 ? "COMBO" : f >= CMD_TAP && f < CMD_TAP + 8 ? "CMD" : f >= C_TAP && f < C_TAP + 8 ? "C" : null;

  const tap = (x: number, y: number, t: number) => <Touch x={x} y={y} press={press01(f, t)} show={interpolate(f, [t - 10, t - 2, t + 8, t + 14], [0, 1, 1, 0], clamp)} />;
  const spread = interpolate(f, [PINCH, PINCH + 24], [18, 96], { ...clamp, easing: outQuint });
  const pinchShow = interpolate(f, [PINCH - 8, PINCH, PINCH + 26, PINCH + 34], [0, 1, 1, 0], clamp);
  const y2 = interpolate(f, [SWIPE2, SWIPE2 + 18], [300, 460], { ...clamp, easing: outQuint });
  const swipe2Show = interpolate(f, [SWIPE2 - 6, SWIPE2, SWIPE2 + 22, SWIPE2 + 30], [0, 1, 1, 0], clamp);
  const combo1 = pcKeyPos("COMBO")!;
  const cmd = pcKeyPos("CMD")!;
  const c = pcKeyPos("C")!;
  return (
    <AbsoluteFill>
      <Phone x={HOME.x} y={HOME.y} scale={HOME.s * 1.05}>
        <UUOriginal
          view={view}
          front={<Terminal lines={lines} size={SIZE} width={TERM_W} height={TERM_H} anchor="bottom" scroll={scroll} selRows={selRows} selColor={`rgba(30,110,255,${0.55 + 0.4 * flash})`} />}
        />
        {pc ? <PcKeyboard show={1} combo={combo} held={held} pressed={pressed} /> : <Keyboard show={kb} />}
        {/* ① 双指张开 */}
        <Touch x={220 - spread * 0.8} y={MID + spread * 0.6} press={1} show={pinchShow} />
        <Touch x={220 + spread * 0.8} y={MID - spread * 0.6} press={1} show={pinchShow} />
        {/* ② 单指往下一滑，再换双指往下滑 */}
        <Touch x={140} y={y1} press={f >= SWIPE1 && f < SWIPE1 + 24 ? 1 : 0} show={interpolate(f, [SWIPE1 - 4, SWIPE1, SWIPE1 + 24, SWIPE1 + 32], [0, 1, 1, 0], clamp)} />
        <Touch x={150} y={y2} press={1} show={swipe2Show} />
        <Touch x={250} y={y2 + 10} press={1} show={swipe2Show} />
        {/* ③ 键盘 → 电脑键盘 → 组合键模式 → ⌘ → C */}
        {tap(275, TOOLBAR_TOP + 27, KB_TAP)}
        {tap(PC_TAB.x, KB_TOP + PC_TAB.y, TAB_TAP)}
        {tap(combo1.x, KB_TOP + combo1.y, COMBO_TAP)}
        {tap(cmd.x, KB_TOP + cmd.y, CMD_TAP)}
        {tap(c.x, KB_TOP + c.y, C_TAP)}
      </Phone>
      <Hero at={6} until={at(24) - 6} title="BUILT FOR DESKTOP" sub="桌面尺度 · 触控板手势" />
      <Note at={PINCH} until={SWIPE1 - 10} text="双指 · 放大" y={500} />
      <Note at={SWIPE1} until={SWIPE2 - 10} text="单指 · 拖选" y={500} />
      <Note at={SWIPE2} until={KB_TAP - 10} text="双指 · 滚动" y={500} />
      <Note at={KB_TAP} until={at(24) - 6} text="电脑键盘 · ⌘C 拷贝" y={500} />
    </AbsoluteFill>
  );
};
