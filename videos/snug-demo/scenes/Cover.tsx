import { AbsoluteFill, Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop } from "../components/backdrop";
import { Freeze } from "../components/devices";
import { CAM0, Devices, type Shot } from "../components/stage";
import { Hand } from "../components/touch";
import { at, srcAt } from "../edl";
import { TOUCH_DRAGS } from "../touch";
import { C, DISPLAY, PAL, SANS, SERIF, TAGLINE } from "../theme";

// 两张封面：横版 1920×1080（B 站、YouTube），竖版 1080×1920（抖音；小红书、视频号的信息流按 3:4 裁中间，
// 要紧的字和设备都放在 240–1680 之间，裁掉的只有最底下的 tagline 和开源那一行）。
// 画面是录像里真实的一帧：在手机上用单指往回翻 Snug 的 README（素材 70.6 秒起的那一下拖动），
// 外接屏上是 Claude Code，内建屏是 Safari 走后露出的桌面。手指按片子里量出来的那次拖动画，三块屏取同一时刻。

const DRAG = TOUCH_DRAGS.find((d) => d.f === 2119)!;
/** 按下后 5 帧：手指刚开始往下拖，README 顶上的图标和标题正在屏幕中间 */
const G = at(DRAG.f / 30) + 5;
const T = srcAt(G);

const META = "MIT 开源 · 免费 · macOS 14+";
const SCREENS = "MacBook、外接 4K 屏、iPhone";

const Desk: React.FC<{ shot: Shot }> = ({ shot }) => (
  <Devices
    shot={{ ...shot, cam: CAM0 }}
    offset={0}
    length={1}
    still={(screen, shown) => <Freeze screen={screen} t={T} shown={shown} />}
    phoneHand={<Hand g={G} />}
  />
);

const Brand: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
    <Img src={staticFile(assets.snugIcon)} style={{ width: size * 0.84, height: size * 0.84, borderRadius: size * 0.19, boxShadow: "0 14px 32px rgba(31,99,255,0.24)" }} />
    <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 0.92, letterSpacing: "-0.05em", color: C.ink, paddingBottom: size * 0.1 }}>Snug</div>
  </div>
);

const Title: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: "0.04em", color: C.ink }}>实机演示</div>
);

/** 横版：左边字、右边三台设备 */
export const CoverLandscape: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.hook.mid, overflow: "hidden" }}>
    {/* 全片的底是按竖屏画的，横版里放大到铺满宽度、取中间一段 */}
    <div style={{ position: "absolute", left: 0, top: (1080 - 1920 * (1920 / 1080)) / 2, width: 1080, height: 1920, transform: `scale(${1920 / 1080})`, transformOrigin: "0 0" }}>
      <Backdrop frame={0} cam={CAM0} keys={[[0, PAL.hook]]} />
    </div>
    <Desk
      shot={{
        mon: { x: 1390, y: 410, w: 840 },
        mac: { x: 1130, y: 820, w: 450 },
        phone: { x: 1700, y: 740, w: 255 },
      }}
    />
    <div style={{ position: "absolute", left: 120, top: 210, whiteSpace: "nowrap" }}>
      <Brand size={118} />
      <div style={{ marginTop: 36 }}>
        <Title size={164} />
      </div>
      <div style={{ marginTop: 22, fontFamily: SANS, fontWeight: 500, fontSize: 40, lineHeight: 1.5, color: C.ink2 }}>
        {SCREENS}
        <br />
        三块屏同时录制
      </div>
      <div style={{ marginTop: 56, fontFamily: SERIF, fontWeight: 700, fontSize: 46, letterSpacing: "0.04em", color: C.ink }}>{TAGLINE}</div>
      <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.ink2 }}>{META}</div>
    </div>
  </AbsoluteFill>
);

/** 竖版：上面字、中间三台设备、最底下 tagline */
export const CoverPortrait: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.hook.mid, overflow: "hidden" }}>
    <Backdrop frame={0} cam={CAM0} keys={[[0, PAL.hook]]} />
    <Desk
      shot={{
        mon: { x: 540, y: 960, w: 840 },
        mac: { x: 300, y: 1420, w: 470 },
        phone: { x: 815, y: 1385, w: 280 },
      }}
    />
    <div style={{ position: "absolute", left: 0, right: 0, top: 280, display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
      <Brand size={112} />
      <div style={{ marginTop: 34 }}>
        <Title size={176} />
      </div>
      <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 500, fontSize: 38, color: C.ink2 }}>{SCREENS} 三块屏同时录制</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1736, textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 46, letterSpacing: "0.04em", color: C.ink }}>{TAGLINE}</div>
      <div style={{ marginTop: 12, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.ink2 }}>{META}</div>
    </div>
  </AbsoluteFill>
);
