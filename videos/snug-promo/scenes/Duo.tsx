import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, outQuint } from "../../../engine/motion";
import { BODY_Y, GHOSTTY_BODY, GhosttyApp } from "../components/apps";
import { Chip, Smear, speed } from "../components/fx";
import { flick, HOLD, holdRing } from "../components/gesture";
import { ImeKeyboardLand, KB_CLOSE_L, LKB_H, LKB_TOP, PC_TAB_L, pcKeyPos, PcKeyboard } from "../components/keyboard";
import { BACK, FRONT, MacDesktop, MacWindow, MH, MissionControl, MW, toPhone, type McItem, type Rect } from "../components/mac";
import { ContextMenu, CTX_H, CTX_W } from "../components/menu";
import { Landscape as Land, Phone, Touch } from "../components/phone";
import { OTHERS, press01, switching, SWITCH, WIN } from "../components/snug";
import { Hero } from "../components/stage";
import { SHELL_IDLE, TASK_DONE, TASK_GESTURE_LINE } from "../components/story";
import { cellPos, contentHeight, layout, LINE_H, Terminal, type Line, type Sel } from "../components/terminal";
import { FIT_L, landToScreen, lTool, screenToLand, UULandscape, UUSnug, type LandView } from "../components/uu";
import { local, SF } from "../theme";
import { DUO_BOTTOM } from "./Native";

// 并排对照：上面是原版 UU远程（只能横过来用），下面是搭配 Snug 的竖屏。同一个动作两台同时做，结果一眼对比：
// ① 单指往下一滑：原版是鼠标拖拽、选中一片；Snug 是滚动，再一滑回到底。
// ② 拷贝一段字：原版拖选一行 → 点「键盘」→ 切「电脑键盘」→ 勾「组合键模式」→ 按 ⌘ → 按 C；Snug 长按拖选 → 长按 → 点「Copy」，早早做完。
// ③ 换个窗口：原版点「展开所有窗口」，在 Mac 的调度中心里一个个缩略图找；Snug 点底部横条，窗口列表里轻点即开。
// 两台手机中间两行标签，各写这一下的过程。最后上面那台翻走，下面那台升到正中，引出「任意窗口」。
const START = 60;
const at = local(START);
const TOP = { x: 540, y: 540, s: 0.92 };
const BOT = DUO_BOTTOM;
const HOME = { x: 540, y: 1228, s: 1.27 };

// —— 上面：原版横屏里的终端 ——
const T_SIZE = 13;
const T_LH = T_SIZE * LINE_H;
const T_H = FRONT.h - 33;
const T_LINE0 = FRONT.y + 33 + 14;
const T_OFF = Math.max(0, contentHeight(layout(TASK_DONE, T_SIZE, FRONT.w)) - T_H);
/** 横屏屏幕上 y 处是终端的第几排（按不放大、不推上去的桌面算） */
const tRow = (v: LandView, sy: number) => Math.floor((screenToLand(v, 300, sy).y - T_LINE0 + T_OFF) / T_LH);

// —— 下面：Snug 手机屏里的同一个终端 ——
const S_SIZE = 17;
const S_LAY = layout(TASK_DONE, S_SIZE, MW);
const S_OFF = Math.max(0, contentHeight(S_LAY) - GHOSTTY_BODY);
const sPos = (line: number, col: number) => {
  const p = cellPos(S_LAY, line, col);
  return { x: p.x, y: BODY_Y + p.y - S_OFF };
};
const G_LINE = TASK_GESTURE_LINE;
const G_TEXT = (TASK_DONE[G_LINE] as { t: string }[]).map((x) => x.t).join("");
const FROM = { line: G_LINE, col: [...G_TEXT.slice(0, G_TEXT.indexOf("单指"))].length };
const TO = { line: G_LINE, col: [...G_TEXT.slice(0, G_TEXT.indexOf("判定为选字") + 5)].length };
const sel = (end: number): Sel[] => [{ line: G_LINE, from: FROM.col, to: end }];

