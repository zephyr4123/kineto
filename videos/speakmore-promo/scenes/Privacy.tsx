import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { assets } from "../assets.gen";
import type { Camera } from "../components/Stage";
import { show } from "../motion";
import { COLOR, SANS, SERIF } from "../theme";

// 第七章 隐私：一句话定调，三件不做的事并成一排。出处是 SpeakMore 的 README：录音直接发给选的那一家、
// 中间没有别的服务器，没有统计上报，不读屏幕；说过的话只存在本机。

const NOTS = ["不经中转", "不做统计", "不读屏幕"];
const T = { line: 6, row: 26, out: 250, end: 270 };

export const PRIVACY_FRAMES = T.end;
export const PRIVACY_CAMERA: Camera = { focus: [[0, 1]], zoom: [[0, 1]] };

export const Privacy: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: "translateY(-30px)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 88, fontWeight: 600, letterSpacing: "0.06em", ...show(frame, T.line, T.out) }}>
          录音直达模型，记录只存本机。
        </div>
        <div style={{ marginTop: 80, display: "flex", alignItems: "center" }}>
          {NOTS.map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", ...show(frame, T.row + i * 10, T.out) }}>
              {i > 0 ? <span style={{ width: 1.5, height: 40, margin: "0 64px", background: "oklch(1 0 0 / 0.3)" }} /> : null}
              <span style={{ fontSize: 44, fontWeight: 500, letterSpacing: "0.12em" }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <Sequence from={T.line - 4} layout="none" name="sfx:gather">
        <Audio src={staticFile(assets.sfxGather)} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};
