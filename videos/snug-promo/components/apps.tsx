import { Img, staticFile } from "remotion";
import { assets } from "../assets.gen";
import { MONO, SF } from "../theme";
import { Indicator, MENU_H, MenuBar, MH, MW, TitleBar } from "./mac";
import { Terminal, type Line, type Sel } from "./terminal";

// 放上 Snug 手机屏的各个 App 窗口（Mac 点，540×950）：菜单栏 + 标题栏 + 内容 + 底部横条。
// 内容照各 App 真实的样子画（Ghostty 浅色主题里的 Claude Code、ChatGPT 桌面版、Safari 起始页和 GitHub 仓库页）。

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
/** 窗口内容区的顶（Mac 点），算字和手指的位置用 */
export const BODY_Y = BODY_TOP;
export const GhosttyApp: React.FC<{
  lines: readonly Line[];
  title?: string;
  size?: number;
  scroll?: number;
  sel?: readonly Sel[];
  selRows?: readonly [number, number];
  cursor?: boolean;
  anchor?: "top" | "bottom";
  indicatorPress?: number;
  children?: React.ReactNode;
}> = ({ lines, title = "✳ 项目目录结构", size = 16, scroll = 0, sel, selRows, cursor, anchor = "bottom", indicatorPress, children }) => (
  <Frame app="Ghostty" title={title} folder={title.startsWith(".")} indicatorPress={indicatorPress}>
    <Terminal lines={lines} size={size} width={MW} height={BODY_H} scroll={scroll} sel={sel} selRows={selRows} cursor={cursor} anchor={anchor} />
    {children}
  </Frame>
);

/** 打字机：只留前 n 个字 */
const typeOut = (text: string, n: number) => [...text].slice(0, Math.max(0, n)).join("");
const Caret: React.FC<{ h: number; color?: string }> = ({ h, color = "#0d0d0d" }) => <span style={{ display: "inline-block", width: 2, height: h, background: color, verticalAlign: "middle", marginLeft: 1 }} />;

/**
 * ChatGPT 桌面版（浅色）：窄窗口里侧栏收起，顶上一行模型名。没发消息时中间一句问候、下面输入框；
 * 发出去以后右边一个浅灰气泡，下面是回复（正文 + 代码块），输入框沉到底部。
 */
