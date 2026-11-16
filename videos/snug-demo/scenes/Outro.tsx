import { interpolate } from "remotion";
import { clamp, inOutQuint, outExpo, prog } from "../../../engine/motion";
import { RepoCard } from "../../../engine/snug/repo";
import { Freeze } from "../components/devices";
import { cam, MODEL, OUTRO, withCam } from "../components/layouts";
import { Scene } from "../components/scene";
import type { ShotKey } from "../components/stage";
import { Contact, Finger, Ripple } from "../components/touch";
import { Lockup } from "../components/type";
import { FREEZE_AT } from "../edl";
import { ACTS, bar, C, CREDIT, MONO, PAL, REPO_URL, SERIF, sec } from "../theme";

// 落版：机型段最后一帧定格，手机从特写退下去，三台设备收成画面下方的一张小桌面；
// 上面是 Snug 的字标（图标 + Snug + slogan，和开场同一套），GitHub 仓库卡片升上来，一根手指点亮 Star（落在尾声的第 26 小节）；最后是地址、许可和致谢，随音乐淡出。

export const OUTRO_FROM = sec(ACTS.outro);
export const OUTRO_LEN = sec(ACTS.end) - OUTRO_FROM;
const END = OUTRO_FROM + OUTRO_LEN;
const STAR = sec(bar(26));

const CARD = { x: 90, y: 690 };
/** Star 按钮的中心（卡片里的位置） */
const STAR_AT = { x: CARD.x + 100, y: CARD.y + 175 };

// 起手和机型段的最后一帧对上：手机还在原处，另两台在画外
const IN: ShotKey[1] = {
  mon: { ...OUTRO.mon, y: OUTRO.mon.y + 500, op: 0 },
  mac: { ...OUTRO.mac, x: OUTRO.mac.x - 500, op: 0 },
  phone: { ...MODEL.phone, ry: 0, rx: 0 },
  cam: cam(470, 1050, 1.06),
};
const KEYS: readonly ShotKey[] = [
  [OUTRO_FROM, IN],
  [OUTRO_FROM + 96, OUTRO],
  [END, withCam(OUTRO, cam(540, 930, 1.03))],
];


export const Outro: React.FC = () => (
  <Scene
    offset={OUTRO_FROM}
    length={OUTRO_LEN}
    bg={[[OUTRO_FROM, PAL.outro]]}
    keys={KEYS}
    hand={false}
    still={(screen, shown) => <Freeze screen={screen} t={FREEZE_AT} shown={shown} />}
    over={({ g }) => {
      const k = (d: number, dur = 26) => prog(g, OUTRO_FROM + d, dur, outExpo);
      const card = prog(g, STAR - 120, 34, outExpo);
      // 手指：从右下伸过来，按下 Star，停一下抬走
      const fx = interpolate(g, [STAR - 46, STAR - 2], [STAR_AT.x + 620, STAR_AT.x], { ...clamp, easing: inOutQuint });
      const fy = interpolate(g, [STAR - 46, STAR - 2], [STAR_AT.y + 520, STAR_AT.y], { ...clamp, easing: inOutQuint });
      const lift = interpolate(g, [STAR - 46, STAR - 2, STAR + 10, STAR + 24], [1, 0, 0, 1], { ...clamp, easing: inOutQuint });
      const press = interpolate(g, [STAR - 3, STAR, STAR + 8, STAR + 12], [0, 1, 1, 0], clamp);
      const hand = interpolate(g, [STAR - 46, STAR - 36, STAR + 24, STAR + 40], [0, 1, 1, 0], clamp);
      const away = interpolate(g, [STAR + 10, STAR + 40], [0, 1], { ...clamp, easing: inOutQuint });
      const burst = prog(g, STAR, 22, outExpo);
      return (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", transform: "scale(0.72)", transformOrigin: "50% 0" }}>
            <Lockup frame={g} at={OUTRO_FROM + 56} />
          </div>
          <div style={{ position: "absolute", left: CARD.x, top: CARD.y, opacity: card, transform: `translateY(${(1 - card) * 90}px)` }}>
            <RepoCard starred={g >= STAR} burst={burst} />
          </div>
          {hand > 0 ? (
            <div style={{ position: "absolute", left: 0, top: 0, opacity: hand }}>
              <Ripple x={STAR_AT.x} y={STAR_AT.y} t={g - STAR} size={1.5} />
              <Contact x={STAR_AT.x} y={STAR_AT.y} press={press} size={1.3} />
              <div style={{ position: "absolute", left: fx + away * 260, top: fy + away * 300, transform: "scale(1.25)", transformOrigin: "0 0" }}>
                <Finger lift={lift} press={press} />
              </div>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 38, color: C.ink, opacity: k(STAR - OUTRO_FROM + 36) }}>{REPO_URL}</div>
            <div style={{ marginTop: 14, fontFamily: SERIF, fontWeight: 600, fontSize: 32, letterSpacing: "0.06em", color: C.ink2, opacity: k(STAR - OUTRO_FROM + 50) }}>MIT 开源 · 免费下载 · macOS 14+</div>
            <div style={{ marginTop: 12, fontFamily: SERIF, fontWeight: 500, fontSize: 24, color: C.ink2, opacity: k(STAR - OUTRO_FROM + 64) }}>{CREDIT}</div>
          </div>
        </>
      );
    }}
  />
);
