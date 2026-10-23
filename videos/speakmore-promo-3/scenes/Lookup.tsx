import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Chapter } from "../components/Chapter";
import { Glass, Screen, type ViewKeys } from "../components/Glass";
import { Keycaps } from "../components/Keycaps";
import { LookupCard } from "../components/LookupCard";
import { Panel } from "../components/Panel";
import { Spoken } from "../components/Spoken";
import { CARD_ANCHOR, IBeam, SELECT_TOTAL, TERM_H, TERM_W, Terminal, selectionHead } from "../components/Terminal";
import { Focus, Line, Reel, Typewriter } from "../components/Type";
import { Sub, Tag } from "../components/kit";
import { Browser, type Message, SelLines, Workspace, selHead, totalChars } from "../components/windows";
import { assets } from "../assets.gen";
import { COLOR, EASE, SANS, b } from "../theme";

// 划词翻译（第 95–136 拍）：开场卡的键在第 96 拍砸下时按下（右⌥ 回车）→ 网页（镜头贴着段落，拖选、卡片从选区下长出，拉远）
// → PDF 实拍（镜头飞过）→ terminal（拖选、卡片）→ 组合着用：团队频道里同事发来日文，划词看懂，再用语音翻译回一句日文
// → 一组实拍压暗退后，"No plug-ins. Any app." → 夜色的圆从中间涨满，进暗场。
// 译文都是 App 的真实输出（DeepSeek V4.1 Flash，2026-10-23；terminal 那段是 README 实拍里的同一段）。
const START = 95;
const at = (n: number) => b(n - START);
export const LOOKUP_FRAMES = b(41);

const WEB_LINES = ["The Promise object represents the eventual completion (or failure)", "of an asynchronous operation and its resulting value."];
const WEB_TEXT = "Promise 对象表示异步操作的最终完成（或失败）及其结果值。";
const TERM_TEXT = "从本地仓库更新远程仓库里的一个或多个分支、标签或其他引用，并把远程仓库还没有的数据全部推送过去。";
const SATO = ["明日のリリース前に、最終チェックを", "お願いできますか？テスト環境はもう準備できています。"];
const SATO_ZH = "明天发布前，能麻烦你做一下最终检查吗？测试环境已经准备好了。";
const REPLY_JA = "わかりました。午後から確認を始めます。問題があればすぐにお知らせします。";

const WEB = { w: 1280, h: 760 };
const WEB_VIEW: ViewKeys = [
  [at(98.4), { fx: 0.3, fy: 0.42, s: 1.55, rx: 14, ry: -16, rz: -1 }],
  [at(100.6), { fx: 0.52, fy: 0.45, s: 1.45, rx: 12, ry: -12 }],
  [at(102.4), { fx: 0.42, fy: 0.55, s: 1.02, rx: 8, ry: -10 }],
  [at(104.6), { fx: 0.45, fy: 0.52, s: 0.94, rx: 6, ry: -14 }],
];
const PDF = { w: 2186, h: 1127 };
const PDF_VIEW: ViewKeys = [
  [at(104.4), { fx: 0.5, fy: 0.9, s: 0.55, rx: 46, ry: 14 }],
  [at(105.8), { fx: 0.48, fy: 0.5, s: 0.9, rx: 14, ry: 8, rz: 1 }],
  [at(108.4), { fx: 0.52, fy: 0.45, s: 1.0, rx: 10, ry: -4 }],
];
const TERM_VIEW: ViewKeys = [
  [at(108.2), { fx: 0.3, fy: 0.3, s: 1.4, rx: 16, ry: 18, rz: 1 }],
  [at(110.6), { fx: 0.55, fy: 0.42, s: 1.3, rx: 12, ry: 12 }],
  [at(112.4), { fx: 0.5, fy: 0.55, s: 0.98, rx: 8, ry: 10 }],
  [at(114.6), { fx: 0.5, fy: 0.55, s: 0.92, rx: 6, ry: 14 }],
];
const WS = { w: 1060, h: 760 };
const WS_VIEW: ViewKeys = [
  [at(114.4), { fx: 0.62, fy: 0.72, s: 1.35, rx: 12, ry: 14, rz: 1 }],
  [at(118.6), { fx: 0.55, fy: 0.62, s: 1.08, rx: 8, ry: 10 }],
  [at(126.4), { fx: 0.5, fy: 0.6, s: 0.96, rx: 6, ry: 6 }],
];
// 团队频道里佐藤那条消息文字的左上角（窗口坐标）
const SATO_TEXT = { x: 250 + 30 + 48 + 16, y: 52 + 524 };

