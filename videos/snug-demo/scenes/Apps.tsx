import { outExpo } from "../../../engine/motion";
import { phonePt, screenPoint } from "../components/devices";
import { cam, PHONE_CENTER, PHONE_LEFT, QUIT, tilt, withCam } from "../components/layouts";
import { Caption, Flight, Frame, Ripple, Tag } from "../components/overlays";
import { Scene } from "../components/scene";
import { type ShotKey } from "../components/stage";
import { at, EVENTS, TAPS, WINDOWS } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 第三幕：「全部」里翻一翻、搜 chat、点开没在跑的 ChatGPT（内建屏上冷启动，窗口一出现就被放上手机）→
// 用手机键盘打字、发出「你好呀，你是谁」、看回复 → 回资源库连点两下退出（窗口先回内建屏正中，再退出）。

export const APPS_FROM = sec(ACTS.apps);
export const APPS_LEN = sec(ACTS.model) - APPS_FROM;
const END = APPS_FROM + APPS_LEN;

const tapAll = at(TAPS.allApps.t);
const tapSearch = at(TAPS.search.t);
const tapChat = at(TAPS.chatgpt.t);
const launch = at(EVENTS.macChatgptLaunch);
const chat = at(92.9);
const tapSend = at(TAPS.send.t);
const reply = at(98.25);
const quitPart = at(108);
const tapQuit = at(TAPS.quit.t);
const macBack = at(EVENTS.macChatgptBack);
const macGone = at(EVENTS.macChatgptGone);

const KEYS: readonly ShotKey[] = [
  [APPS_FROM, PHONE_LEFT],
  [launch - 30, withCam(PHONE_LEFT, cam(520, 1020, 1.04))],
  // 冷启动：镜头推到 MacBook 上看窗口出现
  [launch + 12, withCam(PHONE_LEFT, cam(800, 700, 1.25)), outExpo],
  [chat - 2, withCam(PHONE_LEFT, cam(640, 900, 1.06))],
  // ChatGPT：手机居中；字幕退场后镜头压到下半截的输入框看打字
  [chat, tilt(PHONE_CENTER, 8, 2)],
  [chat + 120, withCam(tilt(PHONE_CENTER, 6, 2), cam(540, 980, 1.02))],
  [chat + 175, withCam(tilt(PHONE_CENTER, 4, 2), cam(540, 1480, 1.32))],
  [reply - 1, withCam(tilt(PHONE_CENTER, 2, 0), cam(540, 1500, 1.34))],
  // 回复出来：拉回全景，再慢慢推到正文
  [reply + 36, withCam(tilt(PHONE_CENTER, -6, 0), cam(540, 960, 1.0)), outExpo],
  [reply + 150, withCam(tilt(PHONE_CENTER, -6, 0), cam(540, 980, 1.02))],
  [quitPart - 4, withCam(tilt(PHONE_CENTER, -8, 0), cam(540, 1000, 1.2))],
  // 退出：手机左边、MacBook 右下
  [quitPart + 36, QUIT],
  [macBack + 10, withCam(QUIT, cam(600, 1150, 1.06))],
  [END, withCam(QUIT, cam(560, 1080, 1.02))],
];

export const Apps: React.FC = () => (
  <Scene
    offset={APPS_FROM}
    length={APPS_LEN}
    bg={[
      [APPS_FROM, PAL.search, "SEARCH"],
      [chat, PAL.chat, "CHATGPT"],
      [quitPart, PAL.quit, "QUIT"],
    ]}
    keys={KEYS}
    phone={({ g }) => {
      const a = phonePt(TAPS.allApps.x, TAPS.allApps.y);
      const s = phonePt(TAPS.search.x, TAPS.search.y);
      const c = phonePt(TAPS.chatgpt.x, TAPS.chatgpt.y);
      const send = phonePt(TAPS.send.x, TAPS.send.y);
      const q = phonePt(TAPS.quit.x, TAPS.quit.y);
      return (
        <>
          <Ripple frame={g} at={tapAll} x={a.x} y={a.y} />
          <Ripple frame={g} at={tapSearch} x={s.x} y={s.y} />
          <Ripple frame={g} at={tapChat} x={c.x} y={c.y} />
          <Ripple frame={g} at={tapSend} x={send.x} y={send.y} />
          <Ripple frame={g} at={tapQuit} x={q.x} y={q.y} />
          <Ripple frame={g} at={tapQuit + 22} x={q.x} y={q.y} />
        </>
      );
    }}
    mac={({ g }) => (
      <>
        <Frame frame={g} at={launch + 6} out={chat - 4} {...WINDOWS.chatgpt} radius={1} />
        <Frame frame={g} at={macBack} out={macGone + 30} {...WINDOWS.chatgpt} radius={1} />
      </>
    )}
    world={({ g, shot }) => {
      const macMid = screenPoint("mac", shot.mac, 0.5, 0.5);
      const phoneMid = screenPoint("phone", shot.phone, 0.5, 0.5);
      const macUnder = screenPoint("mac", shot.mac, 0.4, 1);
      const macCorner = screenPoint("mac", shot.mac, 0.72, 0.14);
      return (
        <>
          <Flight frame={g} at={launch + 30} dur={chat - launch - 30} from={macMid} to={phoneMid} icon="chatgpt" bend={-0.25} />
          <Tag frame={g} at={launch + 8} out={chat} x={macUnder.x} y={macUnder.y + 70} text="冷启动 · 直上手机" icon="chatgpt" size={32} />
          <Flight frame={g} at={tapQuit + 30} dur={macBack - tapQuit - 30} from={phoneMid} to={macMid} icon="chatgpt" bend={0.25} />
          <Tag frame={g} at={macGone + 6} out={END} x={macCorner.x} y={macCorner.y} text="ChatGPT · 已退出" icon="chatgpt" size={34} />
        </>
      );
    }}
    over={({ g }) => (
      <>
        <Caption frame={g} at={APPS_FROM + 22} out={launch - 20} zh="未开的 App · 搜索直开" en="SEARCH · LAUNCH ANY APP" x={540} y={190} align="center" size={70} />
        <Caption frame={g} at={chat + 8} out={chat + 120} zh="手机键盘 · 照常输入" en="TYPE ON THE PHONE" x={540} y={190} align="center" size={74} />
        <Caption frame={g} at={reply + 30} out={reply + 150} zh="即问即答 · 竖屏阅读" en="READ IN PORTRAIT" x={540} y={190} align="center" size={74} />
        <Caption frame={g} at={quitPart + 30} out={END - 10} zh="连点两下 · 干净退出" en="DOUBLE-TAP · QUIT" x={560} y={500} size={80} stack />
      </>
    )}
  />
);
