import { AbsoluteFill, useCurrentFrame } from "remotion";
import { prog } from "../../../engine/motion";
import { Keycaps } from "../components/Keycaps";
import { Shot } from "../components/Shot";
import { LookupCard } from "../components/LookupCard";
import { Panel } from "../components/Panel";
import { CARD_ANCHOR, IBeam, SELECT_TOTAL, TERM_H, TERM_W, Terminal, selectionHead } from "../components/Terminal";
import { Focus, Line, Reel } from "../components/Type";
import { Sub, Tag } from "../components/kit";
import { Browser, CodeEditor, type CodeLine, SelLines, codePos, selHead, totalChars } from "../components/windows";
import { assets } from "../assets.gen";
import { COLOR, EASE, SANS, b } from "../theme";

// 划词（第 32–64 拍）：先在终端里完整走一遍（拖选、右⌥、回车、卡片），然后哪里都能划——网页（代码画、会动）、
// PDF（实拍）、代码编辑器（代码画、会动）、再一组实拍（网页、终端、备忘录）铺开，压上"No plug-ins. Any app."（无需插件，不挑应用）
// 译文都是 App 划词的真实输出（DeepSeek V4.1 Flash，2026-10-23 跑的；终端那段是 README 实拍里的同一段）。
const START = 32;
const at = (n: number) => b(n - START);
export const LOOKUP_FRAMES = b(32);

const TERM_TEXT = "从本地仓库更新远程仓库里的一个或多个分支、标签或其他引用，并把远程仓库还没有的数据全部推送过去。";
const WEB_LINES = ["The Promise object represents the eventual completion (or failure)", "of an asynchronous operation and its resulting value."];
const WEB_TEXT = "Promise 对象表示异步操作的最终完成（或失败）及其结果值。";
const CODE_TEXT = "用指数退避重试，这样单个请求偶尔出问题也不会导致整个同步失败。";
const CODE: readonly CodeLine[] = [
  [["key", "import"], ["ink", " { "], ["fn", "fetchChanges"], ["ink", " } "], ["key", "from"], ["ink", " "], ["str", '"./api"'], ["ink", ";"]],
  [["ink", ""]],
  [["key", "export async function"], ["ink", " "], ["fn", "sync"], ["ink", "(store: Store) {"]],
  [["com", "  // Retry with exponential backoff, so a single flaky request"]],
  [["com", "  // doesn't fail the whole sync."]],
  [["ink", "  "], ["key", "for"], ["ink", " ("], ["key", "let"], ["ink", " attempt = "], ["num", "0"], ["ink", "; attempt < "], ["num", "5"], ["ink", "; attempt++) {"]],
  [["ink", "    "], ["key", "try"], ["ink", " {"]],
  [["ink", "      "], ["key", "return await"], ["ink", " "], ["fn", "fetchChanges"], ["ink", "(store.cursor);"]],
  [["ink", "    } "], ["key", "catch"], ["ink", " {"]],
  [["ink", "      "], ["key", "await"], ["ink", " "], ["fn", "sleep"], ["ink", "("], ["num", "2"], ["ink", " ** attempt * "], ["num", "250"], ["ink", ");"]],
  [["ink", "    }"]],
  [["ink", "  }"]],
  [["ink", "}"]],
];
const CODE_SELECT = [3, 4] as const;
const codeText = (i: number) => CODE[i].map(([, t]) => t).join("");
const CODE_TOTAL = CODE_SELECT.reduce((n, i) => n + codeText(i).length - (codeText(i).indexOf("// ") + 3), 0);
const codeHead = (n: number) => {
  let left = n;
  for (const i of CODE_SELECT) {
    const col = codeText(i).indexOf("// ") + 3;
    const len = codeText(i).length - col;
    if (left <= len || i === CODE_SELECT[CODE_SELECT.length - 1]) return codePos(i, col + Math.min(left, len));
    left -= len;
  }
  return codePos(CODE_SELECT[0], 5);
};

