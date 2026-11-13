import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outQuint } from "../../../engine/motion";
import { FRONT } from "../components/mac";
import { aim, Phone, Touch } from "../components/phone";
import { Hero, HOME, Tag } from "../components/stage";
import { taskAt } from "../components/story";
import { contentHeight, layout, Terminal } from "../components/terminal";
import { DESK_K, DESK_TOP, UUOriginal } from "../components/uu";
import { b, local } from "../theme";

// 方案一：用 UU远程 直接连回 Mac。原版把整块桌面等比缩进手机，字小到看不清；单指一滑被当成鼠标拖拽，选中一片字。
// 终端里还是开场那个任务，接着往下吐字。
const START = 12;
const at = local(START);
// 桌面上 Ghostty 正文的第一行（窗口 62 + 标题栏 33 + 内边距 14）和行高，用来从手指位置换算选到第几行
const LINE0 = 62 + 33 + 14;
const SIZE = 13;
const LH = SIZE * 1.42;
const TERM_W = FRONT.w;
const TERM_H = FRONT.h - 33;
/** 手指在手机屏的 phoneY 处，对着终端的第几排（终端贴底显示，上面被顶出去 off 像素） */
const rowAt = (phoneY: number, off: number) => Math.floor(((phoneY - DESK_TOP) / DESK_K - LINE0 + off) / LH);

export const PainSmall: React.FC = () => {
  const f = useCurrentFrame();
  const lines = taskAt(b(START) + f);
  const off = Math.max(0, contentHeight(layout(lines, SIZE, TERM_W)) - TERM_H);
  // 镜头：先慢推，第 5 拍一下推到 Ghostty 窗口上，看清字有多小
  const s = interpolate(f, [0, at(4.6), at(5), at(5) + 14], [HOME.s, 1.5, 1.5, 2.35], { ...clamp, easing: (t) => (f < at(5) ? outQuint(t) : inOutQuint(t)) });
  const focus = interpolate(f, [at(5), at(5) + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const p = aim(220 - 70 * focus, 478 - 22 * focus, s, 540, HOME.y - 40 * focus);

  // 手指：想往回翻，单指往下一滑；被当成拖拽，选中一片。不死心再滑一次，又选中一片
  const swipe = (t0: number, from: number, to: number) => ({
    t0,
    from,
    y: interpolate(f, [t0, t0 + 16], [from, to], { ...clamp, easing: outQuint }),
    show: interpolate(f, [t0 - 4, t0, t0 + 24, t0 + 32], [0, 1, 1, 0], clamp),
    down: f >= t0 && f < t0 + 24,
  });
  const s1 = swipe(at(6), 400, 540);
  const s2 = swipe(at(8.5), 360, 560);
  const cur = f >= s2.t0 ? s2 : s1;
  // 被当成拖拽：从按下那行一直选到手指现在那行
  const selRows: [number, number] | undefined =
    f >= cur.t0 + 2 ? [Math.min(rowAt(cur.from, off), rowAt(cur.y, off)), Math.max(rowAt(cur.from, off), rowAt(cur.y, off))] : undefined;
  return (
    <AbsoluteFill>
      <Phone x={p.x} y={p.y} scale={s}>
        <UUOriginal front={<Terminal lines={lines} size={SIZE} width={TERM_W} height={TERM_H} anchor="bottom" selRows={selRows} selColor="rgba(30,110,255,0.75)" />} />
        <Touch x={150} y={s1.y} press={s1.down ? 1 : 0} show={s1.show} />
        <Touch x={170} y={s2.y} press={s2.down ? 1 : 0} show={s2.show} />
      </Phone>
      <Tag at={0} until={at(12) - 6} text="方案一 · UU远程 原版" y={150} />
      <Hero at={6} until={at(5) - 6} title="TOO SMALL" sub="整屏缩放 · 字迹难辨" />
      <Hero at={at(5)} until={at(12) - 6} title="NO SCROLL" sub="单指滑动 · 误作拖选" />
    </AbsoluteFill>
  );
};
