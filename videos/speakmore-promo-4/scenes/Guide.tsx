import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { activeWindow, Bar, BOX, WindowStack } from "../components/window";
import { b, LAND, SANS, TONE, UI } from "../theme";

// 结尾的引导：官网和 GitHub 的真截图（2026-11-09 截的，1440×900 两倍图）。先在官网上点"下载 Apple 芯片版"，
// 右上角弹出下载进度；八拍后换成 GitHub 仓库页，点 Star，按钮变成 Starred、数字加一。左边两行跟着亮起当前那一个，下面是网址。
// 截图里按钮的位置（原图像素）：官网下载按钮 964,878 起 464×96；GitHub 的 Star 按钮 2452,376 起 204×56。
const T = TONE.ochre;
const at = (s: number) => LAND + sec(s);
const START = [LAND, LAND + b(196) - b(188)];
const STEPS = [
  { head: "官网下载", url: "speakmore.zephyrxiang.com", top: 300 },
  { head: "点亮星标", url: "github.com/zephyr4123/speakmore", top: 560 },
];
const SCREEN = { x: 0, y: 54, w: BOX.w, h: BOX.h - 54, r: 0 };
const BAR = { bg: "#eceef1", line: "#dcdfe4" };

const DL_CLICK = START[0] + sec(1.85);
const DL_SHOW = START[0] + sec(2.0);
const DL_DONE = START[0] + sec(3.1);
const STAR_CLICK = START[1] + sec(1.45);

export const Guide: React.FC = () => {
  const frame = useCurrentFrame();
  const active = activeWindow(frame, START);
  return (
    <AbsoluteFill>
      <Backdrop tone="ochre" />
      {STEPS.map((s, i) => {
        const on = i === active;
        const enter = i === 0 ? at(-0.35) : START[1] - 30;
        return (
          <div key={s.head} style={{ position: "absolute", left: 118, top: s.top, opacity: on ? 1 : 0.38 }}>
            <Head at={enter} text={s.head} color={T.ink} size={100} />
            <Sub at={enter + 14} text={s.url} color={T.ink2} size={26} style={{ marginTop: 18 }} />
          </div>
        );
      })}
      <WindowStack starts={START} bg="#f4f5f7" windows={[<Site key="site" />, <Repo key="repo" />]} />
    </AbsoluteFill>
  );
};

const Url: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ flex: 1, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: UI, fontSize: 15, color: "#5b616b", marginRight: 90 }}>
    <svg width={12} height={14} viewBox="0 0 12 14" fill="#8a9099">
      <rect x="1" y="6" width="10" height="8" rx="1.5" />
      <path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="#8a9099" strokeWidth="1.6" />
    </svg>
    {text}
  </div>
);

/** 按下去的那一下：14 帧里亮一下再回来 */
const press = (frame: number, at: number) => (frame >= at && frame < at + 14 ? Math.sin(((frame - at) / 14) * Math.PI) : 0);

// 官网：推到两个下载按钮，光标点"下载 Apple 芯片版"
const Site: React.FC = () => {
  const frame = useCurrentFrame();
  const S0 = START[0];
  return (
    <AbsoluteFill style={{ background: "#f7f8fa" }}>
      <Screen
        src={assets.siteHero}
        w={2880}
        h={1800}
        box={SCREEN}
        bg="#f7f8fa"
        shadow={false}
        keys={[
          { f: 0, x: 1440, y: 900, s: 0.385 },
          { f: S0 + sec(0.4), x: 1440, y: 900, s: 0.385 },
          { f: S0 + sec(1.3), x: 1440, y: 860, s: 0.75 },
          { f: S0 + sec(3.2), x: 1440, y: 860, s: 0.75 },
          { f: S0 + sec(4.3), x: 1440, y: 850, s: 0.77 },
        ]}
        pointer={{
          kind: "arrow",
          show: [S0 + sec(0.9), S0 + sec(3.5)],
          keys: [
            { f: S0 + sec(0.9), x: 1900, y: 1250 },
            { f: S0 + sec(1.7), x: 1196, y: 930 },
            { f: S0 + sec(2.6), x: 1196, y: 930 },
            { f: S0 + sec(3.3), x: 1350, y: 1100 },
          ],
          clicks: [DL_CLICK],
        }}
        overlay={<div style={{ position: "absolute", left: 964, top: 878, width: 464, height: 96, borderRadius: 48, background: `oklch(1 0 0 / ${0.22 * press(frame, DL_CLICK)})` }} />}
      />
      <DownloadChip />
      <Bar {...BAR}>
        <Url text="speakmore.zephyrxiang.com" />
      </Bar>
    </AbsoluteFill>
  );
};

