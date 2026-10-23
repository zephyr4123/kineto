import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeIn, prog } from "../../../engine/motion";
import { Focus, Typewriter, Wall } from "../components/Type";
import { Sub, rise } from "../components/kit";
import { COLOR, DISPLAY, EASE, MONO, SANS, b } from "../theme";

// 开场（第 0–24 拍，前奏）："On the web, in documents, in the terminal, in group chats,"（网页里、文档里、终端里、群聊里）——每处一个样子
// （地址栏、纸页、终端提示符、聊天气泡）——"Foreign text. Everywhere."（外文，无处不在）四周浮着各国的问候和常见的英文词。第 16 拍起它们绕着中心卷进去，第 20 拍收成一个点，
// 第 21–23 拍音乐抽空，这个点悬着；第 24 拍砸下，下一段从这个点里炸出 SpeakMore。

const CLOUD = [
  { word: "Hello", x: -560, y: -190, depth: 0.9 },
  { word: "こんにちは", x: 420, y: -250, depth: 0.5 },
  { word: "Hola", x: -260, y: -300, depth: 0.35 },
  { word: "Bonjour", x: 330, y: 230, depth: 0.62 },
  { word: "안녕하세요", x: 60, y: -360, depth: 0.15 },
  { word: "Guten Tag", x: -640, y: 130, depth: 0.74 },
  { word: "Привет", x: 650, y: 40, depth: 0.3 },
  { word: "Ciao", x: -180, y: 300, depth: 0.22 },
  { word: "deadline", x: 160, y: 360, depth: 0.86 },
  { word: "Olá", x: -470, y: 330, depth: 0.42 },
  { word: "Merhaba", x: 760, y: -160, depth: 0.1 },
  { word: "release notes", x: -780, y: -330, depth: 0.55 },
  { word: "Xin chào", x: 560, y: 330, depth: 0.2 },
  { word: "upstream", x: -40, y: 250, depth: 0.08 },
] as const;

/** 四处外文：每处一个容器，2 拍一换，上一处往上虚掉 */
type Kind = "url" | "page" | "term" | "bubble";
const PLACES: { text: string; sub: string; at: number; kind: Kind }[] = [
  { text: "On the web,", sub: "网页里", at: b(1), kind: "url" },
  { text: "in documents,", sub: "文档里", at: b(3), kind: "page" },
  { text: "in the terminal,", sub: "终端里", at: b(5), kind: "term" },
  { text: "in group chats,", sub: "群聊里", at: b(7), kind: "bubble" },
];

const Place: React.FC<{ text: string; sub: string; at: number; out: number; kind: Kind }> = ({ text, sub, at, out, kind }) => {
  const frame = useCurrentFrame();
  const base = rise(frame, at, out, 60, 12);
  // 纸页像翻书一样从右边翻进来；聊天气泡先弹一下
  const page = prog(frame, at, 16, EASE.outQuint);
  const pop = prog(frame, at, 10, EASE.outQuint);
  const style: React.CSSProperties =
    kind === "page"
      ? { ...base, transform: `${base.transform ?? ""} perspective(1400px) rotateY(${-80 * (1 - page)}deg)`, transformOrigin: "left center" }
      : kind === "bubble"
        ? { ...base, transform: `${base.transform ?? ""} scale(${0.6 + 0.4 * pop})`, transformOrigin: "left bottom" }
        : base;
  const dots = kind === "bubble" && frame < at + 14;
  const box: React.CSSProperties =
    kind === "url"
      ? { padding: "16px 40px", borderRadius: 18, background: "oklch(1 0 0)", boxShadow: "0 0 0 1.5px oklch(0.88 0.006 255), 0 20px 50px -24px oklch(0.2 0.03 260 / 0.35)" }
      : kind === "page"
        ? { padding: "34px 60px", borderRadius: 6, background: "oklch(1 0 0)", boxShadow: "0 30px 60px -28px oklch(0.2 0.03 260 / 0.4)", transform: "rotate(-2deg)" }
        : kind === "term"
          ? { padding: "16px 36px", borderRadius: 16, background: COLOR.term, color: COLOR.termBright, fontFamily: `"${MONO}", "${SANS}"` }
          : { padding: "18px 34px", borderRadius: 28, borderBottomLeftRadius: 8, background: "oklch(1 0 0)", boxShadow: "0 0 0 1.5px oklch(0.9 0.005 255)" };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...style, display: "flex", alignItems: "center", gap: 18, fontFamily: kind === "term" ? `"${MONO}", monospace` : DISPLAY, fontSize: 72, fontWeight: kind === "term" ? 500 : 600, letterSpacing: kind === "term" ? 0 : "-0.02em", color: COLOR.ink, ...box }}>
        {kind === "url" ? (
          <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={COLOR.faint} strokeWidth={2.2} strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        ) : null}
        {kind === "term" ? <span style={{ color: COLOR.termDim }}>$</span> : null}
        {kind === "url" || kind === "term" ? (
          <Typewriter value={text} at={at + 2} frames={18} size={72} weight={kind === "term" ? 500 : 600} color={kind === "term" ? COLOR.termBright : COLOR.ink} font={kind === "term" ? `"${MONO}", monospace` : undefined} />
        ) : dots ? (
          <span style={{ display: "inline-flex", gap: 12, padding: "0 12px" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 16, height: 16, borderRadius: 8, background: COLOR.faint, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - at) / 2.5 - i)) }} />
            ))}
          </span>
        ) : (
          text
        )}
      </div>
      <Sub text={sub} at={at + 4} out={out} />
    </AbsoluteFill>
  );
};

