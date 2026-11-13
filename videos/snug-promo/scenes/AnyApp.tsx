import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo, punch } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { ChatgptApp, CLAUDE_LEN, ClaudeApp, GhosttyApp, GPT_LEN, NotionApp, notionBox, SafariApp } from "../components/apps";
import { flick } from "../components/gesture";
import { toPhone } from "../components/mac";
import { Phone, Touch } from "../components/phone";
import { OTHERS, press01, switching, SWITCH, WIN, type Finger, type Win } from "../components/snug";
import { Hero, HOME } from "../components/stage";
import { CC, charCount, EARLY, PRELUDE, streamed, type Line } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { C, local } from "../theme";

// 回击二：放上手机屏的是 Mac 上的窗口本身，什么 App 都行。每换一个窗口都真的走一遍，而且每个窗口都把事做完才走：
// 点底部横条 → 窗口列表滑上来 → 手指移到下一行、点下 →「正在打开」→ 铺满（约 1.5 秒）；
// 铺满后接着操作：Safari 甩一下滑到底、停稳；Notion 勾掉一项；ChatGPT 里的 Codex、Claude 的回复已经在 Mac 上写了一半，
// 切进去看它写完；终端里的 Claude Code 跑完测试、给出结论。没有凭空发出去的消息：要回复的都是切进去之前就在跑的。
// 前半段 ANY APP（Safari、Notion），第 20 拍音乐重新砸下，换成 ANY AI（Codex、Claude、Claude Code）：别的图标退暗，三个 AI 上前。
const at = local(92);

const RING = [
  { k: "iconGhostty", a: 140, ai: true },
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
  { k: "iconTerminal", a: -40, ai: false },
] as const;

// 终端里的那个窗口：在 Mac 上让 Claude Code 看 PR 14、跑测试，切进去时它已经读完改动，正在写结论
const PR: Line[] = [[{ t: "❯ ", c: CC.dim }, { t: "看一下 PR 14 的修复方案，没问题就跑一遍测试", bg: "#eef0f3" }], ""];
const PR_REPLY: Line[] = [
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(gh pr diff 14 --stat)" }],
  [{ t: "  ⎿  3 files changed, 41 insertions(+), 12 deletions(-)", c: CC.dim }],
  "",
  [{ t: "● ", c: CC.ink }, { t: "改动集中在窗口列表的读取：窗口放上手机屏之前先确认它还在原来的桌面空间里，不在就跳过，不再把已经关掉的窗口列出来。思路没问题，补的两条测试也覆盖到了。" }],
  "",
  [{ t: "● ", c: CC.green }, { t: "Bash", b: true }, { t: "(scripts/snug check)" }],
  [{ t: "  ⎿  Build complete · 136 tests passed", c: CC.dim }],
  "",
  [{ t: "● ", c: CC.ink }, { t: "测试全部通过，可以合并。" }],
];
const PR_BEFORE: Line[] = [...PRELUDE, ...EARLY, ...PR];
const upto = (k: number) => charCount(PR_REPLY.slice(0, k));
/** PR 那个终端跑完之后的样子（下一个场景从这里点横条换窗口） */
export const PR_DONE = streamed(PR_BEFORE, PR_REPLY, charCount(PR_REPLY), 0);

type Slot = { from: number; win: Win; screen: (t: number) => React.ReactNode; finger?: (t: number) => Finger | null };
const { MOVE, ENTER } = SWITCH;

