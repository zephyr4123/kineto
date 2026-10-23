import { AbsoluteFill } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { Seal } from "../../../engine/speakmore/Seal";
import { assets } from "../assets.gen";
import { Tile } from "../components/Brand";
import { WindowsMark, WinWallpaper } from "../../../engine/speakmore/Screens";
import { Desktop } from "../components/Stage";
import { UI } from "../icons";
import { COLOR, SANS, SHADOW } from "../theme";

// 第二支的封面，主题是"大更新"。和第一支（真桌面、左边品牌字、右边浮着 App 窗口）不同，这里做成海报：
// 底沿一道斜线劈开，一边是 Mac 的海上日落（片子里的桌面），一边是 Windows 的极光（片子里代码画的壁纸），
// 中间一道光缝；正中大字"大更新"，下面两个系统、几项主要更新，最底一排九家模型的彩色标志。
// 横版 16:9（B 站 / 视频号 / X），竖版 3:4（小红书）。写的都是片子里讲过的。

const FULL = [1, 1, 1, 1, 1];
const VENDORS = [
  { src: assets.logoGemini },
  { src: assets.logoOpenai },
  { src: assets.logoQwen },
  { src: assets.logoBailian },
  { src: assets.logoDeepseek },
  { src: assets.logoKimi, dark: true },
  { src: assets.logoZhipu },
  { src: assets.logoMinimax },
  { src: assets.logoAlibabaCloud },
] as const;
const FEATURES = ["29 个模型", "三种识别方式", "自定义接口", "国内源下载"];

/**
 * 劈开的底：先铺 Mac 那张（铺满），Windows 那张按 clip 剪成另一半；seam 是光缝的两端（画面像素）。
 * 两张都按 1920×1080 画，竖版时按高度放大铺满再居中
 */
const Split: React.FC<{ width: number; height: number; clip: string; seam: [number, number, number, number] }> = ({ width, height, clip, seam }) => {
  const k = Math.max(width / 1920, height / 1080);
  const layer: React.CSSProperties = { position: "absolute", left: (width - 1920 * k) / 2, top: (height - 1080 * k) / 2, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${k})` };
  const [x1, y1, x2, y2] = seam;
  return (
    <AbsoluteFill style={{ background: COLOR.canvas, overflow: "hidden" }}>
      <div style={layer}>
        {/* 放大 1.2 倍、以偏上的一点为中心：菜单栏和程序坞都推到画面外，只留天和海 */}
        <AbsoluteFill style={{ transformOrigin: "50% 30%", transform: "scale(1.2)" }}>
          <Desktop focus={0.8} />
        </AbsoluteFill>
      </div>
      <AbsoluteFill style={{ clipPath: clip }}>
        <div style={layer}>
          <WinWallpaper />
        </div>
      </AbsoluteFill>
      {/* 光缝：一道细亮线，外面一层宽的虚光 */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="seam" gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset="0" stopColor="white" stopOpacity={0.1} />
            <stop offset="0.5" stopColor="white" stopOpacity={0.95} />
            <stop offset="1" stopColor="white" stopOpacity={0.1} />
          </linearGradient>
          <filter id="seam-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.85 0.08 260)" strokeWidth={26} filter="url(#seam-glow)" opacity={0.55} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#seam)" strokeWidth={2} />
      </svg>
      {/* 正中压暗一片，字落在上面稳；四角也压一点 */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 58% 52% at 50% 48%, oklch(0.1 0.015 280 / 0.62), transparent 78%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, oklch(0.08 0.01 300 / 0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

/** 正中那一组：印章和名字、大字、两个系统、几项更新、标志 */
const Poster: React.FC<{ s: number; featureRows: readonly (readonly string[])[]; logoRows: readonly (readonly number[])[] }> = ({ s, featureRows, logoRows }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, color: COLOR.ink, textShadow: SHADOW }}>
    <div style={{ display: "flex", alignItems: "center", gap: 22 * s }}>
      <Seal size={92 * s} bars={FULL} base={1} />
      <span style={{ fontSize: 62 * s, fontWeight: 600, letterSpacing: "-0.01em" }}>SpeakMore</span>
    </div>
    <div style={{ marginTop: 26 * s, fontSize: 250 * s, fontWeight: 800, letterSpacing: "0.08em", marginRight: "-0.08em", lineHeight: 1.05, textShadow: `0 6px 40px oklch(0 0 0 / 0.55), 0 0 80px oklch(0.85 0.06 260 / 0.25)` }}>
      大更新
    </div>
    <div style={{ marginTop: 18 * s, display: "flex", alignItems: "center", gap: 54 * s, fontSize: 46 * s, fontWeight: 500 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 16 * s }}>
        <Glyph icon={UI.apple} size={48 * s} />
        Mac
      </span>
      <i style={{ width: 1, height: 40 * s, background: "oklch(1 0 0 / 0.4)" }} />
      <span style={{ display: "flex", alignItems: "center", gap: 16 * s }}>
        <WindowsMark size={44 * s} />
        Windows
      </span>
    </div>
    <div style={{ marginTop: 46 * s, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * s }}>
      {featureRows.map((row) => (
        <div key={row.join()} style={{ fontSize: 34 * s, fontWeight: 500, color: "oklch(0.9 0.01 255)", letterSpacing: "0.12em" }}>
          {row.join("  ·  ")}
        </div>
      ))}
    </div>
    <div style={{ marginTop: 56 * s, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 * s }}>
      {logoRows.map((row) => (
        <div key={row.join()} style={{ display: "flex", gap: 22 * s }}>
          {row.map((i) => (
            <Tile key={i} src={VENDORS[i].src} size={66 * s} dark={"dark" in VENDORS[i]} />
          ))}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

const ALL = VENDORS.map((_, i) => i);

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Split width={1920} height={1080} clip="polygon(57% 0, 100% 0, 100% 100%, 43% 100%)" seam={[1094, -20, 826, 1100]} />
    <Poster s={1} featureRows={[FEATURES]} logoRows={[ALL]} />
  </AbsoluteFill>
);

export const CoverPortrait: React.FC = () => (
  <AbsoluteFill>
    <Split width={1080} height={1440} clip="polygon(0 58%, 100% 42%, 100% 100%, 0 100%)" seam={[-20, 838, 1100, 601]} />
    <Poster s={1.12} featureRows={[FEATURES.slice(0, 2), FEATURES.slice(2)]} logoRows={[ALL.slice(0, 5), ALL.slice(5)]} />
  </AbsoluteFill>
);
