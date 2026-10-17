import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Counter } from "../../../engine/Counter";
import { Glyph } from "../../../engine/Glyph";
import { clamp } from "../../../engine/motion";
import { Bar } from "../../../engine/speakmore/Bar";
import { Flash, Sfx, swellBefore } from "../components/Fx";
import { MacWindow } from "../components/Screens";
import { deepCamera } from "../components/Stage";
import { UI } from "../icons";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, MONO_STACK, SANS, SHADOW, b } from "../theme";

// 长录音：前半段快进录音，秒表从 0:00 走到 2:52、声波一路往左滚；停下后整理，一篇规整的长文一段段落下来，
// 旁边是口述时长、字数、耗时。2 分 52 秒、约 6 秒出自 SpeakMore 的长录音实测（170、172 秒的录音，本地转写加润色 5 次全都完整，
// 两分多钟的录音整理用 5–6 秒）；文稿是为演示写的例子（一次普通的周会），字数按它实际的字数算。

export const LONG_FRAMES = b(32);
export const LONG_CAMERA = deepCamera(LONG_FRAMES);

const SECONDS = 172;
const T = { rec: b(0.5), stop: b(15.5), tidy: b(16), doc: b(17.8), stats: b(18.4), whole: b(27), out: b(31.2) };

type Block = { kind: "h1" | "h2" | "p" | "li"; text: string; n?: string };
const DOC: readonly Block[] = [
  { kind: "h1", text: "移动端改版周会纪要" },
  { kind: "h2", text: "一、背景" },
  {
    kind: "p",
    text: "本次改版聚焦首页与结算流程，目标是缩短下单路径、降低首次使用的门槛。上周完成第一轮内测，覆盖新老用户共五十人，收集反馈三十余条，整体评价积极，主要意见集中在导航与结算两处。",
  },
  { kind: "h2", text: "二、进展" },
  { kind: "li", n: "1.", text: "首页改为卡片式布局，常用入口前置，层级由四层减为两层，新用户找到核心功能的时间明显缩短。" },
  { kind: "li", n: "2.", text: "结算流程合并为单页，地址、优惠与支付方式可在同一页修改，不再来回跳转。" },
  { kind: "li", n: "3.", text: "新增深色模式，跟随系统自动切换，夜间使用的反馈较好。" },
  { kind: "li", n: "4.", text: "图片改为按需加载，并压缩首屏资源，弱网下首屏时间明显缩短。" },
  { kind: "h2", text: "三、问题" },
  { kind: "li", n: "·", text: "部分机型上，底部导航与系统手势区域冲突，误触较多。" },
  { kind: "li", n: "·", text: "深色模式下少数图标对比度不足，需要按规范重新出图。" },
  { kind: "li", n: "·", text: "结算页在横屏时排版错位，优惠信息被遮挡。" },
  { kind: "li", n: "·", text: "内测包的崩溃日志上报不完整，个别问题无法复现。" },
  { kind: "h2", text: "四、下一步" },
  { kind: "li", n: "1.", text: "本周五前修复底部导航冲突，并在主流机型上逐一核对。" },
  { kind: "li", n: "2.", text: "下周一与设计组确认深色模式的图标规范，周三前完成替换。" },
  { kind: "li", n: "3.", text: "补全崩溃日志上报，内测包同步更新。" },
  { kind: "li", n: "4.", text: "横屏适配列入下一迭代，优先级为中。" },
  { kind: "li", n: "5.", text: "两周后开启第二轮内测，范围扩大到两百人，重点验证结算流程。" },
];
/** 文稿的字数：标点也算，空格和编号不算 */
const CHARS = DOC.reduce((n, block) => n + [...block.text.replace(/\s/g, "")].length, 0);
const blockAt = (i: number) => T.doc + Math.round(i * b(0.4));
// 文稿在窗口里往上翻多远（像素），翻到最后一段露全
const SCROLL = 690;

// 背景里淡淡滚过的原话：口语、带口头禅，正好和整理出来的文稿对照
const RAW = [
  "嗯，那个，这次改版主要是首页和结算，就是，想把下单的路径缩短一点，",
  "然后第一次用的人门槛低一点。呃，上周内测完了，反馈大概三十来条吧，",
  "进展的话，第一个，首页改成卡片了，常用的入口往前放，层级从四层变两层，",
  "第二个是结算，合成一页了，就是地址和支付方式在一页里就能改，",
  "然后加了深色模式，嗯，跟着系统自动切。还有图片改成按需加载，",
  "弱网的时候首屏快了不少。问题的话，嗯，有些机型底部导航跟手势会冲突，",
  "深色模式下有几个图标，那个，对比度不太够，还有结算页横屏会错位，",
  "下一步就是，周五之前先把导航那个冲突修掉，主流机型都过一遍，",
  "然后下周一跟设计组把深色模式的图标规范定一下，横屏放到下个迭代，",
  "两周后开第二轮内测，嗯，扩大到两百人左右。",
];

