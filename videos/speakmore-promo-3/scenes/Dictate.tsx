import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Chapter } from "../components/Chapter";
import { Glass, Halo, Screen, type ViewKeys } from "../components/Glass";
import { Keycaps } from "../components/Keycaps";
import { Said, type SaidPart } from "../components/Said";
import { Line, Typewriter } from "../components/Type";
import { Sub } from "../components/kit";
import { Chat, Mail, type Message, Notes, Workspace } from "../components/windows";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, b } from "../theme";

// 语音输入（第 32–64 拍）：开场卡（右⌥）→ 镜头贴着团队频道的空输入框，说一句带语气词和改口的话，再按一次热键，
// 浅灰的几段炸散、空隙合拢，成句落进输入框，镜头拉远看整窗 → 口述三件事，备忘录里自动分条 →
// 同一句落进邮件、聊天、备忘录（光标在哪就写到哪）→ 引擎页真截图：三种识别方式，离线方式完全在本机。
// 成品都是 App 的真实输出（混合方式整理那一步的 dictate 任务，DeepSeek V4.1 Flash，2026-10-23）。
const START = 32;
const at = (n: number) => b(n - START);
export const DICTATE_FRAMES = b(32);

const MEET: readonly SaidPart[] = [
  { text: "嗯，那个，", cut: true },
  { text: "我们后天开个会吧，" },
  { text: "呃，把上周的，不对，", cut: true },
  { text: "把上个月的数据带上" },
  { text: "。", cut: true },
];
const MEET_OUT = "我们后天开个会吧，把上个月的数据带上";
const LIST: readonly SaidPart[] = [
  { text: "明天要做三件事，" },
  { text: "第一，", cut: true },
  { text: "改一下 README，" },
  { text: "第二，", cut: true },
  { text: "发 0.6.2 版本，" },
  { text: "呃，第三，", cut: true },
  { text: "更新一下官网" },
  { text: "。", cut: true },
];
const LIST_OUT = ["明天要做三件事：", "1. 改一下 README", "2. 发 0.6.2 版本", "3. 更新一下官网"] as const;

const WS = { w: 1400, h: 860 };
const WS_VIEW: ViewKeys = [
  [at(34.4), { fx: 0.5, fy: 0.95, s: 1.7, rx: 18, ry: -16, rz: -2 }],
  [at(41.6), { fx: 0.6, fy: 0.93, s: 1.62, rx: 12, ry: -9, rz: -1 }],
  [at(43.4), { fx: 0.5, fy: 0.56, s: 0.9, rx: 8, ry: -12 }],
  [at(44.8), { fx: 0.48, fy: 0.55, s: 0.86, rx: 6, ry: -16 }],
];
const NOTES = { w: 1200, h: 820 };
const NOTES_VIEW: ViewKeys = [
  [at(44.4), { fx: 0.3, fy: 0.25, s: 0.6, rx: 26, ry: 34 }],
  [at(46), { fx: 0.4, fy: 0.3, s: 1.05, rx: 12, ry: 12, rz: 1 }],
  [at(50.6), { fx: 0.42, fy: 0.38, s: 1.16, rx: 8, ry: 6 }],
];
const ENGINE = { w: 2160, h: 1500 };
const ENGINE_VIEW: ViewKeys = [
  [at(55.8), { fx: 0.28, fy: 0.75, s: 0.62, rx: 44, ry: 20 }],
  [at(57.4), { fx: 0.3, fy: 0.58, s: 1.3, rx: 16, ry: 10, rz: 1 }],
  [at(59.8), { fx: 0.58, fy: 0.5, s: 1.1, rx: 14, ry: -4 }],
  [at(61.8), { fx: 0.8, fy: 0.46, s: 1.35, rx: 12, ry: -10, rz: -1 }],
  [at(63.6), { fx: 0.85, fy: 0.46, s: 2.6, rx: 6, ry: -4 }],
];

const HISTORY: Message[] = [{ from: "them", name: "林晓", lines: ["新版的数据看板做好了，大家看一下。"], at: -100 }];

