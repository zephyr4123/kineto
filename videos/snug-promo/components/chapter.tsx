import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { b, SF, ZH } from "../theme";
import type { Icon } from "./snug";

// 章节卡：每一章开头单独占一屏，先点明这一章讲什么，再进演示（总分）。四张卡的底、版式、进出场各不相同，免得像一套模板刻出来的；
// 这里只放几样共用的小件：章节号 + 英文小标、逐字顶上来的大标题、Mac 窗口的缩略样子（「流转自如」「万窗皆宜」两张卡用）。

/** 章节卡比它那一段的第一拍提前多少帧进场（盖住上一段的最后几帧），段落结束后多少帧退完（露出下一段的开头） */
export const CARD_PRE = 12;
export const CARD_POST = 14;
/** 章节卡里用：卡对应的那一段从第 start 拍开始，第 n 拍是卡里的第几帧（卡的第 0 帧比第 start 拍早 CARD_PRE 帧） */
export const cardAt = (start: number) => (n: number) => CARD_PRE + b(start + n) - b(start);

/** 章节号 + 英文小标：「01 ─ NATIVE GESTURES」。at 起从一侧滑进来，until 起淡出 */
export const ChapterTag: React.FC<{
  at: number;
  until: number;
  n: number;
  text: string;
  x: number;
  y: number;
  color: string;
  align?: "left" | "center";
}> = ({ at, until, n, text, x, y, color, align = "center" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: outExpo });
  const out = interpolate(f, [until, until + 8], [0, 1], clamp);
  if (p <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : x,
        right: align === "center" ? 0 : undefined,
        top: y,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        alignItems: "center",
        gap: 20,
        fontFamily: SF,
        fontWeight: 800,
        color,
        opacity: p * (1 - out),
        transform: `translateX(${(1 - p) * (align === "center" ? 0 : -40)}px) translateY(${(1 - p) * (align === "center" ? -14 : 0)}px)`,
      }}
    >
      <span style={{ fontSize: 46, letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>{String(n).padStart(2, "0")}</span>
      <span style={{ width: 56 * p, height: 3, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 34, letterSpacing: "0.22em" }}>{text}</span>
    </div>
  );
};

/** 大标题：一个字一个字从下面顶上来、从虚到实；until 起往上淡出 */
export const CardTitle: React.FC<{
  at: number;
  until: number;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  align?: "left" | "center";
  weight?: number;
  track?: string;
  shadow?: string;
}> = ({ at, until, text, x, y, size, color, align = "center", weight = 600, track = "0.06em", shadow }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [until, until + 8], [0, 1], clamp);
  if (f < at || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : x,
        right: align === "center" ? 0 : undefined,
        top: y,
        textAlign: align,
        fontFamily: ZH,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.15,
        letterSpacing: track,
        color,
        whiteSpace: "pre",
        textShadow: shadow,
        opacity: 1 - out,
        transform: `translateY(${-30 * out}px)`,
      }}
    >
      {[...text].map((ch, i) => {
        const p = interpolate(f, [at + i * 2.2, at + 12 + i * 2.2], [0, 1], { ...clamp, easing: outExpo });
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 0.45 * size}px) scale(${1 + 0.2 * (1 - p)})`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export type MiniKind = "term" | "chat" | "web" | "code" | "doc" | "files";
export type Mini = { kind: MiniKind; icon: Icon; app: string; title: string };

/** 窗口内容的缩略样子（只是几块色块和线条，看个大概）：终端、对话、网页、代码、文档、文件夹 */
const MiniBody: React.FC<{ kind: MiniKind; w: number; h: number; seed: number }> = ({ kind, w, h, seed }) => {
  const u = w / 100;
  const rows = (n: number, color: string | ((i: number) => string), top: number, gap: number, left = 6, thick = 1.6) =>
    Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: left * u, top: (top + i * gap) * u, width: `${34 + ((i * 29 + seed * 13) % 52)}%`, height: thick * u, borderRadius: u, background: typeof color === "string" ? color : color(i) }} />
    ));
  const fit = Math.max(0, Math.floor((h / u - 10) / 6));
  if (kind === "term")
    return (
      <div style={{ position: "absolute", inset: 0, background: "#1d1f24" }}>
        {rows(Math.min(fit, 16), (i) => (i % 5 === 0 ? "#6be38c" : i % 3 === 0 ? "#79b8ff" : "#c9ced8"), 5, 6)}
        <div style={{ position: "absolute", left: 6 * u, top: (5 + Math.min(fit, 16) * 6) * u, width: 3 * u, height: 4 * u, background: "#e6e6e6" }} />
      </div>
    );
  if (kind === "code")
    return (
      <div style={{ position: "absolute", inset: 0, background: "#1f2430" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16 * u, background: "#181c25" }} />
        {rows(Math.min(fit, 16), (i) => ["#c792ea", "#82aaff", "#c3e88d", "#d6deeb", "#f78c6c"][(i + seed) % 5], 5, 6, 22)}
      </div>
    );
  if (kind === "chat")
    return (
      <div style={{ position: "absolute", inset: 0, background: "#ffffff" }}>
        {Array.from({ length: Math.max(1, Math.floor((h / u - 12) / 22)) }, (_, i) => (
          <div key={i} style={{ position: "absolute", top: (8 + i * 22) * u, [i % 2 ? "right" : "left"]: 6 * u, width: `${i % 2 ? 46 : 70}%`, height: (i % 2 ? 10 : 14) * u, borderRadius: 5 * u, background: i % 2 ? "#ececf1" : "transparent", border: i % 2 ? undefined : `${0.6 * u}px solid #e3e3e8` }} />
        ))}
      </div>
    );
  if (kind === "web")
    return (
      <div style={{ position: "absolute", inset: 0, background: "#ffffff" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 12 * u, background: "#f6f8fa", borderBottom: `${0.4 * u}px solid #d0d7de` }} />
        <div style={{ position: "absolute", left: 6 * u, top: 18 * u, width: "46%", height: 4 * u, borderRadius: u, background: "#0969da", opacity: 0.75 }} />
        {rows(Math.max(0, Math.min(fit - 4, 12)), "#d0d7de", 28, 6)}
      </div>
    );
  if (kind === "doc")
    return (
      <div style={{ position: "absolute", inset: 0, background: "#fffdf8" }}>
        <div style={{ position: "absolute", left: 8 * u, top: 8 * u, width: "50%", height: 4.5 * u, borderRadius: u, background: "#37352f" }} />
        {rows(Math.max(0, Math.min(fit - 3, 14)), "#c8c6c0", 20, 6, 8)}
      </div>
    );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#ffffff" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 26 * u, background: "#eef0f4" }} />
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: (32 + (i % 3) * 22) * u, top: (8 + Math.floor(i / 3) * 22) * u, width: 14 * u, height: 11 * u, borderRadius: 2 * u, background: "#5aa7f5", opacity: 0.85 }} />
      ))}
    </div>
  );
};

