import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, punch } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { C, local, MONO, SF, ZH } from "../theme";

// 落版：图标、名字、slogan 和一句定位；GitHub 仓库卡片升上来，光标点亮 Star；最后是地址、开源许可和致谢。
// 仓库刚发布（v2.0.0，2026-11-13），星标数很小，卡片上不放数字，只演示点亮。
const at = local(156);

const Cursor: React.FC<{ x: number; y: number; down: number }> = ({ x, y, down }) => (
  <svg style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - 0.12 * down})`, transformOrigin: "0 0" }} width="40" height="52" viewBox="0 0 20 26">
    <path d="M1 1v19.5l5-4.6 3.4 7.6 3.3-1.4-3.3-7.4h6.6z" fill="#000" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const icon = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: outExpo });
  const name = interpolate(f, [6, 20], [0, 1], { ...clamp, easing: outExpo });
  const line = interpolate(f, [at(2), at(2) + 14], [0, 1], { ...clamp, easing: outExpo });
  const card = interpolate(f, [at(6), at(6) + 16], [0, 1], { ...clamp, easing: outExpo });
  const click = at(10);
  const cx = interpolate(f, [at(7), click - 4], [980, 236], { ...clamp, easing: inOutQuint });
  const cy = interpolate(f, [at(7), click - 4], [1720, 1468], { ...clamp, easing: inOutQuint });
  const down = interpolate(f, [click - 2, click, click + 6], [0, 1, 0], clamp);
  const starred = f >= click;
  const burst = interpolate(f, [click, click + 18], [0, 1], { ...clamp, easing: outExpo });
  const url = interpolate(f, [at(13), at(13) + 14], [0, 1], { ...clamp, easing: outExpo });
  const credit = interpolate(f, [at(17), at(17) + 16], [0, 1], clamp);
  const hit = punch(f, at(20), 0.05, 26);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1200, transform: `scale(${hit})`, transformOrigin: "50% 40%" }}>
        <Img src={staticFile(assets.snugIcon)} style={{ position: "absolute", left: 540 - 170, top: 250, width: 340, height: 340, opacity: icon, transform: `translateY(${(1 - icon) * 50}px) scale(${0.8 + 0.2 * icon})`, filter: "drop-shadow(0 30px 60px rgba(20,50,120,0.28))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", fontFamily: SF, fontWeight: 800, fontSize: 200, letterSpacing: "-0.04em", color: C.ink, opacity: name, transform: `translateY(${(1 - name) * 30}px)` }}>Snug</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", opacity: line, transform: `translateY(${(1 - line) * 24}px)` }}>
          <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 56, letterSpacing: "-0.01em", color: C.deep }}>Make UU Remote Native on iPhone</div>
          <div style={{ marginTop: 26, fontFamily: ZH, fontWeight: 600, fontSize: 64, letterSpacing: "0.06em", color: C.ink }}>UU远程 · iPhone 原生体验</div>
        </div>
      </div>
      {/* GitHub 仓库卡片 */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1300,
          width: 900,
          height: 250,
          borderRadius: 24,
          background: "#ffffff",
          boxShadow: "0 30px 80px rgba(20,40,90,0.18), 0 0 0 1px rgba(20,40,90,0.08)",
          opacity: card,
          transform: `translateY(${(1 - card) * 120}px)`,
          fontFamily: SF,
          padding: "30px 36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, color: "#0969da" }}>
          <svg width="34" height="34" viewBox="0 0 16 16">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" fill="#59636e" />
          </svg>
          <span>
            zephyr4123 / <b>snug</b>
          </span>
          <span style={{ fontSize: 20, color: "#59636e", border: "1.5px solid #d1d9e0", borderRadius: 14, padding: "2px 12px" }}>Public</span>
        </div>
        <div style={{ marginTop: 14, fontFamily: ZH, fontSize: 28, color: "#59636e" }}>为 UU远程 打造的 Mac 移动端工作区</div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18, fontSize: 26, color: "#25292e" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 12, border: "1.5px solid #d1d9e0", background: starred ? "#fff8c5" : "#f6f8fa", fontWeight: 600 }}>
            <span style={{ color: starred ? "#d4a72c" : "#59636e", fontSize: 30, transform: `scale(${1 + 0.6 * (starred ? 1 - burst : 0)})` }}>{starred ? "★" : "☆"}</span>
            {starred ? "Starred" : "Star"}
            {starred
              ? Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  return <div key={i} style={{ position: "absolute", left: 38 + Math.cos(a) * 46 * burst, top: 26 + Math.sin(a) * 46 * burst, width: 8, height: 8, borderRadius: 4, background: "#e3b341", opacity: 1 - burst }} />;
                })
              : null}
          </div>
          <div style={{ padding: "10px 22px", borderRadius: 12, border: "1.5px solid #d1d9e0", background: "#f6f8fa", fontWeight: 600, color: "#59636e" }}>⑂ Fork</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, color: "#59636e" }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: "#f05138", display: "inline-block" }} />
            Swift · MIT
          </div>
        </div>
      </div>
      {card > 0 && f < click + 40 ? <Cursor x={cx} y={cy} down={down} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1610, textAlign: "center", opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 46, color: C.deep }}>github.com/zephyr4123/snug</div>
        <div style={{ marginTop: 16, fontFamily: ZH, fontWeight: 600, fontSize: 42, letterSpacing: "0.06em", color: C.ink2 }}>MIT 开源 · 免费下载 · macOS 14+</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1790, textAlign: "center", fontFamily: ZH, fontSize: 30, fontWeight: 500, color: C.ink2, opacity: credit }}>
        承接自 aoyamashou/UUyc-companion · 谨向 UU远程 致谢
      </div>
    </AbsoluteFill>
  );
};
