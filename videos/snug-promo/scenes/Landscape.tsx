import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outQuint } from "../../../engine/motion";
import { Callout, Smear } from "../components/fx";
import { FRONT, MacDesktop } from "../components/mac";
import { aimL, Landscape as Land, onStageL, Phone, Touch } from "../components/phone";
import { press01 } from "../components/snug";
import { Headline } from "../components/stage";
import { taskAt } from "../components/story";
import { contentHeight, layout, LINE_H, Terminal } from "../components/terminal";
import { FIT_L, LAND_K, landToScreen, mixLand, screenToLand, UULandscape, UUOriginal, type LandView } from "../components/uu";
import { b, local } from "../theme";
import { PORTRAIT_POSE } from "./Portrait";

// 原版 UU远程 · 横屏（照实机录屏）：竖屏太空，横过来才稍微能用，可字号还是缩了一半多，手指一按就盖住好几行。
// 手机转过来；镜头推到终端的字上，一根手指按上去比较大小；单指往上一滑想翻页，结果是鼠标拖拽，选中一大片；
// 想拖选一行，手指稍微一偏就多选一行；双指放大能看清，但只剩一角。每一下都有一支箭头指着结果（上面一行小字是动作，下面大字是结果）。
// 最后拉回整台手机，下一场转回竖屏。
const START = 20;
const at = local(START);
export const LAND_POSE = { x: 540, y: 1150, s: 1.0 };
const SIZE = 13;
const TERM_H = FRONT.h - 33;
const LH = SIZE * LINE_H;
/** 终端第一排字的顶（桌面点）：窗口顶 + 标题栏 33 + 内边距 14 */
const LINE0 = FRONT.y + 33 + 14;
// 按在终端左半边的正文上
const P1 = landToScreen(FIT_L, FRONT.x + 280, FRONT.y + 430);
const P2 = { x: P1.x - 30, y: P1.y - 34 };
const ZOOM_S = 2.8;
const PINCH_VIEW: LandView = { z: 2.3, fx: FRONT.x + 330, fy: FRONT.y + 420, sx: FIT_L.sx, sy: FIT_L.sy };

const SWIPE = at(5.6);
const DRAG = at(9.4);
const PINCH = at(15);
const UNPINCH = at(17.8);