export const Lookup: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- 网页 ----
  const webSel = Math.round(prog(frame, at(99.2), b(1.4), EASE.inOut) * totalChars(WEB_LINES));
  const webHead = selHead(WEB_LINES, webSel, 30 * 0.53, 48);
  const webBeam = prog(frame, at(98.9), 5) * (1 - prog(frame, at(101), 5));
  // ---- terminal ----
  const termSel = Math.round(prog(frame, at(108.8), b(1.8), EASE.inOut) * SELECT_TOTAL);
  const termHead = selectionHead(termSel);
  const termBeam = prog(frame, at(108.5), 6) * (1 - prog(frame, at(111), 6));
  // ---- 组合：划词看懂，语音回复 ----
  const satoSel = Math.round(prog(frame, at(115.4), b(1.2), EASE.inOut) * totalChars(SATO));
  const satoHead = selHead(SATO, satoSel, 24, 36);
  const satoBeam = prog(frame, at(115.1), 5) * (1 - prog(frame, at(117), 5));
  const ja = frame >= at(124.4);
  const messages: Message[] = [{ from: "them", name: "佐藤", lines: SATO, at: at(114.8) }];
  // 一组实拍压暗退后，好让字压在上面
  const back = prog(frame, at(129), 20, EASE.inOut);
  const iris = prog(frame, at(134), b(2), EASE.inOut);

  return (
    <AbsoluteFill>
      <Chapter keys={["右 ⌥", "回车"]} name="Selection translation." zh="划词翻译" at={at(95.2)} press={at(96)} out={at(98.4)} />

      {/* 网页：镜头贴着段落，拖选、卡片长出，拉远 */}
      <Glass w={WEB.w} h={WEB.h} keys={WEB_VIEW} at={at(98.4)} out={at(104.4)} y={70} fadeIn={12}>
        <Browser w={WEB.w} h={WEB.h} url="developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise">
          <div style={{ position: "absolute", inset: 0, padding: "46px 80px", background: "oklch(1 0 0)", fontFamily: SANS, color: COLOR.ink }}>
            <div style={{ fontSize: 20, color: COLOR.faint }}>JavaScript › Reference › Standard built-in objects</div>
            <div style={{ fontSize: 60, fontWeight: 700, margin: "18px 0 26px" }}>Promise</div>
            <div style={{ position: "relative" }}>
              <SelLines lines={WEB_LINES} selected={webSel} size={30} lineHeight={48} color={COLOR.ink} />
              {webBeam > 0 ? <IBeam x={webHead.x} y={webHead.y} opacity={webBeam} /> : null}
              <div style={{ position: "absolute", left: 0, top: 2 * 48 + 12, zIndex: 2 }}>
                <LookupCard at={at(101)} textAt={at(101) + 16} language="简体中文" text={WEB_TEXT} />
              </div>
            </div>
            <div style={{ marginTop: 34, fontSize: 30, lineHeight: "48px", color: COLOR.ink2 }}>
              A Promise is a proxy for a value not necessarily known when the promise is created. It allows handlers to be associated with an
              asynchronous action's eventual success value or failure reason.
            </div>
          </div>
        </Browser>
      </Glass>
      <Line out={at(104.2)} y={-460}>
        <Typewriter value="Select to translate." at={at(98.8)} frames={22} size={60} />
      </Line>

      {/* PDF 实拍：镜头从下往上飞过 */}
      <Glass w={PDF.w} h={PDF.h} keys={PDF_VIEW} at={at(104.4)} out={at(108.2)} bare fadeIn={14}>
        <Screen src={assets.photoPdf} w={PDF.w} h={PDF.h} />
      </Glass>
      <Tag text="PDF" at={at(104.8)} out={at(108)} style={{ left: 140, top: 96 }} />

      {/* terminal：拖选、卡片 */}
      <Glass w={TERM_W} h={TERM_H} keys={TERM_VIEW} at={at(108.2)} out={at(114.4)} radius={18} fadeIn={12}>
        <Terminal selected={termSel}>
          {termBeam > 0 ? <IBeam x={termHead.x} y={termHead.y} opacity={termBeam} /> : null}
          <div style={{ position: "absolute", left: CARD_ANCHOR.x, top: CARD_ANCHOR.y }}>
            <LookupCard at={at(111.2)} textAt={at(111.2) + 18} language="简体中文" text={TERM_TEXT} />
          </div>
        </Terminal>
      </Glass>
      <Tag text="Terminal" at={at(108.6)} out={at(114.2)} style={{ left: 140, top: 96 }} />

      <Keycaps
        inAt={at(98.8)}
        outAt={at(113.4)}
        caps={[
          { label: "右 ⌥", presses: [[at(100.8), at(102)], [at(111), at(112.2)]] },
          { label: "回车", presses: [[at(101), at(102)], [at(111.2), at(112.2)]] },
        ]}
      />

      {/* 组合着用：划词看懂佐藤的日文，再用语音翻译回一句日文 */}
      <Glass w={WS.w} h={WS.h} keys={WS_VIEW} at={at(114.4)} out={at(126.4)} x={-420} y={40} fadeIn={12}>
        <Workspace w={WS.w} h={WS.h} frame={frame} channel="release" messages={messages} selected={satoSel} input={ja ? REPLY_JA : ""} placeholder="发送到 #release" caret />
        {satoBeam > 0 ? <IBeam x={SATO_TEXT.x + satoHead.x} y={SATO_TEXT.y + satoHead.y} opacity={satoBeam} /> : null}
        <div style={{ position: "absolute", left: 250 + 30, bottom: WS.h - (52 + 496 - 10), opacity: 1 - prog(frame, at(119.4), 12) }}>
          <LookupCard at={at(117.2)} textAt={at(117.2) + 16} language="简体中文" text={SATO_ZH} />
        </div>
        {ja ? <div style={{ position: "absolute", left: 250 + 24, right: 24, bottom: 24, height: 104, borderRadius: 20, boxShadow: `0 0 0 3px oklch(0.55 0.17 33 / ${Math.exp(-(frame - at(124.4)) / 12)})` }} /> : null}
      </Glass>
      <Spoken parts={[{ text: "好的，我下午就开始检查，有问题马上告诉你。" }]} chip="日文" at={at(119.4)} speak={at(119.8)} stop={at(122.6)} done={at(124)} land={at(124.4)} />
      <Line out={at(126.2)} y={-460}>
        <Focus value="Read it. " at={at(115.6)} size={60} />
        <Focus value="Reply by voice." at={at(119.6)} size={60} color={COLOR.cinnabar} />
      </Line>
      <Keycaps inAt={at(115.6)} outAt={at(119)} caps={[{ label: "右 ⌥", presses: [[at(117), at(118)]] }, { label: "回车", presses: [[at(117.2), at(118)]] }]} />
      <Keycaps
        inAt={at(119.2)}
        outAt={at(124.2)}
        caps={[
          { label: "右 ⌥", presses: [[at(119.6), at(120.4)], [at(122.6), at(123.4)]] },
          { label: "空格", presses: [[at(119.6), at(120.4)], [at(122.6), at(123.4)]] },
        ]}
      />

      {/* 一组实拍：网页、终端、备忘录 */}
      <AbsoluteFill style={{ opacity: 1 - 0.75 * back, filter: back > 0 ? `blur(${10 * back}px)` : undefined, transform: `scale(${1 - 0.06 * back})` }}>
        <Panel src={assets.photoWeb} bare w={1120} h={(1120 * 1020) / 2618} x={-360} y={-230} rotY={16} rotX={6} at={at(126.4)} out={at(133.4)} />
        <Panel src={assets.photoTerminal} bare w={780} h={(780 * 1423) / 2040} x={450} y={90} rotY={-16} rotX={6} at={at(126.9)} out={at(133.4)} />
        <Panel src={assets.photoApp} bare w={720} h={(720 * 585) / 1235} x={-420} y={270} rotY={14} rotX={4} at={at(127.4)} out={at(133.4)} />
      </AbsoluteFill>
      <Line out={at(133.6)} y={-30}>
        <Focus value="No plug-ins. " at={at(129.4)} size={110} />
        <Focus value="Any " at={at(130.6)} size={110} />
        <Reel words={["browser.", "PDF.", "terminal.", "chat.", "app."]} at={at(130.7)} hold={6} size={110} land={COLOR.cinnabar} />
      </Line>
      <Line out={at(133.6)} y={80}>
        <Sub text="无需插件，不挑应用" at={at(131.6)} size={34} />
      </Line>

      {/* 进暗场：夜色的圆从中间涨满 */}
      {iris > 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 2400, height: 2400, flexShrink: 0, borderRadius: "50%", background: COLOR.night, transform: `scale(${iris})`, boxShadow: `0 0 120px 40px ${COLOR.night}` }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
