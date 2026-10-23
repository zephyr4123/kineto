import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp, prog, punch } from "../../../engine/motion";
import { UI } from "../../../engine/speakmore/icons";
import { Logo } from "../../../engine/speakmore/Logo";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS } from "../theme";

// 硬件（照第二支的硬件一节，改成浅底）：两行，左边一列名目，右边三家标志排在一道细线上；一束光沿线扫过，扫到哪家哪家亮起来。
// 处理器直接运行，显卡自动加速（官网 speed.hardware 的说法）。Apple 的标志素材是白色的，浅底上改用图标库里同形的深色字形。

type Brand = { name: string; logo?: string; height: number; apple?: boolean };
const ROWS = [
  {
    name: "CPU",
    note: "处理器直接运行",
    brands: [
      { name: "Apple M 系列", height: 1, apple: true },
      { name: "Intel Core", logo: assets.logoIntel, height: 0.6 },
      { name: "AMD Ryzen", logo: assets.logoAmd, height: 0.4 },
    ],
  },
  {
    name: "GPU",
    note: "显卡自动加速",
    brands: [
      { name: "NVIDIA GeForce", logo: assets.logoNvidia, height: 0.95 },
      { name: "AMD Radeon", logo: assets.logoAmd, height: 0.4 },
      { name: "Intel Arc · Iris Xe", logo: assets.logoIntel, height: 0.6 },
    ],
  },
] as const satisfies readonly { name: string; note: string; brands: readonly Brand[] }[];

const GRID = { left: 300, right: 1620, top: 330, row: 250, logo: 84, first: 860, gap: 330 };

/** lit(n)：第 n 家（先处理器三家、再显卡三家）亮起的帧 */
export const Hardware: React.FC<{ at: number; lit: (n: number) => number; out: number }> = ({ at, lit, out }) => {
  const frame = useCurrentFrame();
  const z = prog(frame, out, 16, EASE.inOut);
  if (frame < at || z >= 1) return null;
  return (
    <AbsoluteFill style={{ opacity: 1 - z, filter: z > 0 ? `blur(${10 * z}px)` : undefined, transform: `translateY(${60 - 20 * z}px)` }}>
      {ROWS.map((row, r) => {
        const y = GRID.top + r * GRID.row;
        const enter = at + r * 6;
        const from = lit(r * 3);
        const to = lit(r * 3 + 2);
        const sweep = interpolate(frame, [from - 14, to + 14], [GRID.first - 200, GRID.first + 2 * GRID.gap + 200], clamp);
        const sweeping = frame >= from - 14 && frame <= to + 30;
        const a = prog(frame, enter, 18);
        return (
          <div key={row.name}>
            <div style={{ position: "absolute", left: GRID.left, top: y + 4, opacity: a, transform: `translateY(${16 * (1 - a)}px)` }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 650, letterSpacing: "-0.01em", color: COLOR.ink }}>{row.name}</div>
              <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 28, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.12em" }}>{row.note}</div>
            </div>
            {/* 细线：从左画到右 */}
            <div style={{ position: "absolute", left: GRID.left, width: GRID.right - GRID.left, top: y + 170, height: 1.5, background: `linear-gradient(90deg, transparent, ${COLOR.line} 20%, ${COLOR.line} 85%, transparent)`, transformOrigin: "0 0", transform: `scaleX(${prog(frame, enter, 40, EASE.inOut)})` }} />
            {sweeping ? (
              <>
                <div style={{ position: "absolute", left: sweep - 160, top: y - 30, width: 320, height: 210, borderRadius: "50%", background: "oklch(0.75 0.1 265 / 0.16)", filter: "blur(40px)" }} />
                <div style={{ position: "absolute", left: sweep - 90, top: y + 169, width: 180, height: 3, background: `linear-gradient(90deg, transparent, ${COLOR.cinnabar}, transparent)` }} />
              </>
            ) : null}
            {row.brands.map((brand: Brand, i) => {
              const n = r * 3 + i;
              const on = prog(frame, lit(n), 18);
              const show = prog(frame, enter + 6 + i * 4, 16);
              return (
                <div key={brand.name} style={{ position: "absolute", left: GRID.first + i * GRID.gap, top: y, transform: `translateX(-50%) translateY(${14 * (1 - show)}px)`, opacity: show, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
                  <div style={{ height: GRID.logo + 20, display: "flex", alignItems: "center", opacity: 0.3 + 0.7 * on, filter: `grayscale(${1 - on})`, transform: `scale(${punch(frame, lit(n), 0.1, 20)})` }}>
                    {brand.apple ? <Glyph icon={UI.apple} size={GRID.logo * brand.height} style={{ color: COLOR.ink }} /> : <Logo src={brand.logo ?? ""} height={GRID.logo * brand.height} />}
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 500, whiteSpace: "nowrap", color: on > 0.5 ? COLOR.ink : COLOR.faint }}>{brand.name}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
