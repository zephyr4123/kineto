import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Logo } from "../components/Brand";
import { Sfx, swellBefore } from "../components/Fx";
import { deepCamera } from "../components/Stage";
import { mix, prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 硬件：副歌一进来就一拍一切（前后两切快速叠化，不闪白）。处理器 → Apple、Intel、AMD → 直接运行；显卡 → NVIDIA、AMD、Intel → 自动加速；
// 最后六家并成两行，排在两道细线上，一束光沿线扫过、逐家亮起。只有词，没有句子。

export const HARDWARE_FRAMES = b(16);
export const HARDWARE_CAMERA = deepCamera(HARDWARE_FRAMES);

type Brand = { src: string; height: number; name: string };
// 字标宽窄不一，按高度排：Apple 是个方形的符号，放高一点；AMD 的字标最扁
const APPLE: Brand = { src: assets.logoApple, height: 1, name: "Apple M 系列" };
const INTEL: Brand = { src: assets.logoIntel, height: 0.6, name: "Intel Core" };
const AMD: Brand = { src: assets.logoAmd, height: 0.4, name: "AMD Ryzen" };
const NVIDIA: Brand = { src: assets.logoNvidia, height: 0.95, name: "NVIDIA GeForce" };
const RADEON: Brand = { ...AMD, name: "AMD Radeon" };
const ARC: Brand = { ...INTEL, name: "Intel Arc · Iris Xe" };
const CPU = [APPLE, INTEL, AMD];
const GPU = [NVIDIA, RADEON, ARC];

// 每一切的起止拍
const CUTS = [
  { from: 0, to: 1, word: "处理器" },
  { from: 1, to: 2, brand: APPLE },
  { from: 2, to: 3, brand: INTEL },
  { from: 3, to: 4, brand: AMD },
  { from: 4, to: 6, word: "直接运行", row: CPU },
  { from: 6, to: 7, word: "显卡" },
  { from: 7, to: 8, brand: NVIDIA },
  { from: 8, to: 9, brand: RADEON },
  { from: 9, to: 10, brand: ARC },
  { from: 10, to: 12, word: "自动加速", row: GPU },
] as const;
const MATRIX = 12;

export const Hardware: React.FC = () => {
  const frame = useCurrentFrame();
  // 上一切在拍点后 SWAP 帧内淡掉，和这一切叠一下，不硬切
  const cuts = CUTS.filter((c) => frame >= b(c.from) && frame < b(c.to) + SWAP);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {cuts.map((cut) => (
        <Cut key={cut.from} frame={frame} cut={cut} />
      ))}
      {frame >= b(MATRIX) ? <Matrix frame={frame} /> : null}

      <Sfx at={0} name="sfxFlash" volume={0.4} />
      <Sfx at={b(6)} name="sfxFlash" volume={0.35} />
      {(["sfxNote0", "sfxNote1", "sfxNote2"] as const).map((name, i) => (
        <Sfx key={name} at={b(1 + i)} name={name} volume={0.32} />
      ))}
      {(["sfxNote2", "sfxNote3", "sfxNote4"] as const).map((name, i) => (
        <Sfx key={`g${name}`} at={b(7 + i)} name={name} volume={0.32} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Sfx key={`t${i}`} at={checkAt(i)} name="sfxTap" volume={0.22} />
      ))}
      <Sfx at={swellBefore(HARDWARE_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

/** 一切换到下一切时，两边交叠淡入淡出的帧数 */
const SWAP = 8;

const Cut: React.FC<{ frame: number; cut: (typeof CUTS)[number] }> = ({ frame, cut }) => {
  const at = b(cut.from);
  const k = punch(frame, at, 0.07, 24);
  const sharp = prog(frame, at, SWAP);
  const gone = prog(frame, b(cut.to), SWAP, EASE.outQuint);
  const blur = 6 * (1 - sharp) + 6 * gone;
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", opacity: sharp * (1 - gone), transform: `scale(${k})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}
    >
      {"word" in cut ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 70 }}>
          <div style={{ fontSize: "row" in cut ? 150 : 190, fontWeight: 700, letterSpacing: "0.04em", textShadow: SHADOW }}>{cut.word}</div>
          {"row" in cut ? (
            <div style={{ display: "flex", alignItems: "center", gap: 90, height: 90 }}>
              {cut.row.map((brand, i) => (
                <div key={i} style={show(frame, at + 4 + i * 4, undefined, 16)}>
                  <Logo src={brand.src} height={90 * brand.height} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 56 }}>
          <div style={{ height: 210, display: "flex", alignItems: "center" }}>
            <Logo src={cut.brand.src} height={210 * cut.brand.height} style={{ filter: "drop-shadow(0 6px 30px oklch(0 0 0 / 0.35))" }} />
          </div>
          <div style={{ fontSize: 50, fontWeight: 500, letterSpacing: "0.04em", color: COLOR.ink2, textShadow: SHADOW, ...show(frame, at + 3, undefined, 12) }}>
            {cut.brand.name}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** 第 i 格（先处理器三格、再显卡三格）打勾的那一帧：每半拍一格 */
const checkAt = (i: number) => b(MATRIX + 0.75 + i * 0.5);

const ROWS = [
  { name: "处理器", note: "直接运行", brands: CPU },
  { name: "显卡", note: "自动加速", brands: GPU },
] as const;
// 两行，不用卡片：左边一列名目，右边三家标志排在一道细线上；一束光沿着线扫过去，扫到哪家哪家亮起来
const GRID = { left: 230, right: 1690, top: 330, row: 250, logo: 84, first: 870, gap: 330 };

const Matrix: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    {ROWS.map((row, r) => {
      const y = GRID.top + r * GRID.row;
      const enter = b(MATRIX) + r * 6;
      const sweep = interpolate(frame, [checkAt(r * 3) - 14, checkAt(r * 3 + 2) + 14], [GRID.first - 200, GRID.first + 2 * GRID.gap + 200], clamp);
      const sweeping = frame >= checkAt(r * 3) - 14 && frame <= checkAt(r * 3 + 2) + 30;
      return (
        <div key={row.name}>
          <div style={{ position: "absolute", left: GRID.left, top: y + 6, textShadow: SHADOW, ...show(frame, enter) }}>
            <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: "0.04em" }}>{row.name}</div>
            <div style={{ marginTop: 10, fontSize: 26, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.2em" }}>{row.note}</div>
          </div>
          {/* 细线：从左画到右 */}
          <div
            style={{
              position: "absolute",
              left: GRID.left,
              width: GRID.right - GRID.left,
              top: y + 170,
              height: 1,
              background: "linear-gradient(90deg, oklch(1 0 0 / 0.05), oklch(1 0 0 / 0.3) 30%, oklch(1 0 0 / 0.3) 80%, oklch(1 0 0 / 0.05))",
              transformOrigin: "0 0",
              transform: `scaleX(${prog(frame, enter, 40, EASE.inOut)})`,
            }}
          />
          {/* 扫过去的那束光：线上一点亮、上方一片淡光 */}
          {sweeping ? (
            <>
              <div style={{ position: "absolute", left: sweep - 160, top: y - 30, width: 320, height: 210, borderRadius: "50%", background: "oklch(0.9 0.04 255 / 0.12)", filter: "blur(40px)" }} />
              <div style={{ position: "absolute", left: sweep - 90, top: y + 169, width: 180, height: 3, background: "linear-gradient(90deg, transparent, white, transparent)", boxShadow: "0 0 14px white" }} />
            </>
          ) : null}
          {row.brands.map((brand, i) => {
            const n = r * 3 + i;
            const lit = prog(frame, checkAt(n), 18);
            const x = GRID.first + i * GRID.gap;
            return (
              <div key={brand.name} style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, ...show(frame, enter + 6 + i * 4, undefined, 16) }}>
                <div
                  style={{
                    height: GRID.logo + 20,
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.32 + 0.68 * lit,
                    filter: `grayscale(${1 - lit}) drop-shadow(0 0 ${18 * lit}px oklch(1 0 0 / ${0.25 * lit}))`,
                    transform: `scale(${punch(frame, checkAt(n), 0.08, 20)})`,
                  }}
                >
                  <Logo src={brand.src} height={GRID.logo * brand.height} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "0.04em", whiteSpace: "nowrap", color: mix(COLOR.ink, COLOR.faint, lit) }}>{brand.name}</div>
              </div>
            );
          })}
        </div>
      );
    })}
  </AbsoluteFill>
);
