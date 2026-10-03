import { AbsoluteFill } from "remotion";
import { backOut, tween, typed } from "../fx";
import { CHECK, CHECK_GREEN } from "../sprites";
import { CLAWD, CREAM, FONT_ARCADE, FONT_MONO, GOLD } from "../theme";
import { PixelText } from "./PixelText";
import { Sprite } from "./Sprite";

// 推镜进电脑后看到的「净」：大片留白，一行命令，回车，一个大绿勾。和第一幕的乱屏正好相反。
// t 是本段局部帧；progress 为真时多一条瞬间跑满的进度条（呼应第一幕卡死的 99%）。
export const TYPE_AT = 6;
export const PER_CHAR = 1;

export const CleanScreen: React.FC<{ t: number; command: string; result: string; progress?: boolean }> = ({ t, command, result, progress = false }) => {
  const enterAt = TYPE_AT + command.length * PER_CHAR + 6;
  const doneAt = enterAt + (progress ? 16 : 2);
  const bar = progress ? tween(t, [enterAt, doneAt], [0, 100]) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1433" }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 64, backgroundColor: "#16224f", display: "flex", alignItems: "center", paddingLeft: 28, gap: 16 }}>
        {["#ff4f5e", GOLD, "#5dffa0"].map((c) => (
          <div key={c} style={{ width: 22, height: 22, backgroundColor: c }} />
        ))}
        <PixelText size={32} color="#7f93d6" font={FONT_MONO} style={{ marginLeft: 20 }}>
          ~/kineto
        </PixelText>
      </div>
      <div style={{ position: "absolute", left: 150, top: 300, display: "flex", alignItems: "center", gap: 38 }}>
        <PixelText size={100} color={CLAWD} font={FONT_MONO}>
          ❯
        </PixelText>
        <PixelText size={command.length > 30 ? 76 : 100} color={CREAM} font={FONT_MONO}>
          {typed(command, t, TYPE_AT, PER_CHAR)}
        </PixelText>
        {t < enterAt ? <div style={{ width: 50, height: 104, backgroundColor: CLAWD, marginLeft: -20 }} /> : null}
      </div>
      {progress && t >= enterAt ? (
        <div style={{ position: "absolute", left: 150, top: 480, width: 1440, height: 64, backgroundColor: "#16224f" }}>
          <div style={{ width: `${bar}%`, height: "100%", backgroundColor: "#5dffa0" }} />
          <PixelText size={30} font={FONT_ARCADE} color={CREAM} style={{ position: "absolute", right: -150, top: 12 }}>
            {`${Math.round(bar)}%`}
          </PixelText>
        </div>
      ) : null}
      {t >= doneAt ? (
        <div
          style={{
            position: "absolute",
            left: 160,
            top: progress ? 640 : 520,
            display: "flex",
            alignItems: "center",
            gap: 40,
            transform: `scale(${tween(t, [doneAt, doneAt + 8], [0.4, 1], backOut)})`,
            transformOrigin: "0 50%",
          }}
        >
          <Sprite grid={CHECK} palette={CHECK_GREEN} scale={22} />
          <PixelText size={84} font={FONT_ARCADE} color="#5dffa0" shadow={8} shadowColor="#0a3d2a">
            {result}
          </PixelText>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// 回车 + 出结果大约需要多少帧，场景据此安排推镜时长
export const cleanScreenLength = (command: string, progress = false) => TYPE_AT + command.length * PER_CHAR + 6 + (progress ? 16 : 2) + 26;