export const Long: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = prog(frame, T.out, 26, EASE.inOut);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink, transform: `scale(${1 + 0.08 * out})`, opacity: 1 - out }}>
      {frame < T.tidy + 30 ? <Recording frame={frame} fps={fps} /> : null}
      {frame >= T.tidy ? <Result frame={frame} /> : null}

      <Flash frame={frame} at={[0, T.tidy]} strength={0.7} />
      <Sfx at={0} name="sfxFlash" volume={0.3} />
      <Sfx at={swellBefore(T.tidy)} name="sfxSwell" volume={0.32} />
      <Sfx at={T.stop} name="sfxClick" volume={0.24} />
      <Sfx at={T.tidy} name="sfxFlash" volume={0.35} />
      <Sfx at={T.doc - 4} name="sfxDing" volume={0.45} />
      {DOC.map((block, i) => (block.kind === "h2" ? <Sfx key={i} at={blockAt(i)} name="sfxTap" volume={0.22} /> : null))}
      <Sfx at={T.whole} name="sfxNote3" volume={0.3} />
      <Sfx at={swellBefore(LONG_FRAMES)} name="sfxSwell" volume={0.45} />
    </AbsoluteFill>
  );
};

/** 录音快进：秒表、往左滚的声波、背景里的原话 */
const Recording: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const audio = interpolate(frame, [T.rec, T.stop], [0, SECONDS], { ...clamp, easing: EASE.inOut });
  const leave = prog(frame, T.tidy, 24, EASE.outQuint);
  const t = frame / fps;
  const level = frame < T.stop ? 0.55 + 0.45 * Math.abs(Math.sin(t * 6.7) * Math.sin(t * 2.9 + 1.3)) : 0;
  const mm = Math.floor(audio / 60);
  const ss = Math.floor(audio % 60);

  return (
    <AbsoluteFill style={{ opacity: 1 - leave, filter: leave > 0.01 ? `blur(${12 * leave}px)` : undefined }}>
      {/* 原话：很淡、往上漂 */}
      <AbsoluteFill style={{ maskImage: "linear-gradient(transparent 22%, black 42%, black 80%, transparent 96%)" }}>
        <div style={{ position: "absolute", left: 150, right: 150, top: 420 - audio * 3.2, fontSize: 40, lineHeight: 2.1, color: "oklch(1 0 0 / 0.09)", filter: "blur(2px)" }}>
          {RAW.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 150, top: 110, fontSize: 64, fontWeight: 700, textShadow: SHADOW, ...show(frame, b(0.4)) }}>近三分钟口述</div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 290, display: "flex", flexDirection: "column", alignItems: "center", textShadow: SHADOW, ...show(frame, 6) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: COLOR.ink2 }}>
          <i style={{ width: 14, height: 14, borderRadius: "50%", background: COLOR.cinnabar, opacity: frame < T.stop ? 0.5 + 0.5 * Math.cos(t * 6) : 0.3 }} />
          录音
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 210, fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.05, fontVariantNumeric: "tabular-nums", transform: `scale(${punch(frame, T.stop, 0.05)})` }}>
          {mm}:{String(ss).padStart(2, "0")}
        </div>
      </div>

      <Wave audio={audio} />

      <div style={{ position: "absolute", left: "50%", top: 880, transform: "translateX(-50%)", ...show(frame, 10, undefined, 30) }}>
        <Bar frame={frame} fps={fps} level={level} timing={{ press: T.stop, finishing: T.stop + 6, done: T.doc - 4 }} />
      </div>
    </AbsoluteFill>
  );
};

/** 声波：每 0.25 秒一根，从中线（此刻）往左滚；说话的段落高、停顿处低 */
const Wave: React.FC<{ audio: number }> = ({ audio }) => {
  const PX = 26; // 每秒多少像素
  const step = 0.25;
  const newest = Math.floor(audio / step);
  const bars: React.ReactNode[] = [];
  for (let j = newest; j >= 0 && j > newest - 160; j--) {
    const x = 960 - (audio - j * step) * PX;
    if (x < -10) break;
    // 一句话 3–6 秒，句间停 0.5–1 秒
    const sentence = Math.floor(j / 18);
    const inPause = j % 18 >= 15 + Math.floor(random(`p${sentence}`) * 2);
    const h = inPause ? 0.06 + 0.06 * random(`q${j}`) : 0.22 + 0.78 * random(`h${j}`) * (0.6 + 0.4 * Math.sin(j * 0.7));
    bars.push(<i key={j} style={{ position: "absolute", left: x, top: 90 - 90 * h, width: 5, height: 180 * h, borderRadius: 3, background: "oklch(0.8 0.07 255 / 0.85)" }} />);
  }
  return (
    <>
      <div style={{ position: "absolute", left: 0, width: 960, top: 600, height: 180, maskImage: "linear-gradient(90deg, transparent, black 30%)" }}>{bars.map((bar) => bar)}</div>
      <div style={{ position: "absolute", left: 958, top: 590, width: 3, height: 200, borderRadius: 2, background: COLOR.cinnabar, boxShadow: `0 0 16px ${COLOR.cinnabar}` }} />
    </>
  );
};

