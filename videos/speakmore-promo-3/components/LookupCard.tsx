import { useCurrentFrame } from "remotion";
import { tween } from "../../../engine/motion";
import { COLOR, EASE, SANS } from "../theme";

// 划词卡片：照 App 的 renderer/lookup/card.css 画，按 S 倍放大（卡片 24rem 宽、圆角 1rem、译文 1.125rem）。
// 真卡片不是逐字流出来的：先是几道加载条，译好了整段换上——片子里也这样。
const S = 1.6;
const rem = (n: number) => n * 16 * S;

// 一个一个字可以单独拿出来（转场时译文的字被打散），所以按字渲染
export const LookupCard: React.FC<{
  at: number;
  textAt: number;
  language: string;
  text: string;
  /** 每个字额外的样式（打散时用）；不给就原样 */
  charStyle?: (index: number) => React.CSSProperties | undefined;
}> = ({ at, textAt, language, text, charStyle }) => {
  const frame = useCurrentFrame();
  const a = tween(frame, [at, at + 16], [0, 1], EASE.outExpo);
  const t = tween(frame, [textAt, textAt + 14], [0, 1], EASE.outExpo);
  const glow = frame >= at ? 0.5 * Math.exp(-(frame - at) / 14) : 0;
  if (a <= 0) return null;
  const shimmer = ((frame - at) / 40) % 1;
  return (
    <div
      style={{
        width: rem(24),
        padding: `${rem(0.75)}px ${rem(1)}px ${rem(1)}px`,
        display: "flex",
        flexDirection: "column",
        gap: rem(0.75),
        background: COLOR.card,
        color: COLOR.cardInk,
        borderRadius: rem(1),
        fontFamily: SANS,
        opacity: a,
        transformOrigin: "0 0",
        transform: `translateY(${-14 * (1 - a)}px) scale(${0.9 + 0.1 * a})`,
        filter: a < 1 ? `blur(${6 * (1 - a)}px)` : undefined,
        boxShadow: `0 0 0 1px ${COLOR.cardLine}, 0 20px 46px -16px oklch(0 0 0 / 0.42), 0 0 0 ${2 + 6 * glow}px oklch(0.55 0.17 33 / ${glow}), 0 0 60px oklch(0.55 0.17 33 / ${glow * 0.6})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: rem(0.25), margin: `${-rem(0.25)}px ${-rem(0.5)}px 0` }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: rem(0.375), height: rem(1.75), padding: `0 ${rem(0.5)}px`, fontSize: rem(0.8125), fontWeight: 600 }}>
          {language}
          <Icon d="m6 9 6 6 6-6" size={rem(0.875)} color={COLOR.cardInk2} />
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ width: rem(1.75), height: rem(1.75), display: "grid", placeItems: "center" }}>
          <Icon d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" size={rem(0.9)} color={COLOR.cardInk2} />
        </span>
        <span style={{ width: rem(1.75), height: rem(1.75), display: "grid", placeItems: "center" }}>
          <Icon d="M18 6L6 18M6 6l12 12" size={rem(0.9)} color={COLOR.cardInk2} />
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
                background: `linear-gradient(90deg, ${COLOR.cardFill}, oklch(0.2 0 0 / 0.11), ${COLOR.cardFill})`,
                backgroundSize: "200% 100%",
                backgroundPosition: `${-200 * shimmer}% 0`,
              }}
            />
          ))}
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: rem(1.125),
            lineHeight: 1.55,
            opacity: t,
            transform: `translateY(${10 * (1 - t)}px)`,
            filter: t < 1 ? `blur(${4 * (1 - t)}px)` : undefined,
          }}
        >
          {[...text].map((ch, i) => (
            // 每个字是 inline-block，空格要 pre 才占宽度
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", ...charStyle?.(i) }}>
              {ch}
            </span>
          ))}
        </p>
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
            background: COLOR.cardInk,
            color: "oklch(1 0 0)",
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
