import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { backOut, clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Shock, Sweep } from "../components/fx";
import { C, local, SF, ZH } from "../theme";

// 立题（音乐前奏）：UU远程 的图标落下，Snug 从右边靠上来并在旁边，中间一个加号（插件的关系）；
// 两枚图标往上收，三行大字一拍一行砸出来：Make UU Remote / Native / on iPhone，下面一行中文。
// 最后一小节整组字往镜头冲过来、散掉，下一场的手机从下面飞进来。
const at = local(0);
const ICON_Y = 820;

/** 一行大字：从下往上顶出来（外面一层裁掉，像从一条缝里升起） */
const Line: React.FC<{ at: number; top: number; size: number; children: React.ReactNode; weight?: number; grad?: boolean; track?: string }> = ({ at: t, top, size, children, weight = 800, grad = false, track = "-0.035em" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [t, t + 14], [0, 1], { ...clamp, easing: outExpo });
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, height: size * 1.12, overflow: "hidden", textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: SF,
          fontWeight: weight,
          fontSize: size,
          lineHeight: 1.08,
          letterSpacing: track,
          transform: `translateY(${(1 - p) * 105}%)`,
          filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
          ...(grad
            ? { background: `linear-gradient(100deg, ${C.deep} 0%, ${C.blue2} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
            : { color: C.ink }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const uu = interpolate(f, [0, 24], [0, 1], { ...clamp, easing: backOut });
  const join = interpolate(f, [at(2), at(3)], [0, 1], { ...clamp, easing: inOutQuint });
  const snug = interpolate(f, [at(2), at(3)], [0, 1], { ...clamp, easing: outExpo });
  const lift = interpolate(f, [at(4) - 6, at(4) + 14], [0, 1], { ...clamp, easing: inOutQuint });
  const zh = interpolate(f, [at(7.5), at(7.5) + 14], [0, 1], { ...clamp, easing: outExpo });
  // 最后一小节：整组往镜头冲、发虚、散掉
  const out = interpolate(f, [at(10.6), at(12)], [0, 1], { ...clamp, easing: inOutQuint });
  const size = 250 - 110 * lift;
  const y = ICON_Y + (470 - ICON_Y) * lift;
  const gap = 170 - 60 * lift;
  const uuX = 540 - gap * join;
  const snugX = 540 + gap + 520 * (1 - snug);
  const label = 1 - lift;
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.9 * out})`, transformOrigin: "50% 45%", opacity: 1 - out, filter: out > 0 ? `blur(${14 * out}px)` : undefined }}>
      <div style={{ position: "absolute", left: 540 - 560, top: y - 560, width: 1120, height: 1120, borderRadius: "50%", background: `radial-gradient(circle, rgba(34,216,255,${0.24 * snug}) 0%, rgba(42,109,255,${0.16 * snug}) 36%, transparent 66%)` }} />
      <Img
        src={staticFile(assets.iconUu)}
        style={{ position: "absolute", left: uuX - size / 2, top: y - size / 2, width: size, height: size, opacity: Math.min(1, uu * 1.5), transform: `translateY(${(1 - uu) * -120}px) scale(${0.7 + 0.3 * uu})`, filter: "drop-shadow(0 26px 50px rgba(20,50,120,0.22))" }}
      />
      <div style={{ position: "absolute", left: uuX - 200, top: y + size / 2 + 6, width: 400, textAlign: "center", fontFamily: ZH, fontSize: 44, fontWeight: 600, color: C.ink, opacity: uu * label }}>UU远程</div>
      <div style={{ position: "absolute", left: 540 - 50, top: y - 50, width: 100, height: 100, textAlign: "center", fontFamily: SF, fontSize: 96 - 30 * lift, fontWeight: 300, lineHeight: "100px", color: C.ink2, opacity: snug }}>+</div>
      <Img
        src={staticFile(assets.snugIcon)}
        style={{ position: "absolute", left: snugX - size / 2, top: y - size / 2, width: size, height: size, opacity: snug, transform: `rotate(${(1 - snug) * 18}deg)`, filter: "drop-shadow(0 30px 60px rgba(20,50,120,0.28))" }}
      />
      <div style={{ position: "absolute", left: snugX - 200, top: y + size / 2 + 6, width: 400, textAlign: "center", fontFamily: SF, fontSize: 46, fontWeight: 700, color: C.ink, opacity: snug * label }}>Snug</div>
      <Line at={at(4)} top={650} size={104}>
        Make UU Remote
      </Line>
      <Line at={at(5)} top={770} size={260} weight={900} grad track="-0.05em">
        Native
      </Line>
      <Line at={at(6)} top={1062} size={104}>
        on iPhone
      </Line>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1230, textAlign: "center", fontFamily: ZH, fontSize: 70, fontWeight: 600, letterSpacing: "0.08em", color: C.ink, opacity: zh, transform: `translateY(${(1 - zh) * 20}px)` }}>
        UU远程 · iPhone 原生体验
      </div>
      <Shock at={2} x={540} y={ICON_Y} size={1000} />
      <Shock at={at(2.6)} x={540 + 170} y={ICON_Y} size={700} color="0,184,234" />
      <Sweep at={at(5) + 4} />
    </AbsoluteFill>
  );
};
