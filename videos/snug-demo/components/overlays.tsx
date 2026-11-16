import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo, outQuint, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { C, SF, ZH } from "../theme";

// 画面上的标注：字幕、点按的波纹、上滑手势、窗口在设备之间飞的轨迹、贴着设备的小标签、左上角的「实录 · 倍速」角标。
// 全是帧的纯函数，frame 一律是成片里的帧。

const fade = (frame: number, at: number, out: number, inDur = 14, outDur = 12) =>
  interpolate(frame, [at, at + inDur, out - outDur, out], [0, 1, 1, 0], clamp);

/**
 * 字幕：上面一行英文小标，下面中文主句（「·」分成几块，逐块弹上来）。
 * x、y 是这块字的锚点；align 决定锚点在左、中、右。
 */
export const Caption: React.FC<{
  frame: number;
  at: number;
  out: number;
  zh: string;
  en: string;
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  size?: number;
  /** 竖排：每块各占一行、不要中间的点（贴在设备旁的窄处用） */
  stack?: boolean;
}> = ({ frame, at, out, zh, en, x, y, align = "left", size = 80, stack = false }) => {
  if (frame < at - 1 || frame > out + 1) return null;
  const parts = zh.split(" · ");
  const leave = prog(frame, out - 14, 14, outQuint);
  const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const shift = align === "left" ? "0" : align === "right" ? "-100%" : "-50%";
  if (stack) {
    return (
      <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${shift})`, opacity: 1 - leave, translate: `0 ${-30 * leave}px`, textAlign: align }}>
        <div style={{ display: "flex", justifyContent: justify, alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 34 * prog(frame, at, 18), height: 5, borderRadius: 3, background: C.blue }} />
          <div style={{ fontFamily: SF, fontSize: 22, fontWeight: 700, letterSpacing: "0.2em", color: C.ink2, opacity: prog(frame, at + 4, 16), whiteSpace: "nowrap" }}>{en}</div>
        </div>
        {parts.map((p, i) => {
          const k = prog(frame, at + 3 + i * 8, 22);
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: size * 0.06 }}>
              <div style={{ fontFamily: ZH, fontSize: size, lineHeight: 1.12, fontWeight: 800, letterSpacing: "0.04em", color: C.ink, transform: `translateY(${(1 - k) * 110}%)`, whiteSpace: "nowrap" }}>
                {p}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${shift})`, opacity: 1 - leave, translate: `0 ${-30 * leave}px` }}>
      <div style={{ display: "flex", justifyContent: justify, alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 34 * prog(frame, at, 18), height: 5, borderRadius: 3, background: C.blue }} />
        <div
          style={{
            fontFamily: SF,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: C.ink2,
            opacity: prog(frame, at + 4, 16),
            whiteSpace: "nowrap",
          }}
        >
          {en}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: justify, alignItems: "baseline", gap: size * 0.32, whiteSpace: "nowrap" }}>
        {parts.map((p, i) => {
          const k = prog(frame, at + 3 + i * 7, 22);
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: size * 0.32 }}>
              {i > 0 ? <span style={{ fontFamily: ZH, fontSize: size * 0.7, fontWeight: 700, color: C.blue, opacity: k }}>·</span> : null}
              <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.08 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: ZH,
                    fontSize: size,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    color: C.ink,
                    transform: `translateY(${(1 - k) * 110}%)`,
                  }}
                >
                  {p}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** 点按：一圈波纹 + 一个按下去的圆点。坐标在所叠的那块屏的坐标系里（手机是远程画面的点） */