const SLOTS: Slot[] = [
  {
    // 第一格从窗口列表接进来（上一个场景点了横条，列表已经在了），直接点 Safari
    from: 0,
    win: WIN.safari,
    // 甩一下：带惯性滑下去、慢慢停稳，再甩一下到表格那里
    screen: (t) => <SafariApp scroll={Math.min(640, flick(t, 14, 8, 170) + flick(t, 64, 8, 120))} />,
    finger: (t) => {
      const a = interpolate(t, [14, 22], [620, 450], clamp);
      const b = interpolate(t, [64, 72], [600, 480], clamp);
      return t < 50
        ? { ...toPhone(300, a), press: 1, show: interpolate(t, [8, 14, 22, 28], [0, 1, 1, 0], clamp) }
        : { ...toPhone(320, b), press: 1, show: interpolate(t, [58, 64, 72, 78], [0, 1, 1, 0], clamp) };
    },
  },
  {
    from: 10,
    win: WIN.notion,
    screen: (t) => <NotionApp checked={t >= 30 ? 1 : 0} />,
    finger: (t) => {
      const p = notionBox(4);
      return { ...toPhone(p.x, 62 + p.y), press: press01(t, 28), show: interpolate(t, [18, 26, 44, 52], [0, 1, 1, 0], clamp) };
    },
  },
  // 下面三格是 AI：切进去时回复已经写了一半（Mac 上早就在跑），看着它写完、停住
  { from: 20, win: WIN.chatgpt, screen: (t) => <ChatgptApp reveal={Math.floor(GPT_LEN * 0.45 + Math.max(0, t - 6) * 0.6)} /> },
  { from: 30.5, win: WIN.claude, screen: (t) => <ClaudeApp reveal={Math.floor(CLAUDE_LEN * 0.4 + Math.max(0, t - 6) * 0.5)} /> },
  {
    from: 41,
    win: WIN.ghostty2,
    screen: (t) => {
      // 进门时结论写到一半 → 写完 → 跑测试（转圈约 1.3 秒）→ 结果出来 → 一句收尾
      const n = Math.floor(
        interpolate(t, [0, 30, 36, 112, 116, 130, 150], [upto(3) + 40, upto(4), upto(6), upto(6), upto(7), upto(8), charCount(PR_REPLY)], clamp),
      );
      return <GhosttyApp title={WIN.ghostty2.title} lines={streamed(PR_BEFORE, PR_REPLY, n, t, "Reviewing", 96)} />;
    },
  },
];
const ALL: Win[] = [WIN.ghostty, WIN.ghostty2, WIN.safari, WIN.notion, WIN.chatgpt, WIN.claude, WIN.vscode, WIN.finder, WIN.settings];

/** 第 j 格的窗口铺满之后过了几帧（第一格是从列表接进来的，少了点横条、列表滑上来那一段） */
const contentT = (j: number, frame: number) => frame - at(SLOTS[j].from) + (j === 0 ? MOVE : 0) - ENTER;

export const AnyApp: React.FC = () => {
  const f = useCurrentFrame();
  const ai = interpolate(f, [at(20), at(20) + 12], [0, 1], { ...clamp, easing: outExpo });
  // 第 19 拍音乐静音一拍：画面定住，往后让一点
  const freeze = f >= at(19) && f < at(20);
  const t = freeze ? at(19) : f;
  const s = HOME.s * punch(f, at(20), 0.04, 22) * (freeze ? 0.95 : 1);
  const i = SLOTS.reduce((k, sl, j) => (t >= at(sl.from) ? j : k), 0);
  const slot = SLOTS[i];
  const lt = t - at(slot.from) + (i === 0 ? MOVE : 0);
  // 列表：当前窗口是上一个；第一格沿用上一个场景的列表，后面几格要点的窗口排在「其他窗口」第一行
  const prev = i === 0 ? WIN.ghostty : SLOTS[i - 1].win;
  const others: readonly Win[] = i === 0 ? OTHERS : [slot.win, ...ALL.filter((w) => w !== slot.win && w !== prev)].slice(0, 6);
  const sw = switching(lt, { prevScreen: i === 0 ? null : SLOTS[i - 1].screen(contentT(i - 1, t)), current: prev, others, target: slot.win, fromList: i === 0 });
  const e = interpolate(lt, [ENTER, ENTER + 8], [0, 1], { ...clamp, easing: outExpo });
  const screen = sw ? sw.screen : <div style={{ position: "absolute", inset: 0, opacity: e, transform: `scale(${0.97 + 0.03 * e})` }}>{slot.screen(lt - ENTER)}</div>;
  const finger = sw ? sw.finger : slot.finger ? slot.finger(lt - ENTER) : null;
  // 最后一拍半：四周的图标退掉，下一个场景接着在这台手机上换窗口
  const ringOut = interpolate(f, [at(50.5), at(52)], [1, 0], clamp);
  return (
    <AbsoluteFill>
      {RING.map((r, j) => {
        const p = interpolate(f, [2 + j * 1.5, 22 + j * 1.5], [0, 1], { ...clamp, easing: outExpo });
        const rad = (r.a * Math.PI) / 180;
        const bob = 10 * Math.sin(t / 40 + j);
        const x = 540 + Math.cos(rad) * 465 * p;
        const y = HOME.y - 20 + Math.sin(rad) * 660 * p + bob;
        const dim = r.ai ? 0 : ai;
        const lift = r.ai ? ai : 0;
        const size = 120 * (1 + 0.35 * lift) * (1 - 0.15 * dim);
        return (
          <div key={r.k} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: ringOut * p * (1 - 0.7 * dim), zIndex: r.ai ? 3 : 1 }}>
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
        <Hero at={2} until={at(20) - 6} title="ANY APP" sub="任意窗口 · 原样上屏" />
        <Hero at={at(20)} until={at(52) - 6} title="ANY AI" sub="ChatGPT · Claude · Claude Code" color={C.ink} />
      </div>
    </AbsoluteFill>
  );
};
