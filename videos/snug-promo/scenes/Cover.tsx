import { AbsoluteFill, Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { Backdrop, Grain } from "../components/stage";
import { C, MONO, SF, ZH } from "../theme";
import { CREDIT, LICENSE_LINE, REPO_URL, RepoCard, SLOGAN, TAGLINE } from "./Outro";

// 横版封面（1920×1080）：落版那张总括图横着重排 —— 上面图标和「Snug」并排，中间 slogan 和中文定位，
// 下面左边 GitHub 仓库卡片（已点亮 Star）、右边地址和开源许可，最底下一行致谢。竖版封面就是成片最后一帧（见 compositions.tsx）。
const CW = 1920;
const CH = 1080;
/** 全片的底是按竖屏画的，横版里放大到铺满宽度、取中间一段 */
const BG_K = CW / 1080;

export const CoverLandscape: React.FC = () => (
  <AbsoluteFill style={{ background: "#f4f8ff", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: (CH - 1920 * BG_K) / 2, width: 1080, height: 1920, transform: `scale(${BG_K})`, transformOrigin: "0 0" }}>
      <Backdrop />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center", alignItems: "center", gap: 48 }}>
      <Img src={staticFile(assets.snugIcon)} style={{ width: 290, height: 290, filter: "drop-shadow(0 30px 60px rgba(20,50,120,0.28))" }} />
      <div style={{ fontFamily: SF, fontWeight: 800, fontSize: 250, lineHeight: 1, letterSpacing: "-0.04em", color: C.ink, paddingBottom: 24 }}>Snug</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 428, textAlign: "center" }}>
      <div style={{ fontFamily: SF, fontWeight: 700, fontSize: 66, letterSpacing: "-0.01em", color: C.deep }}>{SLOGAN}</div>
      <div style={{ marginTop: 18, fontFamily: ZH, fontWeight: 600, fontSize: 70, letterSpacing: "0.06em", color: C.ink }}>{TAGLINE}</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", alignItems: "center", gap: 80 }}>
      <div style={{ width: 972 * 0.8, height: 310 * 0.8 }}>
        <div style={{ transform: "scale(0.8)", transformOrigin: "0 0" }}>
          <RepoCard starred />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 46, color: C.deep }}>{REPO_URL}</div>
        <div style={{ marginTop: 18, fontFamily: ZH, fontWeight: 600, fontSize: 42, letterSpacing: "0.06em", color: C.ink2 }}>{LICENSE_LINE}</div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center", fontFamily: ZH, fontSize: 30, fontWeight: 500, color: C.ink2 }}>{CREDIT}</div>
    <Grain />
  </AbsoluteFill>
);
