import { Img, interpolate, staticFile } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { UI } from "../icons";
import { prog, punch } from "../motion";
import { COLOR, EASE } from "../theme";
import { Pointer } from "./Bits";

// 落款中间插的一幕：GitHub 仓库页的页头（静态截图，3 倍图），镜头推到 Star 按钮上，指针点一下：
// 星变实、Star 变 Starred、78 翻成 79。按钮点下去之后的样子照 GitHub 的按钮样式画在截图上面。
// 实心星的形状是 GitHub 的 Octicons（MIT）里的 star-fill-16；点之前的空心星就是截图里那个，不另画。

const STAR = "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815l4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97l.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25";

// 截图：1440 CSS 像素宽的页面按 3 倍截，从 GitHub 全局页头下面（CSS 第 73 行）裁起
const SHOT = { w: 4320, h: 681, dpr: 3 };
// Star 按钮在截图里的位置（CSS 像素，相对裁出来的这一块）
const BUTTON = { x: 1233, y: 119, w: 95, h: 28 };
const ICON = { x: 1249, y: 133 };
const CARD = { left: 180, top: 380, width: 1560, bar: 52 };
const ZOOM = 2.4;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';

export type StarTiming = { from: number; zoom: number; pointer: number; click: number; back: number; until: number };

/** 这一幕在画面上占了多少（0–1）：落款的其余部分照它退暗 */
export const starPresence = (frame: number, t: StarTiming) => prog(frame, t.from, 34, EASE.inOut) * (1 - prog(frame, t.back, t.until - t.back, EASE.inOut));

/**
 * 整一幕：from 时从 origin（落款上那行 github 地址）的位置放大进来，zoom 时推到 Star 上，click 时点下去，
 * back 时缩回 origin，until 时完全退掉
 */
export const GitHubStar: React.FC<{ frame: number; t: StarTiming; origin: { x: number; y: number } }> = ({ frame, t, origin }) => {
  if (frame < t.from || frame > t.until) return null;
  const css = CARD.width / (SHOT.w / SHOT.dpr);
  const cardH = CARD.bar + (SHOT.h * CARD.width) / SHOT.w;
  // 进来、退回：从地址那一行长出来，又缩回去
  const presence = starPresence(frame, t);
  // 推镜头：以星为中心放大，同时把星挪到画面正中
  const zoom = prog(frame, t.zoom, 60, EASE.inOut) * (1 - prog(frame, t.back - 24, 24, EASE.inOut));
  const star = { x: CARD.left + ICON.x * css, y: CARD.top + CARD.bar + ICON.y * css };
  const z = 1 + (ZOOM - 1) * zoom;
  const shift = { x: (960 - star.x) * zoom, y: (560 - star.y) * zoom };
  const grow = interpolate(presence, [0, 1], [0.12, 1]);
  const center = { x: CARD.left + CARD.width / 2, y: CARD.top + cardH / 2 };
  const fromOrigin = { x: (origin.x - center.x) * (1 - presence), y: (origin.y - center.y) * (1 - presence) };

  const pressed = interpolate(frame, [t.click - 2, t.click + 2, t.click + 10], [0, 1, 0], clamp);
  const starred = prog(frame, t.click, 10);
  // 指针：从右下角进来，停在星上；点完往外让开
  const pIn = prog(frame, t.pointer, t.click - t.pointer - 4, EASE.inOut);
  const pOut = prog(frame, t.click + 26, 30, EASE.inOut);
  const tip = { x: interpolate(pIn, [0, 1], [1760, 960 + 6]) + 220 * pOut, y: interpolate(pIn, [0, 1], [1040, 560 + 8]) + 180 * pOut };

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: CARD.left,
          top: CARD.top,
          width: CARD.width,
          height: cardH,
          borderRadius: 18,
          overflow: "hidden",
          background: "#f6f8fa",
          boxShadow: "0 0 0 1px oklch(0 0 0 / 0.12), 0 50px 120px oklch(0 0 0 / 0.55)",
          opacity: Math.min(1, presence * 1.6),
          transformOrigin: `${star.x - CARD.left}px ${star.y - CARD.top}px`,
          transform: `translate(${shift.x + fromOrigin.x}px, ${shift.y + fromOrigin.y}px) scale(${z * grow})`,
        }}
      >
        {/* 浏览器的地址栏 */}
        <div style={{ height: CARD.bar, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", background: "oklch(0.96 0.004 80)", borderBottom: "1px solid oklch(0.9 0.006 80)" }}>
          <span style={{ display: "flex", gap: 9 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <i key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
            ))}
          </span>
          <span style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 22px", borderRadius: 10, background: "oklch(0.92 0.005 80)", color: COLOR.paperInk, fontSize: 18 }}>
              <Glyph icon={UI.lock} size={15} style={{ color: COLOR.paperInk2 }} />
              github.com/zephyr4123/speakmore
            </span>
          </span>
        </div>
        <Img src={staticFile(assets.githubTop)} style={{ position: "absolute", left: 0, top: CARD.bar, width: CARD.width }} />
        {/* 点下去之后的按钮：盖在截图里那个按钮上，照 GitHub 的样式画 */}
        {starred > 0 ? (
          <div
            style={{
              position: "absolute",
              left: BUTTON.x * css,
              top: CARD.bar + BUTTON.y * css,
              transformOrigin: "0 0",
              transform: `scale(${css})`,
            }}
          >
            <StarButton starred={starred} pressed={pressed} frame={frame} click={t.click} />
          </div>
        ) : null}
        {/* 点之前按下去的那一下：在截图的按钮上压一层淡灰 */}
        {starred <= 0 && pressed > 0 ? (
          <div style={{ position: "absolute", left: BUTTON.x * css, top: CARD.bar + BUTTON.y * css, width: BUTTON.w * css, height: BUTTON.h * css, borderRadius: 6 * css, background: `oklch(0 0 0 / ${0.06 * pressed})` }} />
        ) : null}
      </div>
      {presence > 0.5 ? <Pointer x={tip.x} y={tip.y} scale={1.6} opacity={Math.min(pIn * 2, 1) * (1 - pOut)} /> : null}
    </>
  );
};

