import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Pointer } from "../components/Bits";
import { Tile } from "../components/Brand";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, show, typed } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SHADOW, b } from "../theme";

// 自定义接口：润色那一跳可以交给任何兼容 OpenAI 接口的服务（SpeakMore 的 src/server/chat/vendors.mjs 里的 custom）。
// 一张深色玻璃的设置卡片里敲进地址和模型名、点检测、可用。Ollama、LM Studio 只作为例子露一下标志，不展开讲（没有实际接过）。
// 地址用的是 Ollama 默认的本机端口。检测通过后，这张卡缩进模型页"密钥"一栏的真截图里"自定义服务"那一行。

export const CUSTOM_FRAMES = b(16);
export const CUSTOM_CAMERA = deepCamera(CUSTOM_FRAMES);

const URL = "http://localhost:11434/v1";
const MODEL = "qwen3:8b";
const T = { card: b(1.4), url: b(2.4), urlFrames: 64, model: b(5.2), modelFrames: 22, pointer: b(6.4), click: b(7.3), ok: b(7.8), examples: b(8.6), keys: b(10), spot: b(11) };
const CARD = { left: 900, top: 214, width: 860, height: 620 };
// 密钥一栏的截图、"自定义服务"那一行（截图像素）
const KEYS_AT = { left: 900, top: 90, width: 940 };
const CUSTOM_ROW: Rect = { x: 610, y: 1500, w: 1516, h: 128 };
// 检测按钮在卡片里的位置
const CHECK = { x: CARD.left + 56 + 70, y: CARD.top + 520 + 32 };