export const OPENING_FRAMES = b(25);

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  // 卷进去：第 16 拍起绕中心旋、半径收到 0；第 20 拍收成一个点
  const curl = prog(frame, b(16), b(4), easeIn);
  const point = prog(frame, b(19.5), 10) * (1 - prog(frame, b(24), 4));
  const breathe = 1 + 0.25 * Math.sin(((frame - b(20)) / 24) * Math.PI * 2) * prog(frame, b(20), 10);

  return (
    <AbsoluteFill>
      {CLOUD.map(({ word, x: x0, y: y0, depth }, i) => {
        const appear = prog(frame, 6 + i * 5, 30, EASE.outQuint);
        const drift = frame * (0.06 + depth * 0.2);
        const angle = curl * (2.2 + depth) * Math.PI;
        const r = 1 - curl;
        const bx = x0 + drift * Math.sign(x0);
        const x = (bx * Math.cos(angle) - y0 * Math.sin(angle)) * r;
        const y = (bx * Math.sin(angle) + y0 * Math.cos(angle)) * r;
        return (
          <span
            key={word}
            style={{
              position: "absolute",
              left: 960 + x,
              top: 540 + y,
              transform: `translate(-50%, -50%) scale(${1 - 0.6 * curl})`,
              fontFamily: SANS,
              fontSize: 22 + depth * 36,
              color: COLOR.ink2,
              whiteSpace: "nowrap",
              opacity: appear * (0.32 + 0.38 * (1 - Math.abs(depth - 0.45))) * (1 - curl * curl),
              filter: `blur(${Math.abs(depth - 0.45) * 10 + curl * 6}px)`,
            }}
          >
            {word}
          </span>
        );
      })}

      {PLACES.map((p, i) => (
        <Place key={p.text} {...p} out={i < PLACES.length - 1 ? PLACES[i + 1].at - 4 : b(9.5)} />
      ))}

      {/* "Everywhere" 铺成一面文字墙，几行反向滑，随后收回中间 */}
      <Wall word="Everywhere" at={b(12)} collapse={b(14.6)} out={b(15.4)} color={COLOR.ink2} />

      {/* "Foreign text. Everywhere."："Foreign"的字母一个个晃一下（陌生）；墙收拢时 Everywhere 落到它下面；卷进去时一起缩成一点 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${-90 * prog(frame, b(12), 16, EASE.outQuint)}px) scale(${1 - curl}) rotate(${curl * 200}deg)`, opacity: 1 - prog(frame, b(19), 12) }}>
        <div style={{ display: "flex", alignItems: "baseline", fontFamily: DISPLAY, fontSize: 128, fontWeight: 650, letterSpacing: "-0.03em", color: COLOR.ink }}>
          {[..."Foreign"].map((ch, i) => {
            const t = frame - b(10) - i * 2;
            const wobble = t > 0 ? Math.sin(t / 4.2) * 22 * Math.exp(-t / 16) : 0;
            return (
              <span key={`${ch}-${i}`} style={{ display: "inline-block", ...rise(frame, b(10) + i * 2), translate: `0 ${-wobble}px`, rotate: `${wobble * 0.4}deg` }}>
                {ch}
              </span>
            );
          })}
          <span style={{ display: "inline-block", whiteSpace: "pre", ...rise(frame, b(11)) }}> text.</span>
        </div>
        <Focus value="Everywhere." at={b(14.9)} size={150} weight={700} color={COLOR.cinnabar} style={{ letterSpacing: "-0.035em" }} />
        <Sub text="外文，无处不在" at={b(15.4)} size={38} />
      </AbsoluteFill>

      {/* 收成的那一点：抽空的三拍里悬着、轻轻呼吸 */}
      {point > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: COLOR.cinnabar, opacity: point, transform: `scale(${breathe})`, boxShadow: `0 0 ${30 * breathe}px ${COLOR.cinnabar}` }} />
          {/* 抽空的每一拍，一圈涟漪从这一点漾开 */}
          {[20, 21, 22, 23].map((k) => {
            const t = (frame - b(k)) / 24;
            if (t < 0 || t > 1) return null;
            return <div key={k} style={{ position: "absolute", width: 40, height: 40, borderRadius: "50%", boxShadow: `0 0 0 1.5px ${COLOR.cinnabar}`, opacity: 0.5 * (1 - t) * point, transform: `scale(${1 + 9 * EASE.outQuint(t)})` }} />;
          })}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