/** 点过之后的 Star 按钮：实心的星（金色）、Starred、计数从 78 翻到 79；点下去时星迸出几点光 */
const StarButton: React.FC<{ starred: number; pressed: number; frame: number; click: number }> = ({ starred, pressed, frame, click }) => {
  const roll = prog(frame, click + 4, 16, EASE.outQuint);
  const burst = prog(frame, click, 26, EASE.outQuint);
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: BUTTON.h,
        boxSizing: "border-box",
        padding: "0 6px 0 11px",
        gap: 8,
        borderRadius: 6,
        border: "1px solid #d1d9e0",
        background: pressed > 0 ? "#eff2f5" : "#f6f8fa",
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 500,
        color: "#25292e",
        whiteSpace: "nowrap",
        transform: `scale(${1 - 0.03 * pressed})`,
        opacity: Math.min(1, starred * 2),
      }}
    >
      <span style={{ position: "relative", width: 16, height: 16 }}>
        <svg viewBox="0 0 16 16" width={16} height={16} style={{ position: "absolute", left: 0, top: 0, transform: `scale(${punch(frame, click, 0.45, 18)})` }}>
          <path d={STAR} fill="#eac54f" />
        </svg>
        {/* 迸出来的八点光 */}
        {burst > 0 && burst < 1
          ? Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 6 + 14 * burst;
              return (
                <i
                  key={i}
                  style={{
                    position: "absolute",
                    left: 8 + Math.cos(a) * r - 1.5,
                    top: 8 + Math.sin(a) * r - 1.5,
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#eac54f",
                    opacity: 1 - burst,
                  }}
                />
              );
            })
          : null}
      </span>
      Starred
      <span style={{ position: "relative", display: "inline-block", height: 18, minWidth: 20, padding: "0 6px", borderRadius: "2em", background: "rgba(129, 139, 152, 0.12)", overflow: "hidden", textAlign: "center", lineHeight: "18px" }}>
        <span style={{ display: "block", transform: `translateY(${-18 * roll}px)` }}>78</span>
        <span style={{ display: "block", transform: `translateY(${-18 * roll}px)` }}>79</span>
      </span>
    </div>
  );
};
