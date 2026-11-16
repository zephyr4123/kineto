import { clamp, outExpo } from "../../../engine/motion";
import { interpolate } from "remotion";
import { phonePt, screenPoint } from "../components/devices";
import { cam, MON_HERO, PHONE_MAX, TOP_ROW, tilt, withCam } from "../components/layouts";
import { Caption, Flight, Frame, Ripple, ScrollHint, Tag } from "../components/overlays";
import { Scene } from "../components/scene";
import { type ShotKey } from "../components/stage";
import { at, EVENTS, TAPS } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 第一幕：在 Ghostty 卡片上点「新建窗口」→ 外接屏上新窗口全屏出生、退出全屏缩小、滑走 → 手机上铺满、字号 +2 →
// 启动 Claude Code、发出「总结一下今天的提交」→ 回复出来，单指往下翻。
// 字幕先在顶上的字幕带里出现两秒多，退场后镜头再推近，字和画面不抢。

export const CREATE_FROM = sec(ACTS.create);
export const CREATE_LEN = sec(ACTS.swap) - CREATE_FROM;
const END = CREATE_FROM + CREATE_LEN;

const tapNew = at(TAPS.newWindow.t);
const extIn = at(EVENTS.extWindowIn);
const settled = at(EVENTS.extWindowSettled);
const extOut = at(EVENTS.extWindowOut);
const filled = at(EVENTS.phoneFilled);
const fontUp = at(EVENTS.fontUp);
const claude = at(16.5);
const reply = at(36.5);
const scrollFrom = at(EVENTS.scrollFrom);
const scrollTo = at(EVENTS.scrollTo);

// 外接屏上那扇新窗口退出全屏后停在左下角：Snug 日志记的原位是 800×632 点，外接屏 1920×1080 点，
// 换算成 41.7% 宽、58.5% 高，录像里窗口顶边在 40.8% 处。镜头推过去看它缩小、滑走
const MON_ZOOM = withCam(MON_HERO, cam(380, 700, 1.32));

const KEYS: readonly ShotKey[] = [
  [CREATE_FROM, TOP_ROW],
  [tapNew + 40, TOP_ROW],
  [extIn - 6, MON_HERO],
  [extIn + 40, MON_ZOOM, outExpo],
  [extOut + 4, MON_ZOOM],
  // 铺满以后两块 Mac 屏退场、手机放大，一直接到 Claude 开工；字幕退场后镜头慢慢推近、往下走
  [filled + 14, PHONE_MAX],
  [claude + 150, PHONE_MAX],
  [reply - 1, withCam(PHONE_MAX, cam(540, 1260, 1.18))],
  // 读回复：手机侧过来一点；字幕退场后推近到正文
  [reply, withCam(tilt(PHONE_MAX, -12, 4), cam(560, 960, 1.0))],
  [reply + 150, withCam(tilt(PHONE_MAX, -10, 4), cam(560, 980, 1.02))],
  [END - 40, withCam(tilt(PHONE_MAX, -3, 2), cam(540, 1100, 1.3))],
  [END, withCam(tilt(PHONE_MAX, 0, 0), cam(540, 1060, 0.92))],
];

export const Create: React.FC = () => (
  <Scene
    offset={CREATE_FROM}
    length={CREATE_LEN}
    bg={[
      [CREATE_FROM, PAL.create, "NEW WINDOW"],
      [claude, PAL.claude, "CLAUDE"],
      [reply, PAL.scroll, "SCROLL"],
    ]}
    keys={KEYS}
    phone={({ g }) => {
      const t = phonePt(TAPS.newWindow.x, TAPS.newWindow.y);
      return <Ripple frame={g} at={tapNew} x={t.x} y={t.y} />;
    }}
    mon={({ g }) => <Frame frame={g} at={settled} out={extOut + 4} l={0} t={40.8} w={41.7} h={58.5} radius={1} />}
    world={({ g, shot }) => {
      const from = screenPoint("mon", shot.mon, 0.21, 0.7);
      const to = screenPoint("phone", shot.phone, 0.5, 0.45);
      const top = screenPoint("phone", shot.phone, 0.74, 0);
      return (
        <>
          <Flight frame={g} at={extOut - 2} dur={filled - extOut + 4} from={from} to={to} icon="ghostty" />
          <Tag frame={g} at={fontUp} out={claude - 4} x={top.x} y={top.y - 170} text="字号 +2" size={36} />
        </>
      );
    }}
    over={({ g, shot, screen }) => {
      const side = screen(screenPoint("phone", shot.phone, 1, 0.55));
      const hint = interpolate(g, [scrollFrom, scrollTo], [0, 1], clamp);
      return (
        <>
          <Caption frame={g} at={CREATE_FROM + 16} out={extIn - 8} zh="新建窗口" en="TAP · NEW WINDOW" x={540} y={190} align="center" size={88} />
          <Caption frame={g} at={extIn + 4} out={filled - 6} zh="大屏出生 · 飞上手机" en="BORN ON 4K" x={64} y={1250} size={84} stack />
          <Caption frame={g} at={filled} out={claude - 4} zh="竖屏铺满 · 字号放大" en="FULL SCREEN · BIGGER TEXT" x={540} y={190} align="center" size={72} />
          <Caption frame={g} at={claude + 6} out={claude + 150} zh="Claude Code · 竖屏开工" en="AGENT IN PORTRAIT" x={540} y={190} align="center" size={72} />
          <Caption frame={g} at={reply + 6} out={reply + 160} zh="单指滑动 · 原生手感" en="ONE-FINGER SCROLL" x={540} y={190} align="center" size={78} />
          {hint > 0 && hint < 1 ? <ScrollHint frame={g} at={scrollFrom} out={scrollTo} x={Math.min(side.x + 60, 1030)} y={side.y + 120} /> : null}
        </>
      );
    }}
  />
);
