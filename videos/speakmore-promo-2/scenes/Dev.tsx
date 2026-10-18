import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Sfx } from "../components/Fx";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, show, typed } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SHADOW, b } from "../theme";

// 开发者：终端里敲命令（命令和输出照 SpeakMore 官网终端演示那几条，都是真跑出来的），切到"Windows 开发"再跑全部单测；
// 然后 GitHub 的仓库页（10-17 截的整页长图）转进来，从上往下慢慢滑到 README。字只有"命令行 / 与 App 对等"和"开源 · MIT"。

export const DEV_FRAMES = b(16);
export const DEV_CAMERA = deepCamera(DEV_FRAMES);

type Out = { text: string; tone?: "faint" | "green" };
type Cmd = { at: number; cmd: string; out: readonly Out[]; tab: 0 | 1 };
const TYPE = 18;
const CMDS: readonly Cmd[] = [
  {
    at: b(0.4),
    tab: 0,
    cmd: "speakmore mode private",
    out: [{ text: "切到了 private 模式：本机的 qwen3-asr-0.6b-q8，不润色、不上传。", tone: "faint" }, { text: "已经换上，不用重启。", tone: "green" }],
  },
  { at: b(1.7), tab: 0, cmd: "speakmore status --json", out: [{ text: '{"running":true,"settings":{"mode":{"value":"private",…},…}}', tone: "faint" }] },
  { at: b(3.3), tab: 1, cmd: "scripts/dev/win-test.sh", out: [{ text: "ℹ tests 920  ℹ pass 904  ℹ fail 0  ℹ skipped 16", tone: "green" }] },
  { at: b(4.5), tab: 1, cmd: "scripts/dev/win-screenshot.sh desktop.png", out: [{ text: "desktop.png", tone: "faint" }] },
];
const TAB_SWITCH = b(3);
const T = { caption: b(1.2), github: b(5.8), open: b(7), scroll: b(6.6) };
// 浏览器窗口和里面的长图：图 1800 像素宽，按窗口宽缩；往下滑到 README 的"五项自由"露出来
const BROWSER = { left: 860, top: 90, width: 980, height: 900, bar: 58 };
const PAGE = { w: 1800, h: 4584 };
const SCROLL = 1300;
const TERM = { left: 150, top: 240, width: 1080, height: 560 };

