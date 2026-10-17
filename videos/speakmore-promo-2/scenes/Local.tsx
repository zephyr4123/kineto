import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SHADOW, b } from "../theme";

// 本机运行：配乐在这里接到最后一段副歌，一切就是"本机运行 / 不联网 · 无需密钥"；
// 然后两条下载进度并排赛跑（快进）：国内源 850 MB 用 1 分 32 秒下完，同一时间 Hugging Face 只下了 54 MB。
// 数字出自 SpeakMore 仓库 bench/results/e2e-local-2026-10-16.md：国内源 850 MB 91.7 秒，Hugging Face 1447 秒。

export const LOCAL_FRAMES = b(16);
export const LOCAL_CAMERA = deepCamera(LOCAL_FRAMES);

const MB = 850;
const MIRROR_S = 91.7;
const HF_S = 1447;
const T = { title: 0, sub: b(1), panel: b(3), race: b(4), done: b(10), faster: b(10.6), out: b(15.2) };
const PANEL = { left: 300, top: 300, width: 1320 };

export const Local: React.FC = () => {
  const frame = useCurrentFrame();
  const titleUp = prog(frame, T.panel, 40, EASE.inOut);
  const panelIn = prog(frame, T.panel + 6, 40);
  const seconds = interpolate(frame, [T.race, T.done], [0, MIRROR_S], clamp);
  const out = prog(frame, T.out, 26, EASE.inOut);
  const finished = prog(frame, T.done, 16);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: interpolate(titleUp, [0, 1], [330, 96]),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textShadow: SHADOW,
          transform: `scale(${interpolate(titleUp, [0, 1], [1, 0.52]) * punch(frame, T.title, 0.06)})`,
          transformOrigin: "50% 0%",
        }}
      >
        <div style={{ fontSize: 176, fontWeight: 700, letterSpacing: "0.04em", filter: `blur(${6 * (1 - prog(frame, 0, 8))}px)` }}>本机运行</div>
        <div style={{ display: "flex", alignItems: "center", gap: 46, marginTop: 30, fontSize: 52, fontWeight: 500, color: COLOR.ink2, ...show(frame, T.sub) }}>
          <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Glyph icon={UI.wifiOff} size={52} />
            不联网
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Glyph icon={UI.key} size={52} />
            无需密钥
          </span>
        </div>
      </div>

      {panelIn > 0 ? (
        <div
          style={{
            position: "absolute",
            ...PANEL,
            padding: "44px 56px 48px",
            boxSizing: "border-box",
            borderRadius: 34,
            background: COLOR.glass,
            boxShadow: `0 0 0 1px ${COLOR.line}, 0 40px 100px oklch(0 0 0 / 0.45)`,
            backdropFilter: "blur(24px)",
            opacity: panelIn,
            transform: `translateY(${40 * (1 - panelIn)}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <Glyph icon={UI.download} size={38} style={{ alignSelf: "center" }} />
            <span style={{ fontSize: 38, fontWeight: 650 }}>本机模型</span>
            <span style={{ fontSize: 30, color: COLOR.ink2 }}>{MB} MB</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: MONO_STACK, fontSize: 52, fontWeight: 300, fontVariantNumeric: "tabular-nums" }}>
              {Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, "0")}
            </span>
          </div>
          <Row name="国内源" rate={MB / MIRROR_S} done={seconds / MIRROR_S} color={COLOR.seal} finished={finished} frame={frame} />
          <Row name="Hugging Face" rate={MB / HF_S} done={seconds / HF_S} color="oklch(1 0 0 / 0.45)" finished={0} frame={frame} note={finished > 0 ? "约 24 分钟" : undefined} noteK={finished} />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 820,
          textAlign: "center",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textShadow: SHADOW,
          opacity: prog(frame, T.faster, 10),
          transform: `scale(${punch(frame, T.faster, 0.08)})`,
        }}
      >
        快十余倍
      </div>

      <Flash frame={frame} at={[0]} strength={0.85} />
      <Flash frame={frame} at={[T.faster]} strength={0.25} dur={12} />
      <Sfx at={0} name="sfxFlash" volume={0.4} />
      <Sfx at={T.panel} name="sfxSwish" volume={0.35} />
      <Sfx at={T.done} name="sfxDing" volume={0.45} />
      <Sfx at={T.faster} name="sfxFlash" volume={0.3} />
      <Sfx at={swellBefore(LOCAL_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

const Row: React.FC<{ name: string; rate: number; done: number; color: string; finished: number; frame: number; note?: string; noteK?: number }> = ({
  name,
  rate,
  done,
  color,
  finished,
  note,
  noteK = 0,
}) => {
  const k = Math.min(1, done);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 50 }}>
      <div style={{ width: 250 }}>
        <div style={{ fontSize: 34, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 24, color: COLOR.ink2, marginTop: 4, fontFamily: MONO_STACK }}>{rate.toFixed(1)} MB/s</div>
      </div>
      <div style={{ position: "relative", flex: 1, height: 20, borderRadius: 10, background: "oklch(1 0 0 / 0.1)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${k * 100}%`, borderRadius: 10, background: color, boxShadow: finished > 0 ? `0 0 24px ${color}` : undefined }} />
      </div>
      <div style={{ width: 190, textAlign: "right", fontFamily: MONO_STACK, fontSize: 32, fontVariantNumeric: "tabular-nums", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
        {finished > 0 ? (
          <span style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", background: COLOR.green, color: "oklch(0.2 0.03 150)", opacity: finished }}>
            <Glyph icon={UI.check} size={28} />
          </span>
        ) : null}
        {Math.round(k * MB)} MB
      </div>
      {note ? <div style={{ position: "absolute", right: 56, marginTop: 92, fontSize: 24, color: COLOR.faint, opacity: noteK }}>{note}</div> : null}
    </div>
  );
};
