import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { Sfx } from "../components/Fx";
import { Question } from "../components/Question";
import { Lift, type Rect, SHOTS, Shot } from "../components/Shot";
import { deepCamera } from "../components/Stage";
import { prog, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 费用：先问"订阅费用高昂？"，答的是 App 的真页面。模型页的推荐组合（真截图）：
// 本机转写 + DeepSeek 每月 ¥2.63、纯本机 ¥0，各自圈出来、抽到左边；再是首页的本月花费（真页面，
// 一个月每天百次上下、按 App 自己的价目逐笔算的演示数据），花费那一块整个抽出来放大。
// ¥2.63 出自推荐组合上的月成本（每天 100 次，和官网 website/src/costs.json 同一套算法）。

export const COST_FRAMES = b(16);
export const COST_CAMERA = deepCamera(COST_FRAMES);

const T = { settle: b(2.2), presets: b(2.4), paid: b(3.8), free: b(6.6), home: b(9), lift: b(10), note: b(11) };

// 推荐组合菜单里的两项（截图像素）：圈的是整项，抽出来的只要上半截（名字、说明、经过哪几个模型）
const PAID: Rect = { x: 1040, y: 380, w: 1096, h: 280 };
const PAID_TOP: Rect = { x: 1052, y: 386, w: 1076, h: 180 };
const FREE: Rect = { x: 1040, y: 1240, w: 1096, h: 296 };
const FREE_TOP: Rect = { x: 1052, y: 1250, w: 1076, h: 180 };
// 首页的花费那一块
const SPEND: Rect = { x: 608, y: 1328, w: 1072, h: 536 };

const PRESETS_AT = { left: 900, top: 70, width: 960 };
const HOME_AT = { left: 860, top: 110, width: 1000 };
const LIFT_SCALE = 0.72;
const SPEND_SCALE = 0.8;
const SPEND_TO = { left: 110, top: 300 };

export const Cost: React.FC = () => {
  const frame = useCurrentFrame();
  const presetsIn = prog(frame, T.presets, 40);
  const presetsOut = prog(frame, T.home, 16, EASE.inOut);
  const homeIn = prog(frame, T.home + 10, 40);
  const spot = frame < T.free ? prog(frame, T.paid, 14) : 1;
  // 圈出的那一项：从付费的滑到纯本机的
  const move = prog(frame, T.free - 6, 24, EASE.inOut);
  const spotRect: Rect = {
    x: PAID.x + (FREE.x - PAID.x) * move,
    y: PAID.y + (FREE.y - PAID.y) * move,
    w: PAID.w + (FREE.w - PAID.w) * move,
    h: PAID.h + (FREE.h - PAID.h) * move,
  };

  // 花费那一块：从首页截图里它所在的位置飞出来，放大到左边
  const lift = prog(frame, T.lift, 40, EASE.inOut);
  const homeScale = HOME_AT.width / SHOTS.cost.w;
  const from = { left: HOME_AT.left + SPEND.x * homeScale, top: HOME_AT.top + SPEND.y * homeScale, k: homeScale / SPEND_SCALE };

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {/* 推荐组合：截图在右，圈出的那一项抽到左边，下面是每月多少 */}
      {presetsIn > 0 && presetsOut < 1 ? (
        <AbsoluteFill style={{ perspective: 2200, opacity: 1 - presetsOut, transform: `translateX(${-180 * presetsOut}px)` }}>
          <Shot
            shot={SHOTS.presets}
            width={PRESETS_AT.width}
            spot={{ rect: spotRect, k: spot }}
            style={{
              left: PRESETS_AT.left,
              top: PRESETS_AT.top,
              opacity: presetsIn,
              transformOrigin: "100% 50%",
              transform: `translateX(${200 * (1 - presetsIn)}px) rotateY(${-16 + 10 * presetsIn}deg)`,
            }}
          />
          <Plan frame={frame} at={T.paid} until={T.free} rect={PAID_TOP} price="¥2.63" note="每天 100 次" />
          <Plan frame={frame} at={T.free} until={T.home} rect={FREE_TOP} price="¥0" note="纯本机 · 不上传" />
        </AbsoluteFill>
      ) : null}

      {/* 首页：本月花费 */}
      {homeIn > 0 ? (
        <AbsoluteFill style={{ perspective: 2200 }}>
          <Shot
            shot={SHOTS.cost}
            width={HOME_AT.width}
            spot={{ rect: SPEND, k: prog(frame, T.lift - 10, 16) }}
            style={{
              left: HOME_AT.left,
              top: HOME_AT.top,
              opacity: homeIn,
              transformOrigin: "100% 50%",
              transform: `translateX(${200 * (1 - homeIn)}px) rotateY(${-16 + 10 * homeIn}deg)`,
            }}
          />
          {lift > 0 ? (
            <Lift
              shot={SHOTS.cost}
              rect={SPEND}
              scale={SPEND_SCALE}
              radius={22}
              style={{
                left: interpolate(lift, [0, 1], [from.left, SPEND_TO.left]),
                top: interpolate(lift, [0, 1], [from.top, SPEND_TO.top]),
                transformOrigin: "0 0",
                transform: `scale(${interpolate(lift, [0, 1], [from.k, 1])})`,
                boxShadow: `0 0 0 1px oklch(0 0 0 / 0.08), 0 ${40 * lift}px ${100 * lift}px oklch(0 0 0 / ${0.55 * lift})`,
              }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              left: SPEND_TO.left + 10,
              top: SPEND_TO.top + SPEND.h * SPEND_SCALE + 50,
              fontSize: 40,
              fontWeight: 500,
              color: COLOR.ink2,
              letterSpacing: "0.06em",
              textShadow: SHADOW,
              ...show(frame, T.note),
            }}
          >
            逐笔记录 · 按官方价
          </div>
        </AbsoluteFill>
      ) : null}

      <Question frame={frame} text="订阅费用高昂？" settle={T.settle} />

      <Sfx at={0} name="sfxFlash" volume={0.35} />
      <Sfx at={T.presets} name="sfxSwish" volume={0.35} />
      <Sfx at={T.paid} name="sfxTap" volume={0.24} />
      <Sfx at={T.paid + 8} name="sfxNote2" volume={0.26} />
      <Sfx at={T.free} name="sfxTap" volume={0.24} />
      <Sfx at={T.free + 8} name="sfxNote4" volume={0.26} />
      <Sfx at={T.home} name="sfxSwish" volume={0.35} />
      <Sfx at={T.lift + 30} name="sfxBlip" volume={0.4} />
    </AbsoluteFill>
  );
};

/** 推荐组合里的一项抽到左边，下面是每月多少；和截图上圈出的那一项之间牵一道虚线 */
const Plan: React.FC<{ frame: number; at: number; until: number; rect: Rect; price: string; note: string }> = ({ frame, at, until, rect, price, note }) => {
  if (frame < at || frame >= until + 20) return null;
  const card = show(frame, at, until, 30);
  const slide = 80 * (1 - prog(frame, at, 30));
  const s = PRESETS_AT.width / SHOTS.presets.w;
  return (
    <>
      <Lift shot={SHOTS.presets} rect={rect} scale={LIFT_SCALE} style={{ left: 150, top: 290, ...card, transform: `translateX(${slide}px) ${card.transform}` }} />
      <div style={{ position: "absolute", left: 150, top: 470, display: "flex", alignItems: "baseline", gap: 18, textShadow: SHADOW, ...show(frame, at + 8, until) }}>
        <span style={{ fontSize: 176, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{price}</span>
        <span style={{ fontSize: 56, fontWeight: 500, color: COLOR.ink2 }}>/ 月</span>
      </div>
      <div style={{ position: "absolute", left: 156, top: 690, fontSize: 40, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.06em", textShadow: SHADOW, ...show(frame, at + 14, until) }}>
        {note}
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: interpolate(frame, [at + 10, at + 24, until, until + 12], [0, 0.8, 0.8, 0], clamp) }}>
        <line
          x1={150 + rect.w * LIFT_SCALE + 12}
          y1={290 + (rect.h * LIFT_SCALE) / 2}
          x2={PRESETS_AT.left + rect.x * s - 6}
          y2={PRESETS_AT.top + (rect.y + rect.h / 2) * s}
          stroke={COLOR.cinnabar}
          strokeWidth={2}
          strokeDasharray="6 8"
        />
      </svg>
    </>
  );
};
