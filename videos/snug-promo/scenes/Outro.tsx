import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { RepoCard } from "../../../engine/snug/repo";
import { clamp, inOutQuint, outExpo, punch } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Pointer } from "../components/mac";
import { C, local, MONO, SF, ZH } from "../theme";

// 落版：图标、名字、slogan 和一句定位；GitHub 仓库卡片升上来，光标点亮 Star；最后是地址、开源许可和致谢。
// 仓库刚发布（v2.0.0，2026-11-13），星标数很小，卡片上不放数字，只演示点亮。
const at = local(172);

// 落版和封面共用的文案
export const SLOGAN = "Make UU Remote Native on iPhone";
export const TAGLINE = "UU远程 · iPhone 原生体验";
export const REPO_URL = "github.com/zephyr4123/snug";
export const LICENSE_LINE = "MIT 开源 · 免费下载 · macOS 14+";
export const CREDIT = "承接自 aoyamashou/UUyc-companion · 谨向 UU远程 致谢";

// GitHub 仓库卡片已提升到 engine/snug/repo.tsx（snug-demo 的落版也用），这里转出去，封面的 import 不用改
export { RepoCard };

/** frame：竖版封面用，直接给定落版的第几帧（Still 只有一帧，Remotion 会把 Freeze 的帧号夹回 0） */
export const Outro: React.FC<{ frame?: number }> = ({ frame }) => {
  const current = useCurrentFrame();
  const f = frame ?? current;
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
          <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 56, letterSpacing: "-0.01em", color: C.deep }}>{SLOGAN}</div>
          <div style={{ marginTop: 26, fontFamily: ZH, fontWeight: 600, fontSize: 64, letterSpacing: "0.06em", color: C.ink }}>{TAGLINE}</div>
        </div>
      </div>
      {/* GitHub 仓库卡片 */}
      <div style={{ position: "absolute", left: 90, top: 1300, opacity: card, transform: `translateY(${(1 - card) * 120}px)` }}>
        <RepoCard starred={starred} burst={burst} />
      </div>
      {card > 0 && f < click + 40 ? <Pointer x={cx} y={cy} down={down} size={52} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1610, textAlign: "center", opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 46, color: C.deep }}>{REPO_URL}</div>
        <div style={{ marginTop: 16, fontFamily: ZH, fontWeight: 600, fontSize: 42, letterSpacing: "0.06em", color: C.ink2 }}>{LICENSE_LINE}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1790, textAlign: "center", fontFamily: ZH, fontSize: 30, fontWeight: 500, color: C.ink2, opacity: credit }}>
        {CREDIT}
      </div>
    </AbsoluteFill>
  );
};
