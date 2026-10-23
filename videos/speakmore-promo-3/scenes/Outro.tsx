import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { prog, punch } from "../../../engine/motion";
import { Shot } from "../components/Shot";
import { Assemble, Line, Typewriter } from "../components/Type";
import { AppIcon, Pointer, Ring, Sub } from "../components/kit";
import { Browser } from "../components/windows";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, SANS, b } from "../theme";

// 落版（第 188–225 拍，原曲最后一段和结尾）：
// GitHub 仓库页（真截图，2026-10-23 时 139 星）：指针点 Star，星亮起、139 变 140，一颗大星带着数字弹出来 → "Star on GitHub."
// → 官网下载区（真截图）：点"下载 Apple 芯片版"，底下弹出下载条 → "Download for free."（字母一个个落下来）
// → 图标、SpeakMore、口号、两个网址；第 216 拍乐队停、清唱收尾，只留图标在静音里，到片尾。
const START = 188;
const at = (n: number) => b(n - START);
export const OUTRO_FRAMES = b(37);

const W = 1500;
const K = W / 1920; // 截图缩放
const GH_H = 800;
const SITE_H = 860;
// 截图里的位置（1920×1080 截的），换成窗口里的坐标：标题栏 52，GitHub 的黑色顶栏 72 裁掉
const STAR = { x: ((1466 + 1568) / 2) * K, y: 52 + ((192 + 220) / 2 - 72) * K };
const MAC = { x: ((722 + 954) / 2) * K, y: 52 + ((587 + 635) / 2) * K, w: (954 - 722) * K, h: (635 - 587) * K };

