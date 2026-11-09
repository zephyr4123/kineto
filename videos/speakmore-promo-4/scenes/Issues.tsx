import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Backdrop, Head, Screen, Sub, sec } from "../components/kit";
import { LAND, TONE } from "../theme";

// 社区一：两条真 issue。#1 要 Windows 版，往下看到"已随 0.9.0 发布"；#9 要行业词库，下面接上"已在 0.10.0 支持，名为词典"。
const T = TONE.night;
const at = (s: number) => LAND + sec(s);
const BOX = { x: 120, y: 130, w: 1060, h: 820 };
const SWAP = at(3.7);
const ease = Easing.inOut(Easing.cubic);

export const Issues: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = interpolate(frame, [SWAP, SWAP + 40], [0, 1], { ...clamp, easing: ease });
  const reply = interpolate(frame, [at(5.0), at(5.0) + 40], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return (
    <AbsoluteFill>
      <Backdrop tone="night" />
      <Head at={at(-0.35)} text="逐一回复" color={T.ink} style={{ position: "absolute", left: 1290, top: 392 }} />
      <Sub at={at(-0.1)} text="十五条反馈 十四条已解决" color={T.ink2} style={{ position: "absolute", left: 1296, top: 556 }} />
      <div
        style={{
          position: "absolute",
          left: BOX.x,
          top: BOX.y,
          width: BOX.w,
          height: BOX.h,
          borderRadius: 20,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 46px 90px -40px oklch(0.1 0.03 262 / 0.7), 0 16px 34px -18px oklch(0.1 0.03 262 / 0.5)",
        }}
      >
        <Screen
          src={assets.issue1}
          w={1827}
          h={1297}
          box={{ x: 0, y: 0, w: BOX.w, h: BOX.h, r: 0 }}
          bg="#ffffff"
          shadow={false}
          style={{ transform: `translateY(${-swap * BOX.h}px)` }}
          keys={[
            { f: 0, x: 900, y: 560, s: 0.57 },
            { f: at(1.0), x: 900, y: 560, s: 0.57 },
            { f: at(2.2), x: 900, y: 780, s: 0.57 },
          ]}
        />
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - swap) * BOX.h - interpolate(frame, [at(5.4), at(8.5)], [0, 60], clamp)}px)` }}>
          <Screen
            src={assets.issue9Head}
            w={1825}
            h={458}
            box={{ x: 0, y: 190, w: BOX.w, h: 280, r: 0 }}
            bg="#ffffff"
            shadow={false}
            keys={[{ f: 0, x: 900, y: 229, s: 0.57 }]}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 500,
              width: BOX.w,
              opacity: reply,
              transform: `translateY(${(1 - reply) * 40}px)`,
            }}
          >
            <Screen src={assets.issue9Reply} w={1825} h={170} box={{ x: 0, y: 0, w: BOX.w, h: 110, r: 0 }} bg="#ffffff" shadow={false} keys={[{ f: 0, x: 900, y: 85, s: 0.57 }]} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
