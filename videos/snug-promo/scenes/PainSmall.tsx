import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outQuint } from "../../../engine/motion";
import { aim, Phone, Touch } from "../components/phone";
import { Hero, HOME, Tag } from "../components/stage";
import { SESSION, Terminal, type Sel } from "../components/terminal";
import { DESK_K, DESK_TOP, UUOriginal } from "../components/uu";
import { local } from "../theme";

// 痛点一：原版 UU远程 把整块桌面等比缩进手机，字小到看不清；单指一滑被当成鼠标拖拽，选中一片字。
const at = local(0);
// 桌面上 Ghostty 正文的第一行（窗口 62 + 标题栏 33 + 内边距 14）和行高，用来从手指位置换算选到第几行
const LINE0 = 62 + 33 + 14;
const SIZE = 13;
const LH = SIZE * 1.42;
const lineAt = (phoneY: number) => Math.floor(((phoneY - DESK_TOP) / DESK_K - LINE0) / LH);

export const PainSmall: React.FC = () => {
  const f = useCurrentFrame();
  // 镜头：先慢推，第 4 拍一下推到 Ghostty 窗口上，看清字有多小
  const s = interpolate(f, [0, at(3.6), at(4), at(4) + 14], [HOME.s, 1.5, 1.5, 2.35], { ...clamp, easing: (t) => (f < at(4) ? outQuint(t) : inOutQuint(t)) });
  const focus = interpolate(f, [at(4), at(4) + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const p = aim(220 - 70 * focus, 478 - 22 * focus, s, 540, HOME.y - 40 * focus);

  // 手指：第 4.5 拍按下，往上一滑（想滚动），松手
  const t0 = at(4.5);
  const y = interpolate(f, [t0, t0 + 16], [540, 400], { ...clamp, easing: outQuint });
  const show = interpolate(f, [t0 - 4, t0, t0 + 24, t0 + 32], [0, 1, 1, 0], clamp);
  const down = f >= t0 && f < t0 + 24;
  // 被当成拖拽：从按下那行一直选到手指现在那行
  const sel: Sel[] = [];
  if (f >= t0 + 2) {
    const a = lineAt(540);
    const z = lineAt(y);
    for (let l = Math.min(a, z); l <= Math.max(a, z); l++) sel.push({ line: l, from: l === z ? 6 : 0, to: l === a ? 18 : 80 });
  }
  return (
    <AbsoluteFill>
      <Phone x={p.x} y={p.y} scale={s}>
        <UUOriginal front={<Terminal lines={SESSION} size={SIZE} sel={sel} selColor="rgba(30,110,255,0.75)" />} />
        <Touch x={150} y={y} press={down ? 1 : 0} show={show} />
      </Phone>
      <Tag at={0} until={at(8) - 6} text="PROBLEM 01" y={150} />
      <Hero at={2} until={at(4) - 6} title="TOO SMALL" sub="整块桌面 压进一块小屏" />
      <Hero at={at(4)} until={at(8) - 6} title="NO SCROLL" sub="单指一滑 只会拖选一片" />
    </AbsoluteFill>
  );
};
