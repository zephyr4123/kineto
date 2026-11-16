import { outExpo } from "../../../engine/motion";
import { screenPoint } from "../components/devices";
import { cam, DUAL, MAC_HERO, PHONE_CENTER, TOP_ROW, tilt, withCam } from "../components/layouts";
import { Flight, Spotlight } from "../components/marks";
import { Scene } from "../components/scene";
import type { ShotKey } from "../components/stage";
import { Headline, Label } from "../components/type";
import { at, EVENTS, WINDOWS } from "../edl";
import { TOUCH_SWIPES } from "../touch";
import { ACTS, PAL, sec } from "../theme";

// 上滑指示条回资源库，点 Safari —— 一个动作，两块 Mac 屏一起变：Claude 的窗口飞回外接屏、恢复全屏（正好踩在鼓回来的第 11 小节上），
// Safari 离开内建屏、铺满手机（Safari 限定了最小宽度，Snug 把手机屏换到 580 宽）→ 在手机上看网页 → 回资源库点「还原」，Safari 回到内建屏原位。
// 字讲的是背后的功能：窗口自动吸附到手机、换下来的自动回原位（不用手动拖）；手机屏宽度随窗口自适应；还原回到原位。

export const SWAP_FROM = sec(ACTS.swap);
export const SWAP_LEN = sec(ACTS.apps) - SWAP_FROM;
const END = SWAP_FROM + SWAP_LEN;

const swipe = at(TOUCH_SWIPES[0].from);
const tapSafari = at(56.57);
const claudeBack = at(EVENTS.extClaudeBack);
const claudeFull = at(EVENTS.extClaudeFull);
const safariOut = at(EVENTS.macSafariOut);
const safariIn = at(EVENTS.phoneSafari);
const browse = at(61.5);
const restorePart = at(78);
const back = at(EVENTS.macSafariBack);

const SAFARI = { u: (WINDOWS.safari.l + WINDOWS.safari.w / 2) / 100, v: (WINDOWS.safari.t + WINDOWS.safari.h / 2) / 100 };

const KEYS: readonly ShotKey[] = [
  [SWAP_FROM, withCam(TOP_ROW, cam(540, 1180, 1.12))],
  [swipe + 40, withCam(TOP_ROW, cam(540, 1080, 1.04))],
  [tapSafari + 4, TOP_ROW],
  // 鼓回来的那一拍切成两屏联动
  [claudeBack + 8, DUAL, outExpo],
  [safariIn + 20, withCam(DUAL, cam(560, 990, 1.03))],
  // 网页铺满：手机居中、侧过来一点，慢慢推近
  [browse + 30, withCam(tilt(PHONE_CENTER, 10, 2), cam(540, 960, 1.0))],
  [restorePart - 16, withCam(tilt(PHONE_CENTER, -4, 2), cam(540, 1050, 1.16))],
  // 还原：MacBook 放大做主角，Safari 回来以后推近它
  [restorePart + 34, MAC_HERO],
  [back - 4, withCam(MAC_HERO, cam(560, 960, 1.04))],
  [END, withCam(MAC_HERO, cam(510, 840, 1.12))],
];

export const Swap: React.FC = () => (
  <Scene
    offset={SWAP_FROM}
    length={SWAP_LEN}
    bg={[
      [SWAP_FROM, PAL.swap],
      [browse, PAL.safari],
      [restorePart, PAL.restore],
    ]}
    keys={KEYS}
    mac={({ g }) => (
      <>
        <Spotlight frame={g} at={claudeBack + 20} out={safariOut + 4} {...WINDOWS.safari} dim={0.26} />
        <Spotlight frame={g} at={back} out={END} {...WINDOWS.safari} />
      </>
    )}
    world={({ g, shot }) => (
      <>
        <Flight frame={g} at={claudeBack - 4} dur={claudeFull - claudeBack} from={screenPoint("phone", shot.phone, 0.5, 0.5)} to={screenPoint("mon", shot.mon, 0.5, 0.5)} icon="claude" bend={-0.22} />
        <Flight frame={g} at={safariOut - 8} dur={safariIn - safariOut + 8} from={screenPoint("mac", shot.mac, SAFARI.u, SAFARI.v)} to={screenPoint("phone", shot.phone, 0.5, 0.5)} icon="safari" bend={0.25} />
      </>
    )}
    over={({ g, shot, screen }) => {
      const macWin = screen(screenPoint("mac", shot.mac, WINDOWS.safari.l / 100 + 0.04, (WINDOWS.safari.t + WINDOWS.safari.h) / 100 - 0.04));
      return (
        <>
          <Headline
            frame={g}
            at={claudeBack + 6}
            out={browse + 16}
            lines={["在手机上点开，窗口自动过来", "换下来的窗口，自动回原位"]}
            x={70}
            y={1385}
            size={48}
            sub="不用在 Mac 上手动拖窗口"
          />
          <Headline frame={g} at={browse + 36} out={browse + 230} lines={["手机屏宽度自适应"]} x={84} y={200} size={64} sub="Safari 这类有最小宽度的窗口，也能铺满" />
          <Label frame={g} at={back + 4} out={END + 2} anchor={macWin} to={{ x: macWin.x + 60, y: 1290 }} title="点「还原」" sub="窗口回到 Mac 上原来的位置" size={48} />
        </>
      );
    }}
  />
);