/** 整理：一圈走满，再落下文稿；左边三项数字 */
const Result: React.FC<{ frame: number }> = ({ frame }) => {
  const ring = interpolate(frame, [T.tidy + 4, T.doc - 6], [0, 1], { ...clamp, easing: EASE.inOut });
  const ringOut = prog(frame, T.doc - 4, 20, EASE.outQuint);
  const reveal = (i: number) => prog(frame, blockAt(i), 20);
  const scroll = interpolate(frame, [blockAt(7), blockAt(DOC.length - 1) + 30], [0, SCROLL], { ...clamp, easing: EASE.inOut });
  const value = interpolate(frame, [T.stats + 6, blockAt(DOC.length - 1)], [0, CHARS], { ...clamp, easing: EASE.outQuint });
  const speed = Math.abs(value - interpolate(frame - 1, [T.stats + 6, blockAt(DOC.length - 1)], [0, CHARS], { ...clamp, easing: EASE.outQuint }));

  return (
    <AbsoluteFill>
      {/* 整理中：一圈走满 */}
      <div style={{ position: "absolute", left: 960 - 90, top: 400, width: 180, height: 180, opacity: 1 - ringOut, transform: `scale(${1 - 0.2 * ringOut})` }}>
        <svg viewBox="0 0 180 180" width={180} height={180}>
          <circle cx={90} cy={90} r={80} fill="none" stroke="oklch(1 0 0 / 0.14)" strokeWidth={6} />
          <circle cx={90} cy={90} r={80} fill="none" stroke={COLOR.cinnabar} strokeWidth={6} strokeLinecap="round" strokeDasharray={2 * Math.PI * 80} strokeDashoffset={2 * Math.PI * 80 * (1 - ring)} transform="rotate(-90 90 90)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 600, textShadow: SHADOW }}>整理</div>
      </div>

      {/* 左边：口述、成文、耗时 */}
      <div style={{ position: "absolute", left: 150, top: 200, display: "flex", flexDirection: "column", gap: 56, textShadow: SHADOW }}>
        <Figure label="口述" frame={frame} at={T.stats}>
          <span style={{ fontFamily: MONO_STACK, fontWeight: 300, letterSpacing: "-0.04em" }}>2:52</span>
        </Figure>
        <Figure label="成文" frame={frame} at={T.stats + 8} unit="字">
          <Counter value={value} final={CHARS} speed={speed} />
        </Figure>
        <Figure label="耗时" frame={frame} at={T.stats + 16} unit="秒">
          <span style={{ fontSize: "0.5em", fontWeight: 500, color: COLOR.ink2, marginRight: 10 }}>约</span>6
        </Figure>
      </div>

      <MacWindow title="移动端改版周会纪要" width={1040} height={820} style={{ left: 730, top: 130, ...show(frame, T.doc - 6, undefined, 40) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, padding: "34px 60px", color: COLOR.paperInk }}>
          {DOC.map((block, i) => (
            <DocBlock key={i} block={block} k={reveal(i)} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 80, background: "linear-gradient(transparent, oklch(0.995 0.002 80))" }} />
      </MacWindow>

      <div style={{ position: "absolute", left: 150, top: 860, display: "flex", alignItems: "center", gap: 18, fontSize: 46, fontWeight: 650, textShadow: SHADOW, ...show(frame, T.whole) }}>
        <span style={{ width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", background: COLOR.green, color: "oklch(0.2 0.03 150)" }}>
          <Glyph icon={UI.check} size={34} />
        </span>
        完整成文 · 不截断
      </div>
    </AbsoluteFill>
  );
};

const Figure: React.FC<{ label: string; frame: number; at: number; unit?: string; children: React.ReactNode }> = ({ label, frame, at, unit, children }) => (
  <div style={show(frame, at)}>
    <div style={{ fontSize: 28, color: COLOR.ink2, letterSpacing: "0.1em" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
      <span style={{ fontSize: 110, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{children}</span>
      {unit ? <span style={{ fontSize: 36, fontWeight: 500, color: COLOR.ink2 }}>{unit}</span> : null}
    </div>
  </div>
);

const DocBlock: React.FC<{ block: Block; k: number }> = ({ block, k }) => {
  const style: React.CSSProperties = { opacity: k, transform: `translateY(${14 * (1 - k)}px)`, filter: k < 0.99 ? `blur(${4 * (1 - k)}px)` : undefined };
  if (block.kind === "h1") return <div style={{ ...style, fontSize: 44, fontWeight: 750, marginBottom: 18 }}>{block.text}</div>;
  if (block.kind === "h2") return <div style={{ ...style, fontSize: 32, fontWeight: 700, margin: "26px 0 12px" }}>{block.text}</div>;
  if (block.kind === "p") return <div style={{ ...style, fontSize: 27, lineHeight: 1.75, color: "oklch(0.32 0.015 255)" }}>{block.text}</div>;
  return (
    <div style={{ ...style, display: "flex", gap: 14, fontSize: 27, lineHeight: 1.75, color: "oklch(0.32 0.015 255)", marginBottom: 4 }}>
      <span style={{ flexShrink: 0, width: 28, color: COLOR.paperInk2 }}>{block.n}</span>
      <span>{block.text}</span>
    </div>
  );
};
