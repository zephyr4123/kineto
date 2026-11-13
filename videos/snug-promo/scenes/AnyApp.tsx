import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo, punch } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { ChatgptApp, ClaudeApp, CodeApp, GhosttyApp, NotionApp, notionBox, SafariApp } from "../components/apps";
import { flick } from "../components/gesture";
import { Indicator, MH, MW, toPhone } from "../components/mac";
import { Phone, Touch } from "../components/phone";
import { Opening, press01, rowCenter, WIN, WindowList, type Win } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { ANSWER, ASK, CC, EARLY, PRELUDE, streaming, type Line } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { C, local } from "../theme";

// 回击二：放上手机屏的是 Mac 上的窗口本身，什么 App 都行。每换一个 App 都真的走一遍：
// 点底部横条 → 回到窗口列表 → 点下一个窗口 →「正在打开」→ 铺满；铺满后在 App 里接着操作（滑页面、打勾、看回复一个字一个字出来）。
// 前半段 ANY APP（Safari、Notion、终端），后半段 ANY AI（ChatGPT 里的 Codex、Claude、终端里的 Claude Code）：
// 别的图标退暗，三个 AI 上前。第 14 拍音乐有一拍几乎静音，画面在这一拍定住。
const at = local(48);

const RING = [
  { k: "iconGhostty", a: 140, ai: false },
  { k: "iconVscode", a: 156, ai: false },
  { k: "iconClaude", a: 172, ai: true },
  { k: "iconSafari", a: 188, ai: false },
  { k: "iconNotion", a: 204, ai: false },
  { k: "iconWechat", a: 220, ai: false },
  { k: "iconCursor", a: 40, ai: false },
  { k: "iconFinder", a: 24, ai: false },
  { k: "iconChatgpt", a: 8, ai: true },
  { k: "iconTypeless", a: -8, ai: false },
  { k: "iconIterm", a: -24, ai: false },
  { k: "iconTerminal", a: -40, ai: true },
] as const;

