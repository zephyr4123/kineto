import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { Question } from "../components/Question";
import { Lift, type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 隐私：先问"顾虑数据隐私？"，答的是 App 首页的识别方式选单（真截图）：数据隐私那一项正在用，
// 圈出来、整项抽到左边，下面三条：不上传、无需密钥、不联网。随后首次引导里下载本机模型的那一页（真截图）换上来，
// 圈出"下载完成后自动启用数据隐私"和模型那一行。

export const PRIVACY_FRAMES = b(16);
export const PRIVACY_CAMERA = deepCamera(PRIVACY_FRAMES);

const T = { settle: b(2.2), picker: b(2.4), spot: b(3.8), lift: b(4.2), facts: b(5.4), prepare: b(9), prepareSpot: b(10.2), model: b(10.6), out: b(15.2) };

// 选单里"数据隐私 · 使用中"那一项；首次引导页上的提示条和模型那一行（截图像素）
const ROW: Rect = { x: 1276, y: 830, w: 844, h: 204 };
const ROW_CARD: Rect = { x: 1280, y: 834, w: 836, h: 196 };
const PREPARE: Rect = { x: 480, y: 508, w: 1364, h: 330 };

const SHOT_AT = { left: 900, top: 190, width: 960 };
const LIFT_SCALE = 0.92;
const LIFT_TO = { left: 150, top: 290 };

const FACTS = [
  { icon: UI.shield, text: "不上传" },
  { icon: UI.key, text: "无需密钥" },
  { icon: UI.wifiOff, text: "不联网" },
] as const;
const factAt = (i: number) => T.facts + Math.round(i * b(0.5));

export const Privacy: React.FC = () => {
  const frame = useCurrentFrame();
  const out = prog(frame, T.out, 26, EASE.inOut);
  const pickerIn = prog(frame, T.picker, 40);
  const pickerOut = prog(frame, T.prepare, 16, EASE.inOut);
  const prepareIn = prog(frame, T.prepare + 10, 40);
  const lift = prog(frame, T.lift, 40, EASE.inOut);
  const s = SHOT_AT.width / SHOTS.modePicker.w;
  const from = { left: SHOT_AT.left + ROW_CARD.x * s, top: SHOT_AT.top + ROW_CARD.y * s, k: s / LIFT_SCALE };

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      <AbsoluteFill style={{ perspective: 2200 }}>
        {pickerIn > 0 && pickerOut < 1 ? (
          <Shot
            shot={SHOTS.modePicker}
            width={SHOT_AT.width}
            spot={{ rect: ROW, k: prog(frame, T.spot, 14) }}
            style={{
              left: SHOT_AT.left,
              top: SHOT_AT.top,
              opacity: pickerIn * (1 - pickerOut),
              transformOrigin: "100% 50%",
              transform: `translateX(${200 * (1 - pickerIn) - 160 * pickerOut}px) rotateY(${-16 + 10 * pickerIn}deg)`,
            }}
          />
        ) : null}
        {prepareIn > 0 ? (
          <Shot
            shot={SHOTS.preparePrivate}
            width={SHOT_AT.width}
            spot={{ rect: PREPARE, k: prog(frame, T.prepareSpot, 14) }}
            style={{
              left: SHOT_AT.left,
              top: SHOT_AT.top,
              opacity: prepareIn,
              transformOrigin: "100% 50%",
              transform: `translateX(${200 * (1 - prepareIn)}px) rotateY(${-16 + 10 * prepareIn}deg)`,
            }}
          />
        ) : null}
      </AbsoluteFill>

      {/* 数据隐私那一项：从选单里飞出来，放大到左边 */}
      {lift > 0 ? (
        <Lift
          shot={SHOTS.modePicker}
          rect={ROW_CARD}
          scale={LIFT_SCALE}
          radius={20}
          style={{
            left: interpolate(lift, [0, 1], [from.left, LIFT_TO.left]),
            top: interpolate(lift, [0, 1], [from.top, LIFT_TO.top]),
            transformOrigin: "0 0",
            transform: `scale(${interpolate(lift, [0, 1], [from.k, 1])})`,
            boxShadow: `0 0 0 1px oklch(0 0 0 / 0.08), 0 ${40 * lift}px ${100 * lift}px oklch(0 0 0 / ${0.55 * lift})`,
          }}
        />
      ) : null}

      <div style={{ position: "absolute", left: LIFT_TO.left + 6, top: 540, display: "flex", flexDirection: "column", gap: 34, textShadow: SHADOW }}>
        {FACTS.map((fact, i) => (
          <div key={fact.text} style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 52, fontWeight: 600, ...show(frame, factAt(i), undefined, 20) }}>
            <Glyph icon={fact.icon} size={50} style={{ color: COLOR.seal }} />
            {fact.text}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 40, fontWeight: 500, color: COLOR.ink2, marginTop: 10, ...show(frame, T.model, undefined, 20) }}>
          <Glyph icon={UI.chip} size={42} />
          本机模型 · 下载即用
        </div>
      </div>

      <Question frame={frame} text="顾虑数据隐私？" settle={T.settle} />

      <Flash frame={frame} at={[0]} strength={0.75} />
      <Flash frame={frame} at={[T.lift + 30]} strength={0.2} dur={12} />
      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.picker} name="sfxSwish" volume={0.35} />
      <Sfx at={T.spot} name="sfxTap" volume={0.24} />
      <Sfx at={T.lift + 30} name="sfxBlip" volume={0.4} />
      {FACTS.map((fact, i) => (
        <Sfx key={fact.text} at={factAt(i)} name={(["sfxNote1", "sfxNote2", "sfxNote3"] as const)[i]} volume={0.24} />
      ))}
      <Sfx at={T.prepare} name="sfxSwish" volume={0.35} />
      <Sfx at={T.prepareSpot} name="sfxTap" volume={0.24} />
      <Sfx at={swellBefore(PRIVACY_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};
