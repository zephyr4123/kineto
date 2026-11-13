import { Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { SF } from "../theme";
import { Indicator, MENU_H, MenuBar, MH, MW, TitleBar } from "./mac";
import { Terminal, type Line, type Sel } from "./terminal";

// 放上 Snug 手机屏的各个 App 窗口（Mac 点，540×950）：菜单栏 + 标题栏 + 内容 + 底部横条。
// 内容照各 App 真实的样子画（Ghostty 浅色主题里的 Claude Code、VS Code 深色主题、Safari 里的 GitHub、ChatGPT 的 Codex、Claude 桌面版）。

const BODY_TOP = MENU_H + 32;
const BODY_H = MH - BODY_TOP - 28;

const Frame: React.FC<{ app: string; title: string; dark?: boolean; folder?: boolean; menus?: readonly string[]; children: React.ReactNode; indicatorPress?: number }> = ({
  app,
  title,
  dark,
  folder,
  menus,
  children,
  indicatorPress = 0,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: MW, height: MH, background: dark ? "#1e1e1e" : "#fff", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: BODY_TOP, width: MW, height: BODY_H, overflow: "hidden" }}>{children}</div>
    <TitleBar title={title} dark={dark} folder={folder} />
    <MenuBar app={app} menus={menus} />
    <Indicator press={indicatorPress} />
  </div>
);

export const GHOSTTY_BODY = BODY_H;
export const GhosttyApp: React.FC<{
  lines: readonly Line[];
  title?: string;
  size?: number;
  scroll?: number;
  sel?: readonly Sel[];
  cursor?: boolean;
  anchor?: "top" | "bottom";
  indicatorPress?: number;
  children?: React.ReactNode;
}> = ({ lines, title = "✳ 项目目录结构", size = 16, scroll = 0, sel, cursor, anchor = "bottom", indicatorPress, children }) => (
  <Frame app="Ghostty" title={title} folder={title.startsWith(".")} indicatorPress={indicatorPress}>
    <Terminal lines={lines} size={size} width={MW} height={BODY_H} scroll={scroll} sel={sel} cursor={cursor} anchor={anchor} />
    {children}
  </Frame>
);

/** 打字机：一段文字从 from 帧起按字出现（聊天类 App 的回复用） */
const typeOut = (text: string, n: number) => [...text].slice(0, Math.max(0, n)).join("");

