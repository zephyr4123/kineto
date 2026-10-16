import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Counter } from "../components/Counter";
import type { Camera } from "../components/Stage";
import { show } from "../motion";
import { COLOR, EASE, SANS, SERIF } from "../theme";

// 第二章 来历：Typeless 是迄今最好的语音输入，年度订阅 $144 → REA，GitHub 星标滚到当下的数 →
// 以 REA 拆开 Typeless，十八篇逆向笔记的标题一路滚过 → 从零重写，只取听写。
// 每一拍左边一行大字定调、右边一个数或一列字作证据；拍与拍之间旧的往上虚掉、新的从下面浮上来。

// GitHub API repos/morluto/rea 的 stargazers_count（2026-10-16 取），渲染当天重取
const REA_STARS = 272_464;
// SpeakMore 仓库 targets/typeless/docs/ 里十八篇逆向笔记的编号和标题，照原样
const NOTES = [
  ["00", "总览"],
  ["01", "包结构与签名"],
  ["02", "代码还原"],
  ["03", "进程与窗口架构"],
  ["04", "语音主链路"],
  ["05", "网络协议"],
  ["06", "上下文采集与隐私"],
  ["07", "原生库"],
  ["08", "本机数据"],
  ["09", "运行时抓包"],
  ["10", "交互状态机与按键"],
  ["11", "录音与编码"],
  ["12", "账号与登录"],
  ["13", "历史云同步"],
  ["14", "结果投递"],
  ["15", "更新、企业策略与权限"],
  ["90", "证据台账"],
  ["91", "未决问题"],
] as const;

const T = {
  typeless: 4,
  rea: 160,
  stars: [196, 290] as const,
  notes: 326,
  scroll: [334, 462] as const,
  rewrite: 482,
  end: 640,
};
const OUT = { typeless: 150, rea: 318, notes: 470, rewrite: 610 };

export const ORIGIN_FRAMES = T.end;
// 开场推近的 3% 在这一章里慢慢退回原大：桌面这时是虚的看不出来，之后各章菜单栏两头不再被裁
export const ORIGIN_CAMERA: Camera = {
  focus: [[0, 1]],
  zoom: [
    [0, 1.03],
    [T.end, 1],
  ],
};

const LEFT = 200;
const RIGHT = 200;