export const Custom: React.FC = () => {
  const frame = useCurrentFrame();
  const out = prog(frame, b(15.2), 26, EASE.inOut);
  const cardIn = prog(frame, T.card, 44);
  const ok = prog(frame, T.ok, 18);
  const pointerIn = prog(frame, T.pointer, 34);
  const press = interpolate(frame, [T.click, T.click + 4, T.click + 12], [0, 1, 0], clamp);
  // 卡片缩进截图里那一行：缩到那一行的宽，挪到它的位置，同时淡掉，截图从底下浮上来
  const into = prog(frame, T.keys, 36, EASE.inOut);
  const keysIn = prog(frame, T.keys - 6, 36);
  const ks = KEYS_AT.width / SHOTS.keys.w;
  const row = { left: KEYS_AT.left + CUSTOM_ROW.x * ks, top: KEYS_AT.top + CUSTOM_ROW.y * ks, width: CUSTOM_ROW.w * ks };

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 150, top: 268, textShadow: SHADOW }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, ...show(frame, 0) }}>
          <Glyph icon={UI.plug} size={92} />
          <span style={{ fontSize: 104, fontWeight: 700 }}>自定义接口</span>
        </div>
        <div style={{ marginTop: 22, fontSize: 42, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.04em", ...show(frame, 12) }}>兼容 OpenAI 接口</div>
      </div>

      {/* 例子：两家本机跑大模型的工具，只露标志 */}
      <div style={{ position: "absolute", left: 150, top: 560, display: "flex", gap: 34 }}>
        {[
          { src: assets.logoOllama, name: "Ollama" },
          { src: assets.logoLmstudio, name: "LM Studio" },
        ].map((v, i) => (
          <div key={v.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, ...show(frame, T.examples + i * 10, undefined, 20) }}>
            <Tile src={v.src} size={118} />
            <span style={{ fontSize: 26, color: COLOR.ink2, textShadow: SHADOW }}>{v.name}</span>
          </div>
        ))}
        <div style={{ alignSelf: "flex-start", height: 118, display: "grid", placeItems: "center", fontSize: 54, color: COLOR.faint, ...show(frame, T.examples + 20, undefined, 20) }}>…</div>
      </div>

      {keysIn > 0 ? (
        <Shot
          shot={SHOTS.keys}
          width={KEYS_AT.width}
          spot={{ rect: CUSTOM_ROW, k: prog(frame, T.spot, 14) }}
          style={{ left: KEYS_AT.left, top: KEYS_AT.top, opacity: keysIn, transform: `scale(${1.04 - 0.04 * keysIn})` }}
        />
      ) : null}

      {/* 设置卡片：深色玻璃，输入框只留一道底线，敲字时那道线亮起来 */}
      <div
        style={{
          position: "absolute",
          ...CARD,
          borderRadius: 30,
          background: "oklch(0.2 0.012 255 / 0.62)",
          backdropFilter: "blur(28px)",
          boxShadow: `0 0 0 1px ${COLOR.line}, inset 0 1px 0 oklch(1 0 0 / 0.08), 0 40px 100px oklch(0 0 0 / 0.5)`,
          opacity: cardIn * (1 - into),
          transformOrigin: "0 0",
          transform:
            into > 0
              ? `translate(${(row.left - CARD.left) * into}px, ${(row.top - CARD.top) * into}px) scale(${1 - (1 - row.width / CARD.width) * into})`
              : `perspective(2000px) translateX(${120 * (1 - cardIn)}px) rotateY(${-14 * (1 - cardIn)}deg)`,
          padding: "44px 56px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Glyph icon={UI.plug} size={34} style={{ color: COLOR.seal }} />
          <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "0.02em" }}>自定义服务</span>
          <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 500, letterSpacing: "0.2em", color: COLOR.ink2 }}>润色 · OPENAI 兼容</span>
        </div>
        <div style={{ height: 1, background: COLOR.line, margin: "30px 0 34px" }} />
        <Field label="地址" value={typed(URL, frame, T.url, T.urlFrames)} caret={frame >= T.url - 10 && frame < T.model} frame={frame} />
        <Field label="模型" value={typed(MODEL, frame, T.model, T.modelFrames)} caret={frame >= T.model && frame < T.ok} frame={frame} />
        <div style={{ position: "absolute", left: 56, right: 56, top: 520, display: "flex", alignItems: "center", gap: 26 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 64,
              padding: "0 36px",
              borderRadius: 32,
              boxShadow: `inset 0 0 0 1px oklch(1 0 0 / ${0.3 + 0.4 * press})`,
              background: `oklch(1 0 0 / ${0.06 + 0.1 * press})`,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "0.12em",
              transform: `scale(${1 - 0.04 * press})`,
            }}
          >
            检测
          </span>
          {/* 结果：一颗亮起来的绿点和"可用"，点外一圈光散开 */}
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 500, letterSpacing: "0.1em", color: COLOR.green, opacity: ok }}>
            <i style={{ position: "relative", width: 14, height: 14, borderRadius: "50%", background: COLOR.green, boxShadow: `0 0 16px 3px ${COLOR.green}` }}>
              <i style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `2px solid ${COLOR.green}`, transform: `scale(${1 + 3 * prog(frame, T.ok, 30)})`, opacity: 1 - prog(frame, T.ok, 30) }} />
            </i>
            可用
          </span>
        </div>
      </div>

      <Pointer
        x={interpolate(pointerIn, [0, 1], [1700, CHECK.x])}
        y={interpolate(pointerIn, [0, 1], [1000, CHECK.y])}
        opacity={pointerIn * (1 - prog(frame, T.ok + 20, 20))}
      />

      <Flash frame={frame} at={[0]} strength={0.6} />
      <Sfx at={0} name="sfxFlash" volume={0.3} />
      <Sfx at={T.card} name="sfxSwish" volume={0.35} />
      <Sfx at={T.url} name="sfxKeys" volume={0.28} frames={T.urlFrames} />
      <Sfx at={T.model} name="sfxKeys" volume={0.28} frames={T.modelFrames} />
      <Sfx at={T.click} name="sfxClick" volume={0.32} />
      <Sfx at={T.ok} name="sfxDing" volume={0.45} />
      <Sfx at={T.examples} name="sfxNote3" volume={0.25} />
      <Sfx at={T.examples + 10} name="sfxNote4" volume={0.25} />
      <Sfx at={T.keys} name="sfxSwish" volume={0.32} />
      <Sfx at={T.spot} name="sfxTap" volume={0.24} />
      <Sfx at={swellBefore(CUSTOM_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

/** 一栏：上面一行字距拉开的小字，下面是敲进去的值，底下一道线；正在敲的那一栏线是亮的 */
const Field: React.FC<{ label: string; value: string; caret: boolean; frame: number }> = ({ label, value, caret, frame }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{ fontSize: 20, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.2em" }}>{label}</div>
    <div style={{ position: "relative", height: 70, display: "flex", alignItems: "center", fontFamily: MONO_STACK, fontSize: 34, whiteSpace: "pre" }}>
      {value}
      {caret ? <span style={{ width: 3, height: 40, marginLeft: 3, background: COLOR.seal, boxShadow: `0 0 10px ${COLOR.seal}`, opacity: Math.floor(frame / 28) % 2 === 0 ? 1 : 0 }} /> : null}
      <i style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: caret ? 2 : 1, background: caret ? COLOR.seal : "oklch(1 0 0 / 0.2)", boxShadow: caret ? `0 0 12px ${COLOR.seal}` : undefined }} />
    </div>
  </div>
);
