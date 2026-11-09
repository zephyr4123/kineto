import { useCurrentFrame } from "remotion";
import { outExpo, tween } from "../../../engine/motion";
import { SANS } from "../theme";

// 划词翻译的两样零件：一段能被"拖选"的文字（带文字光标），和 App 的划词卡片。

/**
 * 一段文字，[from, from + (to - from) * p) 这一截是选中的。文字光标跟着选区的尾巴走：
 * 它是插在文字流里的一个空的行内元素，所以换行、对齐都由排版自己算，不用量坐标。
 */
export const Selectable: React.FC<{
  text: string;
  from: number;
  to: number;
  p: number;
  beam: number;
  selection: string;
  beamDark?: boolean;
}> = ({ text, from, to, p, beam, selection, beamDark = true }) => {
  const end = Math.round(from + (to - from) * p);
  const stroke = beamDark ? "#111" : "#fff";
  const halo = beamDark ? "#fff" : "#111";
  return (
    <>
      {text.slice(0, from)}
      <span style={{ background: end > from ? selection : undefined, borderRadius: 2 }}>{text.slice(from, end)}</span>
      <span style={{ position: "relative" }}>
        {beam > 0 ? (
          <svg viewBox="0 0 16 34" style={{ position: "absolute", left: "-0.32em", top: "-0.08em", width: "0.62em", height: "1.32em", opacity: beam, overflow: "visible" }}>
            <path d={BEAM} fill="none" stroke={halo} strokeWidth={5} strokeLinecap="round" />
            <path d={BEAM} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          </svg>
        ) : null}
      </span>
      {text.slice(end)}
    </>
  );
};
const BEAM = "M3 2 H6.5 Q8 2 8 4 Q8 2 9.5 2 H13 M8 4 V30 M3 32 H6.5 Q8 32 8 30 Q8 32 9.5 32 H13";

// 划词卡片：照 App 0.21.0 的样子画（renderer/lookup/card.css：24rem 宽、圆角 1rem、译文 1.125rem、蓝色复制按钮），按 S 倍放大。
// 真卡片不是逐字流出来的：先是几道加载条，译好了整段换上。
const S = 1.22;
const rem = (n: number) => n * 16 * S;
const CARD = { bg: "#f8f9fb", ink: "#1f2329", ink2: "#6b7280", fill: "oklch(0.2 0 0 / 0.06)", line: "oklch(0.2 0.01 260 / 0.1)", blue: "#2d5bb0" };

export const LookupCard: React.FC<{ at: number; textAt: number; text: string; style?: React.CSSProperties }> = ({ at, textAt, text, style }) => {
  const frame = useCurrentFrame();
  const a = tween(frame, [at, at + 16], [0, 1], outExpo);
  const t = tween(frame, [textAt, textAt + 14], [0, 1], outExpo);
  if (a <= 0) return null;
  const shimmer = ((frame - at) / 40) % 1;
  return (
    <div
      style={{
        position: "absolute",
        width: rem(24),
        padding: `${rem(0.75)}px ${rem(1)}px ${rem(1)}px`,
        display: "flex",
        flexDirection: "column",
        gap: rem(0.75),
        background: CARD.bg,
        color: CARD.ink,
        borderRadius: rem(1),
        fontFamily: SANS,
        opacity: a,
        transformOrigin: "20% 0",
        transform: `translateY(${-12 * (1 - a)}px) scale(${0.94 + 0.06 * a})`,
        boxShadow: `0 0 0 1px ${CARD.line}, 0 24px 50px -18px oklch(0.1 0.02 260 / 0.45), 0 8px 18px -10px oklch(0.1 0.02 260 / 0.3)`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: rem(0.25), margin: `${-rem(0.25)}px ${-rem(0.5)}px 0` }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: rem(0.375), height: rem(1.75), padding: `0 ${rem(0.5)}px`, fontSize: rem(0.8125), fontWeight: 600 }}>
          简体中文
          <Icon d="m6 9 6 6 6-6" size={rem(0.875)} color={CARD.ink2} />
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ width: rem(1.75), height: rem(1.75), display: "grid", placeItems: "center" }}>
          <Icon d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" size={rem(0.9)} color={CARD.ink2} />
        </span>
        <span style={{ width: rem(1.75), height: rem(1.75), display: "grid", placeItems: "center" }}>
          <Icon d="M18 6L6 18M6 6l12 12" size={rem(0.9)} color={CARD.ink2} />
        </span>
      </div>
      {t <= 0 ? (
        <div style={{ display: "grid", gap: rem(0.5), padding: `${rem(0.25)}px 0` }}>
          {[1, 1, 0.58].map((w, i) => (
            <i
              key={i}
              style={{
                height: rem(0.8),
                width: `${w * 100}%`,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${CARD.fill}, oklch(0.2 0 0 / 0.12), ${CARD.fill})`,
                backgroundSize: "200% 100%",
                backgroundPosition: `${-200 * shimmer}% 0`,
              }}
            />
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: rem(1.125), lineHeight: 1.6, opacity: t, transform: `translateY(${8 * (1 - t)}px)` }}>{text}</p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", opacity: t }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: rem(0.375),
            height: rem(1.75),
            padding: `0 ${rem(0.75)}px`,
            borderRadius: 999,
            background: CARD.blue,
            color: "#fff",
            fontSize: rem(0.8125),
            fontWeight: 500,
          }}
        >
          <svg width={rem(0.85)} height={rem(0.85)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          复制
        </span>
      </div>
    </div>
  );
};

const Icon: React.FC<{ d: string; size: number; color: string }> = ({ d, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
