import { AbsoluteFill, Easing, interpolateColors, useCurrentFrame } from "remotion";
import { backOut, tween } from "../../../engine/motion";
import { CREMA, ESPRESSO, FONT_DISPLAY, ROAST, ROAST_STAGES } from "../theme";

// 竖版的安全区：抖音等平台顶部约 200px、底部约 350px、右侧约 150px 会被界面盖住，信息都放在这之内

// 烘焙色带：五档颜色排成一条，指针随 progress（0~1）从生豆走到深烘，当前档的字亮起来
export const ColorStrip: React.FC<{ readonly progress: number; readonly y?: number }> = ({ progress, y = 1330 }) => {
  const f = useCurrentFrame();
  const left = 72;
  const width = 936;
  const n = ROAST_STAGES.length;
  const active = Math.min(n - 1, Math.floor(progress * n));
  const colors = ROAST_STAGES.map((s) => s.color);
  const stops = colors.map((_, i) => i / (n - 1));
  return (
    <div style={{ position: "absolute", left, top: y, width, translate: `0px ${tween(f, [0, 8], [140, 0], Easing.out(Easing.cubic))}px`, opacity: tween(f, [0, 4], [0, 1]) }}>
      <div style={{ height: 34, borderRadius: 17, background: `linear-gradient(90deg, ${colors.join(", ")})`, boxShadow: "0 0 0 4px rgba(255,241,220,0.9)" }} />
      <div
        style={{
          position: "absolute",
          top: -22,
          left: progress * width - 39,
          width: 78,
          height: 78,
          borderRadius: 39,
          border: `8px solid ${CREMA}`,
          backgroundColor: interpolateColors(progress, stops, colors),
          boxShadow: `0 0 36px ${ROAST}`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 34 }}>
        {ROAST_STAGES.map((s, i) => (
          <div
            key={s.label}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: i === active ? 58 : 44,
              color: i === active ? CREMA : "rgba(255,241,220,0.55)",
              textShadow: i === active ? `0 0 24px ${ROAST}` : "none",
            }}
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// 豆温计数：数字跳动到 value，数位等宽，跳的时候不左右晃
export const Thermo: React.FC<{ readonly value: number; readonly y?: number }> = ({ value, y = 300 }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: y,
        fontFamily: FONT_DISPLAY,
        color: CREMA,
        scale: String(tween(f, [0, 6], [0.4, 1], backOut)),
        transformOrigin: "0% 50%",
      }}
    >
      <div style={{ fontSize: 44, color: ROAST, letterSpacing: 4 }}>豆温</div>
      <div style={{ fontSize: 180, lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: `6px 6px 0 ${ESPRESSO}, 0 0 40px rgba(255,106,26,0.6)` }}>
        {Math.round(value)}
        <span style={{ fontSize: 90 }}>°C</span>
      </div>
    </div>
  );
};

// 顶部旅程进度条：从樱桃到杯子的六站，当前站放大发光，active 之前的线段填满
export const JOURNEY = ["采摘", "晾晒", "出海", "烘焙", "研磨", "萃取"] as const;

export const Journey: React.FC<{ readonly active: number; readonly fill?: number }> = ({ active, fill = 0 }) => {
  const f = useCurrentFrame();
  const left = 96;
  const width = 888;
  const step = width / (JOURNEY.length - 1);
  return (
    <AbsoluteFill style={{ opacity: tween(f, [0, 6], [0, 1]) }}>
      <div style={{ position: "absolute", left, top: 216, width, height: 6, backgroundColor: "rgba(255,241,220,0.25)" }} />
      <div style={{ position: "absolute", left, top: 216, width: step * (active + fill), height: 6, backgroundColor: ROAST, boxShadow: `0 0 16px ${ROAST}` }} />
      {JOURNEY.map((name, i) => {
        const on = i === active;
        const done = i < active;
        const d = on ? 34 : 18;
        return (
          <div key={name} style={{ position: "absolute", left: left + i * step - 60, top: 219 - d / 2, width: 120, textAlign: "center" }}>
            <div
              style={{
                margin: "0 auto",
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: done || on ? ROAST : "rgba(255,241,220,0.35)",
                boxShadow: on ? `0 0 0 6px ${CREMA}, 0 0 30px ${ROAST}` : "none",
              }}
            />
            <div style={{ marginTop: 14, fontFamily: FONT_DISPLAY, fontSize: on ? 42 : 30, color: on ? CREMA : "rgba(255,241,220,0.6)" }}>{name}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
