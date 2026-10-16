import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { APP_WIN, AppShot, AppWindow } from "../components/AppWindow";
import { DOCK_SPEAKMORE } from "../components/Desktop";
import { Seal } from "../components/Seal";
import type { Camera } from "../components/Stage";
import { show } from "../motion";
import { BEAT, COLOR, EASE, SANS, SERIF, SHADOW } from "../theme";

// 第四章 App：在程序坞里点开 SpeakMore，真的主窗口从图标里展开 → 首页（字数、语速、热力图、花费）→
// 点侧栏的"历史"翻过去 → 窗口缩到中间，另两套主题的窗口从它身后左右滑出，三扇并排，再一起由上往下转成深色。
// 截图是 SpeakMore 的真页面（src/renderer/hub）在 Electron 里离屏渲染的，数据是造的（照官网截图脚本），
// 耗时按本机真实记录造成 3.5 秒左右，不比真的快。
// 时间按拍算，对在这两小节听得见的重音上：点"历史"在第 3 拍，换主题在第 5 拍，转深色在第 6 拍半（两小节里最重的一下）。

/** 主窗口打开后的中心 */
const MAIN = { x: 700 + APP_WIN.width / 2, y: 166 + APP_WIN.height / 2 };
/** 三扇并排时：中间那扇大一点、两边的往它身后掖进去一点 */
const ROW = { x: 1260, y: 541, mid: 0.44, side: 0.36, dx: 392 };
// 侧栏卡片右缘之外一点：翻页时侧栏只换选中的那一项，右边的内容才动
const SIDEBAR = 215;

const T = {
  click: 22,
  open: 24,
  lead: 40,
  history: Math.round(3 * BEAT),
  themes: Math.round(5 * BEAT),
  dark: Math.round(6.5 * BEAT),
  out: Math.round(7.5 * BEAT),
  end: Math.round(8 * BEAT),
};

const SIDES = [
  { light: assets.appHomeLightInk, dark: assets.appHomeDarkInk, side: -1, darkAt: T.dark },
  { light: assets.appHomeLightIndigo, dark: assets.appHomeDarkIndigo, side: 1, darkAt: T.dark + 8 },
];

// 光标：[帧, x, y]，画面坐标，指的是箭头尖。在程序坞的图标上点一下，进窗口歇着，再去点侧栏的"历史"
const HISTORY_ITEM = { x: MAIN.x - APP_WIN.width / 2 + 75, y: MAIN.y - APP_WIN.height / 2 + 170 };
const REST = { x: 1190, y: 640 };
const CURSOR = [
  [0, DOCK_SPEAKMORE.x + 70, DOCK_SPEAKMORE.y - 110],
  [T.click - 2, DOCK_SPEAKMORE.x + 4, DOCK_SPEAKMORE.y + 6],
  [T.open + 16, DOCK_SPEAKMORE.x + 4, DOCK_SPEAKMORE.y + 6],
  [T.open + 70, REST.x, REST.y],
  [T.history - 36, REST.x, REST.y],
  [T.history - 4, HISTORY_ITEM.x, HISTORY_ITEM.y],
  [T.history + 40, HISTORY_ITEM.x + 30, HISTORY_ITEM.y + 24],
] as const;

export const APP_FRAMES = T.end;
// 点程序坞那一下桌面要看得清，窗口开出来之后再退后
export const APP_CAMERA: Camera = {
  focus: [
    [0, 1],
    [20, 0.2],
    [T.open + 40, 0.2],
    [T.open + 90, 0.55],
    [T.out, 0.55],
  ],
  zoom: [[0, 1]],
};

const ease = (frame: number, range: readonly [number, number], easing = EASE.inOut) => interpolate(frame, range, [0, 1], { ...clamp, easing });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** 整章收尾时的退场：淡出、虚掉 */
const leave = (frame: number): React.CSSProperties => {
  const exit = ease(frame, [T.out, T.out + 22], EASE.outQuint);
  return { opacity: 1 - exit, filter: exit > 0.01 ? `blur(${12 * exit}px)` : undefined, transform: `translateY(${-32 * exit}px)` };
};
/** 深色由上往下盖下来的进度 */
const fallAt = (frame: number, at: number) => ease(frame, [at, at + 20]);

