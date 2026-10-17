import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 三种识别方式：三条道，一条一条亮，一颗光点从录音走到成稿，走过的每一站标明在本机还是在云端。
// 随后 App 首页那个选识别方式的下拉（真截图）转进来。字只有方式的名字和两三个词。

export const MODES_FRAMES = b(16);
export const MODES_CAMERA = deepCamera(MODES_FRAMES);

type Kind = "io" | "device" | "cloud";
type Node = { label: string; icon: keyof typeof UI; kind: Kind };
const REC: Node = { label: "录音", icon: "mic", kind: "io" };
const DONE: Node = { label: "成稿", icon: "text", kind: "io" };
const LANES: readonly { name: string; facts: string; nodes: readonly Node[] }[] = [
  { name: "原生识别", facts: "上传音频 · 需要密钥", nodes: [REC, { label: "大模型", icon: "cloud", kind: "cloud" }, DONE] },
  {
    name: "转写 + 润色",
    facts: "只上传文字 · 需要密钥",
    nodes: [REC, { label: "本机转写", icon: "chip", kind: "device" }, { label: "润色", icon: "cloud", kind: "cloud" }, DONE],
  },
  { name: "数据隐私", facts: "不上传 · 无需密钥", nodes: [REC, { label: "本机转写", icon: "chip", kind: "device" }, DONE] },
];

const ROW = { left: 150, width: 1620, top: 292, height: 168, gap: 26 };
const TRACK = { left: 640, right: 1560 };
const active = (i: number) => b(3 + 2 * i);
const PICKER = b(9.5);

const KIND: Record<Kind, { bg: string; edge: string }> = {
  io: { bg: "oklch(1 0 0 / 0.07)", edge: "oklch(1 0 0 / 0.22)" },
  device: { bg: "oklch(0.8 0.07 255 / 0.18)", edge: "oklch(0.8 0.07 255 / 0.75)" },
  cloud: { bg: "oklch(0.74 0.17 32 / 0.16)", edge: "oklch(0.74 0.17 32 / 0.75)" },
};