// —— 调度中心里的四个窗口 ——
const SHELL_RECT: Rect = { x: 300, y: 210, w: 760, h: 480 };
const MC_SHELL: Rect = { x: 190, y: 590, w: 480, h: 303 };
const shellTerm = (lines: readonly Line[], cursor = false) => <Terminal lines={lines} size={13} width={760} height={447} cursor={cursor} />;
const MC_ITEMS: McItem[] = [
  { from: FRONT, to: { x: 150, y: 120, w: 540, h: 420 }, w: FRONT.w, h: FRONT.h, node: <MacWindow w={FRONT.w} h={FRONT.h} title="✳ 项目目录结构"><Terminal lines={TASK_DONE} size={13} width={FRONT.w} height={T_H} anchor="bottom" /></MacWindow> },
  { from: BACK, to: { x: 800, y: 150, w: 520, h: 406 }, w: BACK.w, h: BACK.h, node: <MacWindow w={BACK.w} h={BACK.h} title="github.com/zephyr4123/snug"><div style={{ padding: 30 }}><div style={{ width: 260, height: 22, borderRadius: 4, background: "#0969da", opacity: 0.6 }} />{Array.from({ length: 14 }, (_, i) => <div key={i} style={{ marginTop: 18, width: `${60 + ((i * 37) % 35)}%`, height: 12, borderRadius: 3, background: "#d0d7de" }} />)}</div></MacWindow> },
  { from: SHELL_RECT, to: MC_SHELL, w: SHELL_RECT.w, h: SHELL_RECT.h, node: <MacWindow w={SHELL_RECT.w} h={SHELL_RECT.h} title={WIN.shell.title}>{shellTerm(SHELL_IDLE)}</MacWindow> },
  { from: { x: 600, y: 300, w: 800, h: 560 }, to: { x: 820, y: 600, w: 470, h: 329 }, w: 800, h: 560, node: <MacWindow w={800} h={560} title="ChatGPT"><div style={{ paddingTop: 200, textAlign: "center", fontFamily: SF, fontSize: 30, color: "#0d0d0d" }}>What can I help with?</div></MacWindow> },
];
const centerOf = (r: Rect) => landToScreen(FIT_L, r.x + r.w / 2, r.y + r.h / 2);

// 时间（帧）
const A1 = at(1.4);
const A2 = at(3.9);
const B_SEL = at(6.3);
const B_KB = at(7.4);
const B_TAB = at(8.4);
const B_COMBO = at(9.3);
const B_CMD = at(10.2);
const B_C = at(11.1);
const B_CLOSE = at(14.6);
const S_DOWN = at(6.3);
const S_MENU = at(8.2);
const S_UP = S_MENU + HOLD + 2;
const S_COPY = S_UP + 30;
const C_ALL = at(16.4);
const C_PICK = at(19.2);
const C_BAR = at(16.4);
const EXIT = at(22.4);

const tap = (f: number, x: number, y: number, t: number) => <Touch x={x} y={y} press={press01(f, t)} show={interpolate(f, [t - 10, t - 2, t + 8, t + 14], [0, 1, 1, 0], clamp)} />;