export const Lookup: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- 终端 ----
  const termSel = Math.round(prog(frame, at(33.5), b(2), EASE.inOut) * SELECT_TOTAL);
  const termHead = selectionHead(termSel);
  const termBeam = prog(frame, at(33.1), 6) * (1 - prog(frame, at(36.6), 6));
  // ---- 网页 ----
  const webSel = Math.round(prog(frame, at(41.1), b(1.4), EASE.inOut) * totalChars(WEB_LINES));
  const webHead = selHead(WEB_LINES, webSel, 30 * 0.53, 48);
  const webBeam = prog(frame, at(40.8), 5) * (1 - prog(frame, at(42.7), 5));
  // ---- 代码 ----
  const codeSel = Math.round(prog(frame, at(48.1), b(1.5), EASE.inOut) * CODE_TOTAL);
  const cHead = codeHead(codeSel);
  const codeBeam = prog(frame, at(47.9), 5) * (1 - prog(frame, at(49.7), 5));
  const codeCard = codePos(4, 5);
  // 一组实拍压暗退后，好让字压在上面
  const back = prog(frame, at(55.6), 20, EASE.inOut);

  return (
    <AbsoluteFill>
      {/* 终端：完整走一遍 */}
      <Shot w={TERM_W} h={TERM_H} enter={0} leave={at(40)} rotY={-12} how="far" kick={at(37)}>
        <Terminal selected={termSel}>
          {termBeam > 0 ? <IBeam x={termHead.x} y={termHead.y} opacity={termBeam} /> : null}
          <div style={{ position: "absolute", left: CARD_ANCHOR.x, top: CARD_ANCHOR.y, transform: "translateZ(40px)" }}>
            <LookupCard at={at(37)} textAt={at(37) + 18} language="简体中文" text={TERM_TEXT} />
          </div>
        </Terminal>
      </Shot>
      <Tag text="Terminal" sub="终端" at={at(33)} out={at(39.6)} style={{ left: 140, top: 96 }} />

      {/* 网页（代码画） */}
      <Shot w={1280} h={760} enter={at(40)} leave={at(44.4)} rotY={10} how="flip" kick={at(43)}>
        <Browser w={1280} h={760} url="developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise">
          <div style={{ position: "absolute", inset: 0, padding: "46px 80px", background: "oklch(1 0 0)", fontFamily: SANS, color: COLOR.ink }}>
            <div style={{ fontSize: 20, color: COLOR.faint }}>JavaScript › Reference › Standard built-in objects</div>
            <div style={{ fontSize: 60, fontWeight: 700, margin: "18px 0 26px" }}>Promise</div>
            <div style={{ position: "relative" }}>
              <SelLines lines={WEB_LINES} selected={webSel} size={30} lineHeight={48} color={COLOR.ink} />
              {webBeam > 0 ? <IBeam x={webHead.x} y={webHead.y} opacity={webBeam} /> : null}
              <div style={{ position: "absolute", left: 0, top: 2 * 48 + 12, zIndex: 2 }}>
                <LookupCard at={at(43)} textAt={at(43) + 16} language="简体中文" text={WEB_TEXT} />
              </div>
            </div>
            <div style={{ marginTop: 34, fontSize: 30, lineHeight: "48px", color: COLOR.ink2 }}>
              A Promise is a proxy for a value not necessarily known when the promise is created. It allows handlers to be associated with an
              asynchronous action's eventual success value or failure reason.
            </div>
          </div>
        </Browser>
      </Shot>
      <Tag text="Web" sub="网页" at={at(40.4)} out={at(44.2)} style={{ left: 140, top: 96 }} />

      {/* PDF（实拍）：推近到卡片 */}
      <Panel src={assets.photoPdf} w={1400} h={(1400 * 1127) / 2186} rotY={-8} rotX={5} from="right" bare at={at(44.4)} out={at(47.4)} zoom={{ at: at(45.4), dur: 44, rect: { x: 0.26, y: 0.12, w: 0.5, h: 0.72 } }} />
      <Tag text="PDF" sub="文档" at={at(44.8)} out={at(47.2)} style={{ left: 140, top: 96 }} />

      {/* 代码编辑器（代码画） */}
      <Shot w={1320} h={640} enter={at(47.4)} leave={at(51.8)} rotY={-9} how="below" kick={at(50)}>
        <CodeEditor w={1320} h={640} file="sync.ts" lines={CODE} select={CODE_SELECT} selected={codeSel} />
        {codeBeam > 0 ? <IBeam x={cHead.x} y={cHead.y + 52} opacity={codeBeam} /> : null}
        <div style={{ position: "absolute", left: codeCard.x, top: codeCard.y + 52 + 28, transform: "translateZ(40px)" }}>
          <LookupCard at={at(50)} textAt={at(50) + 16} language="简体中文" text={CODE_TEXT} />
        </div>
      </Shot>
      <Tag text="Code editor" sub="代码编辑器" at={at(47.8)} out={at(51.6)} style={{ left: 140, top: 96 }} />

      <Keycaps
        inAt={at(34)}
        outAt={at(51.6)}
        caps={[
          { label: "右 ⌥", presses: [[at(36), at(38)], [at(42.8), at(44)], [at(49.8), at(51)]] },
          { label: "回车", presses: [[at(37), at(38)], [at(43), at(44)], [at(50), at(51)]] },
        ]}
      />

      {/* 一组实拍：网页、终端、备忘录 */}
      <AbsoluteFill style={{ opacity: 1 - 0.75 * back, filter: back > 0 ? `blur(${10 * back}px)` : undefined, transform: `scale(${1 - 0.06 * back})` }}>
        <Panel src={assets.photoWeb} bare w={1120} h={(1120 * 1020) / 2618} x={-360} y={-230} rotY={16} rotX={6} at={at(52)} out={at(62)} />
        <Panel src={assets.photoTerminal} bare w={780} h={(780 * 1423) / 2040} x={450} y={90} rotY={-16} rotX={6} at={at(52.5)} out={at(62)} />
        <Panel src={assets.photoApp} bare w={720} h={(720 * 585) / 1235} x={-420} y={270} rotY={14} rotX={4} at={at(53)} out={at(62)} />
      </AbsoluteFill>
      {/* No plug-ins. 虚实变焦落定；Any 后面那个词像滚轮一样滚过各种应用，停在 app */}
      <Line out={at(62.4)} y={-30}>
        <Focus value="No plug-ins. " at={at(56)} size={128} />
        <Focus value="Any " at={at(57.5)} size={128} />
        <Reel words={["terminal.", "browser.", "PDF.", "editor.", "chat.", "app."]} at={at(57.6)} hold={6} size={128} land={COLOR.cinnabar} />
      </Line>
      <Line out={at(62.4)} y={90}>
        <Sub text="无需插件，不挑应用" at={at(59)} size={38} />
      </Line>
    </AbsoluteFill>
  );
};
