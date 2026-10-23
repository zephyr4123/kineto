import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Counter } from "../../../engine/Counter";
import { clamp } from "../../../engine/motion";
import { Bar } from "../../../engine/speakmore/Bar";
import { Sfx, swellBefore } from "../components/Fx";
import { MacWindow } from "../../../engine/speakmore/Screens";
import { deepCamera } from "../components/Stage";
import { prog, punch, show } from "../motion";
import { COLOR, EASE, SANS, SHADOW, b } from "../theme";

// 长录音：前半段快进录音，一条声波长卷往左卷、时长从 0:00 走到 2:52；停下后镜头拉远，整条录音铺满画面，
// 一道光从头扫到尾（整理），扫过的声波压平；随后一篇规整的长文一段段落下来，旁边是口述时长、字数、整理用时。2 分 52 秒、约 6 秒出自 SpeakMore 的长录音实测（170、172 秒的录音，本地转写加润色 5 次全都完整，
// 两分多钟的录音整理用 5–6 秒）；文稿是为演示写的例子（一次普通的周会），字数按它实际的字数算。

export const LONG_FRAMES = b(32);
export const LONG_CAMERA = deepCamera(LONG_FRAMES);

const SECONDS = 172;
// 停下后一拍拉远，副歌进来的那一拍（第 16 拍）开始扫，扫完落文稿
const T = { rec: b(0.5), stop: b(15), tidy: b(16), doc: b(18), stats: b(18.6), whole: b(27) };

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

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {frame < T.doc + 20 ? <Recording frame={frame} fps={fps} /> : null}
      {frame >= T.doc - 10 ? <Result frame={frame} /> : null}

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