export const Duo: React.FC = () => {
  const f = useCurrentFrame();

  // —— 机位 ——
  const enterAt = (t: number) => interpolate(t, [0, 20], [0, 1], { ...clamp, easing: outExpo });
  const exitAt = (t: number) => interpolate(t, [EXIT, EXIT + 26], [0, 1], { ...clamp, easing: inOutQuint });
  const topY = (t: number) => -420 + (TOP.y + 420) * enterAt(t) - (TOP.y + 760) * exitAt(t);
  const enter = enterAt(f);
  const exit = exitAt(f);
  const rise = interpolate(f, [at(23), at(25.4)], [0, 1], { ...clamp, easing: inOutQuint });
  const bot = { x: BOT.x, y: BOT.y + (HOME.y - BOT.y) * rise, s: BOT.s + (HOME.s - BOT.s) * rise };

  // —— 上面：原版 ——
  const kbUp = interpolate(f, [B_KB + 3, B_KB + 13], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [B_CLOSE + 3, B_CLOSE + 13], [0, 1], { ...clamp, easing: outExpo }));
  // 键盘升起，UU 把画面往上推：桌面底边贴着键盘顶
  const view: LandView = { ...FIT_L, sy: FIT_L.sy - LKB_H * kbUp };
  const swipeY = interpolate(f, [A1, A1 + 14], [150, 216], { ...clamp, easing: outQuint });
  const selX = interpolate(f, [B_SEL, B_SEL + 14], [212, 300], { ...clamp, easing: outQuint });
  const ROW_Y = 250;
  let selRows: [number, number] | undefined;
  if (f >= A1 + 2 && f < at(5.6)) selRows = [tRow(FIT_L, 150), tRow(FIT_L, swipeY)];
  if (f >= B_SEL + 2 && f < C_ALL) selRows = [tRow(FIT_L, ROW_Y), tRow(FIT_L, ROW_Y + 3)];
  const flashC = interpolate(f, [B_C + 2, B_C + 8, B_C + 16], [0, 1, 0], clamp);
  const ime = f >= B_KB && f < B_TAB + 2;
  const pc = f >= B_TAB + 2;
  const combo = f >= B_COMBO + 2;
  const held = f >= B_CMD + 2 && f < B_C + 12 ? ["CMD"] : [];
  const pressed = f >= B_COMBO && f < B_COMBO + 8 ? "COMBO" : f >= B_CMD && f < B_CMD + 8 ? "CMD" : f >= B_C && f < B_C + 8 ? "C" : null;
  const kbNode = kbUp > 0 ? ime ? <ImeKeyboardLand show={kbUp} /> : pc ? <PcKeyboard land show={kbUp} combo={combo} held={held} pressed={pressed} /> : null : null;
  const mc = interpolate(f, [C_ALL + 4, C_ALL + 20], [0, 1], { ...clamp, easing: inOutQuint });
  const pick = interpolate(f, [C_PICK + 3, C_PICK + 19], [0, 1], { ...clamp, easing: inOutQuint });
  const picked = f >= C_PICK + 19;
  const term = <Terminal lines={TASK_DONE} size={T_SIZE} width={FRONT.w} height={T_H} anchor="bottom" selRows={selRows} selColor={`rgba(30,110,255,${0.5 + 0.45 * flashC})`} />;
  const items = MC_ITEMS.map((it, i) => (i === 2 && pick > 0 ? { ...it, from: SHELL_RECT, to: { ...MC_SHELL, x: MC_SHELL.x + (SHELL_RECT.x - MC_SHELL.x) * pick, y: MC_SHELL.y + (SHELL_RECT.y - MC_SHELL.y) * pick, w: MC_SHELL.w + (SHELL_RECT.w - MC_SHELL.w) * pick } } : it));
  const desk = picked ? (
    <MacDesktop front={shellTerm(SHELL_IDLE, true)} frontRect={SHELL_RECT} frontTitle={WIN.shell.title} />
  ) : mc > 0 ? (
    <MissionControl p={mc} items={items} />
  ) : (
    <MacDesktop front={term} />
  );
  // 调度中心里手指先停在 Safari 上，再挪到那个 shell 窗口
  const safariC = centerOf({ x: 800, y: 150, w: 520, h: 406 });
  const shellC = centerOf(MC_SHELL);
  const hunt = { x: interpolate(f, [C_ALL + 22, at(17.9), at(18.3), C_PICK - 2], [lTool("all").x, safariC.x, safariC.x, shellC.x], { ...clamp, easing: inOutQuint }), y: interpolate(f, [C_ALL + 22, at(17.9), at(18.3), C_PICK - 2], [lTool("all").y, safariC.y, safariC.y, shellC.y], { ...clamp, easing: inOutQuint }) };
  const huntShow = interpolate(f, [C_ALL + 16, C_ALL + 22, C_PICK + 8, C_PICK + 14], [0, 1, 1, 0], clamp);
  const pcTab = { x: PC_TAB_L.x, y: LKB_TOP + PC_TAB_L.y };
  const comboK = pcKeyPos("COMBO", true)!;
  const cmdK = pcKeyPos("CMD", true)!;
  const cK = pcKeyPos("C", true)!;

  // —— 下面：Snug ——
  const bScroll = -Math.max(0, Math.min(S_OFF, flick(f, A1, 10, 150) - flick(f, A2, 10, 150)));
  const fingerA = (t: number, dir: number) => ({
    y: interpolate(f, [t, t + 10], [0, 150], clamp) * dir,
    show: interpolate(f, [t - 6, t, t + 10, t + 16], [0, 1, 1, 0], clamp),
  });
  const a1 = fingerA(A1, 1);
  const a2 = fingerA(A2, -1);
  const drag0 = S_DOWN + HOLD;
  const end = Math.round(interpolate(f, [drag0, at(7.7)], [FROM.col, TO.col], { ...clamp, easing: outQuint }));
  const sSel = f >= drag0 && f < C_BAR ? sel(f < S_MENU ? end : TO.col) : undefined;
  const fpSel = sPos(G_LINE, Math.max(FROM.col, end - 1));
  const fpTo = sPos(G_LINE, TO.col - 1);
  const menuP = interpolate(f, [S_UP, S_UP + 8], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [S_COPY + 10, S_COPY + 18], [0, 1], clamp));
  const my = Math.min(fpTo.y, MH - 28 - CTX_H - 8);
  const menuX = Math.min(fpTo.x, MW - CTX_W - 8);
  const copy = toPhone(menuX + 60, my + 16);
  const shellPrev = <GhosttyApp lines={TASK_DONE} size={S_SIZE} sel={sSel} />;
  const sw = switching(f - C_BAR, { prevScreen: shellPrev, current: WIN.ghostty, others: OTHERS, target: WIN.shell });
  const fill = interpolate(f - C_BAR, [SWITCH.ENTER, SWITCH.ENTER + 8], [0, 1], { ...clamp, easing: outExpo });
  const bScreen =
    f < C_BAR ? (
      <GhosttyApp lines={TASK_DONE} size={S_SIZE} scroll={bScroll} sel={sSel}>
        {menuP > 0 ? <ContextMenu x={menuX} y={my - BODY_Y} p={menuP} hover={f >= S_COPY - 2 ? 0 : -1} /> : null}
      </GhosttyApp>
    ) : sw ? (
      sw.screen
    ) : (
      <div style={{ position: "absolute", inset: 0, opacity: fill, transform: `scale(${0.97 + 0.03 * fill})` }}>
        <GhosttyApp lines={SHELL_IDLE} title={WIN.shell.title} size={S_SIZE} cursor anchor="bottom" />
      </div>
    );

  // —— 标签 ——
  const steps = [
    [B_KB, "键盘"],
    [B_TAB, "电脑键盘"],
    [B_COMBO, "组合键模式"],
    [B_CMD, "⌘"],
    [B_C, "C"],
  ] as const;
  const shown = steps.filter(([t]) => f >= t).map(([, s]) => s);
  const rowA = 792;
  const rowB = 872;
  return (
    <AbsoluteFill>
      {/* 上面：原版横屏 */}
      <Smear id="duo-top" sx={0} sy={Math.min(24, Math.abs(speed(topY, f)) * 0.2)}>
        <Phone x={TOP.x} y={topY(f)} scale={TOP.s} rotate={-90 + 14 * (1 - enter)} tiltX={-48 * exit} bar={false}>
          <Land>
            <UULandscape desk={desk} view={view} kb={kbNode} />
            {/* ① 单指往下一滑 */}
            <Touch x={300} y={swipeY} press={1} show={interpolate(f, [A1 - 6, A1, A1 + 16, A1 + 22], [0, 1, 1, 0], clamp)} />
            {/* ② 拖选一行，再走键盘那一串 */}
            <Touch x={selX} y={ROW_Y} press={1} show={interpolate(f, [B_SEL - 6, B_SEL, B_SEL + 16, B_SEL + 22], [0, 1, 1, 0], clamp)} />
            {tap(f, lTool("kb").x, lTool("kb").y, B_KB)}
            {tap(f, pcTab.x, pcTab.y, B_TAB)}
            {tap(f, comboK.x, LKB_TOP + comboK.y, B_COMBO)}
            {tap(f, cmdK.x, LKB_TOP + cmdK.y, B_CMD)}
            {tap(f, cK.x, LKB_TOP + cK.y, B_C)}
            {tap(f, KB_CLOSE_L.x, LKB_TOP + KB_CLOSE_L.y, B_CLOSE)}
            {/* ③ 展开所有窗口，一个个找 */}
            {tap(f, lTool("all").x, lTool("all").y, C_ALL)}
            <Touch x={hunt.x} y={hunt.y} press={press01(f, C_PICK)} show={huntShow} />
          </Land>
        </Phone>
      </Smear>
      {/* 下面：Snug 竖屏 */}
      <Phone x={bot.x} y={bot.y} scale={bot.s} glow={0.25}>
        <UUSnug>{bScreen}</UUSnug>
        {/* ① 单指往下一滑，再往上一滑回到底 */}
        <Touch x={toPhone(330, 380).x} y={toPhone(330, 380 + a1.y).y} press={1} show={a1.show} />
        <Touch x={toPhone(330, 560).x} y={toPhone(330, 560 + a2.y).y} press={1} show={a2.show} />
        {/* ② 长按拖选 → 长按 → Copy */}
        <Touch x={toPhone(fpSel.x, fpSel.y).x} y={toPhone(fpSel.x, fpSel.y).y} press={1} show={interpolate(f, [S_DOWN - 6, S_DOWN, at(7.7) + 4, at(7.7) + 10], [0, 1, 1, 0], clamp)} ring={f < drag0 ? holdRing(f, S_DOWN) : 0} />
        <Touch x={toPhone(fpTo.x, fpTo.y).x} y={toPhone(fpTo.x, fpTo.y).y} press={1} show={interpolate(f, [S_MENU - 6, S_MENU, S_UP, S_UP + 6], [0, 1, 1, 0], clamp)} ring={holdRing(f, S_MENU)} />
        <Touch x={copy.x} y={copy.y} press={press01(f, S_COPY)} show={interpolate(f, [S_COPY - 14, S_COPY - 4, S_COPY + 10, S_COPY + 16], [0, 1, 1, 0], clamp)} />
        {/* ③ 横条 → 窗口列表 */}
        {sw?.finger ? <Touch x={sw.finger.x} y={sw.finger.y} press={sw.finger.press} show={sw.finger.show} /> : null}
      </Phone>
      {/* 中间两行：这一下各自怎么做 */}
      <Chip at={A1 + 8} until={at(5.6)} x={540} y={rowA} center text="原版 · 鼠标拖拽 · 误选一片" tone="dim" />
      <Chip at={A1 + 8} until={at(5.6)} x={540} y={rowB} center text="Snug · 单指滚动" tone="snug" />
      {shown.length > 0 ? <Chip at={B_KB} until={C_ALL - 6} x={540} y={rowA} center text={`原版 · ${shown.join(" → ")}`} tone="dim" size={28} /> : null}
      <Chip at={S_DOWN + 10} until={S_COPY} x={540} y={rowB} center text="Snug · 长按" tone="snug" />
      <Chip at={S_COPY} until={C_ALL - 6} x={540} y={rowB} center text="Snug · 长按 → 拷贝 · 完成" tone="snug" />
      <Chip at={C_ALL + 6} until={EXIT} x={540} y={rowA} center text="原版 · 展开所有窗口 → 逐个查找" tone="dim" />
      <Chip at={C_BAR + 6} until={EXIT} x={540} y={rowB} center text="Snug · 横条 → 窗口列表 → 轻点即开" tone="snug" />
      <Hero at={6} until={at(6) - 4} y={70} size={110} subSize={44} backing={false} title="NATIVE SCROLL" sub="同一手势 · 两种结果" />
      <Hero at={at(6)} until={C_ALL - 4} y={70} size={110} subSize={44} backing={false} title="NATIVE COPY" sub="长按 · 拷贝" />
      <Hero at={C_ALL} until={EXIT} y={70} size={110} subSize={44} backing={false} title="NATIVE SWITCH" sub="窗口列表 · 轻点即开" />
      <Hero at={at(24.6)} title="ANY WINDOW" sub="终端 · App · 浏览器" />
    </AbsoluteFill>
  );
};
