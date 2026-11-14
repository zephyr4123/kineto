import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, outQuint } from "../../../engine/motion";
import { BODY_Y, GHOSTTY_BODY, GhosttyApp } from "../components/apps";
import { Steps, Toggle } from "../components/compare";
import { Callout, Flash, Shock, Smear, Sweep } from "../components/fx";
import { flick, HOLD, holdRing } from "../components/gesture";
import { ImeKeyboardLand, LKB_H, LKB_TOP, PC_TAB_L, pcKeyPos, PcKeyboard } from "../components/keyboard";
import { BACK, FRONT, MacDesktop, MacWindow, MH, MissionControl, MW, toPhone, type McItem, type Rect } from "../components/mac";
import { ContextMenu, CTX_H, CTX_W } from "../components/menu";
import { Landscape as Land, onStage, onStageL, Phone, Touch } from "../components/phone";
import { OTHERS, press01, switching, SWITCH, WIN } from "../components/snug";
import { Headline } from "../components/stage";
import { SHELL_IDLE, TASK_DONE, TASK_GESTURE_LINE } from "../components/story";
import { cellPos, contentHeight, layout, LINE_H, Terminal, type Line, type Sel } from "../components/terminal";
import { FIT_L, LAND_K, landToScreen, lTool, screenToLand, UULandscape, UUSnug, type LandView } from "../components/uu";
import { local, SF } from "../theme";
import { DUO_SNUG } from "./Native";

// 手势对照：三个动作，每个都先演原版、再拨到 Snug。顶上一个分段开关「UU远程 原版 | Snug」，拨到哪边手机就变成哪边：
// 原版是横屏的 UU远程（竖屏太空，只能横过来用），Snug 是竖屏。主标题跟着开关换，原版一句「同 Mac 的什么」，Snug 一句「同 iPhone」。
// 前两个动作属于第一章「原生手势」（章节卡 GesturesCard 盖在这一段之前），第三个属于第二章「流转自如」（SwitchCard 盖在第 20–24 拍）：
// ① 滚动：原版双指拖动才滚（同触控板）；Snug 单指一划就滚。
// ② 拷贝：原版拖选一行 → 键盘 → 电脑键盘 → 组合键模式 → ⌘ → C，步骤标签一步步弹出来；Snug 长按拖选 → 右键菜单 → 拷贝。
//    Snug 长按落在歌里静音的那一拍（片子第 78 拍），按住时没声音，开始拖选时鼓声回来。
// ③ 切窗口：原版点「展开所有窗口」，在调度中心的缩略图里逐个辨认；Snug 点底部指示条，窗口列表里轻点即开。
// 这一段结束时第三章的章节卡（WindowsCard）从上面盖下来。
const START = 64;
const at = local(START);
const SNUG = DUO_SNUG;
const LAND = { x: 540, y: 1090, s: 0.98 };
const HL_Y = 150;
const TOGGLE_Y = 476;

// —— 横屏原版里的终端 ——
const T_SIZE = 13;
const T_LH = T_SIZE * LINE_H;
const T_H = FRONT.h - 33;
const T_LINE0 = FRONT.y + 33 + 14;
const T_OFF = Math.max(0, contentHeight(layout(TASK_DONE, T_SIZE, FRONT.w)) - T_H);
/** 横屏屏幕上 y 处是终端的第几排（按不放大、不推上去的桌面算） */
const tRow = (v: LandView, sy: number) => Math.floor((screenToLand(v, 300, sy).y - T_LINE0 + T_OFF) / T_LH);

// —— Snug 手机屏里的同一个终端 ——
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

// —— 时间（帧）——
// 开关拨回原版、拨到 Snug 的时刻；手机跟着转（MORPH 帧），开关滑块快一点（FLIP 帧）
const P1 = at(0.5);
const P1_SNUG = at(3);
const P2 = at(8);
const P2_SNUG = at(13.4);
/** 第二章的章节卡盖上来的那一拍（卡进场要十几帧，这之后前两个动作的字可以撤了） */
const CARD2 = at(20);
const P3 = at(24.5);
const P3_SNUG = at(27.6);
const FLIPS: readonly (readonly [number, number])[] = [
  [P1, 0],
  [P1_SNUG, 1],
  [P2, 0],
  [P2_SNUG, 1],
  [P3, 0],
  [P3_SNUG, 1],
];
const MORPH = 22;
const FLIP = 14;
/** 第 t 帧开关在哪（0 原版，1 Snug）：一开始在 Snug（接着上一场），每次拨动用 len 帧走完 */
const toggleAt = (t: number, len: number) =>
  FLIPS.reduce((v, [t0, to]) => (t >= t0 ? v + (to - v) * interpolate(t, [t0, t0 + len], [0, 1], { ...clamp, easing: inOutQuint }) : v), 1);