export const Modes: React.FC = () => {
  const frame = useCurrentFrame();
  const lanesOut = prog(frame, PICKER, 30, EASE.inOut);
  const pickerIn = prog(frame, PICKER + 8, 46);
  const out = prog(frame, b(15.2), 26, EASE.inOut);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: ROW.left, top: 96, textShadow: SHADOW }}>
        <div style={{ fontSize: 78, fontWeight: 700, ...show(frame, 0) }}>三种识别方式</div>
        <div style={{ marginTop: 8, fontSize: 36, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.12em", ...show(frame, 10) }}>一键切换</div>
      </div>

      <AbsoluteFill style={{ opacity: 1 - lanesOut, transform: `translateX(${-160 * lanesOut}px)`, filter: lanesOut > 0.01 ? `blur(${10 * lanesOut}px)` : undefined }}>
        {LANES.map((lane, i) => (
          <Lane key={lane.name} frame={frame} index={i} lane={lane} />
        ))}
      </AbsoluteFill>

      {/* App 首页的下拉：三种方式、各用哪个模型，正在用的那一项打勾 */}
      {pickerIn > 0 ? (
        <AbsoluteFill style={{ perspective: 2000 }}>
          <Img
            src={staticFile(assets.appModePicker)}
            style={{
              position: "absolute",
              left: 520,
              top: 210,
              width: 1240,
              opacity: pickerIn,
              transformOrigin: "100% 50%",
              transform: `translateX(${180 * (1 - pickerIn)}px) rotateY(${-16 + 10 * pickerIn}deg)`,
              filter: "drop-shadow(0 40px 80px oklch(0 0 0 / 0.45))",
            }}
          />
          <div style={{ position: "absolute", left: ROW.left, top: 470, fontSize: 40, fontWeight: 600, lineHeight: 1.5, textShadow: SHADOW }}>
            <div style={show(frame, PICKER + 24)}>首页切换</div>
            <div style={{ color: COLOR.ink2, ...show(frame, PICKER + 32) }}>即刻生效</div>
            <div style={{ color: COLOR.ink2, ...show(frame, PICKER + 40) }}>配置分别保存</div>
          </div>
        </AbsoluteFill>
      ) : null}

      <Flash frame={frame} at={[0]} strength={0.7} />
      <Sfx at={0} name="sfxFlash" volume={0.3} />
      {(["sfxNote0", "sfxNote1", "sfxNote2"] as const).map((name, i) => (
        <Sfx key={name} at={rowIn(i)} name={name} volume={0.26} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`a${i}`} at={active(i)} name="sfxTap" volume={0.22} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`d${i}`} at={arrive(i)} name="sfxBlip" volume={0.35} />
      ))}
      <Sfx at={PICKER} name="sfxSwish" volume={0.4} />
      <Sfx at={swellBefore(MODES_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

const rowIn = (i: number) => b(0.6 + 0.4 * i);
/** 光点走到成稿的那一帧 */
const arrive = (i: number) => active(i) + b(1.5);

const Lane: React.FC<{ frame: number; index: number; lane: (typeof LANES)[number] }> = ({ frame, index, lane }) => {
  const top = ROW.top + index * (ROW.height + ROW.gap);
  const on = Math.min(prog(frame, active(index), 12), 1 - prog(frame, active(index) + b(2), 12));
  // 三条都还没轮到时都亮着；轮到某一条时其余的退一点
  const anyOn = frame >= active(0) ? 1 : 0;
  const dim = anyOn ? 0.42 + 0.58 * on : 1;
  const n = lane.nodes.length;
  const step = (TRACK.right - TRACK.left) / (n - 1);
  const travel = interpolate(frame, [active(index) + 6, arrive(index)], [0, n - 1], { ...clamp, easing: EASE.inOut });
  const moving = frame >= active(index) + 6 && frame < arrive(index) + 20;

  return (
    <div
      style={{
        position: "absolute",
        left: ROW.left,
        top,
        width: ROW.width,
        height: ROW.height,
        borderRadius: 30,
        background: `oklch(0.2 0.012 255 / ${0.5 + 0.2 * on})`,
        boxShadow: `0 0 0 1px oklch(1 0 0 / ${0.12 + 0.16 * on}), 0 24px 60px oklch(0 0 0 / 0.3)`,
        opacity: dim,
        ...show(frame, rowIn(index), undefined, 30),
      }}
    >
      <div style={{ position: "absolute", left: 48, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 650 }}>{lane.name}</div>
        <div style={{ marginTop: 8, fontSize: 26, color: COLOR.ink2, letterSpacing: "0.04em" }}>{lane.facts}</div>
      </div>
      {/* 站与站之间的线；光点走过的那一截亮起来 */}
      <div style={{ position: "absolute", left: TRACK.left - ROW.left + 60, width: TRACK.right - TRACK.left - 120, top: ROW.height / 2 - 1, height: 2, background: "oklch(1 0 0 / 0.18)" }} />
      <div
        style={{
          position: "absolute",
          left: TRACK.left - ROW.left + 60,
          width: Math.max(0, travel * step - 60) * (moving || frame >= arrive(index) ? 1 : 0),
          top: ROW.height / 2 - 1.5,
          height: 3,
          background: COLOR.ink,
          opacity: on,
        }}
      />
      {lane.nodes.map((node, j) => {
        const x = TRACK.left - ROW.left + j * step;
        const reached = on > 0 && travel >= j - 0.05 ? 1 : 0;
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: x,
              top: ROW.height / 2,
              transform: `translate(-50%, -50%) scale(${1 + 0.06 * reached * on})`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: 70,
              padding: "0 26px",
              borderRadius: 35,
              background: KIND[node.kind].bg,
              boxShadow: `0 0 0 ${reached ? 2 : 1}px ${KIND[node.kind].edge}`,
              fontSize: 28,
              fontWeight: 550,
              whiteSpace: "nowrap",
              ...show(frame, rowIn(index) + 6 + j * 4, undefined, 14),
            }}
          >
            <Glyph icon={UI[node.icon]} size={28} />
            {node.label}
          </div>
        );
      })}
      {moving ? (
        <div
          style={{
            position: "absolute",
            left: TRACK.left - ROW.left + travel * step,
            top: ROW.height / 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background: COLOR.ink,
            boxShadow: `0 0 18px 6px oklch(1 0 0 / 0.55)`,
            opacity: 1 - prog(frame, arrive(index), 14),
          }}
        />
      ) : null}
    </div>
  );
};
