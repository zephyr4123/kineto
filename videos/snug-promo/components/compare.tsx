import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, mix, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { BLUE_FILL, C, SF, ZH } from "../theme";

// 对照段（原版 → Snug）用的两样东西：顶上的分段开关，和一串带序号、一步步弹出来的步骤标签。

const TW = 640;
const TH = 96;
const PAD = 7;
const THUMB_W = (TW - 2 * PAD) / 2;

/**
 * 分段开关「UU远程 原版 | Snug」：snug 从 0 到 1，滑块从左滑到右，白滑块换成蓝滑块，选中的那一边字变深（或变白）。
 * 滑块在半路略微拉长一点，像手指拨过去。at 起从上面落下来，until 起退掉。
 */
export const Toggle: React.FC<{ at: number; until?: number; y: number; snug: number }> = ({ at, until = Infinity, y, snug }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: outExpo });
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  if (p <= 0 || out >= 1) return null;
  const stretch = 1 + 0.14 * Math.sin(Math.PI * snug);
  const thumb: React.CSSProperties = {
    position: "absolute",
    top: PAD,
    left: PAD + snug * THUMB_W,
    width: THUMB_W,
    height: TH - 2 * PAD,
    borderRadius: (TH - 2 * PAD) / 2,
    transform: `scaleX(${stretch})`,
  };
  const label: React.CSSProperties = { position: "absolute", top: 0, width: TW / 2, height: TH, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: ZH, fontWeight: 600, fontSize: 38, letterSpacing: "0.04em" };
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - TW / 2,
        top: y,
        width: TW,
        height: TH,
        borderRadius: TH / 2,
        background: "rgba(208,221,242,0.88)",
        border: "1.5px solid rgba(11,26,51,0.08)",
        boxShadow: "inset 0 2px 6px rgba(20,40,90,0.12), 0 12px 30px rgba(20,40,90,0.1)",
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * -24 - 20 * out}px) scale(${0.94 + 0.06 * p})`,
        zIndex: 11,
      }}
    >
      <div style={{ ...thumb, background: "#fff", boxShadow: "0 6px 18px rgba(20,40,90,0.22)", opacity: 1 - snug }} />
      <div style={{ ...thumb, background: BLUE_FILL, boxShadow: "0 8px 20px rgba(6,56,232,0.35)", opacity: snug }} />
      <div style={{ ...label, left: 0, color: mix(C.ink2, C.ink, snug) }}>UU远程 原版</div>
      <div style={{ ...label, left: TW / 2, color: mix("#ffffff", C.ink2, snug), fontFamily: SF }}>
        <Img src={staticFile(assets.snugIcon)} style={{ width: 44, height: 44 }} />
        Snug
      </div>
    </div>
  );
};

/**
 * 步骤：一串带序号的标签，到各自的时间点一个个弹出来（手指点到哪一步，哪一步亮一下），until 起一起退掉。
 * 标签一开始就占好位置（只是看不见），弹出来时不挤动别的标签。dir=row 从中间往两边排、放不下就换行；dir=col 竖着往下排。
 * tone：plain 白底深字、深色序号（原版），snug 蓝底白字（Snug）。
 */
export const Steps: React.FC<{
  items: readonly { at: number; text: string }[];
  until?: number;
  x: number;
  y: number;
  w: number;
  tone?: "plain" | "snug";
  dir?: "row" | "col";
  size?: number;
}> = ({ items, until = Infinity, x, y, w, tone = "plain", dir = "row", size = 40 }) => {
  const f = useCurrentFrame();
  const out = Number.isFinite(until) ? interpolate(f, [until, until + 6], [0, 1], clamp) : 0;
  if (items.length === 0 || f < items[0].at || out >= 1) return null;
  const snug = tone === "snug";
  const badge = Math.round(size * 1.05);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        display: "flex",
        flexDirection: dir === "row" ? "row" : "column",
        flexWrap: dir === "row" ? "wrap" : "nowrap",
        justifyContent: dir === "row" ? "center" : "flex-start",
        alignItems: dir === "row" ? "center" : "flex-start",
        gap: 16,
        opacity: 1 - out,
        zIndex: 12,
      }}
    >
      {items.map((it, i) => {
        const p = interpolate(f, [it.at, it.at + 8], [0, 1], { ...clamp, easing: outExpo });
        const glow = f >= it.at ? Math.exp(-(f - it.at) / 12) : 0;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: Math.round(size * 0.3),
              padding: `${Math.round(size * 0.2)}px ${Math.round(size * 0.5)}px ${Math.round(size * 0.2)}px ${Math.round(size * 0.22)}px`,
              borderRadius: size,
              background: snug ? BLUE_FILL : "rgba(255,255,255,0.97)",
              border: snug ? "none" : "1.5px solid rgba(20,40,90,0.1)",
              boxShadow: `${snug ? "0 10px 26px rgba(6,56,232,0.3)" : "0 10px 26px rgba(20,40,90,0.14)"}, 0 0 0 ${6 * glow}px rgba(31,99,255,${0.35 * glow})`,
              opacity: p,
              transform: `translateY(${(1 - p) * 16}px) scale(${0.72 + 0.28 * p + 0.06 * glow})`,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                width: badge,
                height: badge,
                borderRadius: badge / 2,
                background: snug ? "#fff" : C.ink,
                color: snug ? C.deep : "#fff",
                fontFamily: SF,
                fontWeight: 800,
                fontSize: Math.round(size * 0.62),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontFamily: ZH, fontWeight: 600, fontSize: size, letterSpacing: "0.03em", color: snug ? "#fff" : C.ink }}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};
