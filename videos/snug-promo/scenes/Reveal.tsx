import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { C, local, SF, ZH } from "../theme";

// 亮相：先是 UU远程 的图标，Snug 从右边靠上来、并在它旁边（插件的关系），中间一个加号；
// 音乐抽空的那一小节里光圈越涨越亮，名字、slogan、一句定位依次跟上。
const at = local(40);
const Y = 720;
const SIZE = 300;

export const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const uu = interpolate(f, [2, 20], [0, 1], { ...clamp, easing: outExpo });
  const join = interpolate(f, [at(3), at(4)], [0, 1], { ...clamp, easing: inOutQuint });
  const snug = interpolate(f, [at(3.2), at(4.2)], [0, 1], { ...clamp, easing: outExpo });
  const swell = interpolate(f, [at(4), at(8)], [0, 1], clamp);
  const name = interpolate(f, [at(4.5), at(4.5) + 14], [0, 1], { ...clamp, easing: outExpo });
  const slogan = interpolate(f, [at(5.5), at(5.5) + 14], [0, 1], { ...clamp, easing: outExpo });
  const sub = interpolate(f, [at(6.5), at(6.5) + 14], [0, 1], { ...clamp, easing: outExpo });
  // UU 图标先在正中，Snug 靠上来时往左让；两枚图标的中心
  const uuX = 540 - 190 * join;
  const snugX = 540 + 190 + 260 * (1 - snug);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - 520, top: Y - 520, width: 1040, height: 1040, borderRadius: "50%", background: `radial-gradient(circle, rgba(34,216,255,${0.3 * swell * swell}) 0%, rgba(42,109,255,${0.22 * swell}) 35%, transparent 68%)`, transform: `scale(${0.6 + 0.6 * swell})`, opacity: snug }} />
      <Img
        src={staticFile(assets.iconUu)}
        style={{ position: "absolute", left: uuX - SIZE / 2, top: Y - SIZE / 2, width: SIZE, height: SIZE, opacity: uu, transform: `translateY(${(1 - uu) * 50}px) scale(${0.8 + 0.2 * uu})`, filter: "drop-shadow(0 26px 50px rgba(20,50,120,0.22))" }}
      />
      <div style={{ position: "absolute", left: uuX - 200, top: Y + SIZE / 2 + 4, width: 400, textAlign: "center", fontFamily: ZH, fontSize: 40, fontWeight: 600, color: C.ink2, opacity: uu * (1 - name) }}>UU远程</div>
      <div style={{ position: "absolute", left: 540 - 40, top: Y - 40, width: 80, height: 80, textAlign: "center", fontFamily: SF, fontSize: 80, fontWeight: 300, lineHeight: "80px", color: C.ink3, opacity: snug }}>+</div>
      <Img
        src={staticFile(assets.snugIcon)}
        style={{ position: "absolute", left: snugX - SIZE / 2, top: Y - SIZE / 2, width: SIZE, height: SIZE, opacity: snug, transform: `scale(${(0.8 + 0.2 * snug) * (1 + 0.05 * swell)})`, filter: "drop-shadow(0 30px 60px rgba(20,50,120,0.28))" }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, textAlign: "center", fontFamily: SF, fontWeight: 800, fontSize: 190, letterSpacing: "-0.04em", color: C.ink, opacity: name, transform: `translateY(${(1 - name) * 40}px)`, filter: name < 1 ? `blur(${(1 - name) * 10}px)` : undefined }}>
        Snug
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, textAlign: "center", fontFamily: SF, fontWeight: 700, fontSize: 52, letterSpacing: "-0.01em", color: C.blue, opacity: slogan, transform: `translateY(${(1 - slogan) * 24}px)` }}>
        Make UU Remote Native on iPhone
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1320, textAlign: "center", fontFamily: ZH, fontWeight: 600, fontSize: 46, letterSpacing: "0.1em", color: C.ink2, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
        UU远程 手机屏插件
      </div>
    </AbsoluteFill>
  );
};
