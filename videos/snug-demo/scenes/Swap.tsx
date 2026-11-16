import { outExpo } from "../../../engine/motion";
import { phonePt, screenPoint } from "../components/devices";
import { cam, DUAL, MAC_HERO, PHONE_CENTER, TOP_ROW, tilt, withCam } from "../components/layouts";
import { Caption, Flight, Frame, Ripple, Swipe, Tag } from "../components/overlays";
import { Scene } from "../components/scene";
import { type ShotKey } from "../components/stage";
import { at, EVENTS, TAPS, WINDOWS } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 第二幕：上滑指示条回资源库，点 Safari —— 一个动作，两块 Mac 屏一起变：Claude 的窗口飞回外接屏、恢复全屏，
// Safari 离开内建屏、铺满手机（Snug 把手机屏换到 580 宽）→ 在手机上看网页 → 回资源库点「还原」，Safari 回到内建屏原位。

export const SWAP_FROM = sec(ACTS.swap);
export const SWAP_LEN = sec(ACTS.apps) - SWAP_FROM;
const END = SWAP_FROM + SWAP_LEN;

const swipe = at(TAPS.swipeHome.t);
const tapSafari = at(TAPS.safari.t);
const claudeBack = at(EVENTS.extClaudeBack);
const claudeFull = at(EVENTS.extClaudeFull);
const safariOut = at(EVENTS.macSafariOut);
const safariIn = at(EVENTS.phoneSafari);
const browse = at(61.5);
const restorePart = at(78);
const tapRestore = at(TAPS.restore.t);
const back = at(EVENTS.macSafariBack);

const KEYS: readonly ShotKey[] = [
  [SWAP_FROM, withCam(TOP_ROW, cam(540, 1020, 1.08))],
  [SWAP_FROM + 40, TOP_ROW, outExpo],
  [tapSafari + 12, TOP_ROW],
  [claudeBack + 6, DUAL, outExpo],
  [safariIn + 10, withCam(DUAL, cam(560, 980, 1.03))],
  // 网页铺满：手机居中、侧过来一点；字幕退场后慢慢推近
  [browse + 30, withCam(tilt(PHONE_CENTER, 10, 2), cam(540, 960, 1.0))],
  [browse + 170, withCam(tilt(PHONE_CENTER, 6, 2), cam(540, 1000, 1.04))],
  [restorePart - 20, withCam(tilt(PHONE_CENTER, -6, 0), cam(540, 1060, 1.2))],
  // 还原：MacBook 放大做主角
  [restorePart + 30, MAC_HERO],
  [tapRestore - 6, withCam(MAC_HERO, cam(560, 960, 1.04))],
  [END - 10, withCam(MAC_HERO, cam(540, 900, 1.1))],
];

export const Swap: React.FC = () => (
  <Scene
    offset={SWAP_FROM}
    length={SWAP_LEN}
    bg={[
      [SWAP_FROM, PAL.swap, "SWAP"],
      [browse, PAL.safari, "SAFARI"],
      [restorePart, PAL.restore, "RESTORE"],
    ]}
    keys={KEYS}
    phone={({ g }) => {
      const s = phonePt(TAPS.swipeHome.x, TAPS.swipeHome.y);
      const sf = phonePt(TAPS.safari.x, TAPS.safari.y);
      const r = phonePt(TAPS.restore.x, TAPS.restore.y);
      return (
        <>
          <Swipe frame={g} at={swipe - 6} x={s.x} y={s.y - 6} dist={130} />
          <Ripple frame={g} at={tapSafari} x={sf.x} y={sf.y} />
          <Ripple frame={g} at={tapRestore} x={r.x} y={r.y} />
        </>
      );
    }}
    mon={({ g }) => <Frame frame={g} at={claudeFull - 6} out={safariIn + 30} l={0.6} t={1} w={98.8} h={98} radius={1} />}
    mac={({ g }) => <Frame frame={g} at={back} out={END} {...WINDOWS.safari} radius={1} />}
    world={({ g, shot }) => {
      const phoneMid = screenPoint("phone", shot.phone, 0.5, 0.5);
      const monMid = screenPoint("mon", shot.mon, 0.5, 0.5);
      const macWin = screenPoint("mac", shot.mac, (WINDOWS.safari.l + WINDOWS.safari.w / 2) / 100, (WINDOWS.safari.t + WINDOWS.safari.h / 2) / 100);
      const monTag = screenPoint("mon", shot.mon, 0.74, 0.12);
      const macTag = screenPoint("mac", shot.mac, 0.72, 0.14);
      return (
        <>
          <Flight frame={g} at={claudeBack - 4} dur={claudeFull - claudeBack} from={phoneMid} to={monMid} icon="claude" bend={-0.22} />
          <Flight frame={g} at={safariOut - 8} dur={safariIn - safariOut + 8} from={macWin} to={phoneMid} icon="safari" bend={0.25} />
          <Tag frame={g} at={claudeFull} out={browse + 10} x={monTag.x} y={monTag.y} text="Claude · 回到大屏" icon="claude" size={32} />
          <Tag frame={g} at={safariOut + 4} out={browse + 10} x={macTag.x} y={macTag.y} text="Safari · 飞上手机" icon="safari" size={32} />
          <Tag frame={g} at={back + 4} out={END} x={macTag.x} y={macTag.y} text="Safari · 回到原位" icon="safari" size={34} />
        </>
      );
    }}
    over={({ g }) => (
      <>
        <Caption frame={g} at={SWAP_FROM + 18} out={tapSafari + 10} zh="指示条 · 回资源库" en="SWIPE UP · APP LIBRARY" x={540} y={190} align="center" size={78} />
        <Caption frame={g} at={claudeBack} out={browse + 6} zh="一点 · 两屏同动" en="ONE TAP · TWO SCREENS" x={64} y={1410} size={88} stack />
        <Caption frame={g} at={browse + 20} out={browse + 170} zh="网页铺满 · 宽度自适应" en="ANY APP · FITS THE PHONE" x={540} y={190} align="center" size={70} />
        <Caption frame={g} at={restorePart + 20} out={END - 12} zh="一键还原 · 原位归来" en="RESTORE" x={64} y={1120} size={84} stack />
      </>
    )}
  />
);
