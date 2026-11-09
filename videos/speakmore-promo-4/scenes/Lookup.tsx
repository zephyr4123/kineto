import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Line, Screen, Sub, sec } from "../components/kit";
import { LAND, SANS, TONE } from "../theme";

// 划词翻译：终端、PDF、网页三张实拍轮流上来（往上推，和转场同一个方向），每张先看选区、再移到下面弹出的译文卡。
// 左边"终端 PDF 网页"跟着亮起当前那一个。
const T = TONE.paper;
const at = (s: number) => LAND + sec(s);
const BOX = { x: 690, y: 150, w: 1110, h: 780 };
const SWAP = [at(2.6), at(5.0)];
const PLACES = ["终端", "PDF", "网页"];

const slide = (frame: number, i: number) => {
  // 第 i 张：在 SWAP[i-1] 从下面推上来，在 SWAP[i] 往上推走
  const inP = i === 0 ? 1 : interpolate(frame, [SWAP[i - 1], SWAP[i - 1] + 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const outP = i === 2 ? 0 : interpolate(frame, [SWAP[i], SWAP[i] + 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (1 - inP) * BOX.h - outP * BOX.h;
};

export const Lookup: React.FC = () => {
  const frame = useCurrentFrame();
  const active = frame < SWAP[0] + 20 ? 0 : frame < SWAP[1] + 20 ? 1 : 2;
  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Head at={at(-0.35)} text="划词即译" color={T.ink} style={{ position: "absolute", left: 118, top: 360 }} />
      <Line at={at(0.3)} style={{ position: "absolute", left: 124, top: 524 }}>
        <div style={{ display: "flex", gap: 30, fontFamily: SANS, fontWeight: 500, fontSize: 34, letterSpacing: "0.06em" }}>
          {PLACES.map((p, i) => (
            <span key={p} style={{ color: i === active ? T.accent : T.ink2, opacity: i === active ? 1 : 0.55 }}>
              {p}
            </span>
          ))}
        </div>
      </Line>
      <Sub at={at(0.5)} text="选中即出译文" color={T.ink2} style={{ position: "absolute", left: 124, top: 590 }} />
      <div
        style={{
          position: "absolute",
          left: BOX.x,
          top: BOX.y,
          width: BOX.w,
          height: BOX.h,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 46px 90px -40px oklch(0.15 0.03 260 / 0.55), 0 16px 34px -18px oklch(0.15 0.03 260 / 0.4)",
        }}
      >
        <Screen
          src={assets.appLookupTerminal}
          w={2040}
          h={1423}
          box={{ x: 0, y: 0, w: BOX.w, h: BOX.h, r: 0 }}
          bg="#1d1d1f"
          shadow={false}
          style={{ transform: `translateY(${slide(frame, 0)}px)` }}
          keys={[
            { f: 0, x: 1000, y: 735, s: 0.92 },
            { f: at(0.6), x: 1000, y: 735, s: 0.92 },
            { f: at(1.7), x: 560, y: 1010, s: 0.92 },
          ]}
          pointer={{ kind: "ibeam", show: [at(-0.3), at(1.1)], keys: [{ f: 0, x: 1484, y: 742 }] }}
        />
        <Screen
          src={assets.appLookupPdf}
          w={2186}
          h={1127}
          box={{ x: 0, y: 0, w: BOX.w, h: BOX.h, r: 0 }}
          bg="#ffffff"
          shadow={false}
          style={{ transform: `translateY(${slide(frame, 1)}px)` }}
          keys={[
            { f: SWAP[0], x: 1000, y: 285, s: 1 },
            { f: SWAP[0] + sec(0.7), x: 1000, y: 285, s: 1 },
            { f: SWAP[0] + sec(1.7), x: 990, y: 565, s: 1 },
          ]}
          pointer={{ kind: "ibeam", show: [SWAP[0], SWAP[0] + sec(1.2)], keys: [{ f: 0, x: 600, y: 368 }] }}
        />
        <Screen
          src={assets.appLookupWeb}
          w={2618}
          h={1020}
          box={{ x: 0, y: 0, w: BOX.w, h: BOX.h, r: 0 }}
          bg="#ffffff"
          shadow={false}
          style={{ transform: `translateY(${slide(frame, 2)}px)` }}
          keys={[
            { f: SWAP[1], x: 950, y: 470, s: 0.95 },
            { f: SWAP[1] + sec(0.7), x: 950, y: 470, s: 0.95 },
            { f: SWAP[1] + sec(1.8), x: 1600, y: 720, s: 0.95 },
          ]}
          pointer={{ kind: "ibeam", show: [SWAP[1], SWAP[1] + sec(1.2)], keys: [{ f: 0, x: 1195, y: 493 }] }}
        />
      </div>
    </AbsoluteFill>
  );
};