/** 录音快进：一条声波长卷往左卷，下面一把分钟尺；停下后拉远，整条 2 分 52 秒尽收眼底，再扫一遍整理 */
const Recording: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const audio = interpolate(frame, [T.rec, T.stop], [0, SECONDS], { ...clamp, easing: EASE.inOut });
  const leave = prog(frame, T.doc - 10, 24, EASE.outQuint);
  const t = frame / fps;
  const level = frame < T.stop ? 0.55 + 0.45 * Math.abs(Math.sin(t * 6.7) * Math.sin(t * 2.9 + 1.3)) : 0;
  const mm = Math.floor(audio / 60);
  const ss = Math.floor(audio % 60);
  // 拉远：停下的那一刻起，从"此刻在正中"换成"整条铺满"
  const wide = prog(frame, T.stop + 2, T.tidy - T.stop - 2, EASE.inOut);
  // 整理：一道光从左扫到右，扫过的声波压平成一道线
  const scan = interpolate(frame, [T.tidy, T.doc - 8], [0, 1], { ...clamp, easing: EASE.inOut });

  return (
    <AbsoluteFill style={{ opacity: 1 - leave, filter: leave > 0.01 ? `blur(${12 * leave}px)` : undefined }}>
      {/* 原话：很淡、往上漂 */}
      <AbsoluteFill style={{ maskImage: "linear-gradient(transparent 22%, black 42%, black 80%, transparent 96%)", opacity: 1 - wide }}>
        <div style={{ position: "absolute", left: 150, right: 150, top: 420 - audio * 3.2, fontSize: 40, lineHeight: 2.1, color: "oklch(1 0 0 / 0.09)", filter: "blur(2px)" }}>
          {RAW.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 150, top: 110, fontSize: 64, fontWeight: 700, textShadow: SHADOW, ...show(frame, b(0.4)) }}>近三分钟口述</div>

      {/* 时长：细体大字，停下时定在 2:52 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 236, display: "flex", flexDirection: "column", alignItems: "center", textShadow: SHADOW, ...show(frame, 6) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 500, letterSpacing: "0.2em", color: COLOR.ink2 }}>
          <i style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR.cinnabar, boxShadow: `0 0 12px ${COLOR.cinnabar}`, opacity: frame < T.stop ? 0.5 + 0.5 * Math.cos(t * 6) : 0 }} />
          {frame < T.stop ? "录音" : scan > 0 ? "整理" : "口述"}
        </div>
        <div style={{ fontSize: 170, fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.05, fontVariantNumeric: "tabular-nums", transform: `scale(${punch(frame, T.stop, 0.05)})` }}>
          {mm}:{String(ss).padStart(2, "0")}
        </div>
      </div>

      <Ribbon audio={audio} wide={wide} scan={scan} />

      <div style={{ position: "absolute", left: "50%", top: 880, transform: "translateX(-50%)", ...show(frame, 10, T.stop + 10, 30) }}>
        <Bar frame={frame} fps={fps} level={level} timing={{ press: T.stop, finishing: T.stop + 6, done: T.stop + 20 }} />
      </div>
    </AbsoluteFill>
  );
};

// 声波：每 0.25 秒一个取样；一句话 3–6 秒、句间停 0.5–1 秒，停顿处低
const STEP = 0.25;
const levelAt = (j: number) => {
  const sentence = Math.floor(j / 18);
  const inPause = j % 18 >= 15 + Math.floor(random(`p${sentence}`) * 2);
  return inPause ? 0.05 + 0.05 * random(`q${j}`) : 0.2 + 0.8 * random(`h${j}`) * (0.6 + 0.4 * Math.sin(j * 0.7));
};
const RIBBON = { y: 610, amp: 92, near: 26, left: 160, right: 1760 };

/**
 * 声波长卷：上下对称的一整块填色（不是一根根竖条），往左卷；此刻那一处一道竖光。
 * wide 从 0 到 1 时，从"每秒 26 像素、此刻在正中"换成"整条 2:52 铺满画面"；scan 扫过的部分压平
 */
const Ribbon: React.FC<{ audio: number; wide: number; scan: number }> = ({ audio, wide, scan }) => {
  const newest = Math.floor(audio / STEP);
  const span = RIBBON.right - RIBBON.left;
  const xOf = (sec: number) => interpolate(wide, [0, 1], [960 - (audio - sec) * RIBBON.near, RIBBON.left + (sec / SECONDS) * span]);
  const amp = interpolate(wide, [0, 1], [RIBBON.amp, 64]);
  const scanX = RIBBON.left + scan * span;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let j = 0; j <= newest; j++) {
    const x = xOf(j * STEP);
    if (x < -40) continue;
    // 扫过的地方压平，留一道细线
    const flat = scan > 0 ? interpolate(x, [scanX - 120, scanX], [0, 1], clamp) : 1;
    const h = amp * levelAt(j) * (0.03 + 0.97 * flat);
    top.push(`${x.toFixed(1)} ${(RIBBON.y - h).toFixed(1)}`);
    bottom.push(`${x.toFixed(1)} ${(RIBBON.y + h).toFixed(1)}`);
  }
  const d = top.length > 1 ? `M${top.join(" L")} L${bottom.reverse().join(" L")} Z` : "";
  const fadeLeft = interpolate(wide, [0, 1], [30, 0]);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, maskImage: `linear-gradient(90deg, transparent, black ${fadeLeft}%)` }}>
        <defs>
          <linearGradient id="ribbon-tone" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="oklch(0.8 0.07 255)" stopOpacity={0.55} />
            <stop offset="0.85" stopColor="oklch(0.86 0.06 255)" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <filter id="ribbon-glow" x="-5%" y="-50%" width="110%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        {d ? <path d={d} fill="url(#ribbon-tone)" filter="url(#ribbon-glow)" opacity={0.55} /> : null}
        {d ? <path d={d} fill="url(#ribbon-tone)" opacity={0.92} /> : null}
        <line x1={RIBBON.left} x2={RIBBON.right} y1={RIBBON.y} y2={RIBBON.y} stroke="oklch(1 0 0 / 0.18)" strokeWidth={1} opacity={wide} />
      </svg>
      {/* 此刻：一道竖光；拉远后变成整理的扫光 */}
      <div
        style={{
          position: "absolute",
          left: scan > 0 ? scanX - 1 : xOf(audio) - 1,
          top: RIBBON.y - 120,
          width: 2,
          height: 240,
          background: `linear-gradient(transparent, ${scan > 0 ? "white" : COLOR.cinnabar}, transparent)`,
          boxShadow: `0 0 18px ${scan > 0 ? "white" : COLOR.cinnabar}`,
          opacity: scan > 0 ? Math.sin(Math.PI * Math.min(1, scan * 1.02)) : 1 - wide,
        }}
      />
      <MinuteRuler audio={audio} xOf={xOf} wide={wide} />
    </>
  );
};

