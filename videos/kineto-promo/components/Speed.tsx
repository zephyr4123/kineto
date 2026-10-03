import { AbsoluteFill, random } from "remotion";
import { backOut, tween } from "../fx";
import { CHECK, CHECK_INK } from "../sprites";
import { CLAWD, CREAM, FONT_ARCADE, GOLD, INK } from "../theme";
import { GROUND_Y } from "../timing";
import { PixelText } from "./PixelText";
import { PixelBox } from "./Retro";
import { Sprite } from "./Sprite";

// 第二幕的道具。坐标都是世界坐标（外层已经按镜头平移）。

// 屏幕空间的速度线：越快越密越亮
export const SpeedLines: React.FC<{ frame: number; amount: number }> = ({ frame, amount }) => {
  if (amount <= 0.02) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: Math.min(1, amount) }}>
      {Array.from({ length: 26 }, (_, i) => {
        const y = 80 + random(`sl-y-${i}`) * 900;
        const len = 200 + random(`sl-l-${i}`) * 500;
        const speed = 90 + random(`sl-v-${i}`) * 80;
        const x = 2200 - (((random(`sl-x-${i}`) * 3000 + frame * speed) % 3000) + 0);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: len, height: random(`sl-h-${i}`) > 0.7 ? 6 : 3, backgroundColor: "rgba(255,255,255,0.55)" }} />;
      })}
    </AbsoluteFill>
  );
};

// 地面上的加速箭头，一路铺过去
export const GroundArrows: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const out: React.ReactNode[] = [];
  for (let x = Math.ceil(from / 520) * 520; x < to; x += 520) {
    out.push(
      <div key={x} style={{ position: "absolute", left: x, top: GROUND_Y + 44, display: "flex", gap: 10 }}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ width: 30, height: 36, backgroundColor: "rgba(255,213,150,0.55)", clipPath: "polygon(0 0, 50% 0, 100% 50%, 50% 100%, 0 100%, 50% 50%)" }} />
        ))}
      </div>,
    );
  }
  return <>{out}</>;
};

// 关卡旗：到了就翻成绿色、打勾
export const Flag: React.FC<{ x: number; n: number; frame: number; doneAt: number; groundY?: number }> = ({ x, n, frame, doneAt, groundY = GROUND_Y }) => {
  const done = frame >= doneAt;
  const wave = (k: number) => Math.round(Math.sin(frame / 5 + k) * 6);
  const color = done ? "#5dffa0" : CLAWD;
  return (
    <div style={{ position: "absolute", left: x, top: groundY - 360 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: 360, backgroundColor: "#e8ecff", boxShadow: "inset -5px 0 0 #a9b4e0" }} />
      <div style={{ position: "absolute", left: -6, top: -14, width: 26, height: 26, backgroundColor: GOLD }} />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <div key={k} style={{ position: "absolute", left: 14 + k * 30, top: 14 + wave(k), width: 30, height: 120, backgroundColor: color, boxShadow: `inset 0 -10px 0 rgba(0,0,0,0.18)` }} />
      ))}
      <div style={{ position: "absolute", left: 60, top: 44 + wave(2), transform: `scale(${done ? tween(frame, [doneAt, doneAt + 8], [1.6, 1], backOut) : 1})` }}>
        {done ? (
          <Sprite grid={CHECK} palette={CHECK_INK} scale={8} />
        ) : (
          <PixelText size={52} font={FONT_ARCADE} color={INK}>
            {String(n)}
          </PixelText>
        )}
      </div>
    </div>
  );
};