export const Origin: React.FC = () => {
  const frame = useCurrentFrame();

  const starsT = interpolate(frame, T.stars, [0, 1], { ...clamp, easing: EASE.outExpo });
  const starsPrev = interpolate(frame - 1, T.stars, [0, 1], { ...clamp, easing: EASE.outExpo });
  const scroll = interpolate(frame, T.scroll, [0, 15], { ...clamp, easing: EASE.inOut });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {/* 一 Typeless 与 $144 */}
      <Lead top={392} frame={frame} at={T.typeless} out={OUT.typeless} name="Typeless" line="迄今最好的语音输入" />
      <Figure frame={frame} at={T.typeless + 36} out={OUT.typeless} label="年度订阅">
        <span style={{ fontWeight: 250 }}>$144</span>
        <span style={{ fontSize: "0.3em", fontWeight: 400, color: COLOR.muted, marginLeft: "0.3em" }}>/ 年</span>
      </Figure>

      {/* 二 REA 与星标 */}
      <Lead top={392} frame={frame} at={T.rea} out={OUT.rea} name="REA" line="以智能体逆向一切" />
      <Figure frame={frame} at={T.rea + 30} out={OUT.rea} label="GitHub 星标">
        <Star />
        <span style={{ fontWeight: 250 }}>
          <Counter value={REA_STARS * starsT} final={REA_STARS} speed={REA_STARS * (starsT - starsPrev)} />
        </span>
      </Figure>

      {/* 三 拆解：十八篇笔记的标题滚过去 */}
      <div style={{ position: "absolute", left: LEFT, top: 418, fontSize: 64, fontWeight: 500, lineHeight: 1.5 }}>
        <div style={show(frame, T.notes, OUT.notes)}>以 REA 逐层拆解，</div>
        <div style={show(frame, T.notes + 12, OUT.notes)}>成文十八篇。</div>
      </div>
      <div style={{ position: "absolute", right: RIGHT, top: 540, width: 620, ...show(frame, T.notes + 4, OUT.notes, 0) }}>
        {NOTES.map(([no, title], i) => {
          const d = i - scroll;
          const near = Math.max(0, 1 - Math.abs(d));
          return (
            <div
              key={no}
              style={{
                position: "absolute",
                left: 0,
                top: d * 66 - 22,
                display: "flex",
                gap: 28,
                fontSize: 36,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                opacity: Math.max(0, 1 - Math.abs(d) / 3.6),
                color: near > 0.5 ? COLOR.ink : COLOR.muted,
                fontWeight: 360 + 140 * near,
              }}
            >
              <span style={{ width: "1.4em", fontVariantNumeric: "tabular-nums", color: near > 0.5 ? COLOR.cinnabar : COLOR.muted }}>{no}</span>
              <span>{title}</span>
            </div>
          );
        })}
      </div>

      {/* 四 从零重写 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 600, letterSpacing: "0.06em", ...show(frame, T.rewrite, OUT.rewrite) }}>
          从零重写，只取听写。
        </div>
        <div style={{ marginTop: 40, fontSize: 32, color: COLOR.muted, letterSpacing: "0.08em", ...show(frame, T.rewrite + 20, OUT.rewrite) }}>
          不含 Typeless 的任何代码与密钥
        </div>
      </AbsoluteFill>

      {[T.rea, T.notes, T.rewrite].map((at) => (
        <Sequence key={at} from={at - 4} layout="none" name="sfx:gather">
          <Audio src={staticFile(assets.sfxGather)} volume={0.32} />
        </Sequence>
      ))}
      <Sequence from={T.stars[0] + 54} layout="none" name="sfx:key">
        <Audio src={staticFile(assets.sfxKey)} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 左边定调的那一组：一个名字，一行宋体的评语 */
const Lead: React.FC<{ top: number; frame: number; at: number; out: number; name: string; line: string }> = ({ top, frame, at, out, name, line }) => (
  <div style={{ position: "absolute", left: LEFT, top }}>
    <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, ...show(frame, at, out) }}>{name}</div>
    <div
      style={{
        marginTop: 40,
        fontFamily: SERIF,
        fontSize: 40,
        fontWeight: 500,
        letterSpacing: "0.24em",
        color: COLOR.muted,
        lineHeight: 1,
        ...show(frame, at + 12, out),
      }}
    >
      {line}
    </div>
  </div>
);

/** 右边作证据的数：上面一行小字说这是什么，下面是数本身 */
const Figure: React.FC<{ frame: number; at: number; out: number; label: string; children: React.ReactNode }> = ({ frame, at, out, label, children }) => (
  <div style={{ position: "absolute", right: RIGHT, top: 366, textAlign: "right" }}>
    <div style={{ fontSize: 32, color: COLOR.muted, letterSpacing: "0.12em", lineHeight: 1, ...show(frame, at, out) }}>{label}</div>
    <div
      style={{
        marginTop: 36,
        fontSize: 180,
        lineHeight: 1,
        display: "flex",
        alignItems: "baseline",
        justifyContent: "flex-end",
        fontVariantNumeric: "tabular-nums",
        ...show(frame, at + 6, out),
      }}
    >
      {children}
    </div>
  </div>
);

/** 五角星：自己画的，不用 GitHub 的图标 */
const Star: React.FC = () => (
  <svg viewBox="0 0 24 24" width="0.36em" height="0.36em" style={{ marginRight: "0.22em", alignSelf: "center" }}>
    <path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill={COLOR.cinnabar} />
  </svg>
);
