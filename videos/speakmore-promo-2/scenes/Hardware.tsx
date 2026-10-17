import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Logo } from "../components/Brand";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 硬件：副歌一进来就一拍一切。处理器 → Apple、Intel、AMD → 直接运行；显卡 → NVIDIA、AMD、Intel → 自动加速；
// 最后六家并成一张两行的表，逐格打勾。只有词，没有句子。

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
  const cut = CUTS.find((c) => frame >= b(c.from) && frame < b(c.to));
  const out = prog(frame, b(15.2), 26, EASE.inOut);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {cut ? <Cut frame={frame} cut={cut} /> : null}
      {frame >= b(MATRIX) ? (
        <AbsoluteFill style={{ transform: `scale(${1 + 0.12 * out})`, opacity: 1 - out, filter: out > 0.01 ? `blur(${8 * out}px)` : undefined }}>
          <Matrix frame={frame} />
        </AbsoluteFill>
      ) : null}

      <Flash frame={frame} at={[0, b(6)]} strength={0.8} />
      <Flash frame={frame} at={[b(1), b(2), b(3), b(4), b(7), b(8), b(9), b(10), b(MATRIX)]} strength={0.22} dur={10} />
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

const Cut: React.FC<{ frame: number; cut: (typeof CUTS)[number] }> = ({ frame, cut }) => {
  const at = b(cut.from);
  const k = punch(frame, at, 0.07, 24);
  const sharp = prog(frame, at, 8);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${k})`, filter: sharp < 0.99 ? `blur(${6 * (1 - sharp)}px)` : undefined }}>
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

const Matrix: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
    {ROWS.map((row, r) => (
      <div key={row.name} style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ width: 230, textShadow: SHADOW, ...show(frame, b(MATRIX) + r * 6) }}>
          <div style={{ fontSize: 50, fontWeight: 700 }}>{row.name}</div>
          <div style={{ marginTop: 6, fontSize: 28, color: COLOR.ink2, letterSpacing: "0.06em" }}>{row.note}</div>
        </div>
        {row.brands.map((brand, i) => {
          const n = r * 3 + i;
          const checked = prog(frame, checkAt(n), 14);
          return (
            <div
              key={brand.name}
              style={{
                position: "relative",
                width: 400,
                height: 214,
                borderRadius: 30,
                background: COLOR.glass,
                boxShadow: `0 0 0 1px ${COLOR.line}, 0 24px 60px oklch(0 0 0 / 0.35)`,
                backdropFilter: "blur(20px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 26,
                ...show(frame, b(MATRIX) + 4 + n * 3, undefined, 30),
              }}
            >
              <div style={{ height: 86, display: "flex", alignItems: "center" }}>
                <Logo src={brand.src} height={86 * brand.height} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 500, color: COLOR.ink2 }}>{brand.name}</div>
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: COLOR.green,
                  color: "oklch(0.2 0.03 150)",
                  opacity: checked,
                  transform: `scale(${interpolate(checked, [0, 1], [0.4, 1], clamp)})`,
                }}
              >
                <Glyph icon={UI.check} size={28} />
              </div>
            </div>
          );
        })}
      </div>
    ))}
  </AbsoluteFill>
);
