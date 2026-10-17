import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Camera } from "../../../engine/camera";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Seal } from "../../../engine/speakmore/Seal";
import { assets } from "../assets.gen";
import { DownloadPill } from "../components/Brand";
import { Pointer } from "../components/Bits";
import { Sfx, swellBefore } from "../components/Fx";
import { UI } from "../icons";
import { prog, show } from "../motion";
import { COLOR, EASE, SANS, beat } from "../theme";

// 开场：官网首屏照原样一块块搭起来（图标、开口即成文、一句话、两个下载按钮、主窗口），
// 镜头慢慢往前推；指针点下"下载 Windows 版"，镜头一头扎进这颗按钮，下一章从 Windows 桌面亮起来。
// 正好是配乐前 7 秒的前奏，安静、不赶。

export const HERO_FRAMES = beat(16);

const T = {
  page: 0,
  seal: 12,
  title: 30,
  lead: 64,
  buttons: 92,
  shot: 112,
  pointer: 300,
  hover: 352,
  press: 372,
  zoom: 386,
};

const TITLE = [..."开口即成文"];
// 两颗按钮：各 300 宽、间距 16，Windows 那颗在右边；镜头扎进它右端的圆头里（字不在那儿，放大时不会糊一屏字）
const PILL = { width: 300, height: 62, gap: 16, top: 590 };
const WIN_LEFT = 960 + PILL.gap / 2;
const DIVE = { x: WIN_LEFT + PILL.width - 14, y: PILL.top + PILL.height / 2 };

export const HERO_CAMERA: Camera = { focus: [[0, 1]], zoom: [[0, 1]] };

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();

  // 镜头：一直极慢地推近；点下去之后加速扎进按钮
  const drift = 1 + 0.035 * interpolate(frame, [0, T.zoom], [0, 1], clamp);
  const dive = interpolate(frame, [T.zoom, HERO_FRAMES], [0, 1], { ...clamp, easing: Easing.in(Easing.poly(4)) });
  const scale = drift * (1 + 70 * dive);

  const hover = prog(frame, T.hover, 10, EASE.outQuint);
  const press = interpolate(frame, [T.press, T.press + 4, T.press + 12], [0, 1, 0], clamp);
  const pointerIn = prog(frame, T.pointer, 52);
  const px = interpolate(pointerIn, [0, 1], [1560, DIVE.x - 40]);
  const py = interpolate(pointerIn, [0, 1], [1020, DIVE.y + 6]);

  const shotIn = prog(frame, T.shot, 46);
  const fromBlack = 1 - prog(frame, 0, 22, EASE.outQuint);

  return (
    <AbsoluteFill style={{ background: COLOR.paper, fontFamily: SANS, color: COLOR.paperInk, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${DIVE.x}px ${DIVE.y}px` }}>
        <Nav frame={frame} />

        <div style={{ position: "absolute", left: 960 - 48, top: 132 }}>
          <Seal
            size={96}
            bars={[0, 1, 2, 3, 4].map((i) => prog(frame, T.seal + i * 5, 22, EASE.outQuint))}
            base={prog(frame, T.seal + 18, 18, EASE.outQuint)}
          />
        </div>

        <div style={{ position: "absolute", top: 268, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          {TITLE.map((ch, i) => (
            <span key={i} style={{ display: "inline-block", fontSize: 158, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, ...show(frame, T.title + i * 5, undefined, 34) }}>
              {ch}
            </span>
          ))}
        </div>

        <div style={{ position: "absolute", top: 462, left: 0, right: 0, textAlign: "center", fontSize: 34, fontWeight: 500, lineHeight: 1.36, color: COLOR.paperInk2 }}>
          <div style={show(frame, T.lead)}>Mac 与 Windows 上的语音输入。</div>
          <div style={show(frame, T.lead + 10)}>模型、方式、费用，由你决定。</div>
        </div>

        <div style={{ position: "absolute", top: PILL.top, left: 0, right: 0, display: "flex", justifyContent: "center", gap: PILL.gap, ...show(frame, T.buttons, undefined, 20) }}>
          <DownloadPill os="apple" label="下载 Apple 芯片版" style={{ width: PILL.width }} />
          <DownloadPill
            os="windows"
            label="下载 Windows 版"
            contentOpacity={1 - prog(frame, T.zoom, 10)}
            style={{
              width: PILL.width,
              transform: `translateY(${-3 * hover}px) scale(${1 - 0.03 * press})`,
              boxShadow: `0 ${10 * hover}px ${26 * hover}px oklch(0.21 0.02 255 / ${0.3 * hover})`,
            }}
          />
        </div>
        <div style={{ position: "absolute", top: PILL.top + 82, left: 652, width: PILL.width, textAlign: "center", fontSize: 19, color: COLOR.paperInk2, ...show(frame, T.buttons + 12) }}>
          Intel 芯片 Mac 版 →
        </div>

        {/* 主窗口：和官网一样从下面露出上半截，进场时由斜着立起来 */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 742, display: "flex", justifyContent: "center", perspective: 1800 }}>
          <Img
            src={staticFile(assets.appHome)}
            style={{
              width: 1300,
              opacity: shotIn,
              transformOrigin: "50% 0%",
              transform: `translateY(${120 * (1 - shotIn)}px) rotateX(${24 * (1 - shotIn)}deg)`,
            }}
          />
        </div>

        <Pointer x={px} y={py} opacity={pointerIn * (1 - prog(frame, T.zoom, 8))} scale={1.5} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `oklch(0 0 0 / ${fromBlack})` }} />

      <Sfx at={T.title + 22} name="sfxNote0" volume={0.22} />
      <Sfx at={T.press} name="sfxClick" volume={0.32} />
      <Sfx at={swellBefore(HERO_FRAMES)} name="sfxSwell" volume={0.5} />
    </AbsoluteFill>
  );
};

const NAV = ["识别方式", "性能", "模型", "隐私", "开发者"];

/** 官网顶上的导航：左边图标和名字，右边几项、GitHub、下载 */
const Nav: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 360,
      right: 360,
      height: 76,
      display: "flex",
      alignItems: "center",
      gap: 34,
      fontSize: 18,
      color: COLOR.paperInk2,
      opacity: prog(frame, 18, 30),
    }}
  >
    <Seal size={32} bars={[1, 1, 1, 1, 1]} base={1} />
    <span style={{ marginLeft: -20, fontSize: 22, fontWeight: 650, color: COLOR.paperInk }}>SpeakMore</span>
    <span style={{ flex: 1 }} />
    {NAV.map((item) => (
      <span key={item}>{item}</span>
    ))}
    <Glyph icon={UI.github} size={24} style={{ color: COLOR.paperInk }} />
    <span style={{ padding: "8px 18px", borderRadius: 999, background: COLOR.paperInk, color: COLOR.paper, fontSize: 16, fontWeight: 600 }}>下载</span>
  </div>
);