export const Dev: React.FC = () => {
  const frame = useCurrentFrame();
  const gh = prog(frame, T.github, 46);
  const tab = frame >= TAB_SWITCH ? 1 : 0;
  const termBack = prog(frame, T.github, 40, EASE.inOut);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <div
        style={{
          position: "absolute",
          ...TERM,
          borderRadius: 22,
          overflow: "hidden",
          background: "oklch(0.15 0.008 255 / 0.94)",
          boxShadow: `0 0 0 1px ${COLOR.line}, 0 40px 100px oklch(0 0 0 / 0.5)`,
          transformOrigin: "0% 50%",
          transform: `translateX(${-60 * termBack}px) scale(${1 - 0.12 * termBack})`,
          opacity: 1 - 0.35 * termBack,
          ...show(frame, 0, undefined, 30),
        }}
      >
        <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: "oklch(0.2 0.008 255)", borderBottom: `1px solid ${COLOR.line}` }}>
          <span style={{ display: "flex", gap: 9, marginRight: 18 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <i key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
            ))}
          </span>
          {["命令行", "Windows 开发"].map((name, i) => (
            <span
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 10,
                fontSize: 20,
                fontWeight: 550,
                color: tab === i ? COLOR.ink : COLOR.faint,
                background: tab === i ? "oklch(1 0 0 / 0.1)" : undefined,
              }}
            >
              <Glyph icon={i === 0 ? UI.terminal : UI.windows} size={20} />
              {name}
            </span>
          ))}
        </div>
        <div style={{ padding: "26px 30px", fontFamily: MONO_STACK, fontSize: 25, lineHeight: 1.75 }}>
          {CMDS.filter((c) => c.tab === tab && frame >= c.at - 6).map((c) => (
            <div key={c.cmd} style={{ marginBottom: 14 }}>
              <div style={{ whiteSpace: "pre" }}>
                <span style={{ color: COLOR.green }}>$ </span>
                {typed(c.cmd, frame, c.at, TYPE)}
                {frame < c.at + TYPE + 8 ? <span style={{ display: "inline-block", width: "0.6em", height: "1.1em", verticalAlign: "-0.2em", background: COLOR.ink, opacity: 0.8 }} /> : null}
              </div>
              {c.out.map((o, i) =>
                frame >= c.at + TYPE + 8 + i * 5 ? (
                  <div key={i} style={{ color: o.tone === "green" ? COLOR.green : COLOR.faint, whiteSpace: "pre-wrap", opacity: prog(frame, c.at + TYPE + 8 + i * 5, 6) }}>
                    {o.text}
                  </div>
                ) : null,
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: 1320, top: 360, fontSize: 70, fontWeight: 700, lineHeight: 1.3, textShadow: SHADOW, opacity: 1 - prog(frame, T.github - 10, 20) }}>
        <div style={show(frame, T.caption)}>命令行</div>
        <div style={{ color: COLOR.ink2, ...show(frame, T.caption + 10) }}>与 App 对等</div>
      </div>

      {/* GitHub 的仓库页：浏览器窗口，从右边转进来 */}
      {gh > 0 ? (
        <div
          style={{
            position: "absolute",
            left: BROWSER.left,
            top: BROWSER.top,
            width: BROWSER.width,
            height: BROWSER.height,
            borderRadius: 20,
            overflow: "hidden",
            background: "white",
            boxShadow: "0 0 0 1px oklch(0 0 0 / 0.12), 0 40px 100px oklch(0 0 0 / 0.5)",
            opacity: gh,
            transformOrigin: "100% 50%",
            transform: `perspective(2200px) translateX(${260 * (1 - gh)}px) rotateY(${-20 * (1 - gh)}deg)`,
          }}
        >
          <div style={{ position: "relative", zIndex: 1, height: BROWSER.bar, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", background: "oklch(0.96 0.004 80)", borderBottom: "1px solid oklch(0.9 0.006 80)" }}>
            <span style={{ display: "flex", gap: 9 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <i key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
              ))}
            </span>
            <span style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 22px", borderRadius: 10, background: "oklch(0.92 0.005 80)", color: COLOR.paperInk, fontSize: 19 }}>
                <Glyph icon={UI.lock} size={16} style={{ color: COLOR.paperInk2 }} />
                github.com/zephyr4123/speakmore
              </span>
            </span>
          </div>
          <Img
            src={staticFile(assets.githubPage)}
            style={{
              position: "absolute",
              left: 0,
              top: BROWSER.bar - interpolate(frame, [T.scroll, DEV_FRAMES], [0, SCROLL], { ...clamp, easing: EASE.inOut }),
              width: BROWSER.width,
              height: (BROWSER.width * PAGE.h) / PAGE.w,
            }}
          />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 150, top: 860, display: "flex", alignItems: "center", gap: 20, fontSize: 64, fontWeight: 700, textShadow: SHADOW, ...show(frame, T.open) }}>
        <Glyph icon={UI.github} size={62} />
        开源 · MIT
      </div>

      <Sfx at={0} name="sfxFlash" volume={0.3} />
      {CMDS.map((c) => (
        <Sfx key={c.cmd} at={c.at} name="sfxKeys" volume={0.28} frames={TYPE} />
      ))}
      <Sfx at={TAB_SWITCH} name="sfxTap" volume={0.22} />
      <Sfx at={T.github} name="sfxSwish" volume={0.4} />
      <Sfx at={T.open} name="sfxNote4" volume={0.25} />
    </AbsoluteFill>
  );
};
