import { interpolate } from "remotion";
import { clamp } from "../../../engine/motion";
import { prog, punch } from "../motion";
import { COLOR, EASE, SHADOW } from "../theme";

// 价格、隐私、下载三章的开头：先抛一句反问，正中大字落下；到 settle 那一帧缩成左上角的章头，
// 后面的真截图和答语接着上来。问句短、书面、不带人称。

const BIG = 176;
const HEAD = 64;
const HEAD_AT = { left: 150, top: 96 };

export const Question: React.FC<{ frame: number; text: string; settle: number }> = ({ frame, text, settle }) => {
  const k = prog(frame, settle, 40, EASE.inOut);
  const scale = interpolate(k, [0, 1], [1, HEAD / BIG]);
  return (
    <div
      style={{
        position: "absolute",
        left: interpolate(k, [0, 1], [960, HEAD_AT.left]),
        top: interpolate(k, [0, 1], [540, HEAD_AT.top]),
        transformOrigin: "0 0",
        // 起先以中心对准画面中心，缩到章头时以左上角对齐
        transform: `scale(${scale * punch(frame, 0, 0.06, 24)}) translate(${-50 * (1 - k)}%, ${-50 * (1 - k)}%)`,
        fontSize: BIG,
        fontWeight: 700,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        color: COLOR.ink,
        textShadow: SHADOW,
        opacity: interpolate(frame, [0, 4], [0, 1], clamp),
        filter: `blur(${6 * (1 - prog(frame, 0, 8))}px)`,
      }}
    >
      {text}
    </div>
  );
};
