import { AbsoluteFill, CanvasImage, Easing, staticFile, useCurrentFrame } from "remotion";
import { backOut, tween } from "../../../engine/motion";
import { CREMA, ESPRESSO, FONT_DISPLAY } from "../theme";

// 四宫格：四张照片按 at（相对本段的帧）依次弹进来，每格左下角一个标签。
// 同一画面里并排对比（这里是同一批豆子烘到不同程度）
export const Grid: React.FC<{
  readonly cells: readonly { readonly src: string; readonly label: string; readonly at: number }[];
}> = ({ cells }) => {
  const f = useCurrentFrame();
  const cw = 540;
  const ch = 960;
  return (
    <AbsoluteFill style={{ backgroundColor: ESPRESSO }}>
      {cells.map((c, i) => {
        const t = f - c.at;
        if (t < 0) return null;
        const flash = tween(t, [0, 4], [1, 0]);
        return (
          <div
            key={c.src}
            style={{
              position: "absolute",
              left: (i % 2) * cw,
              top: Math.floor(i / 2) * ch,
              width: cw,
              height: ch,
              overflow: "hidden",
              scale: String(tween(t, [0, 7], [0.55, 1], backOut)),
              rotate: `${tween(t, [0, 7], [i % 2 === 0 ? -8 : 8, 0], Easing.out(Easing.cubic))}deg`,
              outline: `6px solid ${ESPRESSO}`,
            }}
          >
            <CanvasImage
              src={staticFile(c.src)}
              fit="cover"
              width={cw}
              height={ch}
              style={{ scale: String(tween(t, [0, 40], [1.15, 1.3])), filter: "contrast(1.12) saturate(1.12) sepia(0.12)" }}
            />
            <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 120,
                fontFamily: FONT_DISPLAY,
                fontSize: 84,
                color: CREMA,
                textShadow: `5px 5px 0 ${ESPRESSO}`,
              }}
            >
              {c.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