const GPT_INTRO = "Here's a pattern for tags like v2.0.0:";
const GPT_CODE = "^v(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$";
const GPT_OUTRO = "It rejects leading zeros such as v01.2.3. For pre-releases like v2.1.0-beta.1, add (-[0-9A-Za-z.-]+)? before the $.";
export const GPT_LEN = [...GPT_INTRO].length + [...GPT_CODE].length + [...GPT_OUTRO].length;
/** 输入框的中心（Mac 点，相对窗口左上角）：没发消息时在中间，发了以后在底部 */
export const gptComposer = (asked: boolean) => ({ x: 270, y: asked ? MH - 28 - 62 : 520 });
export const ChatgptApp: React.FC<{ draft?: string; focused?: boolean; asked?: string | null; reveal?: number; indicatorPress?: number }> = ({
  draft = "",
  focused = false,
  asked = null,
  reveal = 0,
  indicatorPress,
}) => {
  const a = [...GPT_INTRO].length;
  const c = [...GPT_CODE].length;
  const composer = (
    <div style={{ position: "absolute", left: 18, right: 18, top: asked ? undefined : 520 - BODY_TOP - 40, bottom: asked ? 14 : undefined, height: 84, borderRadius: 26, background: "#fff", border: `1px solid ${focused ? "#c9c9c9" : "#e3e3e3"}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "14px 18px", fontSize: 17, color: draft ? "#0d0d0d" : "#9b9b9b" }}>
      {draft || (focused ? "" : "Ask anything")}
      {focused ? <Caret h={20} color="#0d0d0d" /> : null}
      {!draft && focused ? <span style={{ color: "#9b9b9b" }}>Ask anything</span> : null}
      <div style={{ position: "absolute", left: 16, bottom: 10, fontSize: 22, color: "#5d5d5d" }}>+</div>
      <div style={{ position: "absolute", right: 12, bottom: 9, width: 34, height: 34, borderRadius: 17, background: draft ? "#0d0d0d" : "#e5e5e5", color: "#fff", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</div>
    </div>
  );
  return (
    <Frame app="ChatGPT" title="ChatGPT" folder={false} menus={["File", "Edit", "View", "Window"]} indicatorPress={indicatorPress}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SF }}>
        <div style={{ position: "absolute", left: 18, top: 12, fontSize: 18, fontWeight: 600, color: "#0d0d0d" }}>
          ChatGPT <span style={{ color: "#8f8f8f", fontWeight: 400 }}>⌄</span>
        </div>
        {asked === null ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 360 - BODY_TOP, textAlign: "center", fontSize: 27, fontWeight: 500, color: "#0d0d0d" }}>What can I help with?</div>
        ) : (
          <div style={{ position: "absolute", left: 18, right: 18, top: 60 }}>
            <div style={{ marginLeft: "auto", width: "fit-content", maxWidth: 360, background: "#f4f4f4", color: "#0d0d0d", borderRadius: 20, padding: "11px 18px", fontSize: 17, lineHeight: 1.5 }}>{asked}</div>
            <div style={{ marginTop: 22, fontSize: 17, lineHeight: 1.65, color: "#0d0d0d" }}>
              {typeOut(GPT_INTRO, reveal)}
              {reveal > a ? (
                <div style={{ margin: "12px 0", borderRadius: 14, background: "#f9f9f9", border: "1px solid #ececec", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", fontSize: 13.5, color: "#5d5d5d", borderBottom: "1px solid #ececec" }}>
                    <span>regex</span>
                    <span>⧉ Copy</span>
                  </div>
                  <div style={{ padding: "12px 14px", fontFamily: MONO, fontSize: 14.5, color: "#c5221f", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{typeOut(GPT_CODE, reveal - a)}</div>
                </div>
              ) : null}
              {reveal > a + c ? typeOut(GPT_OUTRO, reveal - a - c) : null}
              {reveal > 0 && reveal < GPT_LEN ? <span style={{ display: "inline-block", width: 11, height: 11, borderRadius: 6, background: "#0d0d0d", marginLeft: 5, verticalAlign: "middle" }} /> : null}
            </div>
          </div>
        )}
        {composer}
      </div>
    </Frame>
  );
};

// GitHub 的标志（Octicons mark-github，MIT 许可，路径照原样）
const GITHUB_MARK =
  "M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256c0-1.123.404-2.336 1.078-3.144c-.292-.741-.247-2.314.09-2.965c.898-.112 2.111.36 2.83 1.01c.853-.269 1.752-.404 2.853-.404c1.1 0 1.999.135 2.807.382c.696-.629 1.932-1.1 2.83-.988c.315.606.36 2.179.067 2.942c.72.854 1.101 2 1.101 3.167c0 2.763-2.089 4.852-5.098 5.234c.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786c4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1C5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669c.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313c-.247-.607-.517-.966-1.034-1.033c-.27-.023-.359-.135-.359-.27c0-.27.45-.471.898-.471c.652 0 1.213.404 1.797 1.235c.45.651.921.943 1.483.943c.561 0 .92-.202 1.437-.719c.382-.381.674-.718.944-.943";
const GithubMark: React.FC<{ size: number; color?: string }> = ({ size, color = "#1f2328" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d={GITHUB_MARK} fill={color} />
  </svg>
);

/**
 * Safari（浅色，紧凑工具栏）：红黄绿灯、侧栏、前进后退、地址栏、分享、新标签页、标签页总览。
 * 地址栏居中显示域名（起始页是灰色提示字），载入时底边一道蓝色进度。
 * 页面：起始页（个人收藏）或 Snug 的 GitHub 仓库页（窄屏排版）。
 */
const TOOL_H = 52;
const FIELD = { x: 168, w: 272, h: 34 };
const ToolGlyph: React.FC<{ x: number; d: string; w?: number }> = ({ x, d, w = 20 }) => (
  <svg style={{ position: "absolute", left: x - w / 2, top: TOOL_H / 2 - 10 }} width={w} height={20} viewBox={`0 0 ${w} 20`}>
    <path d={d} fill="none" stroke="#6e6e73" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const SafariApp: React.FC<{ page: "start" | "repo"; load?: number; scroll?: number; indicatorPress?: number; tilePress?: number }> = ({
  page,
  load = 0,
  scroll = 0,
  indicatorPress = 0,
  tilePress = 0,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: MW, height: MH, background: "#fff", overflow: "hidden", fontFamily: SF }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: MENU_H + TOOL_H, bottom: 28, overflow: "hidden" }}>
      {page === "start" ? <StartPage press={tilePress} /> : <RepoPage scroll={scroll} />}
    </div>
    {/* 工具栏 */}
    <div style={{ position: "absolute", left: 0, top: MENU_H, width: MW, height: TOOL_H, background: "#f6f6f6", borderBottom: "1px solid #dedede" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 14 + i * 20, top: TOOL_H / 2 - 6, width: 12.5, height: 12.5, borderRadius: "50%", background: c, boxShadow: "inset 0 0 0 0.6px rgba(0,0,0,0.18)" }} />
      ))}
      <ToolGlyph x={92} d="M2 3.5h16v13H2zM7 3.5v13" />
      <ToolGlyph x={124} d="M12 4 6 10l6 6" />
      <ToolGlyph x={148} d="M8 4l6 6-6 6" />
      <div
        style={{
          position: "absolute",
          left: FIELD.x,
          top: (TOOL_H - FIELD.h) / 2,
          width: FIELD.w,
          height: FIELD.h,
          borderRadius: 10,
          background: "#e8e8ea",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 12px",
          fontSize: 15,
          color: "#1d1d1f",
          whiteSpace: "nowrap",
        }}
      >
        {page === "repo" ? (
          "github.com"
        ) : (
          <span style={{ color: "#8e8e93" }}>Search or enter website name</span>
        )}
        {load > 0 && load < 1 ? <div style={{ position: "absolute", left: 0, bottom: 0, width: `${load * 100}%`, height: 2.5, background: "#0a84ff" }} /> : null}
      </div>
      <ToolGlyph x={466} d="M10 2v11M6 6l4-4 4 4M4 9v8h12V9" />
      <ToolGlyph x={494} d="M10 4v12M4 10h12" />
      <ToolGlyph x={522} w={20} d="M3 6h11v11H3zM6 3h11v11" />
    </div>
    <MenuBar app="Safari" menus={["File", "Edit", "View", "History"]} />
    <Indicator press={indicatorPress} />
  </div>
);

/** 起始页「个人收藏」第一个（Snug 仓库的书签）的中心（Mac 点，相对窗口左上角） */
export const SAFARI_TILE = { x: 40 + 41, y: MENU_H + TOOL_H + 56 + 24 + 18 + 36 };
/** Safari 起始页：「个人收藏」一排站点，没有站点图标的用首字母方块（Safari 自己就是这么显示的） */
const StartPage: React.FC<{ press?: number }> = ({ press = 0 }) => (
  <div style={{ position: "absolute", inset: 0, background: "#f2f2f4", padding: "56px 40px" }}>
    <div style={{ fontSize: 20, fontWeight: 700, color: "#1d1d1f", lineHeight: "24px" }}>Favorites</div>
    <div style={{ marginTop: 18, display: "flex", gap: 26 }}>
      {[
        { name: "Snug", node: <GithubMark size={40} color="#fff" />, bg: "#1f2328" },
        { name: "Apple", node: <Img src={staticFile(assets.appleLogo)} style={{ width: 34, height: 34, filter: "invert(1)" }} />, bg: "#e8e8ed" },
        { name: "Swift", node: <span style={{ fontSize: 34, fontWeight: 700, color: "#fff" }}>S</span>, bg: "#f05138" },
        { name: "Hacker News", node: <span style={{ fontSize: 34, fontWeight: 700, color: "#fff" }}>Y</span>, bg: "#ff6600" },
      ].map((t) => (
        <div key={t.name} style={{ width: 82, textAlign: "center", transform: t.name === "Snug" ? `scale(${1 - 0.08 * press})` : undefined }}>
          <div style={{ width: 72, height: 72, margin: "0 auto", borderRadius: 16, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>{t.node}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#3a3a3c", whiteSpace: "nowrap" }}>{t.name}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 44, fontSize: 20, fontWeight: 700, color: "#1d1d1f" }}>Privacy Report</div>
    <div style={{ marginTop: 14, height: 66, borderRadius: 14, background: "#fff", padding: "0 20px", display: "flex", alignItems: "center", fontSize: 15, color: "#3a3a3c", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      In the last seven days, Safari has prevented 41 trackers from profiling you.
    </div>
  </div>
);

/** Safari 里打开的 Snug 仓库页（窄屏下 GitHub 的排版，文字照仓库 README） */
const RepoPage: React.FC<{ scroll: number }> = ({ scroll }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, background: "#fff" }}>
    <div style={{ height: 56, background: "#f6f8fa", borderBottom: "1px solid #d1d9e0", display: "flex", alignItems: "center", gap: 16, padding: "0 18px" }}>
      <svg width="22" height="22" viewBox="0 0 22 22">
        <path d="M3 6h16M3 11h16M3 16h16" stroke="#59636e" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <GithubMark size={32} />
      <span style={{ fontSize: 15, fontWeight: 600, color: "#1f2328" }}>zephyr4123 / snug</span>
    </div>
    <div style={{ padding: "14px 20px", borderBottom: "1px solid #d8dee4" }}>
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
    <div style={{ margin: "24px 20px 0", fontSize: 22, fontWeight: 700, color: "#1f2328", borderBottom: "1px solid #d8dee4", paddingBottom: 8 }}>📥 下载</div>
    <div style={{ margin: "12px 20px", fontSize: 15.5, color: "#1f2328", lineHeight: 1.65 }}>
      <b>Snug for macOS</b>
      <br />
      一个安装包同时支持 Apple 芯片与 Intel，适用于 macOS 14 及更新版本
      <br />
      已签名并通过 Apple 公证，下载后拖入「应用程序」即可
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
    <div style={{ margin: "22px 20px 0", fontSize: 18, fontWeight: 700, color: "#1f2328" }}>手势：为触屏重新设计</div>
    <div style={{ margin: "8px 20px", fontSize: 15, color: "#1f2328", lineHeight: 1.7 }}>
      {[
        ["手机上的操作", "UU远程 原版", "Snug 手机屏"],
        ["单指滑动", "鼠标拖拽，容易误选文字", "页面滚动，松手带惯性"],
        ["长按后拖动", "鼠标拖拽", "拖选文字"],
        ["长按松开", "普通点击", "调出右键菜单"],
      ].map(([k, a, z], i) => (
        <div key={k} style={{ display: "flex", borderBottom: "1px solid #d8dee4", padding: "8px 0", fontWeight: i === 0 ? 700 : undefined }}>
          <b style={{ width: 110 }}>{k}</b>
          <span style={{ width: 180, color: i === 0 ? "#1f2328" : "#59636e" }}>{a}</span>
          <span>{z}</span>
        </div>
      ))}
    </div>
    <div style={{ margin: "26px 20px 0", fontSize: 22, fontWeight: 700, color: "#1f2328", borderBottom: "1px solid #d8dee4", paddingBottom: 8 }}>📦 安装</div>
    <div style={{ margin: "12px 20px", fontSize: 15.5, color: "#1f2328", lineHeight: 1.9 }}>
      1. 从「下载」一节获取安装包（中国大陆推荐国内源）
      <br />
      2. 将 Snug 拖入「应用程序」并打开
      <br />
      3. 按欢迎页提示授予辅助功能权限
      <br />
      完成后 Snug 常驻菜单栏，此后无需任何操作。
    </div>
    <div style={{ margin: "26px 20px 0", fontSize: 22, fontWeight: 700, color: "#1f2328", borderBottom: "1px solid #d8dee4", paddingBottom: 8 }}>🔒 隔离与还原</div>
    <div style={{ margin: "12px 20px 40px", fontSize: 15.5, color: "#1f2328", lineHeight: 1.9 }}>
      • 只改动手机屏：不更改主显示器，不关闭任何屏幕，不触碰其他窗口
      <br />• 先记录，后改动：窗口的原始位置与字号先行记录
      <br />• 不联网：不连接任何服务器，不收集任何数据
    </div>
  </div>
);
