import { interpolate } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { screenPoint } from "../components/devices";
import { DESK, DESK_OUT, TOP_ROW } from "../components/layouts";
import { Scene } from "../components/scene";
import { glide, type ShotKey } from "../components/stage";
import { Headline, Label, Lockup } from "../components/type";
import { ROLL } from "../edl";
import { ACTS, PAL, sec } from "../theme";

// 开场先说清这是什么：Snug 的图标和大字、slogan、一句「UU远程 的 Mac 辅助插件」在画面正中亮出来（垫着歌里收住的那一小节），
// 然后字标缩到顶上，三台设备从右、左、下三个方向错开飞进来，落成一张桌面时正好进饱满段 —— 这时手机正好连上 UU，Snug 的手机屏就绪、资源库读出来。
// 接着逐块标明是哪块屏（外接 4K 屏、MacBook 内建屏、iPhone），顶上换成「屏幕数量不限」；最后镜头一推，交给第一个动作。

export const INTRO_FROM = sec(ACTS.hook);
export const INTRO_LEN = sec(ACTS.create) - INTRO_FROM;

/** 设备开始进场（素材在这之前已经开放）；字标提前半秒缩到顶上，给显示器让路 */
const RISE = sec(ROLL) + 30;
/** 设备落位，正好是饱满段的头一拍；左上角的录制角标从这时起出现 */
export const LAND = sec(ACTS.hook + 3.6358);
/** 三块屏的标注依次出现 */
const NAME = LAND + 6;
/** 顶上的字标退场，换成「屏幕数量不限」 */
const POINT = NAME + 108;
/** 标注、标题退场，镜头推向第一个动作 */
const OUT = INTRO_LEN - 46;

const KEYS: readonly ShotKey[] = [
  [0, DESK_OUT],
  [LAND, DESK],
  [INTRO_LEN - 44, DESK],
  [INTRO_LEN, TOP_ROW, glide],
];

export const Intro: React.FC = () => (
  <Scene
    offset={INTRO_FROM}
    length={INTRO_LEN}
    bg={[[0, PAL.hook]]}
    keys={KEYS}
    adjust={(s, g) => {
      if (g > LAND) return s;
      // 三台设备错开入场：显示器从右边先到，MacBook 从左边次之，手机最后从下面升上来
      const k = (from: number) => prog(g, from, LAND - from, outExpo);
      const mix = (a: number, b: number, t: number) => a + (b - a) * t;
      const km = k(RISE);
      const kb = k(RISE + 14);
      const kp = k(RISE + 28);
      return {
        ...s,
        mon: { ...DESK.mon, x: mix(DESK_OUT.mon.x, DESK.mon.x, km), rot: (1 - km) * -6 },
        mac: { ...DESK.mac, x: mix(DESK_OUT.mac.x, DESK.mac.x, kb), rot: (1 - kb) * 7 },
        phone: { ...DESK.phone, y: mix(DESK_OUT.phone.y, DESK.phone.y, kp), rot: (1 - kp) * 9 },
      };
    }}
    over={({ g, shot, screen }) => {
      // 字标：先在正中，设备进场时缩到顶上（只留图标、Snug 和 slogan），标完三块屏后让位
      const up = prog(g, RISE - 30, 60, outExpo);
      const leave = interpolate(g, [POINT - 24, POINT - 4], [1, 0], clamp);
      const detail = interpolate(g, [RISE - 30, RISE - 6], [1, 0], clamp);
      // 三块屏的标注：点落在屏幕上，字写在设备旁边的空处
      const mon = screen(screenPoint("mon", shot.mon, 0.1, 0.1));
      const mac = screen(screenPoint("mac", shot.mac, 0.16, 0.86));
      const phone = screen(screenPoint("phone", shot.phone, 0.62, 0.9));
      // 手机的字写在机身下沿外面（机身高是宽的 2.13 倍）
      const phoneBottom = screen({ x: shot.phone.x, y: shot.phone.y + shot.phone.w * 1.065 }).y;
      return (
        <>
          {leave > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: interpolate(up, [0, 1], [690, 104]),
                display: "flex",
                justifyContent: "center",
                transform: `scale(${interpolate(up, [0, 1], [1, 0.5])})`,
                transformOrigin: "50% 0",
                opacity: leave,
              }}
            >
              <Lockup frame={g} at={4} note="UU远程 的 Mac 辅助插件" detail={detail} />
            </div>
          ) : null}
          <Label frame={g} at={NAME} out={OUT} anchor={mon} to={{ x: mon.x + 50, y: mon.y - 104 }} title="外接 4K 屏" />
          <Label frame={g} at={NAME + 16} out={OUT} anchor={mac} to={{ x: mac.x + 46, y: mac.y + 150 }} title="MacBook 内建屏" />
          <Label frame={g} at={NAME + 32} out={OUT} anchor={phone} to={{ x: phone.x - 60, y: phoneBottom + 62 }} title="iPhone" sub="通过 UU远程 连接" />
          <Headline frame={g} at={POINT} out={OUT} lines={["屏幕数量不限"]} x={540} y={130} align="center" size={68} sub="内建屏、外接屏上的窗口，都能放到手机上" />
        </>
      );
    }}
  />
);
