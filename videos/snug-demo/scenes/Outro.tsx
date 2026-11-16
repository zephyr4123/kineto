import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Freeze } from "../components/devices";
import { OUTRO } from "../components/layouts";
import { Scene } from "../components/scene";
import { type ShotKey } from "../components/stage";
import { ACTS, C, PAL, SF, ZH, bar, sec } from "../theme";

// 落版：三台设备收回成一张桌面，屏幕停在最后的样子；上半是 Snug 的图标、名字、一句话主旨和开源地址。
// 第 23 小节起歌进入没有低音的尾声，标语在这时落定，最后随音乐淡出。

export const OUTRO_FROM = sec(ACTS.outro);
export const OUTRO_LEN = sec(ACTS.end) - OUTRO_FROM;
const END = OUTRO_FROM + OUTRO_LEN;
const CALM = sec(bar(23));
/** 和 snug-promo 落版同一句致谢 */
const CREDIT = "承接自 aoyamashou/UUyc-companion · 谨向 UU远程 致谢";

const KEYS: readonly ShotKey[] = [
  [OUTRO_FROM, { ...OUTRO, cam: { x: 540, y: 1150, z: 1.25 } }],
  [OUTRO_FROM + 70, OUTRO],
  [END, { ...OUTRO, cam: { x: 540, y: 990, z: 1.03 } }],
];

const Chip: React.FC<{ text: string; k: number }> = ({ text, k }) => (
  <div
    style={{
      padding: "10px 26px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.95)",
      boxShadow: "0 8px 24px rgba(16,24,40,0.12), 0 0 0 1px rgba(16,24,40,0.06)",
      fontFamily: ZH,
      fontSize: 34,
      fontWeight: 700,
      color: C.ink,
      opacity: k,
      transform: `translateY(${(1 - k) * 30}px) scale(${0.8 + 0.2 * k})`,
    }}
  >
    {text}
  </div>
);

export const Outro: React.FC = () => (
  <Scene
    offset={OUTRO_FROM}
    length={OUTRO_LEN}
    bg={[[OUTRO_FROM, PAL.outro, "SNUG"]]}
    keys={KEYS}
    still={(screen) => <Freeze screen={screen} t={137.0} />}
    over={({ g }) => {
      const k = (d: number, dur = 26) => prog(g, OUTRO_FROM + d, dur, outExpo);
      const out = interpolate(g, [END - 40, END], [1, 0], clamp);
      return (
        <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center", opacity: out }}>
          <Img
            src={staticFile(assets.snugIcon)}
            style={{ width: 132, height: 132, borderRadius: 31, boxShadow: "0 20px 46px rgba(31,99,255,0.28)", transform: `scale(${0.4 + 0.6 * k(10)}) rotate(${(1 - k(10)) * 25}deg)`, opacity: k(10) }}
          />
          <div style={{ marginTop: 14, fontFamily: SF, fontSize: 108, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, opacity: k(18), transform: `translateY(${(1 - k(18)) * 40}px)` }}>Snug</div>
          <div style={{ marginTop: 0, fontFamily: ZH, fontSize: 52, fontWeight: 800, color: C.ink, opacity: k(28), transform: `translateY(${(1 - k(28)) * 30}px)` }}>
            让 UU远程 在 iPhone 上更好用
          </div>
          <div style={{ marginTop: 26, display: "flex", justifyContent: "center", gap: 16 }}>
            <Chip text="开源" k={k(CALM - OUTRO_FROM - 30)} />
            <Chip text="免费" k={k(CALM - OUTRO_FROM - 22)} />
            <Chip text="macOS 插件" k={k(CALM - OUTRO_FROM - 14)} />
          </div>
          <div style={{ marginTop: 22, fontFamily: SF, fontSize: 34, fontWeight: 600, letterSpacing: "0.02em", color: C.ink2, opacity: k(CALM - OUTRO_FROM) }}>
            github.com/zephyr4123/snug
          </div>
          <div style={{ marginTop: 10, fontFamily: ZH, fontSize: 24, fontWeight: 500, color: C.ink2, opacity: k(CALM - OUTRO_FROM + 10) }}>{CREDIT}</div>
        </div>
      );
    }}
  />
);
