import { outExpo } from "../../../engine/motion";
import { screenPoint } from "../components/devices";
import { cam, PHONE_CENTER, PHONE_LEFT, QUIT, tilt, withCam } from "../components/layouts";
import { Flight, Spotlight } from "../components/marks";
import { Scene } from "../components/scene";
import type { ShotKey } from "../components/stage";
import { Echo, Headline, Label } from "../components/type";
import { at, EVENTS, WINDOWS } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 「全部」里翻一翻、搜 chat、点开没在跑的 ChatGPT（内建屏上只看到菜单栏换成 ChatGPT，窗口一出现就被放上手机）→
// 用手机键盘打字、发出「你好呀，你是谁」、看回复 → 回资源库连点两下退出（窗口先回内建屏正中，再退出）。

export const APPS_FROM = sec(ACTS.apps);
export const APPS_LEN = sec(ACTS.model) - APPS_FROM;
const END = APPS_FROM + APPS_LEN;

const chatFrom = at(EVENTS.typeChat);
const chatTo = at(EVENTS.typeChatDone);
const launch = at(EVENTS.macChatgptLaunch);
const onPhone = at(92.62);
const chat = at(92.9);
const helloFrom = at(EVENTS.typeHello);
const helloTo = at(EVENTS.typeHelloDone);
const reply = at(98.25);
const quitPart = at(108);
const confirm = at(110.1);
const macBack = at(EVENTS.macChatgptBack);
const quitLog = at(110.39);

const KEYS: readonly ShotKey[] = [
  [APPS_FROM, PHONE_LEFT],
  [launch - 24, withCam(PHONE_LEFT, cam(520, 1010, 1.03))],
  // 冷启动：镜头往 MacBook 靠，看菜单栏换成 ChatGPT，手机上同时显示「正在打开」
  [launch + 20, withCam(PHONE_LEFT, cam(600, 900, 1.07)), outExpo],
  [onPhone + 4, withCam(PHONE_LEFT, cam(590, 920, 1.06))],
  // ChatGPT 铺满手机：手机居中，打字时镜头不动，字在上面同步放大
  [chat + 30, tilt(PHONE_CENTER, 8, 2)],
  [helloTo + 10, withCam(tilt(PHONE_CENTER, 4, 2), cam(540, 1000, 1.03))],
  // 回复出来：推近正文
  [reply + 40, withCam(tilt(PHONE_CENTER, -6, 0), cam(540, 900, 1.14)), outExpo],
  [quitPart - 16, withCam(tilt(PHONE_CENTER, -8, 0), cam(540, 960, 1.2))],
  // 退出：手机左上、MacBook 在下；窗口回到内建屏时镜头往 MacBook 靠
  [quitPart + 36, QUIT],
  [macBack + 14, withCam(QUIT, cam(620, 1180, 1.08))],
  [END, withCam(QUIT, cam(570, 1060, 1.0))],
];

export const Apps: React.FC = () => (
  <Scene
    offset={APPS_FROM}
    length={APPS_LEN}
    bg={[
      [APPS_FROM, PAL.search],
      [chat, PAL.chat],
      [quitPart, PAL.quit],
    ]}
    keys={KEYS}
    mac={({ g }) => <Spotlight frame={g} at={macBack} out={macBack + 50} {...WINDOWS.chatgpt} />}
    world={({ g, shot }) => (
      <>
        <Flight frame={g} at={onPhone - 6} dur={chat - onPhone + 14} from={screenPoint("mac", shot.mac, 0.5, 0.45)} to={screenPoint("phone", shot.phone, 0.5, 0.5)} icon="chatgpt" bend={-0.25} />
        <Flight frame={g} at={confirm} dur={macBack - confirm + 14} from={screenPoint("phone", shot.phone, 0.5, 0.5)} to={screenPoint("mac", shot.mac, 0.5, 0.5)} icon="chatgpt" bend={0.25} />
      </>
    )}
    over={({ g, shot, screen }) => {
      const menu = screen(screenPoint("mac", shot.mac, 0.035, 0.012));
      return (
        <>
          <Headline frame={g} at={APPS_FROM + 20} out={launch - 22} lines={["未启动的", "搜索直开"]} x={1020} y={880} align="right" size={92} />
          <Echo frame={g} from={chatFrom} to={chatTo} out={launch - 22} text="chat" x={1020} y={1180} size={110} align="right" note="搜索" />
          <Label frame={g} at={launch + 22} out={chat + 24} anchor={menu} to={{ x: menu.x + 40, y: menu.y + 540 }} title="冷启动，直上手机" sub="ChatGPT 启动后 0.9s 出现，放上手机屏" />
          <Echo frame={g} from={helloFrom} to={helloTo} out={reply + 30} text="你好呀，你是谁" x={540} y={250} size={84} note="手机键盘输入" />
          <Headline frame={g} at={quitPart + 30} out={END - 8} lines={["连点两下", "干净退出"]} x={580} y={430} size={92} logs={[{ at: quitLog, text: "请 ChatGPT 退出" }]} />
        </>
      );
    }}
  />
);
