import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo, shake } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Hero, Tag } from "../components/stage";
import { C, local, SF } from "../theme";

// 痛点二：AI 助手自带的远程控制（Claude Remote Control、ChatGPT 里的 Codex）只连自家 AI 的会话，
// Mac 上别的 App 一个也碰不到。上面两个 AI 亮着，下面一排 App 被逐个锁上。
const at = local(8);

const AI = [
  { icon: "iconClaude", label: "Remote Control", x: 300 },
  { icon: "iconChatgpt", label: "Codex", x: 780 },
] as const;
const OTHERS = ["iconGhostty", "iconVscode", "iconCursor", "iconSafari", "iconNotion", "iconWechat", "iconTerminal", "iconFinder"] as const;

const Lock: React.FC<{ p: number }> = ({ p }) => (
  <div
    style={{
      position: "absolute",
      right: -10,
      bottom: -10,
      width: 58,
      height: 58,
      borderRadius: 29,
      background: "#ffffff",
      border: "2px solid rgba(10,30,80,0.1)",
      boxShadow: "0 6px 18px rgba(20,40,90,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${0.4 + 0.6 * p})`,
      opacity: p,
    }}
  >
    <svg width="26" height="30" viewBox="0 0 26 30">
      <rect x="2.5" y="13" width="21" height="15" rx="3.5" fill={C.red} />
      <path d="M7 13V9a6 6 0 0 1 12 0v4" fill="none" stroke={C.red} strokeWidth="3" />
    </svg>
  </div>
);

export const PainLocked: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shake(f, at(4), 14, 10, "lock");
  const zoom = 1 + 0.035 * (f / at(8));
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${zoom})` }}>
      {AI.map((a, i) => {
        const p = interpolate(f, [4 + i * 10, 18 + i * 10], [0, 1], { ...clamp, easing: outExpo });
        return (
          <div key={a.icon} style={{ position: "absolute", left: a.x - 150, top: 660, width: 300, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${0.8 + 0.2 * p})` }}>
            <div style={{ position: "relative", width: 250, height: 250, margin: "0 auto" }}>
              <div style={{ position: "absolute", inset: -26, borderRadius: 80, background: "radial-gradient(circle, rgba(34,216,255,0.35), transparent 68%)" }} />
              <Img src={staticFile(assets[a.icon])} style={{ position: "absolute", inset: 0, width: 250, height: 250 }} />
            </div>
            <div style={{ marginTop: 18, fontFamily: SF, fontSize: 34, fontWeight: 700, color: C.ink }}>{a.label}</div>
          </div>
        );
      })}
      {/* 一道分隔：上面是能连的，下面是连不上的 */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 1085,
          height: 2,
          background: `linear-gradient(90deg, transparent, rgba(31,99,255,0.3), transparent)`,
          transform: `scaleX(${interpolate(f, [at(2), at(3)], [0, 1], { ...clamp, easing: outExpo })})`,
        }}
      />
      {OTHERS.map((k, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const p = interpolate(f, [at(2) + i * 3, at(2) + i * 3 + 14], [0, 1], { ...clamp, easing: outExpo });
        const lock = interpolate(f, [at(4) + i * 2, at(4) + i * 2 + 10], [0, 1], { ...clamp, easing: outExpo });
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 150 + col * 210,
              top: 1170 + row * 230,
              width: 150,
              height: 150,
              opacity: p,
              transform: `translateY(${(1 - p) * 50}px)`,
            }}
          >
            <Img
              src={staticFile(assets[k])}
              style={{ width: 150, height: 150, filter: `grayscale(${0.95 * lock})`, opacity: 1 - 0.55 * lock }}
            />
            <Lock p={lock} />
          </div>
        );
      })}
      <Tag at={0} until={at(8) - 6} text="PROBLEM 02" y={150} />
      <Hero at={2} until={at(8) - 6} title="ONE AI ONLY" sub="远程控制 只连自家 AI" />
    </AbsoluteFill>
  );
};
