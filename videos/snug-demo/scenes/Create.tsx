import { outExpo } from "../../../engine/motion";
import { phonePt, screenPoint } from "../components/devices";
import { cam, MON_HERO, PHONE_MAX, READ, TOP_ROW, tilt, withCam } from "../components/layouts";
import { Flight, Spotlight } from "../components/marks";
import { Scene } from "../components/scene";
import type { ShotKey } from "../components/stage";
import { Echo, Headline, Label } from "../components/type";
import { at, EVENTS, WINDOWS } from "../edl";
import { TOUCH_TAPS } from "../touch";
import { ACTS, PAL, sec } from "../theme";

// 在 Ghostty 卡片上点「新建窗口」→ 外接屏上新窗口全屏出生、退出全屏缩小、滑走 → 手机上铺满、字号 +2 →
// 启动 Claude Code、发出「总结一下今天的提交」→ 回复出来，单指往回翻、再往下读（这段落在歌里安静的第二轮主歌上）。

export const CREATE_FROM = sec(ACTS.create);
export const CREATE_LEN = sec(ACTS.swap) - CREATE_FROM;
const END = CREATE_FROM + CREATE_LEN;

const NEW = TOUCH_TAPS.find((t) => t.name === "newWindow")!;
const tapNew = at(NEW.t);
const extIn = at(EVENTS.extWindowIn);
const settled = at(EVENTS.extWindowSettled);
const extOut = at(EVENTS.extWindowOut);
const filled = at(EVENTS.phoneFilled);
const fontUp = at(EVENTS.fontUp);
const claude = at(16.5);
const prompt = at(25.5);
const reading = at(32);

// 外接屏上那扇新窗口的中心（屏幕上的比例）：镜头推过去看它缩小、滑走
const WIN = { u: (WINDOWS.ghostty.l + WINDOWS.ghostty.w / 2) / 100, v: (WINDOWS.ghostty.t + WINDOWS.ghostty.h / 2) / 100 };

const KEYS: readonly ShotKey[] = [
  [CREATE_FROM, TOP_ROW],
  [tapNew - 70, TOP_ROW],
  // 点之前镜头往手机上半截靠一点
  [tapNew - 6, withCam(TOP_ROW, cam(600, 1090, 1.18))],
  [tapNew + 44, withCam(TOP_ROW, cam(600, 1090, 1.18))],
  [extIn - 2, MON_HERO],
  [extIn + 34, withCam(MON_HERO, cam(400, 740, 1.3)), outExpo],
  [extOut - 8, withCam(MON_HERO, cam(400, 740, 1.3))],
  // 拉回来看窗口飞上手机、铺满
  [extOut + 26, MON_HERO],
  [filled + 40, PHONE_MAX],
  [claude + 120, PHONE_MAX],
  [reading - 2, withCam(PHONE_MAX, cam(540, 1140, 1.14))],
  // 读回复：手机让到右边、侧过来，左边竖排一行字；之后慢慢推近正文
  [reading + 52, READ],
  [END - 60, withCam(tilt(READ, -4, 2), cam(610, 1060, 1.14))],
  [END, withCam(tilt(READ, 0, 0), cam(600, 1010, 1.04))],
];

export const Create: React.FC = () => (
  <Scene
    offset={CREATE_FROM}
    length={CREATE_LEN}
    bg={[
      [CREATE_FROM, PAL.create],
      [claude, PAL.claude],
      [reading + 30, PAL.read],
    ]}
    keys={KEYS}
    mon={({ g }) => <Spotlight frame={g} at={settled - 4} out={extOut + 6} {...WINDOWS.ghostty} />}
    world={({ g, shot }) => (
      <Flight
        frame={g}
        at={extOut - 2}
        dur={filled - extOut + 4}
        from={screenPoint("mon", shot.mon, WIN.u, WIN.v)}
        to={screenPoint("phone", shot.phone, 0.5, 0.45)}
        icon="ghostty"
      />
    )}
    over={({ g, shot, screen }) => {
      const tap = phonePt(NEW.x, NEW.y);
      const tapAt = screen(screenPoint("phone", shot.phone, tap.x / 440, tap.y / 774));
      const text = screen(screenPoint("phone", shot.phone, 0.32, 0.1));
      return (
        <>
          <Label frame={g} at={tapNew + 2} out={tapNew + 56} anchor={tapAt} to={{ x: tapAt.x + 70, y: tapAt.y - 440 }} title="新建窗口" sub="按菜单项「New Window」" />
          <Headline
            frame={g}
            at={extIn + 6}
            out={filled + 34}
            lines={["生于大屏", "归于掌心"]}
            x={80}
            y={1300}
            size={104}
            logs={[{ at: extIn + 24, text: "新建后 1.3s 出现，放上手机屏" }]}
          />
          <Label frame={g} at={fontUp + 2} out={claude - 6} anchor={text} to={{ x: text.x + 90, y: 330 }} title="字号自动放大" sub="字号比原来 +2 级" />
          <Headline frame={g} at={claude + 10} out={prompt - 8} lines={["竖屏终端，照常开工"]} x={540} y={200} align="center" size={78} logs={[{ at: claude + 30, text: "$ claude-max" }]} />
          <Echo frame={g} from={prompt + 2} to={prompt + 8} out={prompt + 150} text="总结一下今天的提交" x={540} y={230} size={80} note="手机键盘输入" />
          <Headline
            frame={g}
            at={reading + 40}
            out={reading + 300}
            lines={["单指翻阅", "一如原生"]}
            x={250}
            y={500}
            size={84}
            vertical
            logs={[{ at: reading + 76, text: "手势翻译已开启" }]}
          />
        </>
      );
    }}
  />
);
