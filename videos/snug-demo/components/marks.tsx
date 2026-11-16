import { Img, interpolate, staticFile } from "remotion";
import { clamp, outExpo, prog } from "../../../engine/motion";
import { assets } from "../assets.gen";

// 贴在画面里的标记：屏幕上的「聚光」（窗口以外压暗一点、四角取景框）和窗口在设备之间飞的轨迹。

/** 聚光：屏幕上 (l, t, w, h)（百分比）这块以外压暗，四个角各一道取景框，像相机对焦。取景框是深色描白边，压在白窗口和深色桌面上都看得见 */
export const Spotlight: React.FC<{ frame: number; at: number; out: number; l: number; t: number; w: number; h: number; dim?: number }> = ({
  frame,
  at,
  out,
  l,
  t,
  w,
  h,
  dim = 0.42,
}) => {
  if (frame < at || frame > out) return null;
  const k = prog(frame, at, 22, outExpo);
  const o = interpolate(frame, [at, at + 8, out - 12, out], [0, 1, 1, 0], clamp);
  const s = 1.07 - 0.07 * k;
  const corner = (pos: React.CSSProperties, borders: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        width: "9%",
        aspectRatio: "1",
        minWidth: 14,
        ...pos,
        ...borders,
        borderColor: "#141821",
        borderStyle: "solid",
        filter: "drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff)",
      }}
    />
  );
  const bw = "5px";
  return (
    <div style={{ position: "absolute", left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, opacity: o }}>
      <div style={{ position: "absolute", inset: 0, boxShadow: `0 0 0 4000px rgba(10,14,28,${dim * k})` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})` }}>
        {corner({ left: 0, top: 0 }, { borderWidth: `${bw} 0 0 ${bw}` })}
        {corner({ right: 0, top: 0 }, { borderWidth: `${bw} ${bw} 0 0` })}
        {corner({ left: 0, bottom: 0 }, { borderWidth: `0 0 ${bw} ${bw}` })}
        {corner({ right: 0, bottom: 0 }, { borderWidth: `0 ${bw} ${bw} 0` })}
      </div>
    </div>
  );
};

type Pt = { x: number; y: number };
const ICON = { ghostty: assets.iconGhostty, safari: assets.iconSafari, chatgpt: assets.iconChatgpt, claude: assets.iconClaude } as const;
export type IconName = keyof typeof ICON;

/**
 * 窗口在两台设备之间飞：App 图标沿一道弧线走，身后拖几道渐隐的残影，走过的地方留一串细点，落地时一圈细环。
 * 和录像里真实的飞行同一时刻起落，只是把「从哪到哪」画出来。世界坐标。
 */
export const Flight: React.FC<{ frame: number; at: number; dur: number; from: Pt; to: Pt; icon: IconName; bend?: number }> = ({ frame, at, dur, from, to, icon, bend = 0.28 }) => {
  const t = frame - at;
  if (t < -2 || t > dur + 30) return null;
  const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2);
  const kAt = (tt: number) => ease(interpolate(tt, [0, dur], [0, 1], clamp));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const c = { x: (from.x + to.x) / 2 - dy * bend, y: (from.y + to.y) / 2 + dx * bend };
  const q = (s: number) => ({
    x: (1 - s) ** 2 * from.x + 2 * (1 - s) * s * c.x + s * s * to.x,
    y: (1 - s) ** 2 * from.y + 2 * (1 - s) * s * c.y + s * s * to.y,
  });
  const k = kAt(t);
  const after = interpolate(t, [dur, dur + 30], [0, 1], clamp);
  const fadeTrail = interpolate(t, [dur, dur + 24], [1, 0], clamp);
  const dots = Array.from({ length: 22 }, (_, i) => i / 21).filter((s) => s <= k);
  const icoScale = interpolate(t, [-2, 6, dur * 0.5, dur - 2, dur + 8], [0.5, 1, 1.12, 1, 0], clamp);
  const ghosts = [3, 6, 9].map((lag, i) => ({ p: q(kAt(t - lag)), o: [0.3, 0.16, 0.08][i] }));
  const p = q(k);
  const icon64 = 84;
  return (
    <>
      {dots.map((s, i) => {
        const d = q(s);
        return <div key={i} style={{ position: "absolute", left: d.x - 3.5, top: d.y - 3.5, width: 7, height: 7, borderRadius: 4, background: "rgba(20,24,33,0.32)", opacity: fadeTrail }} />;
      })}
      {after > 0 ? (
        <div
          style={{
            position: "absolute",
            left: to.x - (20 + 90 * after),
            top: to.y - (20 + 90 * after),
            width: (20 + 90 * after) * 2,
            height: (20 + 90 * after) * 2,
            borderRadius: "50%",
            border: `${3 * (1 - after)}px solid rgba(20,24,33,0.5)`,
          }}
        />
      ) : null}
      {t <= dur + 8
        ? ghosts.map((gh, i) => (
            <Img key={i} src={staticFile(ICON[icon])} style={{ position: "absolute", left: gh.p.x - icon64 / 2, top: gh.p.y - icon64 / 2, width: icon64, height: icon64, opacity: gh.o * icoScale }} />
          ))
        : null}
      <Img
        src={staticFile(ICON[icon])}
        style={{
          position: "absolute",
          left: p.x - icon64 / 2,
          top: p.y - icon64 / 2,
          width: icon64,
          height: icon64,
          transform: `scale(${icoScale})`,
          filter: "drop-shadow(0 12px 18px rgba(16,24,40,0.3))",
        }}
      />
    </>
  );
};
