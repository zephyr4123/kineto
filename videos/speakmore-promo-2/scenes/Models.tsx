import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Counter } from "../../../engine/Counter";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Tile } from "../components/Brand";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { mix, prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 模型：九家的标志（真实的彩色标志）沿一圈每半拍落一个，中间数字滚到 29；三个分类各几个；
// 然后模型页三栏的真截图（原生、转写、润色）一张接一张叠上来，左边对应的那个分类跟着点亮。
// 数字出自 SpeakMore 的模型清单：原生 7、转写 10、润色 12。

export const MODELS_FRAMES = b(16);
export const MODELS_CAMERA = deepCamera(MODELS_FRAMES);

const VENDORS = [
  { src: assets.logoGemini, name: "Gemini" },
  { src: assets.logoOpenai, name: "OpenAI" },
  { src: assets.logoQwen, name: "通义千问" },
  { src: assets.logoBailian, name: "阿里云百炼" },
  { src: assets.logoDeepseek, name: "DeepSeek" },
  { src: assets.logoKimi, name: "Kimi", dark: true },
  { src: assets.logoZhipu, name: "智谱" },
  { src: assets.logoMinimax, name: "MiniMax" },
  { src: assets.logoAlibabaCloud, name: "SenseVoice" },
] as const;
const ROLES = [
  { name: "原生", n: 7, shot: SHOTS.models },
  { name: "转写", n: 10, shot: SHOTS.transcribe },
  { name: "润色", n: 12, shot: SHOTS.polish },
];

const tileAt = (i: number) => b(0.25 + 0.5 * i);
const COUNT = b(4.6);
const roleAt = (i: number) => b(6 + 0.5 * i);
const PAGE = b(8.6);
/** 第 i 栏的截图叠上来的那一帧 */
const pageAt = (i: number) => PAGE + Math.round(i * b(1.4));
const DECK = { left: 930, top: 96, width: 880 };
const CENTER = { x: 960, y: 520 };
/** 第 i 个分类被点亮的程度：它那一栏的截图叠上来时亮起，下一栏来时退回去 */
const lit = (frame: number, i: number) => Math.min(prog(frame, pageAt(i), 12), 1 - (i < 3 - 1 ? prog(frame, pageAt(i + 1), 12) : 0));

export const Models: React.FC = () => {
  const frame = useCurrentFrame();
  const page = prog(frame, PAGE, 46, EASE.outExpo);
  const ringOut = prog(frame, PAGE - 6, 34, EASE.inOut);
  const out = prog(frame, b(15.2), 26, EASE.inOut);

  // 中间那组（数字和三个分类）拉开后挪到左边
  const groupX = interpolate(page, [0, 1], [0, -560]);
  const groupScale = interpolate(page, [0, 1], [1, 0.82]);
  const value = interpolate(frame, [COUNT, COUNT + b(1)], [0, 29], { ...clamp, easing: EASE.outQuint });
  const speed = Math.abs(value - interpolate(frame - 1, [COUNT, COUNT + b(1)], [0, 29], { ...clamp, easing: EASE.outQuint }));

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.1 * out})`, opacity: 1 - out }}>
      {/* 一圈九家 */}
      {VENDORS.map((v, i) => {
        const angle = -Math.PI / 2 + (i / VENDORS.length) * Math.PI * 2;
        const pop = prog(frame, tileAt(i), 20, EASE.outExpo);
        const spread = 1 + 0.5 * ringOut;
        const x = CENTER.x + Math.cos(angle) * 560 * spread;
        const y = CENTER.y + Math.sin(angle) * 330 * spread;
        return (
          <div
            key={v.name}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${(0.5 + 0.5 * pop) * punch(frame, tileAt(i), 0.08, 18)})`,
              opacity: pop * (1 - ringOut),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Tile src={v.src} size={124} dark={"dark" in v} />
            <div style={{ fontSize: 24, fontWeight: 500, color: COLOR.ink2, textShadow: SHADOW, whiteSpace: "nowrap" }}>{v.name}</div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateX(${groupX}px) scale(${groupScale})`,
          textShadow: SHADOW,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: prog(frame, COUNT - 4, 10), transform: `scale(${punch(frame, COUNT + b(1), 0.05)})` }}>
          <span style={{ fontSize: 230, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
            <Counter value={value} final={29} speed={speed} />
          </span>
          <span style={{ fontSize: 64, fontWeight: 600, color: COLOR.ink2 }}>个模型</span>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 34 }}>
          {ROLES.map((role, i) => (
            <div
              key={role.name}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                padding: "12px 28px",
                borderRadius: 999,
                background: COLOR.glass,
                boxShadow: `0 0 0 ${1 + 1.5 * lit(frame, i)}px ${mix(COLOR.cinnabar, COLOR.line, lit(frame, i))}`,
                fontSize: 32,
                fontWeight: 550,
                ...show(frame, roleAt(i), undefined, 16),
                transform: `${show(frame, roleAt(i), undefined, 16).transform} scale(${punch(frame, pageAt(i), 0.08, 18)})`,
              }}
            >
              {role.name}
              <span style={{ fontSize: 36, fontWeight: 700 }}>{role.n}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, fontSize: 40, fontWeight: 600, color: COLOR.ink2, letterSpacing: "0.1em", ...show(frame, pageAt(2) + 50) }}>实测标注 · 价格透明</div>
      </div>

      {/* 模型页三栏：后来的叠在前面，先来的往左后方退 */}
      {page > 0 ? (
        <AbsoluteFill style={{ perspective: 2200 }}>
          {ROLES.map((role, i) => {
            const k = prog(frame, pageAt(i), 40, EASE.outExpo);
            if (k <= 0) return null;
            const depth = ROLES.reduce((d, _, j) => (j > i ? d + prog(frame, pageAt(j), 40, EASE.inOut) : d), 0);
            return (
              <Shot
                key={role.name}
                shot={role.shot}
                width={DECK.width}
                style={{
                  left: DECK.left - 150 * depth,
                  top: DECK.top + 24 * depth,
                  opacity: k,
                  transformOrigin: "100% 50%",
                  transform: `translateX(${240 * (1 - k)}px) rotateY(${-18 + 10 * k + 4 * depth}deg) scale(${1 - 0.07 * depth})`,
                  filter: depth > 0.01 ? `brightness(${1 - 0.28 * depth})` : undefined,
                }}
              />
            );
          })}
        </AbsoluteFill>
      ) : null}

      <Flash frame={frame} at={[0]} strength={0.6} />
      <Flash frame={frame} at={[COUNT + b(1)]} strength={0.25} dur={12} />
      <Sfx at={0} name="sfxFlash" volume={0.3} />
      {VENDORS.map((v, i) => (
        <Sfx key={v.name} at={tileAt(i)} name={(["sfxNote0", "sfxNote1", "sfxNote2", "sfxNote3", "sfxNote4", "sfxNote5"] as const)[i % 6]} volume={0.22} />
      ))}
      <Sfx at={COUNT + b(1)} name="sfxBlip" volume={0.45} />
      {ROLES.map((role, i) => (
        <Sfx key={role.name} at={roleAt(i)} name="sfxTap" volume={0.22} />
      ))}
      {ROLES.map((role, i) => (
        <Sfx key={`p${role.name}`} at={pageAt(i)} name="sfxSwish" volume={0.34} />
      ))}
      <Sfx at={swellBefore(MODELS_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};
