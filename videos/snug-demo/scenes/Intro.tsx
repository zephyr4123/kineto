import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { DESK, DESK_OUT, TOP_ROW } from "../components/layouts";
import { Scene } from "../components/scene";
import { glide, type ShotKey } from "../components/stage";
import { LogLine } from "../components/type";
import { at } from "../edl";
import { ACTS, C, DISPLAY, PAL, SERIF, SLOGAN, sec, TAGLINE } from "../theme";

// 开场先说清这是什么：Snug 的图标和 slogan 在画面正中亮出来（配乐从饱满段的第一拍起），
// 然后 slogan 退到顶上，三台设备从三个方向错开飞进来落成一张桌面 —— 这时手机正好连上 UU，Snug 的手机屏就绪、资源库读出来。
// 最后镜头一推，交给第一个动作。

export const INTRO_FROM = sec(ACTS.hook);
export const INTRO_LEN = sec(ACTS.create) - INTRO_FROM;

const LAND = 150;
const RISE = 84;
const READY = at(2.89);
const KEYS: readonly ShotKey[] = [
  [0, DESK_OUT],
  [LAND, DESK],
  [INTRO_LEN - 44, DESK],
  [INTRO_LEN, TOP_ROW, glide],
];

const WORDS = SLOGAN.split(" ");

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
      // slogan：先在正中，设备进场时缩到顶上；镜头推走前退场
      const up = prog(g, RISE, 64, outExpo);
      const leave = interpolate(g, [INTRO_LEN - 40, INTRO_LEN - 12], [1, 0], clamp);
      const icon = prog(g, 0, 26, outExpo);
      const zh = prog(g, 30, 24, outExpo);
      return (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: interpolate(up, [0, 1], [560, 118]),
            textAlign: "center",
            transform: `scale(${interpolate(up, [0, 1], [1, 0.66])})`,
            transformOrigin: "50% 0",
            opacity: leave,
          }}
        >
          <Img
            src={staticFile(assets.snugIcon)}
            style={{ width: 132, height: 132, borderRadius: 30, boxShadow: "0 18px 40px rgba(31,99,255,0.22)", transform: `translateY(${(1 - icon) * 24}px) scale(${0.85 + 0.15 * icon})`, opacity: icon }}
          />
          <div style={{ marginTop: 34, fontFamily: DISPLAY, fontWeight: 800, fontSize: 104, lineHeight: 1.02, letterSpacing: "-0.035em", color: C.ink, padding: "0 60px" }}>
            {WORDS.map((w, i) => {
              const k = prog(g, 6 + i * 4, 26, outExpo);
              return (
                <span key={w} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: 8, marginRight: i < WORDS.length - 1 ? "0.24em" : 0 }}>
                  <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 105}%)`, color: w === "Native" ? C.blue : C.ink }}>{w}</span>
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 26, fontFamily: SERIF, fontWeight: 700, fontSize: 54, letterSpacing: "0.06em", color: C.ink2, opacity: zh, transform: `translateY(${(1 - zh) * 16}px)`, filter: `blur(${(1 - zh) * 6}px)` }}>
            {TAGLINE}
          </div>
          <div style={{ marginTop: 26, display: "flex", justifyContent: "center", height: 40 }}>
            <LogLine frame={g} at={Math.max(READY, LAND)} out={INTRO_LEN} text="手机屏 #164 已就绪（540 宽）" size={34} />
          </div>
        </div>
      );
    }}
  />
);