// 弹射板
export const BoostPad: React.FC<{ x: number; frame: number; hitAt: number }> = ({ x, frame, hitAt }) => {
  const t = frame - hitAt;
  const squash = t >= 0 && t < 12 ? 1 - 0.5 * Math.sin((t / 12) * Math.PI) : 1;
  return (
    <div style={{ position: "absolute", left: x - 110, top: GROUND_Y - 44 * squash, width: 220, height: 44 * squash }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#5ef2ff", boxShadow: "inset 0 -12px 0 #2bb5c8, 0 0 40px rgba(94,242,255,0.8)" }} />
      <div style={{ position: "absolute", left: 76, top: 6, width: 68, height: 28 * squash, backgroundColor: "white", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
    </div>
  );
};

// 第一关：摄影棚从地里升起来
export const Studio: React.FC<{ x: number; frame: number; at: number }> = ({ x, frame, at }) => {
  if (frame < at) return null;
  const rise = tween(frame, [at, at + 18], [460, 0], backOut);
  const lights = Math.floor((frame - at) / 6) % 2;
  return (
    <div style={{ position: "absolute", left: x, top: GROUND_Y - 420 + rise }}>
      {/* 招牌 */}
      <PixelBox x={90} y={-10} w={420} h={84} border={8} color={GOLD} fill="#b0324f">
        <PixelText size={40} font={FONT_ARCADE} color={CREAM} style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center" }}>
          STUDIO
        </PixelText>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 8 + i * 35, top: 70, width: 12, height: 12, backgroundColor: (i + lights) % 2 ? GOLD : "#fff6cf" }} />
        ))}
      </PixelBox>
      {/* 幕布 + 舞台 */}
      <div style={{ position: "absolute", left: 60, top: 100, width: 480, height: 240, backgroundColor: "#22306e" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 90, height: 240, backgroundColor: "#c2304f", boxShadow: "inset -14px 0 0 #8e2039" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 90, height: 240, backgroundColor: "#c2304f", boxShadow: "inset 14px 0 0 #8e2039" }} />
        <div style={{ position: "absolute", left: 90, top: 0, right: 90, bottom: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(255,236,170,0.55), rgba(255,236,170,0) 70%)" }} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 340, width: 560, height: 80, backgroundColor: "#7a4b2e", boxShadow: "inset 0 14px 0 #a0663f" }} />
      {/* 三脚架上的摄像机 */}
      <div style={{ position: "absolute", left: 620, top: 230, width: 120, height: 70, backgroundColor: "#2d2d3d", boxShadow: `inset 0 -10px 0 #1b1b26` }}>
        <div style={{ position: "absolute", left: 120, top: 18, width: 34, height: 34, backgroundColor: "#4a4a63" }} />
        <div style={{ position: "absolute", left: 18, top: -36, width: 36, height: 36, backgroundColor: "#2d2d3d", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 62, top: -36, width: 36, height: 36, backgroundColor: "#2d2d3d", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 6, top: 18, width: 14, height: 14, backgroundColor: lights ? "#ff4f5e" : "#5a1f28" }} />
      </div>
      {[[-30, 640], [0, 676], [30, 712]].map(([rot, left], i) => (
        <div key={i} style={{ position: "absolute", left, top: 300, width: 10, height: 130, backgroundColor: "#c7cce8", transform: `rotate(${rot}deg)`, transformOrigin: "50% 0" }} />
      ))}
    </div>
  );
};

// 第二关：素材落进贴好标签的箱子，每个箱子盖一个许可证戳
export interface CrateSpec {
  label: string;
  license: string;
  item: "note" | "image" | "font";
}