// ① 滚动
const TWO = at(1.2);
const ONE_DOWN = at(4.2);
const ONE_UP = at(6.1);
// ② 拷贝：原版
const B_SEL = at(9.1);
const B_KB = at(10);
const B_TAB = at(10.7);
const B_COMBO = at(11.4);
const B_CMD = at(12.1);
const B_C = at(12.8);
// ② 拷贝：Snug
const S_DOWN = at(14.2);
const S_DRAG = S_DOWN + HOLD;
const S_MENU = at(15.8);
const S_UP = S_MENU + HOLD + 2;
const S_COPY = S_UP + 12;
// ③ 切窗口
const C_ALL = at(25.3);
const C_PICK = at(26.9);
/** 点指示条；约 3 拍后窗口铺满，要赶在第三章的卡盖下来之前 */
const C_BAR = at(28.4);

const tap = (f: number, x: number, y: number, t: number) => <Touch x={x} y={y} press={press01(f, t)} show={interpolate(f, [t - 10, t - 2, t + 8, t + 14], [0, 1, 1, 0], clamp)} />;

export const Duo: React.FC = () => {
  const f = useCurrentFrame();

  // —— 机位：开关在原版时横屏居中，在 Snug 时竖屏偏左（右边留给标注）——
  const landAt = (t: number) => 1 - toggleAt(t, MORPH);
  const r = landAt(f);
  const pose = { x: SNUG.x + (LAND.x - SNUG.x) * r, y: SNUG.y + (LAND.y - SNUG.y) * r, s: SNUG.s + (LAND.s - SNUG.s) * r };
  const turn = Math.abs(landAt(f + 0.5) - landAt(f - 0.5));
  const land = interpolate(r, [0.35, 0.65], [0, 1], clamp);
  const settledLand = r > 0.999;
  const settledSnug = r < 0.001;
  const pair = f < P2 ? 1 : f < P3 ? 2 : 3;

  // —— 原版（横屏）——
  const twoP = interpolate(f, [TWO, TWO + 34], [0, 1], { ...clamp, easing: outQuint });
  const twoY = 150 + 70 * twoP;
  const kbUp = interpolate(f, [B_KB + 3, B_KB + 13], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [P2_SNUG, P2_SNUG + 8], [0, 1], clamp));
  // 键盘升起，UU 把画面往上推：桌面底边贴着键盘顶
  const view: LandView = { ...FIT_L, sy: FIT_L.sy - LKB_H * kbUp };
  const selX = interpolate(f, [B_SEL, B_SEL + 14], [212, 300], { ...clamp, easing: outQuint });
  const ROW_Y = 250;
  const selRows: [number, number] | undefined = pair === 2 && f >= B_SEL + 2 ? [tRow(FIT_L, ROW_Y), tRow(FIT_L, ROW_Y + 3)] : undefined;
  const flashC = interpolate(f, [B_C + 2, B_C + 8, B_C + 16], [0, 1, 0], clamp);
  const ime = f >= B_KB && f < B_TAB + 2;
  const combo = f >= B_COMBO + 2;
  const held = f >= B_CMD + 2 && f < B_C + 12 ? ["CMD"] : [];
  const pressed = f >= B_COMBO && f < B_COMBO + 8 ? "COMBO" : f >= B_CMD && f < B_CMD + 8 ? "CMD" : f >= B_C && f < B_C + 8 ? "C" : null;
  const kbNode = pair === 2 && kbUp > 0 ? ime ? <ImeKeyboardLand show={kbUp} /> : <PcKeyboard land show={kbUp} combo={combo} held={held} pressed={pressed} /> : null;
  const mc = interpolate(f, [C_ALL + 4, C_ALL + 20], [0, 1], { ...clamp, easing: inOutQuint });
  const pick = interpolate(f, [C_PICK + 3, C_PICK + 19], [0, 1], { ...clamp, easing: inOutQuint });
  const picked = f >= C_PICK + 19;
  const term = <Terminal lines={TASK_DONE} size={T_SIZE} width={FRONT.w} height={T_H} anchor="bottom" scroll={pair === 1 ? (-70 * twoP) / LAND_K : 0} selRows={selRows} selColor={`rgba(30,110,255,${0.5 + 0.45 * flashC})`} />;
  const items = MC_ITEMS.map((it, i) => (i === 2 && pick > 0 ? { ...it, to: { ...MC_SHELL, x: MC_SHELL.x + (SHELL_RECT.x - MC_SHELL.x) * pick, y: MC_SHELL.y + (SHELL_RECT.y - MC_SHELL.y) * pick, w: MC_SHELL.w + (SHELL_RECT.w - MC_SHELL.w) * pick } } : it));
  const desk =
    pair === 3 && picked ? (
      <MacDesktop front={shellTerm(SHELL_IDLE, true)} frontRect={SHELL_RECT} frontTitle={WIN.shell.title} />
    ) : pair === 3 && mc > 0 ? (
      <MissionControl p={mc} items={items} />
    ) : (
      <MacDesktop front={term} />
    );
  // 调度中心里手指先停在 Safari 上，再挪到那个 shell 窗口
  const safariC = centerOf({ x: 800, y: 150, w: 520, h: 406 });
  const shellC = centerOf(MC_SHELL);
  const huntT = [C_ALL + 22, at(26.2), at(26.45), C_PICK - 2];
  const hunt = { x: interpolate(f, huntT, [lTool("all").x, safariC.x, safariC.x, shellC.x], { ...clamp, easing: inOutQuint }), y: interpolate(f, huntT, [lTool("all").y, safariC.y, safariC.y, shellC.y], { ...clamp, easing: inOutQuint }) };
  const huntShow = interpolate(f, [C_ALL + 16, C_ALL + 22, C_PICK + 8, C_PICK + 14], [0, 1, 1, 0], clamp);
  const pcTab = { x: PC_TAB_L.x, y: LKB_TOP + PC_TAB_L.y };
  const comboK = pcKeyPos("COMBO", true)!;
  const cmdK = pcKeyPos("CMD", true)!;
  const cK = pcKeyPos("C", true)!;

  // —— Snug（竖屏）——
  const bScroll = pair === 1 ? -Math.max(0, Math.min(S_OFF, flick(f, ONE_DOWN, 10, 150) - flick(f, ONE_UP, 10, 150))) : 0;
  const fingerA = (t: number, dir: number) => ({
    y: interpolate(f, [t, t + 10], [0, 150], clamp) * dir,
    show: interpolate(f, [t - 6, t, t + 10, t + 16], [0, 1, 1, 0], clamp),
  });
  const a1 = fingerA(ONE_DOWN, 1);
  const a2 = fingerA(ONE_UP, -1);
  const end = Math.round(interpolate(f, [S_DRAG, S_DRAG + 16], [FROM.col, TO.col], { ...clamp, easing: outQuint }));
  const sSel = pair === 2 && f >= S_DRAG ? sel(f < S_MENU ? end : TO.col) : undefined;
  const fpSel = sPos(G_LINE, Math.max(FROM.col, end - 1));
  const fpTo = sPos(G_LINE, TO.col - 1);
  const menuP = interpolate(f, [S_UP, S_UP + 8], [0, 1], { ...clamp, easing: outExpo }) * (1 - interpolate(f, [S_COPY + 10, S_COPY + 18], [0, 1], clamp));
  const my = Math.min(fpTo.y, MH - 28 - CTX_H - 8);
  const menuX = Math.min(fpTo.x, MW - CTX_W - 8);
  const copy = toPhone(menuX + 60, my + 16);
  const sw = pair === 3 ? switching(f - C_BAR, { prevScreen: <GhosttyApp lines={TASK_DONE} size={S_SIZE} />, current: WIN.ghostty, others: OTHERS, target: WIN.shell }) : null;
  const fill = interpolate(f - C_BAR, [SWITCH.ENTER, SWITCH.ENTER + 8], [0, 1], { ...clamp, easing: outExpo });
  const snugScreen =
    pair < 3 || f < C_BAR ? (
      <GhosttyApp lines={TASK_DONE} size={S_SIZE} scroll={bScroll} sel={sSel}>
        {pair === 2 && menuP > 0 ? <ContextMenu x={menuX} y={my - BODY_Y} p={menuP} hover={f >= S_COPY - 2 ? 0 : -1} /> : null}
      </GhosttyApp>
    ) : sw ? (
      sw.screen
    ) : (
      <div style={{ position: "absolute", inset: 0, opacity: fill, transform: `scale(${0.97 + 0.03 * fill})` }}>
        <GhosttyApp lines={SHELL_IDLE} title={WIN.shell.title} size={S_SIZE} cursor anchor="bottom" />
      </div>
    );

  // —— 标注要用的画面坐标（手机停稳时）——
  const onL = (lx: number, ly: number) => onStageL(LAND.x, LAND.y, LAND.s, lx, ly);
  const onS = (px: number, py: number) => onStage(SNUG.x, SNUG.y, SNUG.s, px, py);
  const twoAt = onL(300, 150 + 70 * 0.6);
  const oneAt = onS(toPhone(330, 450).x, toPhone(330, 450).y);
  const mcAt = onL(centerOf(MC_SHELL).x, centerOf(MC_SHELL).y - 30);
  const listAt = onS(toPhone(150, 520).x, toPhone(150, 520).y);
  const RIGHT = SNUG.x + 270;

  return (
    <AbsoluteFill>
      <Smear id="duo-turn" sx={Math.min(5, turn * 50)} sy={Math.min(5, turn * 50)}>
        <Phone x={pose.x} y={pose.y} scale={pose.s} rotate={-90 * r} bar={r < 0.5} glow={0.25 * (1 - r)}>
          {land > 0 ? (
            <Land opacity={land}>
              <UULandscape desk={desk} view={view} kb={kbNode} />
              {settledLand ? (
                <>
                  {/* ① 双指拖动 */}
                  <Touch x={260} y={twoY} press={1} show={interpolate(f, [TWO - 6, TWO, TWO + 36, TWO + 42], [0, 1, 1, 0], clamp)} />
                  <Touch x={340} y={twoY} press={1} show={interpolate(f, [TWO - 6, TWO, TWO + 36, TWO + 42], [0, 1, 1, 0], clamp)} />
                  {/* ② 拖选一行，再走键盘那一串 */}
                  <Touch x={selX} y={ROW_Y} press={1} show={interpolate(f, [B_SEL - 6, B_SEL, B_SEL + 16, B_SEL + 22], [0, 1, 1, 0], clamp)} />
                  {tap(f, lTool("kb").x, lTool("kb").y, B_KB)}
                  {tap(f, pcTab.x, pcTab.y, B_TAB)}
                  {tap(f, comboK.x, LKB_TOP + comboK.y, B_COMBO)}
                  {tap(f, cmdK.x, LKB_TOP + cmdK.y, B_CMD)}
                  {tap(f, cK.x, LKB_TOP + cK.y, B_C)}
                  {/* ③ 展开所有窗口，一个个找 */}
                  {tap(f, lTool("all").x, lTool("all").y, C_ALL)}
                  <Touch x={hunt.x} y={hunt.y} press={press01(f, C_PICK)} show={huntShow} />
                </>
              ) : null}
            </Land>
          ) : null}
          {land < 1 ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - land }}>
              <UUSnug>{snugScreen}</UUSnug>
              {settledSnug ? (
                <>
                  {/* ① 单指一划，再划回来 */}
                  <Touch x={toPhone(330, 380).x} y={toPhone(330, 380 + a1.y).y} press={1} show={a1.show} />
                  <Touch x={toPhone(330, 560).x} y={toPhone(330, 560 + a2.y).y} press={1} show={a2.show} />
                  {/* ② 长按拖选 → 长按 → 拷贝 */}
                  <Touch x={toPhone(fpSel.x, fpSel.y).x} y={toPhone(fpSel.x, fpSel.y).y} press={1} show={interpolate(f, [S_DOWN - 6, S_DOWN, S_DRAG + 18, S_DRAG + 24], [0, 1, 1, 0], clamp)} ring={f < S_DRAG ? holdRing(f, S_DOWN) : 0} />
                  <Touch x={toPhone(fpTo.x, fpTo.y).x} y={toPhone(fpTo.x, fpTo.y).y} press={1} show={interpolate(f, [S_MENU - 6, S_MENU, S_UP, S_UP + 6], [0, 1, 1, 0], clamp)} ring={holdRing(f, S_MENU)} />
                  <Touch x={copy.x} y={copy.y} press={press01(f, S_COPY)} show={interpolate(f, [S_COPY - 10, S_COPY - 3, S_COPY + 10, S_COPY + 16], [0, 1, 1, 0], clamp)} />
                  {/* ③ 指示条 → 窗口列表 */}
                  {sw?.finger ? <Touch x={sw.finger.x} y={sw.finger.y} press={sw.finger.press} show={sw.finger.show} /> : null}
                </>
              ) : null}
            </div>
          ) : null}
        </Phone>
      </Smear>

      {/* 拨到 Snug 的那一下：白闪、冲击波、扫光 */}
      {[P1_SNUG, P2_SNUG, P3_SNUG].map((t) => (
        <div key={t}>
          <Flash at={t + 6} dur={14} max={0.5} />
          <Shock at={t + 8} x={SNUG.x} y={SNUG.y} size={1300} dur={26} />
          <Sweep at={t + 8} strength={0.5} />
        </div>
      ))}

      {/* 顶上：主标题（跟着开关换）、分段开关（英文小标只放在章节卡上） */}
      <Headline at={P1 + 6} until={P1_SNUG} y={HL_Y} title="双指滚动" sub="同 Mac 触控板" />
      <Headline at={P1_SNUG + 2} until={P2} y={HL_Y} title="单指滚动" sub="同 iPhone" />
      <Headline at={P2 + 2} until={P2_SNUG} y={HL_Y} title="组合键拷贝" sub="同 Mac 键盘" />
      <Headline at={P2_SNUG + 2} until={CARD2 + 6} y={HL_Y} title="长按拷贝" sub="同 iPhone" />
      <Headline at={P3 + 2} until={P3_SNUG} y={HL_Y} title="缩略图切换" sub="同 Mac 调度中心" />
      <Headline at={P3_SNUG + 2} y={HL_Y} title="轻点切换" sub="同 iPhone" />
      <Toggle at={8} y={TOGGLE_Y} snug={toggleAt(f, FLIP)} />

      {/* ① 滚动 */}
      <Callout at={TWO + 4} until={P1_SNUG - 2} x={twoAt.x} y={twoAt.y + 26} tx={540} ty={1420} side="down" text="双指" bend={0.1} />
      <Callout at={ONE_DOWN} until={P2 - 4} x={oneAt.x + 16} y={oneAt.y} tx={RIGHT} ty={oneAt.y - 160} side="right" text="单指" tone="snug" />
      {/* ② 拷贝：原版在手机下面一行行排，Snug 在手机右边竖着排 */}
      <Steps
        items={[
          { at: B_SEL, text: "拖选" },
          { at: B_KB, text: "键盘" },
          { at: B_TAB, text: "电脑键盘" },
          { at: B_COMBO, text: "组合键模式" },
          { at: B_CMD, text: "⌘" },
          { at: B_C, text: "C" },
        ]}
        until={P2_SNUG}
        x={60}
        y={1380}
        w={960}
      />
      <Steps
        items={[
          { at: S_DOWN, text: "长按拖选" },
          { at: S_UP, text: "右键菜单" },
          { at: S_COPY, text: "拷贝" },
        ]}
        until={CARD2 + 6}
        x={RIGHT + 14}
        y={900}
        w={330}
        tone="snug"
        dir="col"
      />
      {/* ③ 切窗口 */}
      <Callout at={C_ALL + 22} until={C_PICK + 6} x={mcAt.x} y={mcAt.y} tx={540} ty={1420} side="down" text="逐个辨认" bend={-0.12} />
      <Callout at={C_BAR + SWITCH.MOVE} until={C_BAR + SWITCH.OPENING} x={listAt.x} y={listAt.y} tx={RIGHT} ty={listAt.y - 250} side="right" text="App · 窗口名" tone="snug" />

    </AbsoluteFill>
  );
};