export const Ripple: React.FC<{ frame: number; at: number; x: number; y: number; scale?: number }> = ({ frame, at, x, y, scale = 1 }) => {
  const t = frame - at;
  if (t < -4 || t > 40) return null;
  const k = prog(frame, at, 32, outExpo);
  const dot = interpolate(t, [-4, 0, 6, 26, 40], [0, 1, 0.82, 0.82, 0], clamp);
  const r = (10 + 44 * k) * scale;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          border: `${4 * scale * (1 - k) + 0.5}px solid ${C.tap}`,
          boxShadow: `0 0 0 ${1.5 * scale}px rgba(255,255,255,${0.9 * (1 - k)})`,
          opacity: 1 - k * 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 15 * scale,
          top: y - 15 * scale,
          width: 30 * scale,
          height: 30 * scale,
          borderRadius: "50%",
          background: "rgba(47,107,255,0.42)",
          border: `${3 * scale}px solid #fff`,
          boxShadow: "0 0 0 1px rgba(16,24,40,0.25), 0 6px 16px rgba(16,24,40,0.3)",
          transform: `scale(${dot})`,
        }}
      />
    </>
  );
};

/** 从底部指示条往上一滑：圆点沿竖线上移，后面拖一道渐隐的尾巴 */
export const Swipe: React.FC<{ frame: number; at: number; x: number; y: number; dist?: number }> = ({ frame, at, x, y, dist = 150 }) => {
  const t = frame - at;
  if (t < -6 || t > 40) return null;
  const k = prog(frame, at, 22, outQuint);
  const show = interpolate(t, [-6, 0, 26, 40], [0, 1, 1, 0], clamp);
  const cy = y - dist * k;
  return (
    <div style={{ opacity: show }}>
      <div
        style={{
          position: "absolute",
          left: x - 7,
          top: cy,
          width: 14,
          height: y - cy,
          borderRadius: 7,
          background: "linear-gradient(180deg, rgba(47,107,255,0.55), rgba(47,107,255,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 16,
          top: cy - 16,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(47,107,255,0.45)",
          border: "3px solid #fff",
          boxShadow: "0 0 0 1px rgba(16,24,40,0.25), 0 6px 16px rgba(16,24,40,0.3)",
        }}
      />
    </div>
  );
};

/** 单指上滑翻页的提示：手机侧面一枚小手指图标上下比划 */
export const ScrollHint: React.FC<{ frame: number; at: number; out: number; x: number; y: number }> = ({ frame, at, out, x, y }) => {
  if (frame < at || frame > out) return null;
  const o = fade(frame, at, out);
  const cyc = ((frame - at) % 50) / 50;
  const k = interpolate(cyc, [0, 0.55, 1], [0, 1, 1], { ...clamp, easing: outQuint });
  const show = interpolate(cyc, [0, 0.1, 0.7, 1], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: x - 22, top: y - 22 - 120 * k, opacity: o * show }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(47,107,255,0.4)", border: "3px solid #fff", boxShadow: "0 0 0 1px rgba(16,24,40,0.25), 0 6px 16px rgba(16,24,40,0.3)" }} />
    </div>
  );
};

type Pt = { x: number; y: number };
const ICON = { ghostty: assets.iconGhostty, safari: assets.iconSafari, chatgpt: assets.iconChatgpt, claude: assets.iconClaude } as const;
export type IconName = keyof typeof ICON;

/**
 * 窗口在两台设备之间飞：一条弧线从起点画到终点，App 图标沿着弧线走，落地时一圈光。
 * 和录像里真实的飞行同一时刻起落，只是把「从哪到哪」画出来。世界坐标。
 */
