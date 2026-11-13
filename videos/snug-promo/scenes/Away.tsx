import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { DW, FRONT, MacBook, MacDesktop, Notification } from "../components/mac";
import { Phone } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { taskAt } from "../components/story";
import { Terminal } from "../components/terminal";
import { UUOriginal } from "../components/uu";
import { local } from "../theme";

// 开场，先交代场景：Mac 上的 Claude Code 正在干活（镜头贴在终端上，字一行行往外吐）；
// 右上角弹出日历提醒，人得走开；想用手机接着盯，手机从下面升上来，连上 UU远程，接进方案一。
const at = local(0);
const SIZE = 13;
const LEFT = 70;
const TOP = 760;
const SCREEN_W = 940;
const k = SCREEN_W / DW;
/** 桌面点 → 画面像素（镜头不动时） */
const stage = (x: number, y: number) => ({ x: LEFT + x * k, y: TOP + y * k });
// 三个机位：贴着终端的下半截、右上角（通知在上面，下面露出终端的右半截和壁纸）、整台 MacBook。
// 这一场桌面上只放 Ghostty，不放后面的 Safari，推近到右上角时不会满屏都是一个空网页。
// 每个机位是「桌面上哪个点 → 放到画面哪里」
const TERM = { ...stage(FRONT.x + 380, FRONT.y + 520), cy: 1300 };
const NOTE = { ...stage(DW - 360, 300), cy: 1230 };
const WHOLE = { x: 540, y: TOP + 300, cy: 1065 };

export const Away: React.FC = () => {
  const f = useCurrentFrame();
  const toNote = interpolate(f, [at(4.6), at(5.6)], [0, 1], { ...clamp, easing: inOutQuint });
  const toWhole = interpolate(f, [at(8), at(9.6)], [0, 1], { ...clamp, easing: inOutQuint });
  const fx = TERM.x + (NOTE.x - TERM.x) * toNote + (WHOLE.x - NOTE.x) * toWhole;
  const fy = TERM.y + (NOTE.y - TERM.y) * toNote + (WHOLE.y - NOTE.y) * toWhole;
  const s = interpolate(f, [0, at(4.6), at(5.6), at(8), at(9.6)], [2.1, 2.25, 2.3, 2.38, 1], clamp);
  // 镜头对准的点放在字幕下面
  const cx = 540;
  const cy = TERM.cy + (NOTE.cy - TERM.cy) * toNote + (WHOLE.cy - NOTE.cy) * toWhole;
  const note = interpolate(f, [at(5), at(5) + 16], [0, 1], { ...clamp, easing: outExpo });
  // 手机升上来，MacBook 往后退、淡掉
  const rise = interpolate(f, [at(9), at(11.5)], [0, 1], { ...clamp, easing: inOutQuint });
  const mac = 1 - interpolate(f, [at(9.8), at(11.6)], [0, 1], clamp);
  const lines = taskAt(f);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: mac, filter: rise > 0 ? `blur(${6 * rise}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${cx - fx * s}px, ${cy - fy * s - 120 * rise}px) scale(${s * (1 - 0.06 * rise)})`, transformOrigin: "0 0" }}>
          <MacBook left={LEFT} top={TOP} width={SCREEN_W}>
            <MacDesktop front={<Terminal lines={lines} size={SIZE} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} back={null} />
            <Notification icon="iconCalendar" title="小组讨论" body="9:45 · 图书馆 3 楼" time="现在" p={note} />
          </MacBook>
        </div>
      </AbsoluteFill>
      {rise > 0 ? (
        <Phone x={HOME.x} y={HOME.y + (1 - rise) * 1500} scale={HOME.s} rotate={-6 * (1 - rise)}>
          <UUOriginal front={<Terminal lines={lines} size={SIZE} width={FRONT.w} height={FRONT.h - 33} anchor="bottom" />} />
        </Phone>
      ) : null}
      <Hero at={2} until={at(5) - 6} title="AI AT WORK" sub="Mac 端 · AI 任务进行中" />
      <Hero at={at(6)} until={at(12) - 6} title="STEP AWAY" sub="暂离工位 · 任务在途" />
    </AbsoluteFill>
  );
};
