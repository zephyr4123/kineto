import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";

// 画出来的电脑窗口：一个固定的圆角框，里面几个窗口依次换上来；还有标题栏的红黄绿三个点和标题栏本身。
// 划词一段（四个窗口）和结尾的官网一段（官网、GitHub 两个窗口）共用。

export const BOX = { x: 690, y: 150, w: 1110, h: 780 } as const;
const SLIDE = 40;

/**
 * windows[k] 在 starts[k] 帧铺满：下一个窗口像一页纸从下面叠上来，这一个往上让一点、暗一点（和卡片之间的转场同一个意思）。
 * bg 是框的底色，换窗口的那一下会露出来一点。
 */
export const WindowStack: React.FC<{ starts: readonly number[]; windows: readonly React.ReactNode[]; bg: string }> = ({ starts, windows, bg }) => {
  const frame = useCurrentFrame();
  const last = windows.length - 1;
  return (
    <div
      style={{
        position: "absolute",
        left: BOX.x,
        top: BOX.y,
        width: BOX.w,
        height: BOX.h,
        borderRadius: 22,
        overflow: "hidden",
        background: bg,
        boxShadow: "0 46px 90px -40px oklch(0.15 0.03 260 / 0.55), 0 16px 34px -18px oklch(0.15 0.03 260 / 0.4)",
      }}
    >
      {windows.map((win, k) => {
        const inP = k === 0 ? 1 : interpolate(frame, [starts[k] - SLIDE, starts[k]], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        const outP = k === last ? 0 : interpolate(frame, [starts[k + 1] - SLIDE, starts[k + 1]], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        if (inP <= 0 || outP >= 1) return null;
        return (
          <AbsoluteFill
            key={k}
            style={{
              transform: `translateY(${(1 - inP) * BOX.h - outP * BOX.h * 0.3}px)`,
              filter: outP > 0 ? `brightness(${1 - 0.3 * outP})` : undefined,
              boxShadow: inP < 1 ? "0 -18px 40px oklch(0.1 0.02 260 / 0.35)" : undefined,
            }}
          >
            {win}
          </AbsoluteFill>
        );
      })}
    </div>
  );
};

/** 正在换上来的是第几个窗口（提前 20 帧算换了，左边跟着亮的字和窗口一起到） */
export const activeWindow = (frame: number, starts: readonly number[]) => Math.max(0, starts.filter((s) => frame >= s - 20).length - 1);

const Lights: React.FC = () => (
  <div style={{ display: "flex", gap: 9 }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <i key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, boxShadow: "inset 0 0 0 0.5px oklch(0 0 0 / 0.15)" }} />
    ))}
  </div>
);

/** 标题栏：盖在窗口内容最上面，内容推近时不会压到它 */
export const Bar: React.FC<{ bg: string; line: string; children?: React.ReactNode }> = ({ bg, line, children }) => (
  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, display: "flex", alignItems: "center", gap: 22, padding: "0 20px", background: bg, borderBottom: `1px solid ${line}` }}>
    <Lights />
    {children}
  </div>
);