/** Mac 窗口缩略：标题栏（红黄绿三点、App 图标、窗口名）+ 内容 */
export const MiniWindow: React.FC<{ win: Mini; w: number; h: number; seed?: number }> = ({ win, w, h, seed = 0 }) => {
  const bar = Math.max(14, w * 0.075);
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: w * 0.035, overflow: "hidden", background: "#ececec", boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bar, background: "#e8e8ea", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
          <div key={c} style={{ position: "absolute", left: bar * (0.45 + i * 0.62), top: bar * 0.32, width: bar * 0.36, height: bar * 0.36, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ position: "absolute", left: bar * 2.3, right: bar * 0.5, top: 0, height: bar, display: "flex", alignItems: "center", justifyContent: "center", gap: bar * 0.25 }}>
          <Img src={staticFile(assets[win.icon])} style={{ width: bar * 0.62, height: bar * 0.62 }} />
          <span style={{ fontFamily: SF, fontSize: bar * 0.46, fontWeight: 600, color: "#4a4a4c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{win.title}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: bar, bottom: 0 }}>
        <MiniBody kind={win.kind} w={w} h={h - bar} seed={seed} />
      </div>
    </div>
  );
};

/** 窗口内容本身（不带标题栏），竖屏的样子：「流转自如」卡里的窗口卡片用 */
export const MiniScreen: React.FC<{ win: Mini; w: number; h: number; seed?: number }> = ({ win, w, h, seed = 0 }) => (
  <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
    <MiniBody kind={win.kind} w={w} h={h} seed={seed} />
  </div>
);

/** 卡里出现的 Mac 窗口：真实存在的 App，窗口名跟片子里其他地方一致（不用 Notion，主人嫌它质感差） */
export const MINIS: readonly Mini[] = [
  { kind: "term", icon: "iconGhostty", app: "Ghostty", title: "✳ Claude Code" },
  { kind: "chat", icon: "iconChatgpt", app: "ChatGPT", title: "ChatGPT" },
  { kind: "web", icon: "iconSafari", app: "Safari", title: "github.com/zephyr4123/snug" },
  { kind: "code", icon: "iconVscode", app: "Code", title: "Scrolling.swift — snug" },
  { kind: "chat", icon: "iconClaude", app: "Claude", title: "Claude" },
  { kind: "files", icon: "iconFinder", app: "Finder", title: "Downloads" },
  { kind: "doc", icon: "iconSettings", app: "System Settings", title: "Login Items" },
  { kind: "code", icon: "iconCursor", app: "Cursor", title: "ZoomBook.swift — snug" },
  { kind: "term", icon: "iconGhostty", app: "Ghostty", title: ".../coding/personal/snug" },
  { kind: "chat", icon: "iconWechat", app: "WeChat", title: "WeChat" },
];
