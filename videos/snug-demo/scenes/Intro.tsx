import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { DESK, DESK_OUT, TOP_ROW } from "../components/layouts";
import { Scene } from "../components/scene";
import { glide, type ShotKey } from "../components/stage";
import { SloganLockup } from "../components/type";
import { ACTS, PAL, sec } from "../theme";

// 开场先说清这是什么：Snug 的图标、slogan 字标和一句「UU远程 的 Mac 辅助插件」在画面里亮出来（配乐从饱满段的第一拍起），
// 然后字标缩到顶上，三台设备从三个方向错开飞进来落成一张桌面 —— 这时手机正好连上 UU，Snug 的手机屏就绪、资源库读出来。
// 最后镜头一推，交给第一个动作。

export const INTRO_FROM = sec(ACTS.hook);
export const INTRO_LEN = sec(ACTS.create) - INTRO_FROM;

/** 设备落位（3.1 秒）；左上角的录制角标从这时起出现 */
export const LAND = 186;
const RISE = 120;
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
      // 三台设备错开入场：显示器先到，MacBook 次之，手机最后落下
      const k = (from: number) => prog(g, from, LAND - from, outExpo);
      const mix = (a: number, b: number, t: number) => a + (b - a) * t;
      const km = k(RISE - 6);
      const kb = k(RISE + 12);
      const kp = k(RISE + 26);
      return {
        ...s,
        mon: { ...DESK.mon, y: mix(DESK_OUT.mon.y, DESK.mon.y, km), rot: (1 - km) * -5 },
        mac: { ...DESK.mac, x: mix(DESK_OUT.mac.x, DESK.mac.x, kb), rot: (1 - kb) * 7 },
        phone: { ...DESK.phone, y: mix(DESK_OUT.phone.y, DESK.phone.y, kp), rot: (1 - kp) * 9 },
      };
    }}
    over={({ g }) => {
      // 字标：先在正中，设备进场时缩到顶上；镜头推走前退场
      const up = prog(g, RISE, 64, outExpo);
      const leave = interpolate(g, [INTRO_LEN - 40, INTRO_LEN - 12], [1, 0], clamp);
      const icon = prog(g, 0, 24, outExpo);
      return (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: interpolate(up, [0, 1], [540, 104]),
            display: "flex",
            justifyContent: "center",
            transform: `scale(${interpolate(up, [0, 1], [1, 0.44])})`,
            transformOrigin: "50% 0",
            opacity: leave,
          }}
        >
          <SloganLockup
            frame={g}
            at={4}
            note="Snug：UU远程 的 Mac 辅助插件"
            head={
              <Img
                src={staticFile(assets.snugIcon)}
                style={{ width: 120, height: 120, borderRadius: 27, marginBottom: 30, boxShadow: "0 18px 40px rgba(31,99,255,0.22)", transform: `translateY(${(1 - icon) * 20}px) scale(${0.85 + 0.15 * icon})`, opacity: icon }}
              />
            }
          />
        </div>
      );
    }}
  />
);
