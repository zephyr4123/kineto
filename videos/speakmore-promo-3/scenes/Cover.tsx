import { AbsoluteFill } from "remotion";
import { NeonKey, TRIO } from "../components/NeonKey";
import { type Ring, Vortex } from "../components/Vortex";
import { AppIcon, Version } from "../components/kit";
import { COLOR, DISPLAY, SANS } from "../theme";

// 第三支的封面。不承接前两支（真桌面、劈开的两张壁纸），取这一支自己的两样招牌：
// 开场那道粒子漩涡定格成一圈绕着品牌字的光环，暗场的夜色和三项功能的霓虹键帽。
// 正中图标、小写的 speakmore 和版本号；下面三项功能平级，各带自己的热键和颜色。
// 横版 16:9（B 站 / 视频号 / X），竖版 3:4（小红书），和前两支一样。

/** 夜色的底：深靛，左上一团靛青的光、右下一团朱砂的光，品牌字背后再亮一点 */
const Night: React.FC<{ width: number; height: number; ring: Ring }> = ({ width, height, ring }) => (
  <AbsoluteFill style={{ background: COLOR.night, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: -width * 0.25, top: -height * 0.35, width: width * 0.9, height: height * 1.1, borderRadius: "50%", background: `radial-gradient(closest-side, color-mix(in oklab, ${COLOR.neonIndigo} 26%, transparent), transparent)` }} />
    <div style={{ position: "absolute", right: -width * 0.25, bottom: -height * 0.4, width: width * 0.85, height: height * 1.05, borderRadius: "50%", background: `radial-gradient(closest-side, color-mix(in oklab, ${COLOR.neonCinnabar} 18%, transparent), transparent)` }} />
    <div style={{ position: "absolute", left: ring.cx - ring.rx * 0.75, top: ring.cy - ring.ry * 1.6, width: ring.rx * 1.5, height: ring.ry * 3.2, borderRadius: "50%", background: "radial-gradient(closest-side, oklch(0.32 0.06 270 / 0.75), transparent)" }} />
    <Vortex width={width} height={height} ring={ring} seed="cover" />
    {/* 四角压暗一点，视线收到中间 */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, oklch(0.08 0.02 280 / 0.7) 100%)" }} />
  </AbsoluteFill>
);

const Wordmark: React.FC<{ size: number }> = ({ size }) => (
  <span style={{ fontFamily: DISPLAY, fontSize: size, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1, color: COLOR.nightInk, textShadow: "0 0 60px oklch(0.72 0.14 268 / 0.35)" }}>speakmore</span>
);

const Icon: React.FC<{ size: number }> = ({ size }) => <AppIcon size={size} style={{ filter: "drop-shadow(0 18px 40px oklch(0 0 0 / 0.55)) drop-shadow(0 0 50px oklch(0.72 0.14 268 / 0.35))" }} />;

/** 一项功能：键帽在上，英文名、中文名在下（横版三列等宽并排） */
const Feature: React.FC<{ item: (typeof TRIO)[number]; s: number }> = ({ item, s }) => (
  <div style={{ width: 500 * s, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 * s }}>
    <div style={{ display: "flex", gap: 12 * s }}>
      {item.keys.map((k) => (
        <NeonKey key={k} label={k} color={item.color} size={66 * s} />
      ))}
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * s }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 44 * s, fontWeight: 600, letterSpacing: "-0.015em", color: COLOR.nightInk, whiteSpace: "nowrap" }}>{item.name}</span>
      <span style={{ fontFamily: SANS, fontSize: 24 * s, letterSpacing: "0.2em", marginRight: "-0.2em", color: COLOR.nightInk2 }}>{item.zh}</span>
    </div>
  </div>
);

// 环几乎放平：一斜，总有一头会从字的下沿划过；前半圈整个从字下面过、后半圈从图标后面过
const WIDE: Ring = { cx: 960, cy: 445, rx: 830, ry: 205, tilt: 2, count: 1300 };

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Night width={1920} height={1080} ring={WIDE} />
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 150 }}>
        <Icon size={150} />
      </div>
      <div style={{ position: "absolute", top: 362, display: "flex", alignItems: "flex-start" }}>
        <Wordmark size={190} />
        <div style={{ position: "absolute", left: "100%", top: 8, marginLeft: 26 }}>
          <Version dark size={30} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 760, display: "flex", gap: 40 }}>
        {TRIO.map((item) => (
          <Feature key={item.name} item={item} s={1} />
        ))}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const TALL: Ring = { cx: 540, cy: 590, rx: 610, ry: 230, tilt: 2, count: 1100 };

/** 竖版：三项功能改成三行，键帽靠右排成一列，名字在右边 */
export const CoverPortrait: React.FC = () => (
  <AbsoluteFill>
    <Night width={1080} height={1440} ring={TALL} />
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 250 }}>
        <Icon size={150} />
      </div>
      <div style={{ position: "absolute", top: 448 }}>
        <Wordmark size={168} />
      </div>
      <div style={{ position: "absolute", top: 652 }}>
        <Version dark size={30} />
      </div>
      <div style={{ position: "absolute", top: 930, display: "flex", flexDirection: "column", gap: 46 }}>
        {TRIO.map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ display: "flex", gap: 12, width: 260, justifyContent: "flex-end" }}>
              {item.keys.map((k) => (
                <NeonKey key={k} label={k} color={item.color} size={70} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 420 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 46, fontWeight: 600, letterSpacing: "-0.015em", color: COLOR.nightInk, whiteSpace: "nowrap" }}>{item.name}</span>
              <span style={{ fontFamily: SANS, fontSize: 24, letterSpacing: "0.2em", color: COLOR.nightInk2 }}>{item.zh}</span>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
