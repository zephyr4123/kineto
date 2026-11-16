import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { DESK, DESK_OUT, TOP_ROW } from "../components/layouts";
import { Tag } from "../components/overlays";
import { Scene } from "../components/scene";
import { glide, type ShotKey } from "../components/stage";
import { ACTS, C, PAL, SF, ZH, bar, sec } from "../theme";

// 开场：标题先出来，三台设备从三个方向错开飞进来，在第一个小节头（2.28 秒）落位成一张桌面；
// 手机这时正好连上 UU，Snug 手机屏出现、资源库读出来。最后镜头一推，变成第一幕「手机居中、Mac 屏在上」的版式。

export const INTRO_FROM = sec(ACTS.intro);
export const INTRO_LEN = sec(ACTS.create) - INTRO_FROM;

const LAND = sec(bar(0));
const KEYS: readonly ShotKey[] = [
  [0, DESK_OUT],
  [LAND, DESK],
  [INTRO_LEN - 50, DESK],
  [INTRO_LEN, TOP_ROW, glide],
];

export const Intro: React.FC = () => (
  <Scene
    offset={INTRO_FROM}
    length={INTRO_LEN}
    bg={[[0, PAL.intro, "SNUG"]]}
    keys={KEYS}
    adjust={(s, g) => {
      if (g > LAND) return s;
      // 三台设备错开入场：显示器先到，MacBook 次之，手机踩着小节头最后落下
      const k = (from: number) => prog(g, from, LAND - from, outExpo);
      const mix = (a: number, b: number, t: number) => a + (b - a) * t;
      const km = k(56);
      const kb = k(74);
      const kp = k(92);
      return {
        ...s,
        mon: { ...DESK.mon, y: mix(DESK_OUT.mon.y, DESK.mon.y, km), rot: (1 - km) * -6 },
        mac: { ...DESK.mac, x: mix(DESK_OUT.mac.x, DESK.mac.x, kb), rot: (1 - kb) * 8 },
        phone: { ...DESK.phone, y: mix(DESK_OUT.phone.y, DESK.phone.y, kp), rot: (1 - kp) * 10 },
      };
    }}
    world={({ g, shot }) => {
      const leave = interpolate(g, [INTRO_LEN - 50, INTRO_LEN - 20], [1, 0], clamp);
      return (
        <div style={{ opacity: leave }}>
          <Tag frame={g} at={LAND + 8} out={INTRO_LEN} x={shot.mon.x} y={shot.mon.y + 448} text="外接显示器" size={30} />
          <Tag frame={g} at={LAND + 16} out={INTRO_LEN} x={shot.mac.x} y={shot.mac.y + 250} text="MacBook" size={30} />
          <Tag frame={g} at={LAND + 24} out={INTRO_LEN} x={shot.phone.x} y={shot.phone.y + 395} text="iPhone · UU远程" size={30} />
        </div>
      );
    }}
    over={({ g }) => {
      // 标题：先在中间亮相，设备进场时缩到顶上
      const up = prog(g, 50, 60, outExpo);
      const leave = interpolate(g, [INTRO_LEN - 46, INTRO_LEN - 16], [1, 0], clamp);
      const icon = prog(g, 4, 26, outExpo);
      return (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: interpolate(up, [0, 1], [560, 70]),
              textAlign: "center",
              transform: `scale(${interpolate(up, [0, 1], [1, 0.52])})`,
              transformOrigin: "50% 0",
              opacity: leave,
            }}
          >
            <Img
              src={staticFile(assets.snugIcon)}
              style={{ width: 150, height: 150, borderRadius: 34, boxShadow: "0 18px 40px rgba(31,99,255,0.25)", transform: `scale(${0.5 + 0.5 * icon}) rotate(${(1 - icon) * -20}deg)`, opacity: icon }}
            />
            <div style={{ marginTop: 26, fontFamily: SF, fontSize: 30, fontWeight: 700, letterSpacing: "0.3em", color: C.ink2, opacity: prog(g, 10, 20) }}>SNUG · LIVE RECORDING</div>
            <div style={{ marginTop: 10, fontFamily: ZH, fontSize: 168, fontWeight: 900, letterSpacing: "0.04em", color: C.ink, opacity: prog(g, 14, 20), transform: `translateY(${(1 - prog(g, 14, 30)) * 40}px)` }}>
              三屏实录
            </div>
            <div style={{ marginTop: 6, fontFamily: ZH, fontSize: 60, fontWeight: 700, letterSpacing: "0.08em", color: C.ink2, opacity: prog(g, 24, 20) }}>
              一部手机 <span style={{ color: C.blue }}>·</span> 两块屏幕
            </div>
          </div>
        </>
      );
    }}
  />
);
