import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { Backdrop, Head, Line, Sub, sec } from "../components/kit";
import { LookupCard, Selectable } from "../components/lookup";
import { activeWindow, Bar, WindowStack } from "../components/window";
import { b, LAND, MONO, SANS, SERIF, TONE, UI } from "../theme";

// 划词翻译：讲"哪里都能划"。四个常用的地方轮流上来——终端里的 Claude Code、技术文档、PDF 论文、游戏模组页，
// 每个都是拖选一段英文、松手弹出译文卡。窗口是照真样子画的，文字是为片子写的。每八拍换一个，第三个落在音乐重新进来那一拍。
// 左边"终端 文档 论文 模组"跟着亮起当前那一个。
const T = TONE.paper;
const at = (s: number) => LAND + sec(s);
const START = [0, 8, 16, 24].map((n) => LAND + b(92 + n) - b(92));
const PLACES = ["终端", "文档", "论文", "模组"];

// 每个窗口自己的时间（u 是它铺满后的帧数）：光标出现 → 拖选 → 松手弹卡 → 译文换上
const DRAG = [sec(0.45), sec(1.25)] as const;
const CARD_AT = sec(1.4);
const TEXT_AT = sec(1.85);
const drag = (u: number) => interpolate(u, DRAG, [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
const beam = (u: number) => interpolate(u, [sec(0.15), sec(0.3), sec(2.1), sec(2.3)], [0, 1, 1, 0], clamp);
// 选中后镜头往选区推一点
const zoom = (u: number) => 1 + 0.05 * interpolate(u, [sec(0.2), sec(2.6)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

type WinProps = { u: number; k: number };

export const Lookup: React.FC = () => {
  const frame = useCurrentFrame();
  const active = activeWindow(frame, START);
  const WINDOWS = [Terminal, Docs, Paper, ModPage];
  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Head at={at(-0.35)} text="划词即译" color={T.ink} style={{ position: "absolute", left: 118, top: 360 }} />
      <Line at={at(0.3)} style={{ position: "absolute", left: 124, top: 524 }}>
        <div style={{ display: "flex", gap: 30, fontFamily: SANS, fontWeight: 500, fontSize: 34, letterSpacing: "0.06em" }}>
          {PLACES.map((p, i) => (
            <span key={p} style={{ color: i === active ? T.accent : T.ink2, opacity: i === active ? 1 : 0.5 }}>
              {p}
            </span>
          ))}
        </div>
      </Line>
      <Sub at={at(0.5)} text="不装插件 任意窗口 选中即译" color={T.ink2} style={{ position: "absolute", left: 124, top: 590 }} />
      <WindowStack starts={START} bg="#1c1e22" windows={WINDOWS.map((Win, k) => <Win key={k} u={frame - START[k]} k={k} />)} />
    </AbsoluteFill>
  );
};

// ———— 四个窗口 ————
// 每个窗口先画内容（会跟着镜头推），再把标题栏盖在最上面。

/** 选中后镜头往选区推一点：transform-origin 放在选区附近 */
const Zoom: React.FC<{ u: number; origin: string; children: React.ReactNode }> = ({ u, origin, children }) => (
  <AbsoluteFill style={{ transformOrigin: origin, transform: `scale(${zoom(u)})` }}>{children}</AbsoluteFill>
);

const TERM_TEXT = "The build fails because vite.config.ts imports a plugin that isn't installed. Add it to devDependencies, then run the build again.";

// 终端：Claude Code 的一段对话，内容贴着底往上长（终端就是这样），选的是它的回答
const Terminal: React.FC<WinProps> = ({ u, k }) => {
  const dim = "#7d828c";
  return (
    <AbsoluteFill style={{ background: "#1c1e22" }}>
      <Zoom u={u} origin="35% 70%">
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 26px", fontFamily: `${MONO}, ${SANS}`, fontSize: 23, lineHeight: 1.6, color: "#d9dbe0" }}>
          <div style={{ border: "1.5px solid oklch(0.68 0.09 55)", borderRadius: 10, padding: "10px 20px", width: 620 }}>
            <div>
              <span style={{ color: "oklch(0.74 0.11 55)" }}>✻</span> Welcome to Claude Code
            </div>
            <div style={{ color: dim, fontSize: 19 }}>cwd: ~/code/site</div>
          </div>
          <div style={{ marginTop: 22, color: "#aeb2ba" }}>&gt; 跑一下构建</div>
          <Dot color="#5fb878">
            Bash(<span style={{ fontWeight: 700 }}>npm run build</span>)
          </Dot>
          <div style={{ color: "oklch(0.7 0.12 25)", paddingLeft: "2ch" }}>└ Error: Cannot find module &quot;vite-plugin-svgr&quot;</div>
          <div style={{ marginTop: 18, color: "#aeb2ba" }}>&gt; 构建为什么失败了</div>
          <Dot color="#5fb878">
            Read(<span style={{ fontWeight: 700 }}>vite.config.ts</span>)
          </Dot>
          <div style={{ color: dim, paddingLeft: "2ch" }}>└ Read 42 lines</div>
          <Dot color="#e8e9ec">
            <Selectable text={TERM_TEXT} from={0} to={TERM_TEXT.length} p={drag(u)} beam={beam(u)} selection="oklch(0.5 0.08 255 / 0.85)" beamDark={false} />
          </Dot>
          <div style={{ marginTop: 26, border: "1.5px solid #4a4d55", borderRadius: 10, padding: "6px 18px", display: "flex", gap: 12 }}>
            <span style={{ color: dim }}>&gt;</span>
            <i style={{ width: 12, height: 26, marginTop: 5, background: "#d9dbe0", opacity: Math.floor(u / 32) % 2 === 0 ? 0.85 : 0 }} />
          </div>
          <div style={{ color: dim, fontSize: 17, marginTop: 4, paddingLeft: 4 }}>? for shortcuts</div>
        </div>
        <LookupCard at={START[k] + CARD_AT} textAt={START[k] + TEXT_AT} text="构建失败是因为 vite.config.ts 引入了一个没有安装的插件。把它加进 devDependencies，再构建一次。" style={{ left: 470, top: 330 }} />
      </Zoom>
      <Bar bg="#26282d" line="#111">
        <div style={{ flex: 1, textAlign: "center", fontFamily: UI, fontSize: 15, color: "#a3a7af", marginRight: 80 }}>claude — ~/code/site</div>
      </Bar>
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ display: "flex", marginTop: 10 }}>
    <span style={{ flex: "0 0 2ch", paddingTop: "0.5em" }}>
      <i style={{ display: "block", width: "0.55em", height: "0.55em", borderRadius: "50%", background: color }} />
    </span>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const DOCS_TEXT = "Responses from fetch are cached for five minutes by default. To opt out for a single request, set revalidate to 0 in its options.";
const DOCS_NAV = ["Getting started", "Routing", "Data fetching", "Caching", "Deployment", "Edge runtime", "Testing"];

// 技术文档：浏览器里一页开发文档，选的是正文第一段
const Docs: React.FC<WinProps> = ({ u, k }) => (
  <AbsoluteFill style={{ background: "#fff", fontFamily: UI }}>
    <Zoom u={u} origin="0% 30%">
      <div style={{ position: "absolute", top: 54, bottom: 0, left: 0, width: 230, background: "#f7f8fa", borderRight: "1px solid #eceef1", padding: "34px 26px", fontSize: 17, color: "#5b616b", lineHeight: 2.3 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#9aa0a8", letterSpacing: "0.04em" }}>Guide</div>
        {DOCS_NAV.map((n) => (
          <div key={n} style={{ color: n === "Caching" ? "#111827" : undefined, fontWeight: n === "Caching" ? 600 : 400, borderLeft: `2px solid ${n === "Caching" ? "#2d5bb0" : "transparent"}`, paddingLeft: 12, marginLeft: -14 }}>
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 54, left: 230, right: 0, padding: "40px 70px", color: "#374151" }}>
        <div style={{ fontSize: 15, color: "#8a9099" }}>Guide &nbsp;/&nbsp; Caching</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginTop: 12 }}>Caching</div>
        <p style={{ fontSize: 23, lineHeight: 1.7, marginTop: 20, maxWidth: 740 }}>
          <Selectable text={DOCS_TEXT} from={0} to={DOCS_TEXT.length} p={drag(u)} beam={beam(u)} selection="#b3d7ff" />
        </p>
        <pre style={{ fontFamily: MONO, fontSize: 18, background: "#f3f4f6", borderRadius: 10, padding: "18px 24px", marginTop: 24, color: "#1f2937", maxWidth: 740 }}>
          <span style={{ color: "#7c3aed" }}>await</span> fetch(url, {"{"} next: {"{"} revalidate: <span style={{ color: "#c2410c" }}>0</span> {"}"} {"}"})
        </pre>
        <p style={{ fontSize: 21, lineHeight: 1.7, marginTop: 24, maxWidth: 740 }}>Cached data is shared across requests and stays valid until it expires or the route is deployed again.</p>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginTop: 30 }}>Revalidating on demand</div>
        <p style={{ fontSize: 21, lineHeight: 1.7, marginTop: 12, maxWidth: 740 }}>Call revalidatePath after a mutation to refresh a route without waiting for the cache to expire.</p>
      </div>
      <LookupCard at={START[k] + CARD_AT} textAt={START[k] + TEXT_AT} text="fetch 返回的响应默认缓存五分钟。如需让单个请求不走缓存，在它的选项里把 revalidate 设为 0。" style={{ left: 470, top: 330 }} />
    </Zoom>
    <Bar bg="#eceef1" line="#dcdfe4">
      <span style={{ color: "#9aa0a8", fontSize: 20, letterSpacing: 8 }}>‹ ›</span>
      <div style={{ flex: 1, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, color: "#5b616b", marginRight: 90 }}>
        <svg width={12} height={14} viewBox="0 0 12 14" fill="#8a9099">
          <rect x="1" y="6" width="10" height="8" rx="1.5" />
          <path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="#8a9099" strokeWidth="1.6" />
        </svg>
        docs.example.com/guide/caching
      </div>
    </Bar>
  </AbsoluteFill>
);

const ABSTRACT = [
  "Transformers struggle with long documents because the cost of attention grows quadratically with sequence length. ",
  "We show that a simple block-sparse pattern retains 98% of the accuracy of dense attention while using one tenth of the memory.",
  " The pattern needs no custom kernels and drops into existing models.",
];
const AUTHORS = ["Lin Zhou", "Mara Ellis", "Kenji Sato"];

// PDF 论文：系统自带的预览里打开的一篇论文，选的是摘要中间那句结论
const Paper: React.FC<WinProps> = ({ u, k }) => {
  const text = ABSTRACT.join("");
  const from = ABSTRACT[0].length;
  return (
    <AbsoluteFill style={{ background: "#d9dade" }}>
      <Zoom u={u} origin="50% 40%">
        <div style={{ position: "absolute", top: 90, left: 125, width: 860, height: 900, background: "#fff", boxShadow: "0 2px 10px oklch(0 0 0 / 0.12)", padding: "62px 84px", fontFamily: SERIF, color: "#1a1a1a" }}>
          <div style={{ fontSize: 30, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>Sparse Attention for Long Documents</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, fontSize: 17, marginTop: 16, color: "#333" }}>
            {AUTHORS.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
          <div style={{ fontSize: 15, textAlign: "center", color: "#666", marginTop: 4 }}>Northbridge University</div>
          <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginTop: 34 }}>Abstract</div>
          <p style={{ fontSize: 19, lineHeight: 1.6, textAlign: "justify", margin: "12px 34px 0" }}>
            <Selectable text={text} from={from} to={from + ABSTRACT[1].length} p={drag(u)} beam={beam(u)} selection="#b3d7ff" />
          </p>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 34 }}>1 &nbsp; Introduction</div>
          <p style={{ fontSize: 19, lineHeight: 1.6, textAlign: "justify", marginTop: 12 }}>
            Long inputs appear in legal review, scientific reading and code understanding. Dense attention compares every token with every other token, so doubling the input quadruples the work.
          </p>
        </div>
        <LookupCard at={START[k] + CARD_AT} textAt={START[k] + TEXT_AT} text="研究表明，一种简单的块稀疏模式能保留稠密注意力 98% 的准确率，内存只用到十分之一。" style={{ left: 330, top: 500 }} />
      </Zoom>
      <Bar bg="#ececef" line="#cfd0d4">
        <div style={{ fontFamily: UI, marginLeft: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#2b2d31" }}>sparse-attention.pdf</div>
          <div style={{ fontSize: 12, color: "#8a8d93" }}>第 1 页，共 12 页</div>
        </div>
      </Bar>
    </AbsoluteFill>
  );
};

const MOD_TEXT = "Replaces the vanilla night sky with a hand-painted star field and a brighter Milky Way. Compatible with most weather mods. Load it after any lighting overhaul.";
const STARS = Array.from({ length: 90 }, (_, i) => ({ x: random(`sx${i}`) * 100, y: random(`sy${i}`) * 72, r: random(`sr${i}`) < 0.12 ? 2.2 : random(`sr${i}`) < 0.45 ? 1.4 : 1 }));

// 游戏模组页：深色的模组站详情页，选的是模组说明
const ModPage: React.FC<WinProps> = ({ u, k }) => (
  <AbsoluteFill style={{ background: "#121418", fontFamily: UI, color: "#c9cdd3" }}>
    <Zoom u={u} origin="30% 100%">
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, height: 200, overflow: "hidden", background: "linear-gradient(180deg, #0b1430 0%, #1b2a55 60%, #3a3f6e 100%)" }}>
        {STARS.map((s, i) => (
          <i key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "#fff", opacity: 0.45 + 0.55 * Math.sin(i * 1.7 + u / 40) ** 2 }} />
        ))}
        <svg viewBox="0 0 1110 120" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, width: "100%", height: 110 }}>
          <path d="M0 120 L0 70 L120 40 L230 78 L360 22 L470 66 L590 34 L720 80 L860 30 L980 70 L1110 48 L1110 120 Z" fill="#0d1120" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 278, left: 56, right: 56 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#f2f3f5", letterSpacing: "-0.01em" }}>Starlit Skies Overhaul</div>
        <div style={{ fontSize: 17, color: "#8f959e", marginTop: 4 }}>by aurora_modder</div>
        <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 15 }}>
          {["Endorsements 12.4k", "Downloads 380k", "Version 2.3"].map((c) => (
            <span key={c} style={{ padding: "6px 12px", borderRadius: 6, background: "#22252b", color: "#b4b9c1" }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 30, marginTop: 22, fontSize: 17, borderBottom: "1px solid #2a2d33" }}>
          {["Description", "Files", "Images", "Posts", "Bugs"].map((t) => (
            <span key={t} style={{ paddingBottom: 12, color: t === "Description" ? "#f2f3f5" : "#8f959e", borderBottom: `2px solid ${t === "Description" ? "oklch(0.72 0.11 62)" : "transparent"}` }}>
              {t}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 22, lineHeight: 1.7, marginTop: 20, maxWidth: 940 }}>
          <Selectable text={MOD_TEXT} from={0} to={MOD_TEXT.length} p={drag(u)} beam={beam(u)} selection="oklch(0.5 0.08 255 / 0.85)" beamDark={false} />
        </p>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#e6e8eb", marginTop: 22 }}>Requirements</div>
        <div style={{ fontSize: 19, lineHeight: 1.8, marginTop: 6, color: "#a9aeb6" }}>
          <div>· Lighting overhaul 1.4 or later</div>
          <div>· Latest script extender</div>
        </div>
      </div>
      <LookupCard at={START[k] + CARD_AT} textAt={START[k] + TEXT_AT} text="把原版夜空换成手绘星空，银河也更明亮。兼容大多数天气模组，请放在光照大修模组之后加载。" style={{ left: 520, top: 548 }} />
    </Zoom>
    <Bar bg="#1d2025" line="#0b0c0e">
      <div style={{ display: "flex", gap: 26, fontSize: 16, color: "#9aa0a8", marginLeft: 18 }}>
        <span>Games</span>
        <span style={{ color: "#e6e8eb" }}>Mods</span>
        <span>Collections</span>
        <span>Media</span>
      </div>
      <div style={{ marginLeft: "auto", width: 260, height: 34, borderRadius: 8, background: "#2a2d33", fontSize: 15, color: "#7d828c", display: "flex", alignItems: "center", padding: "0 14px" }}>Search mods</div>
    </Bar>
  </AbsoluteFill>
);
