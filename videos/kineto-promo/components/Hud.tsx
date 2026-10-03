import { CHECK, CHECK_INK, HEART, HEART_EMPTY, HEART_FULL } from "../sprites";
import { FONT_ARCADE, INK } from "../theme";
import { PixelText } from "./PixelText";
import { PixelBox } from "./Retro";
import { Sprite } from "./Sprite";

// 第一幕的 HUD：左上血量 + 第几次尝试，右上任务。breaking 是正在碎掉的那颗心（闪烁、放大）。
export const SwampHud: React.FC<{ frame: number; hearts: number; attempt: number; breakingAt?: number }> = ({ frame, hearts, attempt, breakingAt }) => {
  const breaking = breakingAt !== undefined && frame - breakingAt >= 0 && frame - breakingAt < 24;
  return (
    <>
      <div style={{ position: "absolute", left: 56, top: 48, display: "flex", gap: 14, alignItems: "center" }}>
        {[0, 1, 2].map((i) => {
          const isBreaking = breaking && i === hearts;
          const full = i < hearts || (isBreaking && Math.floor(frame / 3) % 2 === 0);
          return (
            <div key={i} style={{ transform: isBreaking ? `scale(${1.3}) translateY(-4px)` : undefined }}>
              <Sprite grid={HEART} palette={full ? HEART_FULL : HEART_EMPTY} scale={8} />
            </div>
          );
        })}
        <PixelText size={30} font={FONT_ARCADE} color="#d8d0ea" outline={4} style={{ marginLeft: 22 }}>
          {`TRY #${attempt}`}
        </PixelText>
      </div>
      <PixelBox x={1920 - 56 - 470} y={48} w={470} h={76} border={5} color="#6b5f8a" fill="rgba(20,16,25,0.85)">
        <div style={{ display: "flex", alignItems: "center", height: "100%", paddingLeft: 22, gap: 18 }}>
          <PixelText size={22} font={FONT_ARCADE} color="#ffd24a">
            QUEST
          </PixelText>
          <PixelText size={22} font={FONT_ARCADE} color="#d8d0ea">
            MAKE A VIDEO
          </PixelText>
          <PixelText size={22} font={FONT_ARCADE} color="#ff4f5e" style={{ marginLeft: "auto", marginRight: 20 }}>
            ???
          </PixelText>
        </div>
      </PixelBox>
    </>
  );
};

// 第二幕的 HUD：左上速通计时，右上三关进度
export const SpeedHud: React.FC<{ seconds: number; stopped: boolean; frame: number; progress: number; labels: readonly string[] }> = ({
  seconds,
  stopped,
  frame,
  progress,
  labels,
}) => {
  const mm = Math.floor(seconds / 60);
  const ss = Math.floor(seconds % 60);
  const cs = Math.floor((seconds * 100) % 100);
  const text = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  const blink = stopped && Math.floor(frame / 8) % 2 === 0;
  return (
    <>
      <div style={{ position: "absolute", left: 56, top: 46 }}>
        <PixelText size={22} font={FONT_ARCADE} color="#5ef2ff" outline={3}>
          SPEEDRUN
        </PixelText>
        <PixelText size={56} font={FONT_ARCADE} color={blink ? "#ffd24a" : "white"} outline={5} shadow={5} shadowColor="#ff4fd8" style={{ marginTop: 14 }}>
          {text}
        </PixelText>
      </div>
      <div style={{ position: "absolute", right: 56, top: 52, display: "flex", alignItems: "center", gap: 0 }}>
        {labels.map((label, i) => {
          const done = progress > i;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 ? <div style={{ width: 54, height: 8, backgroundColor: done ? "#5dffa0" : "#3a2f6a" }} /> : null}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: done ? "#5dffa0" : INK,
                    boxShadow: `0 0 0 6px ${done ? "#c8ffe0" : "#3a2f6a"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {done ? <Sprite grid={CHECK} palette={CHECK_INK} scale={3} /> : null}
                </div>
                <PixelText size={30} color={done ? "#c8ffe0" : "#8a7fb8"} outline={3}>
                  {label}
                </PixelText>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