// 浏览器右上角弹出的下载进度：文件名、进度条，下完换成"下载完成"
const DownloadChip: React.FC = () => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [DL_SHOW, DL_SHOW + 18], [0, 1], { ...clamp, easing: outExpo });
  if (a <= 0) return null;
  const p = interpolate(frame, [DL_SHOW + 6, DL_DONE], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const done = frame >= DL_DONE;
  return (
    <div
      style={{
        position: "absolute",
        right: 18,
        top: 66,
        width: 390,
        padding: "16px 18px",
        borderRadius: 14,
        background: "#fff",
        display: "flex",
        gap: 14,
        alignItems: "center",
        fontFamily: `${UI}, ${SANS}`,
        opacity: a,
        transformOrigin: "90% 0",
        transform: `translateY(${-10 * (1 - a)}px) scale(${0.95 + 0.05 * a})`,
        boxShadow: "0 0 0 1px oklch(0.2 0.01 260 / 0.08), 0 22px 44px -16px oklch(0.15 0.02 260 / 0.4)",
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 11, background: "#eef1f5", display: "grid", placeItems: "center" }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={done ? "#2f9e5b" : "#2d5bb0"} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          {done ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#1f2329" }}>SpeakMore-arm64.dmg</div>
        {done ? (
          <div style={{ fontSize: 15, color: "#2f9e5b", marginTop: 6 }}>下载完成</div>
        ) : (
          <div style={{ height: 6, borderRadius: 3, background: "#e6e9ee", marginTop: 12, overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 3, background: "#2d5bb0" }} />
          </div>
        )}
      </div>
    </div>
  );
};

// GitHub：推到右上角的 Star，光标点下去，按钮换成 Starred、数字 194 → 195
const Repo: React.FC = () => {
  const S1 = START[1];
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Screen
        src={assets.ghRepo}
        w={2880}
        h={1800}
        box={SCREEN}
        bg="#fff"
        shadow={false}
        keys={[
          { f: 0, x: 1900, y: 680, s: 0.55 },
          { f: S1 + sec(0.2), x: 1900, y: 680, s: 0.55 },
          { f: S1 + sec(1.0), x: 2270, y: 540, s: 0.95 },
          { f: S1 + sec(4.0), x: 2280, y: 530, s: 0.98 },
        ]}
        pointer={{
          kind: "arrow",
          show: [S1 + sec(0.5), S1 + sec(5)],
          keys: [
            { f: S1 + sec(0.5), x: 2150, y: 760 },
            { f: S1 + sec(1.3), x: 2560, y: 408 },
            { f: S1 + sec(2.2), x: 2560, y: 408 },
            { f: S1 + sec(2.9), x: 2620, y: 520 },
          ],
          clicks: [STAR_CLICK],
        }}
        overlay={<Starred />}
      />
      <Bar {...BAR}>
        <Url text="github.com/zephyr4123/speakmore" />
      </Bar>
    </AbsoluteFill>
  );
};

// 点过之后的 Star 按钮：照 GitHub 的样子画在原按钮上（原图坐标），星星变成实心的黄色、弹一下
const Starred: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < STAR_CLICK + 4) return null;
  const pop = interpolate(frame, [STAR_CLICK + 4, STAR_CLICK + 14, STAR_CLICK + 26], [0.5, 1.25, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 2452,
        top: 376,
        height: 56,
        padding: "0 14px 0 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 12,
        border: "2px solid #d1d9e0",
        background: "#f6f8fa",
        fontFamily: UI,
        fontSize: 24,
        fontWeight: 500,
        color: "#1f2328",
      }}
    >
      <svg width={32} height={32} viewBox="0 0 16 16" style={{ transform: `scale(${pop})` }}>
        <path
          fill="#e3b341"
          d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"
        />
      </svg>
      Starred
      <span style={{ padding: "2px 12px", borderRadius: 999, background: "oklch(0.55 0.02 255 / 0.14)", fontSize: 22, fontWeight: 600 }}>195</span>
    </div>
  );
};