export const App: React.FC = () => {
  const frame = useCurrentFrame();

  // 主窗口：先从程序坞的图标里长到原位，换主题时再缩到三扇的中间
  const open = ease(frame, [T.open, T.open + 36], EASE.outExpo);
  const shrink = ease(frame, [T.themes, T.themes + 26]);
  const s0 = DOCK_SPEAKMORE.size / APP_WIN.width;
  // 窗口一直极慢地往前推一点
  const push = 1 + 0.02 * ease(frame, [0, T.end]);
  const main = {
    x: mix(mix(DOCK_SPEAKMORE.x, MAIN.x, open), ROW.x, shrink),
    y: mix(mix(DOCK_SPEAKMORE.y, MAIN.y, open), ROW.y, shrink),
    scale: push * mix(mix(s0, 1, open), ROW.mid, shrink),
  };

  // 首页 → 历史：侧栏的选中项淡过去，右边的内容新的一页从下面浮上来盖住旧的。
  // 旧的不先淡掉（两张都半透明时会透出桌面），新的 6 帧就盖实，叠影一闪而过，剩下的是往上浮的那点动作
  const sideSwap = ease(frame, [T.history + 2, T.history + 10]);
  const historyIn = interpolate(frame, [T.history + 3, T.history + 9], [0, 1], clamp);
  const historyRise = ease(frame, [T.history + 3, T.history + 22], EASE.outQuint);
  // 换主题时回到首页：缩小的那一路上淡回去
  const backHome = ease(frame, [T.themes, T.themes + 16]);
  // 两边的窗口等中间那扇缩得差不多了才从它身后滑出来
  const slide = ease(frame, [T.themes + 10, T.themes + 40], EASE.outQuint);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      <Lead frame={frame} />

      <AbsoluteFill style={leave(frame)}>
        {slide > 0
          ? SIDES.map((w) => (
              <AppWindow key={w.light} x={ROW.x + w.side * ROW.dx * slide} y={ROW.y} scale={push * mix(ROW.side * 0.9, ROW.side, slide)} opacity={interpolate(slide, [0, 0.3], [0, 1], clamp)}>
                <AppShot src={w.light} />
                <Dark src={w.dark} fall={fallAt(frame, w.darkAt)} />
              </AppWindow>
            ))
          : null}
        <AppWindow x={main.x} y={main.y} scale={main.scale} opacity={interpolate(open, [0, 0.15], [0, 1], clamp)}>
          <AppShot src={assets.appHomeLightCinnabar} />
          <AppShot src={assets.appHistory} style={{ opacity: sideSwap, clipPath: `inset(0 ${APP_WIN.width - SIDEBAR}px 0 0)` }} />
          <AppShot src={assets.appHistory} style={{ clipPath: `inset(0 0 0 ${SIDEBAR}px)`, opacity: historyIn, transform: `translateY(${14 * (1 - historyRise)}px)` }} />
          {backHome > 0 ? <AppShot src={assets.appHomeLightCinnabar} style={{ opacity: backHome }} /> : null}
          <Dark src={assets.appHomeDarkCinnabar} fall={fallAt(frame, T.dark + 4)} />
        </AppWindow>
      </AbsoluteFill>

      <DockPress frame={frame} />
      <Cursor frame={frame} />

      <Sequence from={T.click} layout="none" name="sfx:tick">
        <Audio src={staticFile(assets.sfxTick)} volume={0.32} />
      </Sequence>
      <Sequence from={T.open} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.22} />
      </Sequence>
      <Sequence from={T.history} layout="none" name="sfx:tick">
        <Audio src={staticFile(assets.sfxTick)} volume={0.3} />
      </Sequence>
      <Sequence from={T.themes} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.18} />
      </Sequence>
      <Sequence from={T.dark} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.18} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 深色那张，由上往下盖下来 */
const Dark: React.FC<{ src: string; fall: number }> = ({ src, fall }) => (fall > 0 ? <AppShot src={src} style={{ clipPath: `inset(0 0 ${(1 - fall) * 100}% 0)` }} /> : null);

/** 左边定调：App 的图标像安装包里那样盖下来，下面一个大字"App"，再下面一行随页面换的小字 */
const Lead: React.FC<{ frame: number }> = ({ frame }) => {
  const at = T.lead;
  const lines = [
    { text: "字数、语速、花费，一页尽览", at: at + 18, out: T.history - 6 },
    { text: "每一句话，皆有记录", at: T.history + 6, out: T.themes - 6 },
    { text: "三套主题，深浅随系统", at: T.themes + 6, out: T.out },
  ];
  return (
    <div style={{ position: "absolute", left: 180, top: 344, textShadow: SHADOW }}>
      <div style={leave(frame)}>
        <Seal
          size={112}
          bars={[0, 1, 2, 3, 4].map((i) => ease(frame, [at + i * 3, at + i * 3 + 14], EASE.outExpo))}
          base={ease(frame, [at + 10, at + 24], EASE.outExpo)}
        />
      </div>
      <div style={{ marginTop: 40, fontSize: 130, fontWeight: 600, lineHeight: 1, letterSpacing: "0.02em", ...show(frame, at + 6, T.out) }}>App</div>
      <div style={{ position: "relative", marginTop: 44, height: 40 }}>
        {lines.map((line) => (
          <div
            key={line.text}
            style={{
              position: "absolute",
              fontFamily: SERIF,
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "oklch(0.9 0.006 255)",
              whiteSpace: "nowrap",
              ...show(frame, line.at, line.out),
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 点下去那一下，程序坞里的图标暗一下 */
const DockPress: React.FC<{ frame: number }> = ({ frame }) => {
  const press = interpolate(frame, [T.click, T.click + 2, T.click + 14], [0, 1, 0], clamp);
  if (press <= 0) return null;
  const { x, y, size } = DOCK_SPEAKMORE;
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.225, background: `oklch(0 0 0 / ${0.35 * press})` }} />;
};

/** macOS 的箭头光标，点击时缩一下 */
const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  const frames = CURSOR.map(([f]) => f);
  const x = interpolate(frame, frames, CURSOR.map(([, cx]) => cx), { ...clamp, easing: EASE.inOut });
  const y = interpolate(frame, frames, CURSOR.map(([, , cy]) => cy), { ...clamp, easing: EASE.inOut });
  const opacity = interpolate(frame, [0, 8, T.history + 20, T.history + 40], [0, 1, 1, 0], clamp);
  const press = Math.max(...[T.click, T.history].map((at) => interpolate(frame, [at, at + 3, at + 9], [0, 1, 0], clamp)));
  if (opacity <= 0) return null;
  return (
    <svg
      viewBox="0 0 13 19"
      width={22}
      height={32}
      style={{
        position: "absolute",
        left: x - 1.7,
        top: y - 1.7,
        opacity,
        overflow: "visible",
        transformOrigin: "1.7px 1.7px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 3px oklch(0 0 0 / 0.35))",
      }}
    >
      <path d="M1 1 L1 15.5 L4.6 12.1 L7.1 17.6 L9.5 16.6 L7.1 11.2 L11.9 11.2 Z" fill="black" stroke="white" strokeWidth={1.1} strokeLinejoin="round" />
    </svg>
  );
};
