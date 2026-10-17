import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { Lift, type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 三种识别方式：首次引导里"先选一种识别方式"那一页（真截图）在左，三种方式一拍一项从页面上抽出来、排到右边，
// 每一项底下接一条走向：录音经过哪几站变成成稿，每一站标明在本机还是在云端，一颗光点走一遍。

export const MODES_FRAMES = b(16);
export const MODES_CAMERA = deepCamera(MODES_FRAMES);

type Kind = "io" | "device" | "cloud";
type Node = { label: string; icon: keyof typeof UI; kind: Kind };
const REC: Node = { label: "录音", icon: "mic", kind: "io" };
const DONE: Node = { label: "成稿", icon: "text", kind: "io" };
// 引导页上三项的位置（截图像素）和各自的走向
const WAYS: readonly { rect: Rect; nodes: readonly Node[] }[] = [
  { rect: { x: 486, y: 400, w: 1348, h: 212 }, nodes: [REC, { label: "大模型", icon: "cloud", kind: "cloud" }, DONE] },
  {
    rect: { x: 486, y: 632, w: 1348, h: 208 },
    nodes: [REC, { label: "本机转写", icon: "chip", kind: "device" }, { label: "润色", icon: "cloud", kind: "cloud" }, DONE],
  },
  { rect: { x: 486, y: 860, w: 1348, h: 210 }, nodes: [REC, { label: "本机转写", icon: "chip", kind: "device" }, DONE] },
];

const KIND: Record<Kind, { bg: string; edge: string }> = {
  io: { bg: "oklch(1 0 0 / 0.08)", edge: "oklch(1 0 0 / 0.24)" },
  device: { bg: "oklch(0.8 0.07 255 / 0.2)", edge: "oklch(0.8 0.07 255 / 0.8)" },
  cloud: { bg: "oklch(0.74 0.17 32 / 0.18)", edge: "oklch(0.74 0.17 32 / 0.8)" },
};

const SHOT_AT = { left: 60, top: 250, width: 900 };
const COLUMN = { left: 1010, top: 236, width: 820, gap: 222 };
const CARD_SCALE = COLUMN.width / WAYS[0].rect.w;
const liftAt = (i: number) => b(2 + 2 * i);
/** 抽出来落定之后，光点从录音走到成稿 */
const travelAt = (i: number) => liftAt(i) + 34;
const TRAVEL = b(1.6);
const T = { again: b(10), caption: b(10.4), out: b(15.2) };

export const Modes: React.FC = () => {
  const frame = useCurrentFrame();
  const out = prog(frame, T.out, 26, EASE.inOut);
  const shotIn = prog(frame, 6, 44);
  const current = WAYS.reduce((n, _, i) => (frame >= liftAt(i) ? i : n), -1);
  const shotScale = SHOT_AT.width / SHOTS.way.w;

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 150, top: 96, textShadow: SHADOW }}>
        <div style={{ fontSize: 78, fontWeight: 700, ...show(frame, 0) }}>三种识别方式</div>
        <div style={{ marginTop: 8, fontSize: 36, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.12em", ...show(frame, 10) }}>平级可选 · 一键切换</div>
      </div>

      <AbsoluteFill style={{ perspective: 2200 }}>
        <Shot
          shot={SHOTS.way}
          width={SHOT_AT.width}
          spot={current >= 0 && frame < T.again ? { rect: WAYS[current].rect, k: prog(frame, liftAt(0), 14) } : undefined}
          style={{
            left: SHOT_AT.left,
            top: SHOT_AT.top,
            opacity: shotIn * (1 - 0.35 * prog(frame, T.again, 30)),
            transformOrigin: "0% 50%",
            transform: `translateX(${-200 * (1 - shotIn)}px) rotateY(${16 - 8 * shotIn}deg)`,
          }}
        />
      </AbsoluteFill>

      {WAYS.map((way, i) => {
        const lift = prog(frame, liftAt(i), 40, EASE.inOut);
        if (lift <= 0) return null;
        const to = { left: COLUMN.left, top: COLUMN.top + i * COLUMN.gap };
        const from = { left: SHOT_AT.left + way.rect.x * shotScale, top: SHOT_AT.top + way.rect.y * shotScale, k: shotScale / CARD_SCALE };
        return (
          <div key={i}>
            <Lift
              shot={SHOTS.way}
              rect={way.rect}
              scale={CARD_SCALE}
              radius={18}
              style={{
                left: interpolate(lift, [0, 1], [from.left, to.left]),
                top: interpolate(lift, [0, 1], [from.top, to.top]),
                transformOrigin: "0 0",
                transform: `scale(${interpolate(lift, [0, 1], [from.k, 1]) * punch(frame, liftAt(i) + 40, 0.03, 18)})`,
                boxShadow: `0 0 0 1px oklch(0 0 0 / 0.08), 0 ${30 * lift}px ${80 * lift}px oklch(0 0 0 / ${0.5 * lift})`,
              }}
            />
            <Route frame={frame} nodes={way.nodes} left={to.left} top={to.top + way.rect.h * CARD_SCALE + 18} at={travelAt(i)} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 150, top: 930, fontSize: 38, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.08em", textShadow: SHADOW, ...show(frame, T.caption) }}>
        首页切换 · 即刻生效 · 配置分别保存
      </div>

      <Flash frame={frame} at={[0]} strength={0.7} />
      <Sfx at={0} name="sfxFlash" volume={0.3} />
      {WAYS.map((_, i) => (
        <Sfx key={`l${i}`} at={liftAt(i)} name="sfxSwish" volume={0.28} />
      ))}
      {WAYS.map((_, i) => (
        <Sfx key={`n${i}`} at={liftAt(i) + 40} name={(["sfxNote0", "sfxNote1", "sfxNote2"] as const)[i]} volume={0.26} />
      ))}
      {WAYS.map((_, i) => (
        <Sfx key={`d${i}`} at={travelAt(i) + TRAVEL} name="sfxBlip" volume={0.32} />
      ))}
      <Sfx at={T.again} name="sfxNote4" volume={0.24} />
      <Sfx at={swellBefore(MODES_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

/** 一条走向：几站排成一行，站与站之间一道线；at 起光点从头走到尾，T.again 再走一遍 */
const Route: React.FC<{ frame: number; nodes: readonly Node[]; left: number; top: number; at: number }> = ({ frame, nodes, left, top, at }) => {
  const n = nodes.length;
  const step = (COLUMN.width - 150) / (n - 1);
  const run = (start: number) => interpolate(frame, [start, start + TRAVEL], [0, n - 1], { ...clamp, easing: EASE.inOut });
  const travel = frame >= T.again ? run(T.again) : run(at);
  const start = frame >= T.again ? T.again : at;
  const moving = frame >= start && frame < start + TRAVEL + 14;
  return (
    <div style={{ position: "absolute", left, top, width: COLUMN.width, height: 50, ...show(frame, at - 10, undefined, 14) }}>
      <div style={{ position: "absolute", left: 75, width: step * (n - 1), top: 24, height: 2, background: "oklch(1 0 0 / 0.2)" }} />
      <div style={{ position: "absolute", left: 75, width: step * travel, top: 23, height: 4, borderRadius: 2, background: COLOR.ink, opacity: 0.85 }} />
      {nodes.map((node, j) => {
        const reached = travel >= j - 0.05 && frame >= start;
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: 75 + j * step,
              top: 25,
              transform: `translate(-50%, -50%) scale(${reached ? 1.05 : 1})`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 46,
              padding: "0 18px",
              borderRadius: 23,
              background: KIND[node.kind].bg,
              boxShadow: `0 0 0 ${reached ? 2 : 1}px ${KIND[node.kind].edge}`,
              backdropFilter: "blur(14px)",
              fontSize: 22,
              fontWeight: 550,
              whiteSpace: "nowrap",
            }}
          >
            <Glyph icon={UI[node.icon]} size={22} />
            {node.label}
          </div>
        );
      })}
      {moving ? (
        <div
          style={{
            position: "absolute",
            left: 75 + travel * step,
            top: 25,
            width: 16,
            height: 16,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background: COLOR.ink,
            boxShadow: "0 0 18px 6px oklch(1 0 0 / 0.55)",
            opacity: 1 - prog(frame, start + TRAVEL, 14),
          }}
        />
      ) : null}
    </div>
  );
};