/** 指针从 from 移到 to：at 帧起 dur 帧 */
const path = (frame: number, at: number, dur: number, from: { x: number; y: number }, to: { x: number; y: number }) => {
  const t = prog(frame, at, dur, EASE.inOut);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 60 };
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const starClick = at(192);
  const starred = frame >= starClick + 2;
  const p1 = path(frame, at(189.4), 50, { x: 860, y: 620 }, STAR);
  const dlClick = at(201);
  const p2 = path(frame, at(198.4), 50, { x: 1100, y: 760 }, MAC);
  const count = frame < starClick + 6 ? 139 : 140;
  const badge = prog(frame, starClick + 4, 18, EASE.outExpo) * (1 - prog(frame, at(196), 12));
  const toast = prog(frame, dlClick + 4, 18, EASE.outExpo);
  const fill = prog(frame, dlClick + 10, b(3.4), (t) => t);
  const silence = prog(frame, at(216), b(1.5), EASE.inOut);

  return (
    <AbsoluteFill>
      {/* GitHub：点 Star */}
      <Shot y={70} w={W} h={GH_H} enter={0} leave={at(196.6)} rotY={-8} how="far" kick={starClick}>
        <Browser w={W} h={GH_H} url="github.com/zephyr4123/speakmore">
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "oklch(1 0 0)" }}>
            <Img src={staticFile(assets.githubPage)} style={{ width: W, marginTop: -72 * K, display: "block" }} />
          </div>
        </Browser>
        {starred ? (
          // 点过之后的样子：星变实心、数字加一
          <div style={{ position: "absolute", left: STAR.x - 52, top: STAR.y - 12, width: 104, height: 24, borderRadius: 6, background: "oklch(0.97 0.004 255)", boxShadow: "0 0 0 1px oklch(0.85 0.005 255)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: SANS, fontSize: 11, fontWeight: 600, color: COLOR.ink }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="oklch(0.8 0.16 85)" stroke="oklch(0.7 0.16 80)" strokeWidth={1.5}>
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
            </svg>
            Starred
            <span style={{ padding: "0 6px", borderRadius: 8, background: "oklch(0.9 0.006 255)" }}>{count}</span>
          </div>
        ) : null}
        {frame < at(196.4) ? <Pointer x={p1.x} y={p1.y} press={starClick} /> : null}
      </Shot>
      {/* 一颗大星带着数字从按钮那里弹出来，星屑四散 */}
      {badge > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 30, padding: "28px 52px", borderRadius: 999, background: "oklch(1 0 0)", boxShadow: "0 30px 80px -24px oklch(0.2 0.03 260 / 0.45), 0 0 0 1px oklch(0.9 0.006 255)", opacity: badge, transform: `translate(${380 * (1 - badge)}px, ${-280 * (1 - badge) + 40}px) scale(${(0.4 + 0.6 * badge) * punch(frame, starClick + 6, 0.06, 18)})` }}>
            <svg width={90} height={90} viewBox="0 0 24 24" fill="oklch(0.82 0.16 85)">
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
            </svg>
            <span style={{ position: "relative", display: "inline-block", height: 110, overflow: "hidden", fontFamily: DISPLAY, fontSize: 96, fontWeight: 700, letterSpacing: "-0.03em", color: COLOR.ink, lineHeight: "110px" }}>
              <span style={{ display: "block", transform: `translateY(${-110 * prog(frame, starClick + 8, 14, EASE.outExpo)}px)` }}>
                <span style={{ display: "block" }}>139</span>
                <span style={{ display: "block" }}>140</span>
              </span>
            </span>
          </div>
          {Array.from({ length: 14 }, (_, i) => {
            const t = prog(frame, starClick + 4, 30, EASE.outQuint);
            const ang = random(`sa-${i}`) * Math.PI * 2;
            const r = 140 + random(`sr-${i}`) * 260;
            return <span key={i} style={{ position: "absolute", left: 960 + Math.cos(ang) * r * t, top: 580 + Math.sin(ang) * r * t, width: 12, height: 12, borderRadius: 6, background: i % 2 ? "oklch(0.82 0.16 85)" : COLOR.cinnabar, opacity: (1 - t) * badge }} />;
          })}
        </AbsoluteFill>
      ) : null}
      <Line out={at(196.4)} y={-440}>
        <Assemble value="Star on GitHub." at={at(188.6)} size={96} seed="star" />
      </Line>
      <Line out={at(196.4)} y={-350}>
        <Sub text="在 GitHub 点亮一颗星" at={at(189.6)} size={32} />
      </Line>

      {/* 官网：点下载 */}
      <Shot y={60} w={W} h={SITE_H} enter={at(196.6)} leave={at(205.6)} rotY={8} how="whip" kick={dlClick}>
        <Browser w={W} h={SITE_H} url="speakmore.zephyrxiang.com">
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "oklch(0.99 0.002 255)" }}>
            <Img src={staticFile(assets.siteDownload)} style={{ width: W, display: "block" }} />
          </div>
        </Browser>
        {frame >= dlClick && frame < dlClick + 10 ? (
          <div style={{ position: "absolute", left: MAC.x - MAC.w / 2, top: MAC.y - MAC.h / 2, width: MAC.w, height: MAC.h, borderRadius: 999, background: "oklch(1 0 0 / 0.25)" }} />
        ) : null}
        {frame < at(205.4) ? <Pointer x={p2.x} y={p2.y} press={dlClick} /> : null}
        {/* 下载条 */}
        {toast > 0 ? (
          <div style={{ position: "absolute", left: W / 2 - 300, bottom: 40, width: 600, padding: "22px 28px", borderRadius: 22, background: "oklch(1 0 0)", boxShadow: "0 24px 60px -20px oklch(0.2 0.03 260 / 0.45), 0 0 0 1px oklch(0.9 0.006 255)", opacity: toast, transform: `translateY(${80 * (1 - toast)}px)`, display: "flex", alignItems: "center", gap: 20, fontFamily: SANS }}>
            <AppIcon size={64} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: COLOR.ink }}>SpeakMore-arm64.dmg</div>
              <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: "oklch(0.92 0.005 255)", overflow: "hidden" }}>
                <div style={{ width: `${fill * 100}%`, height: "100%", background: COLOR.ink }} />
              </div>
            </div>
          </div>
        ) : null}
      </Shot>
      <Line out={at(205.4)} y={-450}>
        <span style={{ display: "inline-flex", fontFamily: DISPLAY, fontSize: 96, fontWeight: 600, letterSpacing: "-0.025em", color: COLOR.ink }}>
          {[..."Download for free."].map((ch, i) => {
            // 下载：字母一个个从上面落下来、落定时轻轻一弹
            const t = prog(frame, at(197.2) + i * 1.3, 16, EASE.outQuint);
            const bounce = Math.sin(Math.min(1, t) * Math.PI) * 0.12;
            return (
              <span key={`${ch}-${i}`} style={{ display: "inline-block", whiteSpace: "pre", opacity: Math.min(1, t * 3), transform: `translateY(${-160 * (1 - t)}px) scaleY(${1 - bounce})`, color: ch === "f" || i > 12 ? COLOR.cinnabar : undefined }}>
                {ch}
              </span>
            );
          })}
        </span>
      </Line>
      <Line out={at(205.4)} y={-360}>
        <Sub text="官网免费下载 · macOS 与 Windows" at={at(198.4)} size={32} />
      </Line>

      {/* 落版：图标、SpeakMore、口号、两个网址；乐队停了以后只留图标 */}
      {frame >= at(205.8) ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", display: "grid", placeItems: "center", transform: `translateY(${-150 + 150 * silence}px) scale(${(0.6 + 0.4 * prog(frame, at(205.8), 20, EASE.outExpo)) * (1 + 0.5 * silence)})`, opacity: prog(frame, at(205.8), 12) }}>
            <Ring size={260} color={COLOR.cinnabar} at={at(206)} period={b(2)} style={{ opacity: 0.6 * (1 - silence) }} />
            <AppIcon size={190} style={{ filter: "drop-shadow(0 24px 40px oklch(0.2 0.05 260 / 0.35))" }} />
          </div>
          <div style={{ position: "absolute", top: 600, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - silence }}>
            <Assemble value="SpeakMore" at={at(206.4)} size={140} weight={650} seed="end" style={{ letterSpacing: "-0.035em" }} />
            <div style={{ marginTop: 10, fontFamily: DISPLAY, fontSize: 46, fontWeight: 500, letterSpacing: "-0.015em", color: COLOR.ink2, opacity: prog(frame, at(208), 14) }}>Speak it written. Select to translate.</div>
            <Sub text="口述成文，划词即译" at={at(208.6)} size={30} />
            <div style={{ marginTop: 40, display: "flex", gap: 60, fontFamily: DISPLAY, fontSize: 30, color: COLOR.ink }}>
              <Typewriter value="speakmore.zephyrxiang.com" at={at(210)} frames={22} size={30} weight={500} />
              <Typewriter value="github.com/zephyr4123/speakmore" at={at(211)} frames={26} size={30} weight={500} />
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