/** Safari 里打开的 Snug 仓库页（窄屏下 GitHub 的排版） */
export const SafariApp: React.FC<{ scroll?: number }> = ({ scroll = 0 }) => (
  <Frame app="Safari" title="zephyr4123/snug" folder={false} menus={["File", "Edit", "View", "History"]}>
    <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, background: "#fff", fontFamily: SF }}>
      <div style={{ height: 44, margin: "8px 14px", borderRadius: 10, background: "#eef0f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#333" }}>
        🔒 github.com/zephyr4123/snug
      </div>
      <div style={{ padding: "10px 20px", borderBottom: "1px solid #d8dee4" }}>
        <div style={{ fontSize: 21, color: "#0969da" }}>
          zephyr4123 / <b>snug</b> <span style={{ marginLeft: 8, fontSize: 13, color: "#59636e", border: "1px solid #d1d9e0", borderRadius: 12, padding: "1px 8px" }}>Public</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 15, color: "#59636e" }}>为 UU远程 打造的 Mac 移动端工作区</div>
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          {["☆ Star", "⑂ Fork", "◉ Watch"].map((t) => (
            <div key={t} style={{ padding: "5px 12px", border: "1px solid #d1d9e0", borderRadius: 6, background: "#f6f8fa", fontSize: 14, fontWeight: 600, color: "#25292e" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "22px 20px 0", textAlign: "center" }}>
        <Img src={staticFile(assets.snugIcon)} style={{ width: 96, height: 96 }} />
        <div style={{ fontSize: 34, fontWeight: 700, color: "#1f2328", marginTop: 6 }}>Snug</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#1f2328", marginTop: 10 }}>让 Mac 在手机上拥有原生级的操作体验</div>
        <div style={{ fontSize: 15, color: "#59636e", marginTop: 10, lineHeight: 1.6 }}>
          为 UU远程 打造的移动端工作区
          <br />
          独立竖屏 · 窗口铺满 · 字号放大 · iOS 手势
        </div>
      </div>
      <div style={{ margin: "24px 20px 0", fontSize: 22, fontWeight: 700, color: "#1f2328", borderBottom: "1px solid #d8dee4", paddingBottom: 8 }}>✨ 核心体验</div>
      <div style={{ margin: "12px 20px", fontSize: 15.5, color: "#1f2328", lineHeight: 1.65 }}>
        UU远程 将整块桌面等比压缩进手机屏幕；Snug 为手机增加一块专属竖屏，让 Mac 的窗口以手机的尺度呈现。
      </div>
      <div style={{ margin: "0 20px", fontSize: 15, color: "#1f2328", lineHeight: 1.7 }}>
        {[
          ["画面", "整块桌面等比缩小", "专属竖屏，窗口铺满整屏"],
          ["字号", "随画面一同缩小", "终端与编辑器自动放大"],
          ["单指滑动", "识别为鼠标拖拽", "页面滚动，带惯性"],
          ["切换窗口", "在缩小的桌面中查找", "窗口列表，轻点即开"],
        ].map(([k, a, z]) => (
          <div key={k} style={{ display: "flex", borderBottom: "1px solid #d8dee4", padding: "8px 0" }}>
            <b style={{ width: 88 }}>{k}</b>
            <span style={{ width: 190, color: "#59636e" }}>{a}</span>
            <span>{z}</span>
          </div>
        ))}
      </div>
      <div style={{ margin: "26px 20px 0", fontSize: 22, fontWeight: 700, color: "#1f2328", borderBottom: "1px solid #d8dee4", paddingBottom: 8 }}>📱 与 iPhone 一致的交互</div>
      <div style={{ margin: "12px 20px", fontSize: 15.5, color: "#1f2328", lineHeight: 1.9 }}>
        • 多任务界面 → 窗口列表，汇集 Mac 上的全部窗口
        <br />• 打开 App → 选中窗口，独占整屏
        <br />• 主屏幕指示条 → 底部指示条，返回窗口列表
        <br />• 动态字体 → 字号随屏放大，按 App 分别记忆
      </div>
    </div>
  </Frame>
);

/** ChatGPT 桌面版里的 Codex：左边一列图标，右上一条用户消息，下面是回复和输入框 */
const GPT_REPLY = "找到了：Safari 限定了窗口的最小宽度，比手机屏的 540 点宽一点，所以铺不满。\n\n处理方式：\n1. 放不下时窗口靠左放置，不强行缩小\n2. 在屏上说明原因，避免看起来像出错\n3. 补了一条测试，覆盖最小宽度大于屏宽的情况\n\n改动在 Windows.swift，测试全部通过。";
export const GPT_LEN = [...GPT_REPLY].length;
export const ChatgptApp: React.FC<{ reveal?: number }> = ({ reveal = Infinity }) => (
  <Frame app="ChatGPT" title="修复窗口铺满的边界情况" folder={false} menus={["File", "Edit", "View", "Window"]}>
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SF }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 46, borderRight: "1px solid #ececec", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, paddingTop: 16 }}>
        {["⌂", "◫", "◷", "◎", "⋯"].map((t) => (
          <div key={t} style={{ fontSize: 18, color: "#777" }}>
            {t}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 46, right: 0, top: 0, bottom: 0, padding: "18px 18px" }}>
        <div style={{ marginLeft: "auto", maxWidth: 330, background: "#2f2f2f", color: "#fff", borderRadius: 18, padding: "12px 16px", fontSize: 16.5, lineHeight: 1.5 }}>
          Safari 的窗口铺不满手机屏，查一下原因，顺手修掉
        </div>
        <div style={{ marginTop: 18, fontSize: 14.5, color: "#8f8f8f" }}>{reveal > 0 ? "Worked for 1m 8s ›" : "Thinking…"}</div>
        <div style={{ marginTop: 10, fontSize: 16.5, lineHeight: 1.65, color: "#0d0d0d", whiteSpace: "pre-wrap" }}>
          {typeOut(GPT_REPLY, reveal)}
          {reveal < [...GPT_REPLY].length ? <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5, background: "#0d0d0d", marginLeft: 4 }} /> : null}
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 14, bottom: 14, height: 92, borderRadius: 24, border: "1px solid #e3e3e3", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", padding: "12px 16px", fontSize: 15.5, color: "#9b9b9b" }}>
        接着说说要改的地方
        <div style={{ position: "absolute", left: 16, bottom: 12, fontSize: 20, color: "#555" }}>+</div>
        <div style={{ position: "absolute", right: 60, bottom: 15, fontSize: 13.5, color: "#555" }}>GPT-6 Astra · Extra High ⌄</div>
        <div style={{ position: "absolute", right: 12, bottom: 10, width: 34, height: 34, borderRadius: 17, background: "#0d0d0d", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</div>
      </div>
    </div>
  </Frame>
);

/** Claude 桌面版：米白底，用户消息在浅灰气泡里，回复是衬线字，底下输入框带橙色发送钮 */
const CLAUDE_REPLY = "几个方向：\n\n1. 让 Mac 在手机上拥有原生级的操作体验\n2. 手机上的 Mac，像 App 一样顺手\n3. 一块专属竖屏，窗口铺满，字号放大\n\n第一句最贴近产品本身，也最适合放在 README 顶部。";
export const CLAUDE_LEN = [...CLAUDE_REPLY].length;
export const ClaudeApp: React.FC<{ reveal?: number }> = ({ reveal = Infinity }) => (
  <Frame app="Claude" title="Snug 宣传文案" folder={false} menus={["File", "Edit", "View", "Window"]}>
    <div style={{ position: "absolute", inset: 0, background: "#faf9f5", fontFamily: SF }}>
      <div style={{ margin: "22px 20px 0 auto", maxWidth: 360, background: "#f0eee6", borderRadius: 16, padding: "12px 16px", fontSize: 16.5, lineHeight: 1.55, color: "#1a1915" }}>
        给 Snug 的 README 写一句开头，突出「手机上像原生一样用 Mac」
      </div>
      <div style={{ margin: "22px 22px 0", fontFamily: `"Iowan Old Style", Georgia, "Songti SC", serif`, fontSize: 18, lineHeight: 1.7, color: "#1a1915", whiteSpace: "pre-wrap" }}>
        {typeOut(CLAUDE_REPLY, reveal)}
        {reveal < [...CLAUDE_REPLY].length ? <span style={{ color: "#d97757" }}> ✻</span> : null}
      </div>
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, height: 96, borderRadius: 18, background: "#fff", border: "1px solid #e8e6dc", padding: "14px 16px", fontSize: 16, color: "#9a988f" }}>
        Reply to Claude…
        <div style={{ position: "absolute", right: 58, bottom: 16, fontSize: 13.5, color: "#5d5b54" }}>Opus 5.5 ⌄</div>
        <div style={{ position: "absolute", right: 12, bottom: 10, width: 36, height: 36, borderRadius: 10, background: "#d97757", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</div>
      </div>
    </div>
  </Frame>
);

/** Notion：一页发布清单 */
/** Notion 清单第 i 项勾选框的中心（Mac 点，相对窗口内容区左上角） */
export const notionBox = (i: number) => ({ x: 36, y: 30 + 44 + 8 + 36 + 18 + 10 + i * 46 });
export const NotionApp: React.FC<{ checked?: number }> = ({ checked = 0 }) => (
  <Frame app="Notion" title="Snug 2.0 发布清单" folder={false} menus={["File", "Edit", "View", "Window"]}>
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SF, padding: "30px 26px", color: "#37352f" }}>
      <div style={{ fontSize: 44 }}>🚀</div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>Snug 2.0 发布清单</div>
      {[
        ["签名并通过 Apple 公证", true],
        ["国内源 CDN 上传安装包", true],
        ["README 换上实机截图", true],
        ["GitHub Release 附更新说明", true],
        ["宣传片", checked >= 1],
      ].map(([t, done]) => (
        <div key={String(t)} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, fontSize: 19 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, border: done ? "none" : "1.6px solid #9b9a97", background: done ? "#2383e2" : "#fff", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{done ? "✓" : ""}</div>
          <span style={{ textDecoration: done ? "line-through" : undefined, color: done ? "#9b9a97" : "#37352f" }}>{String(t)}</span>
        </div>
      ))}
    </div>
  </Frame>
);
