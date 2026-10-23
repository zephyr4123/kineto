import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Glass, Screen, type ViewKeys } from "../components/Glass";
import { Focus, Line } from "../components/Type";
import { Sub } from "../components/kit";
import { assets } from "../assets.gen";
import { COLOR, DISPLAY, EASE, b } from "../theme";

// 引导四步（第 168–192 拍，原曲接着放的副歌）：首次打开的四页引导（0.17.0 的真截图：功能、快捷键、权限、引擎）排成一条，
// 镜头一页一页滑过去，上方是和引导里一样的四段进度条；最后拉远看全四页，"Ready to go"；夜色的圆从中间涨满，进暗场。
const START = 168;
const at = (n: number) => b(n - START);
export const SETUP_FRAMES = b(24);

const PAGE = { w: 1160, h: 830, gap: 200 };
const STEPS = [
  { src: assets.onbFeatures, name: "Features", at: at(169.6) },
  { src: assets.onbKeys, name: "Hotkeys", at: at(173.6) },
  { src: assets.onbPermissions, name: "Permissions", at: at(177.6) },
  { src: assets.onbEngine, name: "Engine", at: at(181.6) },
] as const;
const PLANE = { w: STEPS.length * PAGE.w + (STEPS.length - 1) * PAGE.gap, h: PAGE.h };
/** 第 i 页中心在整条上的横向位置（占宽的比例） */
const cx = (i: number) => (i * (PAGE.w + PAGE.gap) + PAGE.w / 2) / PLANE.w;
const VIEW: ViewKeys = [
  [at(168), { fx: 0.3, fy: 0.5, s: 0.36, rx: 30, ry: 22, rz: -3 }],
  ...STEPS.flatMap((step, i) => {
    const tilt = i % 2 ? -10 : 10;
    return [
      [step.at, { fx: cx(i), fy: 0.5, s: 1, rx: 8, ry: tilt }],
      [step.at + b(2.8), { fx: cx(i), fy: 0.5, s: 1.05, rx: 6, ry: tilt * 0.7 }],
    ] as const;
  }),
  [at(186.4), { fx: 0.5, fy: 0.5, s: 0.34, rx: 18, ry: -14 }],
  [at(192), { fx: 0.5, fy: 0.5, s: 0.4, rx: 12, ry: -20 }],
];

export const Setup: React.FC = () => {
  const frame = useCurrentFrame();
  const bar = prog(frame, at(169.2), 16) * (1 - prog(frame, at(185.6), 14));
  const iris = prog(frame, at(190), b(2), EASE.inOut);

  return (
    <AbsoluteFill>
      <Glass w={PLANE.w} h={PLANE.h} keys={VIEW} at={at(168)} bare y={50}>
        <div style={{ position: "relative", width: PLANE.w, height: PLANE.h }}>
          {STEPS.map((step, i) => (
            <div key={step.name} style={{ position: "absolute", left: i * (PAGE.w + PAGE.gap), top: 0 }}>
              <Screen src={step.src} w={PAGE.w} h={PAGE.h} />
            </div>
          ))}
        </div>
      </Glass>

      {/* 开头一句、结尾一句 */}
      <Line out={at(169.2)} y={-440}>
        <Focus value="Set up in four steps" at={at(168.2)} size={72} />
      </Line>
      <Line y={-440} out={at(190)}>
        <Focus value="Ready to go" at={at(186.2)} size={72} color={COLOR.cinnabar} />
      </Line>
      <Line y={-365} out={at(190)}>
        <Sub text="四步引导　装好就能用" at={at(186.8)} size={30} />
      </Line>

      {/* 四段进度条：和引导页顶上那条一样，走到哪段哪段亮 */}
      {bar > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 70, opacity: bar }}>
          <div style={{ display: "flex", gap: 26 }}>
            {STEPS.map((step, i) => {
              const fill = prog(frame, step.at, 30, EASE.inOut);
              const active = frame >= step.at && (i === STEPS.length - 1 || frame < STEPS[i + 1].at);
              return (
                <div key={step.name} style={{ width: 300 }}>
                  <div style={{ height: 6, borderRadius: 3, background: COLOR.line, overflow: "hidden" }}>
                    <div style={{ width: `${fill * 100}%`, height: "100%", background: active ? COLOR.cinnabar : "oklch(0.45 0.08 260)" }} />
                  </div>
                  <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 14, fontFamily: DISPLAY, fontSize: 40, fontWeight: 600, letterSpacing: "-0.01em", color: active ? COLOR.ink : COLOR.faint }}>
                    <span style={{ color: active ? COLOR.cinnabar : COLOR.faint }}>{i + 1}</span>
                    {step.name}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* 进暗场：夜色的圆从中间涨满（flex 里要禁止收缩，不然会被压成椭圆） */}
      {iris > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 2400, height: 2400, flexShrink: 0, borderRadius: "50%", background: COLOR.night, transform: `scale(${iris})`, boxShadow: `0 0 120px 40px ${COLOR.night}` }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