export const Flight: React.FC<{ frame: number; at: number; dur: number; from: Pt; to: Pt; icon: IconName; bend?: number }> = ({
  frame,
  at,
  dur,
  from,
  to,
  icon,
  bend = 0.28,
}) => {
  const t = frame - at;
  if (t < -2 || t > dur + 34) return null;
  const k = interpolate(t, [0, dur], [0, 1], { ...clamp, easing: (v) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2) });
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  // 弧线往起止连线的一侧鼓出去
  const c = { x: (from.x + to.x) / 2 - dy * bend, y: (from.y + to.y) / 2 + dx * bend };
  const q = (s: number) => ({
    x: (1 - s) ** 2 * from.x + 2 * (1 - s) * s * c.x + s * s * to.x,
    y: (1 - s) ** 2 * from.y + 2 * (1 - s) * s * c.y + s * s * to.y,
  });
  const p = q(k);
  const tail = Math.max(0, k - 0.35);
  const after = interpolate(t, [dur, dur + 34], [0, 1], clamp);
  const pathLen = len * 1.25;
  const pop = interpolate(t, [-2, 6, dur - 4, dur + 8], [0.4, 1, 1, 0], clamp);
  const minX = Math.min(from.x, to.x, c.x) - 200;
  const minY = Math.min(from.y, to.y, c.y) - 200;
  const maxX = Math.max(from.x, to.x, c.x) + 200;
  const maxY = Math.max(from.y, to.y, c.y) + 200;
  return (
    <>
      <svg style={{ position: "absolute", left: minX, top: minY, overflow: "visible" }} width={maxX - minX} height={maxY - minY}>
        <path
          d={`M ${from.x - minX} ${from.y - minY} Q ${c.x - minX} ${c.y - minY} ${to.x - minX} ${to.y - minY}`}
          fill="none"
          stroke="rgba(47,107,255,0.75)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${pathLen * (k - tail)} ${pathLen * 3}`}
          strokeDashoffset={-pathLen * tail}
          opacity={1 - after}
          style={{ filter: "drop-shadow(0 0 10px rgba(47,107,255,0.45))" }}
        />
        {/* 落地的一圈光 */}
        {after > 0 ? (
          <circle cx={to.x - minX} cy={to.y - minY} r={30 + 120 * after} fill="none" stroke="rgba(47,107,255,0.6)" strokeWidth={6 * (1 - after)} />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: p.x - 46,
          top: p.y - 46,
          width: 92,
          height: 92,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 12px 30px rgba(16,24,40,0.28), 0 0 0 1px rgba(16,24,40,0.06)",
          transform: `scale(${pop}) rotate(${(1 - k) * -10}deg)`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Img src={staticFile(ICON[icon])} style={{ width: 76, height: 76 }} />
      </div>
    </>
  );
};

/** 贴着设备的小标签：白底胶囊，左边一个小图标或圆点；从锚点弹出来 */
export const Tag: React.FC<{ frame: number; at: number; out: number; x: number; y: number; text: string; icon?: IconName; size?: number }> = ({
  frame,
  at,
  out,
  x,
  y,
  text,
  icon,
  size = 34,
}) => {
  if (frame < at || frame > out) return null;
  const k = prog(frame, at, 20);
  const o = fade(frame, at, out, 8, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * k})`,
        opacity: o,
        display: "flex",
        alignItems: "center",
        gap: size * 0.35,
        padding: `${size * 0.32}px ${size * 0.62}px ${size * 0.32}px ${size * (icon ? 0.36 : 0.55)}px`,
        borderRadius: 999,
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 10px 30px rgba(16,24,40,0.18), 0 0 0 1px rgba(16,24,40,0.06)",
        whiteSpace: "nowrap",
      }}
    >
      {icon ? <Img src={staticFile(ICON[icon])} style={{ width: size * 1.15, height: size * 1.15 }} /> : <div style={{ width: size * 0.36, height: size * 0.36, borderRadius: "50%", background: C.blue }} />}
      <span style={{ fontFamily: ZH, fontSize: size, fontWeight: 700, color: C.ink }}>{text}</span>
    </div>
  );
};

/** 屏幕上框出一块：圆角描边一闪再留住，坐标是所叠那块屏的百分比 */
export const Frame: React.FC<{ frame: number; at: number; out: number; l: number; t: number; w: number; h: number; radius?: number }> = ({
  frame,
  at,
  out,
  l,
  t,
  w,
  h,
  radius = 2,
}) => {
  if (frame < at || frame > out) return null;
  const k = prog(frame, at, 18);
  const o = fade(frame, at, out, 6, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: `${l}%`,
        top: `${t}%`,
        width: `${w}%`,
        height: `${h}%`,
        borderRadius: `${radius}%`,
        border: "6px solid #2f6bff",
        boxShadow: "0 0 0 4px rgba(255,255,255,0.85), 0 0 40px rgba(47,107,255,0.6)",
        opacity: o,
        transform: `scale(${1.08 - 0.08 * k})`,
      }}
    />
  );
};