export const Landscape: React.FC = () => {
  const f = useCurrentFrame();
  const abs = b(START) + f;
  const lines = taskAt(abs);
  // 转过来：带一点过冲
  const r = interpolate(f, [0, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  const r01 = Math.min(1, r);
  const base = {
    x: LAND_POSE.x,
    y: PORTRAIT_POSE.y + (LAND_POSE.y - PORTRAIT_POSE.y) * r01,
    s: PORTRAIT_POSE.s + (LAND_POSE.s - PORTRAIT_POSE.s) * r01,
  };
  const zoom = interpolate(f, [at(2), at(3.2)], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [at(13), at(14.5)], [0, 1], { ...clamp, easing: inOutQuint }));
  const s = base.s + (ZOOM_S - base.s) * zoom;
  const focus = aimL(P1.x, P1.y, s, 540, 1220);
  const pose = { x: base.x + (focus.x - base.x) * zoom, y: base.y + (focus.y - base.y) * zoom };
  const land = interpolate(r01, [0.3, 0.65], [0, 1], clamp);

  // UU 里的双指放大
  const pz = interpolate(f, [PINCH + 2, PINCH + 26], [0, 1], { ...clamp, easing: inOutQuint }) * (1 - interpolate(f, [UNPINCH + 2, UNPINCH + 24], [0, 1], { ...clamp, easing: inOutQuint }));
  const view = mixLand(FIT_L, PINCH_VIEW, pz);

  // 单指一滑 = 鼠标拖拽：从按下那排选到手指所在那排
  const off = Math.max(0, contentHeight(layout(lines, SIZE, FRONT.w)) - TERM_H);
  const rowAt = (sy: number) => Math.floor((screenToLand(FIT_L, P1.x, sy).y - LINE0 + off) / LH);
  const rowTop = (row: number) => landToScreen(FIT_L, 0, LINE0 - off + row * LH).y;
  const swipeY = interpolate(f, [SWIPE, SWIPE + 16], [P1.y + 6, P1.y - 66], { ...clamp, easing: outQuint });
  const dragX = interpolate(f, [DRAG, DRAG + 22], [P2.x, P2.x + 84], { ...clamp, easing: outQuint });
  const dragY = interpolate(f, [DRAG, DRAG + 22], [P2.y, P2.y + 12], { ...clamp, easing: outQuint });
  let selRows: [number, number] | undefined;
  if (f >= SWIPE + 2 && f < at(8.8)) selRows = [rowAt(swipeY), rowAt(P1.y + 6)];
  if (f >= DRAG + 2 && f < at(13)) selRows = [rowAt(P2.y), rowAt(dragY)];
  const target = rowAt(P2.y);
  const tY = rowTop(target);
  const outline = interpolate(f, [DRAG - 14, DRAG - 4], [0, 1], clamp) * (1 - interpolate(f, [at(13), at(13) + 8], [0, 1], clamp));

  const rest = interpolate(f, [at(3.3), at(3.6), SWIPE + 20, SWIPE + 28], [0, 1, 1, 0], clamp);
  const fingerY = f < SWIPE ? P1.y : swipeY;
  const dragShow = interpolate(f, [DRAG - 8, DRAG, DRAG + 26, DRAG + 34], [0, 1, 1, 0], clamp);
  const spread = interpolate(f, [PINCH, PINCH + 24], [16, 90], { ...clamp, easing: outQuint });
  const pinchShow = interpolate(f, [PINCH - 8, PINCH, PINCH + 28, PINCH + 36], [0, 1, 1, 0], clamp);
  const close = interpolate(f, [UNPINCH, UNPINCH + 24], [90, 16], { ...clamp, easing: outQuint });
  const unpinchShow = interpolate(f, [UNPINCH - 8, UNPINCH, UNPINCH + 26, UNPINCH + 34], [0, 1, 1, 0], clamp);
  const fingerStage = onStageL(pose.x, pose.y, s, P1.x, P1.y);
  // 箭头指向：误选的那一片中间、多选出来的那一行、两指中间
  const swipeAt = onStageL(pose.x, pose.y, s, P1.x - 60, (P1.y + 6 + swipeY) / 2);
  const extraAt = onStageL(pose.x, pose.y, s, P2.x + 60, tY + LH * LAND_K * 1.5);
  const pinchAt = onStageL(pose.x, pose.y, s, 430, 220);
  const turning = Math.abs(r01 - 0.5) < 0.5 && f < 30 ? Math.sin(Math.PI * r01) : 0;

  const desk = <MacDesktop front={<Terminal lines={lines} size={SIZE} width={FRONT.w} height={TERM_H} anchor="bottom" selRows={selRows} />} />;
  return (
    <AbsoluteFill>
      <Smear id="land-turn" sx={4 * turning} sy={4 * turning}>
        <Phone x={pose.x} y={pose.y} scale={s} rotate={-90 * r} bar={r01 < 0.5}>
          {land < 1 ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - land }}>
              <UUOriginal front={<Terminal lines={lines} size={SIZE} width={FRONT.w} height={TERM_H} anchor="bottom" />} />
            </div>
          ) : null}
          <Land opacity={land}>
            <UULandscape desk={desk} view={view} />
            {/* 想拖选的那一行：虚线框标出来 */}
            {outline > 0 ? (
              <div style={{ position: "absolute", left: P2.x - 4, top: tY - 1, width: 92, height: LH * LAND_K + 2, border: "1.5px dashed #00b8ea", borderRadius: 2, opacity: outline }} />
            ) : null}
            <Touch x={P1.x} y={fingerY} press={1} show={rest} />
            <Touch x={dragX} y={dragY} press={1} show={dragShow} />
            <Touch x={430 - spread * 0.8} y={220 + spread * 0.5} press={1} show={pinchShow} />
            <Touch x={430 + spread * 0.8} y={220 - spread * 0.5} press={1} show={pinchShow} />
            <Touch x={430 - close * 0.8} y={220 + close * 0.5} press={1} show={unpinchShow} />
            <Touch x={430 + close * 0.8} y={220 - close * 0.5} press={1} show={unpinchShow} />
            <Touch x={P2.x} y={P2.y} press={press01(f, at(8.8))} show={interpolate(f, [at(8.8) - 6, at(8.8), at(8.8) + 8, at(8.8) + 12], [0, 1, 1, 0], clamp)} />
          </Land>
        </Phone>
      </Smear>
      <Callout at={at(3.6)} until={SWIPE - 4} x={fingerStage.x + 30} y={fingerStage.y - 34} tx={760} ty={720} side="up" note="一根手指" text="盖住数行" />
      <Callout at={SWIPE + 8} until={at(8.8)} x={swipeAt.x} y={swipeAt.y} tx={360} ty={720} side="up" note="单指滑动" text="误选一片" />
      <Callout at={DRAG + 10} until={at(13)} x={extraAt.x} y={extraAt.y} tx={720} ty={720} side="up" note="拖动选字" text="多选一行" />
      <Callout at={PINCH + 10} until={at(19.4)} x={pinchAt.x} y={pinchAt.y} tx={540} ty={720} side="up" note="双指放大" text="只见局部" bend={0} />
      <Headline at={10} until={at(20) - 4} kicker="LANDSCAPE" title="横屏 · 字号过小" />
    </AbsoluteFill>
  );
};
