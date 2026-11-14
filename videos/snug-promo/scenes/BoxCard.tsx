import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { backOut, clamp, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { CardTitle, cardAt, ChapterTag } from "../components/chapter";
import { C, ZH } from "../theme";

// 第四章「开箱即用」：画面正中迸出一团光、亮成一整屏的白，光束从中心缓缓转着往外放；Snug 的图标弹出来，
// 一圈圈和图标同形的圆角方框从它身上往外扩（像盒子打开）。图标下面大标题。退场时光和字褪掉，MacBook 从下面升上来，
// 图标从这里落进 Mac 屏幕 —— 接下一段的安装（图标的位置交给 Plugin 接着飞）。
const START = 156;
const at = cardAt(START);
/** 卡在第几拍交给下一段：图标从这一拍起由 Plugin 接着画 */
export const BOX_HANDOFF_BEAT = 2.4;
const HANDOFF = at(BOX_HANDOFF_BEAT);
/** 交接那一刻图标在哪、多大（画面坐标） */
export const BOX_ICON = { x: 540, y: 800, size: 300 };
const FADE = 12;
/** 字先退：MacBook 升上来之前标题已经走了，不和它叠在一起 */
const TEXT_OUT = HANDOFF - FADE - 10;

export const BoxCard: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= HANDOFF) return null;
  const bloom = interpolate(f, [2, 18], [0, 1], { ...clamp, easing: outExpo });
  const fade = interpolate(f, [HANDOFF - FADE, HANDOFF], [0, 1], clamp);
  const pop = interpolate(f, [at(0) + 2, at(0) + 16], [0, 1], { ...clamp, easing: backOut });
  const float = 8 * Math.sin((f - at(0)) / 18);
  const r = 2300 * bloom;
  const icon = BOX_ICON.size * (0.4 + 0.6 * pop);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${BOX_ICON.x}px ${BOX_ICON.y}px)`, opacity: 1 - fade }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #ffffff 0%, #f1f8ff 55%, #dcecff 100%)" }} />
        {/* 光束：从图标处往外放，慢慢转 */}
        <AbsoluteFill
          style={{
            background: `repeating-conic-gradient(from ${f * 0.35}deg at ${BOX_ICON.x}px ${BOX_ICON.y}px, rgba(0,184,234,0.13) 0deg 5deg, rgba(0,184,234,0) 5deg 15deg)`,
            maskImage: `radial-gradient(circle at ${BOX_ICON.x}px ${BOX_ICON.y}px, black 0%, black 25%, transparent 70%)`,
          }}
        />
        <div style={{ position: "absolute", left: BOX_ICON.x - 600, top: BOX_ICON.y - 600, width: 1200, height: 1200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,214,255,0.42) 0%, rgba(31,99,255,0.16) 38%, transparent 68%)" }} />
        {/* 和图标同形的圆角方框，一圈圈往外扩 */}
        {[0, 1, 2, 3].map((i) => {
          const t = (((f - at(0) - i * 12) % 48) + 48) % 48 / 48;
          if (f - at(0) - i * 12 < 0) return null;
          const s = BOX_ICON.size * (1 + 2.2 * outExpo(t));
          return <div key={i} style={{ position: "absolute", left: BOX_ICON.x - s / 2, top: BOX_ICON.y + float - s / 2, width: s, height: s, borderRadius: s * 0.225, border: `${4 * (1 - t) + 1.5}px solid rgba(31,99,255,${0.45 * (1 - t)})` }} />;
        })}
        <ChapterTag at={at(0.3)} until={TEXT_OUT} n={4} text="OUT OF THE BOX" x={0} y={1030} color={C.deep} />
        <CardTitle at={at(0.4)} until={TEXT_OUT} text="开箱即用" x={0} y={1100} size={200} color={C.ink} track="0.08em" />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1350, textAlign: "center", fontFamily: ZH, fontWeight: 600, fontSize: 52, letterSpacing: "0.08em", color: C.ink2, opacity: interpolate(f, [at(0.9), at(0.9) + 10], [0, 1], clamp) * interpolate(f, [TEXT_OUT, TEXT_OUT + 8], [1, 0], clamp) }}>
          Mac 端 · 一次授权
        </div>
      </AbsoluteFill>
      {/* 图标：交接前一直在最上面 */}
      {pop > 0 ? (
        <Img
          src={staticFile(assets.snugIcon)}
          style={{ position: "absolute", left: BOX_ICON.x - icon / 2, top: BOX_ICON.y + float * (1 - fade) - icon / 2, width: icon, height: icon, opacity: Math.min(1, pop * 1.4), filter: "drop-shadow(0 30px 60px rgba(20,50,120,0.32))" }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