export const Dictate: React.FC = () => {
  const frame = useCurrentFrame();
  const meetLanded = frame >= at(42);
  const meetSent = frame >= at(43.2);
  const messages: Message[] = meetSent ? [...HISTORY, { from: "me", name: "我", lines: [MEET_OUT], at: at(43.2) }] : HISTORY;

  // 光标在哪就写到哪：三扇窗围成一道弧，整组慢慢转；一拍落一扇
  const orbit = prog(frame, at(50.4), at(56) - at(50.4), (t) => t);
  const fan = [
    { x: -600, ry: 24, z: -100, land: at(51.4), kind: "mail" },
    { x: 0, ry: 0, z: 40, land: at(52.4), kind: "chat" },
    { x: 600, ry: -24, z: -100, land: at(53.4), kind: "notes" },
  ] as const;
  const fanIn = prog(frame, at(50.4), 26, EASE.outExpo);
  const fanOut = prog(frame, at(55.4), 16, EASE.inOut);

  return (
    <AbsoluteFill>
      <Chapter keys={["右 ⌥"]} name="Voice input." zh="语音输入" at={0} press={at(33)} out={at(34.4)} />

      {/* 团队频道：镜头贴着空输入框 → 成句落下、发出 → 拉远 */}
      <Glass w={WS.w} h={WS.h} keys={WS_VIEW} at={at(34.4)} out={at(44.4)} y={140} fadeIn={12}>
        <Workspace w={WS.w} h={WS.h} frame={frame} channel="general" messages={messages} input={meetLanded && !meetSent ? MEET_OUT : ""} placeholder="发送到 #general" caret />
        {meetLanded && !meetSent ? (
          <div style={{ position: "absolute", left: 250 + 24, right: 24, bottom: 24, height: 64, borderRadius: 20, boxShadow: `0 0 0 3px oklch(0.55 0.17 33 / ${Math.exp(-(frame - at(42)) / 12)})` }} />
        ) : null}
      </Glass>
      <Line out={at(41.6)} y={-440}>
        <Typewriter value="Speak naturally." at={at(34.8)} frames={20} size={64} />
      </Line>
      <Said parts={MEET} at={at(35)} speak={at(35.6)} stop={at(40)} burst={at(40.6)} land={at(41.8)} seed="meet" />
      <Line out={at(44.2)} y={-440}>
        <Typewriter value="Read polished text." at={at(42)} frames={22} size={64} />
      </Line>

      {/* 口述三件事 → 备忘录里自动分条 */}
      <Glass w={NOTES.w} h={NOTES.h} keys={NOTES_VIEW} at={at(44.4)} out={at(50.2)} y={120}>
        <Notes w={NOTES.w} h={NOTES.h} frame={frame} title="待办" lines={LIST_OUT.map((text, i) => ({ text, at: at(48.4) + i * b(0.5) }))} caret />
      </Glass>
      <Said parts={LIST} at={at(44.6)} speak={at(45)} stop={at(47.2)} burst={at(47.6)} land={at(48.2)} size={40} seed="list" />
      <Line out={at(50.2)} y={-440}>
        <span style={{ display: "inline-flex", gap: 0 }}>
          {["Lists, ", "numbered."].map((w, i) => (
            <span key={w} style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, letterSpacing: "-0.025em", whiteSpace: "pre", color: i ? COLOR.cinnabar : COLOR.ink, opacity: prog(frame, at(48.4) + i * 10, 12), transform: `translateY(${-30 * (1 - prog(frame, at(48.4) + i * 10, 16))}px)` }}>
              {w}
            </span>
          ))}
        </span>
      </Line>

      <Keycaps
        inAt={at(34.6)}
        outAt={at(49.4)}
        caps={[{ label: "右 ⌥", presses: [[at(35.4), at(36.2)], [at(40), at(40.8)], [at(44.8), at(45.6)], [at(47.2), at(48)]] }]}
      />

      {/* 光标在哪，字就写到哪：邮件、聊天、备忘录围成一道弧 */}
      {fanIn > 0 && fanOut < 1 ? (
        <AbsoluteFill style={{ perspective: 2200, opacity: Math.min(1, fanIn * 1.5) * (1 - fanOut), filter: fanOut > 0 ? `blur(${12 * fanOut}px)` : undefined }}>
          <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `translateY(90px) rotateX(6deg) rotateY(${10 - 20 * orbit}deg) scale(${0.92 + 0.08 * fanIn})` }}>
            {fan.map((f) => {
              const landed = frame >= f.land;
              const kick = landed ? Math.exp(-(frame - f.land) / 10) : 0;
              return (
                <div key={f.kind} style={{ position: "absolute", left: 960 - 330 + f.x, top: 540 - 220, width: 660, height: 440, transform: `translateZ(${f.z + 30 * kick}px) rotateY(${f.ry}deg)` }}>
                  {f.kind === "mail" ? <Mail w={660} h={440} frame={frame} to="林晓" subject="会议安排" body={landed ? MEET_OUT : ""} caret /> : null}
                  {f.kind === "chat" ? <Chat w={660} h={440} frame={frame} name="林晓" avatar="oklch(0.6 0.12 40)" messages={[]} input={landed ? MEET_OUT : ""} placeholder="发送消息" caret /> : null}
                  {f.kind === "notes" ? <Notes w={660} h={440} frame={frame} title="周会" lines={landed ? [{ text: MEET_OUT, at: f.land }] : []} caret /> : null}
                  <div style={{ position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none", boxShadow: `0 0 0 3px oklch(0.55 0.17 33 / ${0.9 * kick})` }} />
                </div>
              );
            })}
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      <Line out={at(55.4)} y={-450}>
        <Typewriter value="Wherever the cursor is." at={at(50.6)} frames={24} size={64} />
      </Line>

      {/* 引擎页真截图：三种识别方式，离线方式完全在本机 */}
      <Glass w={ENGINE.w} h={ENGINE.h} keys={ENGINE_VIEW} at={at(55.8)} out={at(63)} fadeOut={18} y={60}>
        <Screen src={assets.appEngine} w={ENGINE.w} h={ENGINE.h} />
        <Halo x={484} y={698} w={322} h={101} at={at(57.6)} out={at(58.6)} color="oklch(0.55 0.12 260)" />
        <Halo x={484} y={954} w={322} h={104} at={at(58)} out={at(58.6)} color="oklch(0.55 0.12 260)" />
        <Halo x={484} y={828} w={322} h={99} at={at(58.6)} />
        <Halo x={1350} y={648} w={286} h={95} at={at(60.4)} />
        <Halo x={1730} y={641} w={378} h={97} at={at(61.2)} />
      </Glass>
      <Line out={at(62.8)} y={-450}>
        <span style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, letterSpacing: "-0.025em", whiteSpace: "pre", color: COLOR.ink, opacity: prog(frame, at(56.6), 14), filter: `blur(${10 * (1 - prog(frame, at(56.6), 18))}px)` }}>Three modes. </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 600, letterSpacing: "-0.025em", whiteSpace: "pre", color: COLOR.cinnabar, opacity: prog(frame, at(58.6), 14), filter: `blur(${10 * (1 - prog(frame, at(58.6), 18))}px)` }}>One fully offline.</span>
      </Line>
      <Line out={at(62.8)} y={-370}>
        <Sub text="离线方式完全在本机运行，不需要密钥" at={at(59.2)} size={30} />
      </Line>
    </AbsoluteFill>
  );
};