/** 声波下面的分钟尺：10 秒一根小刻度，30 秒一个数；拉远后末尾标出 2:52 */
const MinuteRuler: React.FC<{ audio: number; xOf: (sec: number) => number; wide: number }> = ({ audio, xOf, wide }) => {
  const marks: React.ReactNode[] = [];
  for (let sec = 0; sec <= Math.min(audio, SECONDS); sec += 10) {
    const x = xOf(sec);
    if (x < 0) continue;
    const label = sec % 30 === 0;
    marks.push(
      <div key={sec}>
        <div style={{ position: "absolute", left: x, top: RIBBON.y + 112, width: 1, height: label ? 14 : 7, background: `oklch(1 0 0 / ${label ? 0.45 : 0.22})` }} />
        {label ? (
          <div style={{ position: "absolute", left: x, top: RIBBON.y + 132, transform: "translateX(-50%)", fontSize: 18, color: COLOR.faint, fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
            {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
          </div>
        ) : null}
      </div>,
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, maskImage: `linear-gradient(90deg, transparent, black ${30 * (1 - wide)}%)` }}>
      {marks}
      {wide > 0 ? (
        <div style={{ position: "absolute", left: xOf(SECONDS), top: RIBBON.y + 106, opacity: wide }}>
          <div style={{ width: 2, height: 20, background: COLOR.cinnabar, boxShadow: `0 0 10px ${COLOR.cinnabar}` }} />
          <div style={{ position: "absolute", left: 0, top: 26, transform: "translateX(-50%)", fontSize: 20, fontWeight: 500, color: COLOR.cinnabar, fontVariantNumeric: "tabular-nums" }}>2:52</div>
        </div>
      ) : null}
    </div>
  );
};

/** 成文：文稿一段段落下来；左边一列规格：口述多长、成文多少字、整理多久 */
const Result: React.FC<{ frame: number }> = ({ frame }) => {
  const reveal = (i: number) => prog(frame, blockAt(i), 20);
  const scroll = interpolate(frame, [blockAt(7), blockAt(DOC.length - 1) + 30], [0, SCROLL], { ...clamp, easing: EASE.inOut });
  const value = interpolate(frame, [T.stats + 6, blockAt(DOC.length - 1)], [0, CHARS], { ...clamp, easing: EASE.outQuint });
  const speed = Math.abs(value - interpolate(frame - 1, [T.stats + 6, blockAt(DOC.length - 1)], [0, CHARS], { ...clamp, easing: EASE.outQuint }));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 150, top: 176, width: 440, textShadow: SHADOW }}>
        <Spec label="口述" frame={frame} at={T.stats}>
          2:52
        </Spec>
        <Spec label="成文" frame={frame} at={T.stats + 8} unit="字" rule>
          <Counter value={value} final={CHARS} speed={speed} />
        </Spec>
        <Spec label="整理" frame={frame} at={T.stats + 16} unit="秒" rule>
          <span style={{ fontSize: "0.42em", fontWeight: 400, color: COLOR.ink2, marginRight: 12 }}>约</span>6
        </Spec>
      </div>

      <MacWindow title="移动端改版周会纪要" width={1040} height={820} style={{ left: 730, top: 130, ...show(frame, T.doc - 6, undefined, 40) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, padding: "34px 60px", color: COLOR.paperInk }}>
          {DOC.map((block, i) => (
            <DocBlock key={i} block={block} k={reveal(i)} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 80, background: "linear-gradient(transparent, oklch(0.995 0.002 80))" }} />
      </MacWindow>

      <div style={{ position: "absolute", left: 150, top: 880, display: "flex", alignItems: "center", gap: 20, fontSize: 38, fontWeight: 500, letterSpacing: "0.08em", textShadow: SHADOW, ...show(frame, T.whole) }}>
        <i style={{ width: 44, height: 2, background: COLOR.cinnabar, boxShadow: `0 0 10px ${COLOR.cinnabar}` }} />
        完整成文 · 不截断
      </div>
    </AbsoluteFill>
  );
};

/** 规格里的一项：上面一行字距拉开的小字，下面细体大数字；rule 时上方一道细线隔开 */
const Spec: React.FC<{ label: string; frame: number; at: number; unit?: string; rule?: boolean; children: React.ReactNode }> = ({ label, frame, at, unit, rule, children }) => (
  <div style={{ ...show(frame, at), paddingTop: rule ? 30 : 0, marginTop: rule ? 30 : 0, position: "relative" }}>
    {rule ? <div style={{ position: "absolute", left: 0, top: 0, height: 1, width: `${100 * prog(frame, at, 30, EASE.inOut)}%`, background: "oklch(1 0 0 / 0.22)" }} /> : null}
    <div style={{ fontSize: 22, fontWeight: 500, color: COLOR.ink2, letterSpacing: "0.24em" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
      <span style={{ fontSize: 112, fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{children}</span>
      {unit ? <span style={{ fontSize: 32, fontWeight: 400, color: COLOR.ink2 }}>{unit}</span> : null}
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