const PR: Line[] = [[{ t: "❯ ", c: CC.dim }, { t: "看一下 PR 14 的修复方案，没问题就跑一遍测试", bg: "#eef0f3" }], ""];
const PR_REPLY: Line[] = [
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(gh pr diff 14 --stat)" }],
  [{ t: "  ⎿  3 files changed, 41 insertions(+), 12 deletions(-)", c: CC.dim }],
  "",
  [{ t: "● ", c: CC.ink }, { t: "改动集中在窗口列表的读取：窗口放上手机屏之前先确认它还在原来的桌面空间里，不在就跳过，不再把已经关掉的窗口列出来。思路没问题，补的两条测试也覆盖到了。" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(scripts/snug check)" }],
];

type Finger = { x: number; y: number; press: number; show: number };
type Slot = { from: number; win: Win; screen: (t: number) => React.ReactNode; finger?: (t: number) => Finger | null };
/** 换窗口用掉的帧数：铺满之后才开始的那一段，t 从铺满那一帧算起 */
const ENTER = 22;
const SLOTS: Slot[] = [
  {
    from: 0,
    win: WIN.safari,
    screen: (t) => <SafariApp scroll={Math.min(560, flick(t, 10, 8, 170))} />,
    finger: (t) => ({ ...toPhone(300, interpolate(t, [10, 18], [620, 450], clamp)), press: 1, show: interpolate(t, [4, 10, 18, 24], [0, 1, 1, 0], clamp) }),
  },
  {
    from: 2.5,
    win: WIN.notion,
    screen: (t) => <NotionApp checked={t >= 18 ? 1 : 0} />,
    finger: (t) => {
      const p = notionBox(4);
      return { ...toPhone(p.x, 62 + p.y), press: press01(t, 16), show: interpolate(t, [8, 14, 26, 32], [0, 1, 1, 0], clamp) };
    },
  },
  { from: 5, win: WIN.ghostty2, screen: (t) => <GhosttyApp title={WIN.ghostty2.title} lines={streaming([...PRELUDE, ...EARLY, ...PR], PR_REPLY, t, 4, 4, "Reviewing")} /> },
  { from: 8, win: WIN.chatgpt, screen: (t) => <ChatgptApp reveal={Math.floor(Math.max(0, t - 8) * 2.6)} /> },
  { from: 10.5, win: WIN.claude, screen: (t) => <ClaudeApp reveal={Math.floor(Math.max(0, t - 6) * 2.4)} /> },
  { from: 12.5, win: WIN.ghostty, screen: (t) => <GhosttyApp lines={streaming([...PRELUDE, ...EARLY, ASK, ""], ANSWER, t, 2, 5)} /> },
];
const ALL: Win[] = [WIN.ghostty, WIN.ghostty2, WIN.safari, WIN.notion, WIN.chatgpt, WIN.claude, WIN.vscode, WIN.finder, WIN.settings];

export const AnyApp: React.FC = () => {
  const f = useCurrentFrame();
  const ai = interpolate(f, [at(8), at(8) + 12], [0, 1], { ...clamp, easing: outExpo });
  const freeze = f >= at(14) && f < at(15);
  const t = freeze ? at(14) : f;
  const s = HOME.s * punch(f, at(8), 0.04, 22) * (1 - 0.06 * interpolate(f, [at(14), at(14) + 6], [0, 1], clamp));
  const i = SLOTS.reduce((k, sl, j) => (t >= at(sl.from) ? j : k), 0);
  const slot = SLOTS[i];
  const prev = i === 0 ? WIN.vscode : SLOTS[i - 1].win;
  const ls = t - at(slot.from);
  // 换窗口：0–5 帧点横条，5–16 帧列表（第 11 帧点下一个），16–22 帧「正在打开」，之后铺满
  const others = [slot.win, ...ALL.filter((w) => w !== slot.win && w !== prev)].slice(0, 6);
  const bar = toPhone(MW / 2, MH - 14);
  const row = toPhone(rowCenter(0, true).x, rowCenter(0, true).y);
  let screen: React.ReactNode;
  let finger: Finger | null = null;
  if (ls < 5) {
    screen = i === 0 ? <CodeApp /> : SLOTS[i - 1].screen(at(slot.from) - at(SLOTS[i - 1].from) - ENTER);
    finger = { ...bar, press: press01(ls, 0), show: 1 };
  } else if (ls < 16) {
    const p = interpolate(ls, [5, 10], [0, 1], { ...clamp, easing: outExpo });
    screen = (
      <div style={{ position: "absolute", inset: 0, opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}>
        <WindowList current={prev} others={others} pressRow={0} press={press01(ls, 11)} />
        <Indicator />
      </div>
    );
    finger = {
      x: interpolate(ls, [5, 11], [bar.x, row.x], clamp),
      y: interpolate(ls, [5, 11], [bar.y, row.y], { ...clamp, easing: outExpo }),
      press: press01(ls, 11),
      show: interpolate(ls, [13, 16], [1, 0], clamp),
    };
  } else if (ls < ENTER) {
    screen = <Opening w={slot.win} frame={ls} />;
  } else {
    const e = interpolate(ls, [ENTER, ENTER + 6], [0, 1], { ...clamp, easing: outExpo });
    screen = <div style={{ position: "absolute", inset: 0, opacity: e, transform: `scale(${0.97 + 0.03 * e})` }}>{slot.screen(ls - ENTER)}</div>;
    finger = slot.finger ? slot.finger(ls - ENTER) : null;
  }
  return (
    <AbsoluteFill>
      {RING.map((r, j) => {
        const p = interpolate(f, [2 + j * 1.5, 22 + j * 1.5], [0, 1], { ...clamp, easing: outExpo });
        const rad = (r.a * Math.PI) / 180;
        const bob = 10 * Math.sin(t / 40 + j);
        const x = 540 + Math.cos(rad) * 455 * p;
        const y = HOME.y - 20 + Math.sin(rad) * 640 * p + bob;
        const dim = r.ai ? 0 : ai;
        const lift = r.ai ? ai : 0;
        const size = 120 * (1 + 0.35 * lift) * (1 - 0.15 * dim);
        return (
          <div key={r.k} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: p * (1 - 0.7 * dim), zIndex: r.ai ? 3 : 1 }}>
            {lift > 0 ? <div style={{ position: "absolute", inset: -30, borderRadius: "50%", background: `radial-gradient(circle, rgba(0,184,234,${0.4 * lift}), transparent 65%)` }} /> : null}
            <Img src={staticFile(assets[r.k])} style={{ position: "absolute", inset: 0, width: size, height: size, filter: dim > 0 ? `grayscale(${dim})` : undefined }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
        <Phone x={HOME.x} y={HOME.y} scale={s} glow={0.3 + 0.5 * ai}>
          <UUSnug>{screen}</UUSnug>
          {finger ? <Touch x={finger.x} y={finger.y} press={finger.press} show={finger.show} /> : null}
        </Phone>
      </div>
      {freeze ? <AbsoluteFill style={{ background: "rgba(240,246,255,0.35)", zIndex: 4 }} /> : null}
      <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
        <Hero at={2} until={at(8) - 6} title="ANY APP" sub="Mac 上的窗口 原样上屏" />
        <Hero at={at(8)} until={at(16) - 6} title="ANY AI" sub="不绑定任何一家 AI" color={C.ink} />
      </div>
    </AbsoluteFill>
  );
};