const Note: React.FC = () => (
  <svg width={90} height={110} viewBox="0 0 9 11" shapeRendering="crispEdges">
    <rect x={4} y={0} width={5} height={2} fill={GOLD} />
    <rect x={4} y={0} width={1} height={9} fill={GOLD} />
    <rect x={8} y={0} width={1} height={7} fill={GOLD} />
    <rect x={1} y={7} width={4} height={3} fill={GOLD} />
    <rect x={5} y={5} width={4} height={3} fill={GOLD} />
  </svg>
);
const Picture: React.FC = () => (
  <div style={{ width: 120, height: 96, backgroundColor: "#f4ead2", padding: 10 }}>
    <div style={{ width: "100%", height: "100%", backgroundColor: "#5fa8ff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 10, bottom: 0, width: 60, height: 40, backgroundColor: "#2f7a4f", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 50, bottom: 0, width: 60, height: 30, backgroundColor: "#3f9a63", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", right: 12, top: 10, width: 18, height: 18, backgroundColor: GOLD }} />
    </div>
  </div>
);
const FontTile: React.FC = () => (
  <div style={{ width: 110, height: 110, backgroundColor: CREAM, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `inset 0 -10px 0 #d9c9a8` }}>
    <PixelText size={50} font={FONT_ARCADE} color={INK}>
      Aa
    </PixelText>
  </div>
);
const ITEM = { note: Note, image: Picture, font: FontTile } as const;

export const Crates: React.FC<{ x: number; frame: number; at: number; crates: readonly CrateSpec[]; groundY?: number }> = ({ x, frame, at, crates, groundY = GROUND_Y }) => {
  if (frame < at) return null;
  return (
    <>
      {crates.map((c, i) => {
        const cx = x + i * 250;
        const appear = at + i * 6;
        const drop = tween(frame, [appear, appear + 14], [-700, 0], backOut);
        const fallAt = at + 22 + i * 10;
        const itemY = tween(frame, [fallAt, fallAt + 16], [-900, -40]);
        const landed = frame >= fallAt + 16;
        const stampAt = fallAt + 22;
        const Item = ITEM[c.item];
        return (
          <div key={c.label} style={{ position: "absolute", left: cx, top: groundY - 170 + drop }}>
            {!landed || frame < fallAt + 22 ? (
              <div style={{ position: "absolute", left: 105 - 60, top: itemY + (landed ? 30 : 0), transform: landed ? "scale(0.8)" : undefined }}>
                <Item />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 0, top: 0, width: 210, height: 170, backgroundColor: "#a86a3c", boxShadow: "inset 0 0 0 10px #7a4a28, inset 0 -40px 0 #93582f" }}>
              <div style={{ position: "absolute", left: 10, top: 58, width: 190, height: 12, backgroundColor: "#7a4a28" }} />
              <PixelText size={24} font={FONT_ARCADE} color={CREAM} outline={3} style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center" }}>
                {c.label}
              </PixelText>
            </div>
            {frame >= stampAt ? (
              <div
                style={{
                  position: "absolute",
                  left: 120,
                  top: -36,
                  transform: `rotate(-12deg) scale(${tween(frame, [stampAt, stampAt + 6], [2.2, 1])})`,
                  opacity: tween(frame, [stampAt, stampAt + 3], [0, 1]),
                }}
              >
                <div style={{ padding: "8px 14px", border: "6px solid #5dffa0", backgroundColor: "rgba(10,40,30,0.85)" }}>
                  <PixelText size={22} font={FONT_ARCADE} color="#5dffa0">
                    {c.license}
                  </PixelText>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// 第三关：大屏幕从地里升起，里面放刚渲染好的片子（children）
export const BILLBOARD = { w: 800, h: 450, border: 14 };
export const Billboard: React.FC<{ x: number; frame: number; at: number; children: React.ReactNode }> = ({ x, frame, at, children }) => {
  if (frame < at) return null;
  const rise = tween(frame, [at, at + 20], [760, 0], backOut);
  return (
    <div style={{ position: "absolute", left: x, top: GROUND_Y - BILLBOARD.h - 230 + rise }}>
      {[160, BILLBOARD.w - 190].map((lx) => (
        <div key={lx} style={{ position: "absolute", left: lx, top: BILLBOARD.h, width: 30, height: 260, backgroundColor: "#c7cce8", boxShadow: "inset -10px 0 0 #8e98c8" }} />
      ))}
      <PixelBox x={0} y={0} w={BILLBOARD.w} h={BILLBOARD.h} border={BILLBOARD.border} color="#e8ecff" fill="#0b1433" style={{ overflow: "hidden" }}>
        {frame >= at + 20 ? children : null}
      </PixelBox>
      <div style={{ position: "absolute", left: 0, right: 0, top: -64, textAlign: "center" }}>
        <PixelText size={30} font={FONT_ARCADE} color={GOLD} outline={4}>
          NOW SHOWING
        </PixelText>
      </div>
    </div>
  );
};

// 大屏幕里放的片子：DVD 屏保式的 KINETO 徽标满屏乱弹，hitAt 那一帧正好撞进右下角
const tri = (u: number, L: number) => {
  const m = ((u % (2 * L)) + 2 * L) % (2 * L);
  return m <= L ? m : 2 * L - m;
};
export const CornerHitMini: React.FC<{ frame: number; hitAt: number; w: number; h: number }> = ({ frame, hitAt, w, h }) => {
  const bw = 230;
  const bh = 96;
  const Lx = w - bw;
  const Ly = h - bh;
  const t = Math.min(frame, hitAt) - hitAt;
  const x = tri(Lx + 13 * t, Lx);
  const y = tri(Ly + 9 * t, Ly);
  const hit = frame >= hitAt;
  const k = frame - hitAt;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: hit ? "#1b1446" : "#0d0b1e" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: bw,
          height: bh,
          borderRadius: 18,
          backgroundColor: hit ? "#ff4f5e" : "#b57bff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 30px ${hit ? "#ff4f5e" : "#b57bff"}`,
          transform: hit ? `scale(${1 + 0.25 * Math.exp(-k / 6)})` : undefined,
          transformOrigin: "100% 100%",
        }}
      >
        <PixelText size={30} font={FONT_ARCADE} color={INK}>
          KINETO
        </PixelText>
      </div>
      {hit ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <PixelText size={58} font={FONT_ARCADE} color={GOLD} outline={6} style={{ transform: `scale(${tween(frame, [hitAt, hitAt + 10], [0, 1], backOut)}) rotate(-6deg)` }}>
            CORNER!
          </PixelText>
        </AbsoluteFill>
      ) : null}
      {hit && k < 6 ? <AbsoluteFill style={{ backgroundColor: "white", opacity: 1 - k / 6 }} /> : null}
    </div>
  );
};

// 片库：一排排整齐的胶片盘，新的那盘最后插进去
export const Shelf: React.FC<{ x: number; frame: number; at: number; slotAt: number }> = ({ x, frame, at, slotAt }) => {
  if (frame < at) return null;
  const drop = tween(frame, [at, at + 16], [-800, 0], backOut);
  const labels = ["corner-hit", "intro", "launch", "teaser", "demo", "recap", "promo"];
  return (
    <div style={{ position: "absolute", left: x, top: GROUND_Y - 520 + drop }}>
      <PixelText size={26} font={FONT_ARCADE} color={CREAM} outline={4} style={{ position: "absolute", left: 0, right: 0, top: -50, textAlign: "center", width: 440 }}>
        LIBRARY
      </PixelText>
      <div style={{ position: "absolute", left: 0, top: 0, width: 440, height: 520, backgroundColor: "#5b3a24", boxShadow: "inset 0 0 0 14px #7a4f31" }} />
      {[0, 1].map((row) =>
        Array.from({ length: 4 }, (_, k) => {
          const idx = row * 4 + k;
          if (idx >= labels.length) return null;
          const isNew = idx === labels.length - 1;
          if (isNew && frame < slotAt) return null;
          const pop = isNew ? tween(frame, [slotAt, slotAt + 8], [1.5, 1], backOut) : 1;
          return (
            <div key={idx} style={{ position: "absolute", left: 30 + k * 100, top: 40 + row * 240, width: 84, height: 180, transform: `scale(${pop})` }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", backgroundColor: isNew ? CLAWD : "#3a4a8c", boxShadow: "inset 0 0 0 10px rgba(0,0,0,0.25)" }} />
              <div style={{ marginTop: 8, height: 64, backgroundColor: isNew ? "#ffe0cc" : "#d7dcf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: FONT_ARCADE, fontSize: 11, color: INK, writingMode: "vertical-rl" as const }}>{labels[idx]}</div>
              </div>
            </div>
          );
        }),
      )}
      {[200, 440].map((y) => (
        <div key={y} style={{ position: "absolute", left: 0, top: y + 30, width: 440, height: 22, backgroundColor: "#7a4f31" }} />
      ))}
    </div>
  );
};
