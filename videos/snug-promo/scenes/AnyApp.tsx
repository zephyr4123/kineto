import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo, punch } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { ChatgptApp, ClaudeApp, GhosttyApp, NotionApp, SafariApp } from "../components/apps";
import { Phone } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { INPUT, SESSION } from "../components/terminal";
import { UUSnug } from "../components/uu";
import { C, local } from "../theme";

// 回击二：放上手机屏的是 Mac 上的窗口本身。前半段 ANY APP：一圈 App 图标从手机后面散开，屏上一个接一个换 App；
// 后半段 ANY AI：别的图标退暗，Claude、ChatGPT、终端三个上前，屏上换成 Codex、Claude、终端里的 Claude Code。
// 第 14 拍音乐有一拍几乎静音，画面在这一拍定住。
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

const SCREENS = [
  { from: 0, el: <SafariApp /> },
  { from: 2.5, el: <NotionApp /> },
  { from: 5, el: <GhosttyApp lines={[...SESSION.slice(12), ...INPUT("")]} title="◐ PR 14 修复方案" /> },
  { from: 8, el: <ChatgptApp /> },
  { from: 10.5, el: <ClaudeApp /> },
  { from: 12.5, el: <GhosttyApp lines={[...SESSION, ...INPUT("")]} /> },
] as const;

export const AnyApp: React.FC = () => {
  const f = useCurrentFrame();
  const ai = interpolate(f, [at(8), at(8) + 12], [0, 1], { ...clamp, easing: outExpo });
  const freeze = f >= at(14) && f < at(15);
  const t = freeze ? at(14) : f;
  const s = HOME.s * punch(f, at(8), 0.04, 22) * (1 - 0.06 * interpolate(f, [at(14), at(14) + 6], [0, 1], clamp));
  const cur = [...SCREENS].reverse().find((x) => f >= at(x.from)) ?? SCREENS[0];
  const enter = interpolate(f, [at(cur.from), at(cur.from) + 10], [0, 1], { ...clamp, easing: outExpo });
  return (
    <AbsoluteFill>
      {RING.map((r, i) => {
        const p = interpolate(f, [2 + i * 1.5, 22 + i * 1.5], [0, 1], { ...clamp, easing: outExpo });
        const rad = (r.a * Math.PI) / 180;
        const bob = 10 * Math.sin(t / 40 + i);
        const rx = 455;
        const ry = 640;
        const x = 540 + Math.cos(rad) * rx * p;
        const y = HOME.y - 20 + Math.sin(rad) * ry * p + bob;
        const dim = r.ai ? 0 : ai;
        const lift = r.ai ? ai : 0;
        const size = 120 * (1 + 0.35 * lift) * (1 - 0.15 * dim);
        return (
          <div key={r.k} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: p * (1 - 0.7 * dim), zIndex: r.ai ? 3 : 1 }}>
            {lift > 0 ? <div style={{ position: "absolute", inset: -30, borderRadius: "50%", background: `radial-gradient(circle, rgba(34,216,255,${0.45 * lift}), transparent 65%)` }} /> : null}
            <Img src={staticFile(assets[r.k])} style={{ position: "absolute", inset: 0, width: size, height: size, filter: dim > 0 ? `grayscale(${dim})` : undefined }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
        <Phone x={HOME.x} y={HOME.y} scale={s} glow={0.3 + 0.5 * ai}>
          <UUSnug>
            <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - enter) * 120}px) scale(${0.96 + 0.04 * enter})`, opacity: Math.min(1, enter * 1.5) }}>{cur.el}</div>
          </UUSnug>
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
