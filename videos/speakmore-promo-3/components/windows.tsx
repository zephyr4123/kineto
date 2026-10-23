import { COLOR, MONO, SANS } from "../theme";

// 代码画的几扇窗口：浏览器、代码编辑器、聊天、工作区、邮件。只画样子，动作（划选到第几个字、输入框里有什么）由场景按帧交进来。
// 不画任何一家产品的标志和名字，只取各类应用通行的样子。

const SELECT = "oklch(0.62 0.13 255 / 0.35)";

/** 预先断好行的一段字，selected 是从头选中了几个字；head(n) 算选到第 n 个字时选区的头在哪（拖选时光标跟着它） */
export const SelLines: React.FC<{
  lines: readonly string[];
  selected: number;
  size: number;
  lineHeight: number;
  color: string;
  select?: string;
  font?: string;
  weight?: number;
}> = ({ lines, selected, size, lineHeight, color, select = SELECT, font = SANS, weight = 400 }) => {
  let left = selected;
  return (
    <div style={{ fontFamily: font, fontSize: size, lineHeight: `${lineHeight}px`, color, fontWeight: weight }}>
      {lines.map((line, i) => {
        const n = Math.max(0, Math.min(line.length, left));
        left -= line.length;
        return (
          <div key={`${i}-${line}`} style={{ whiteSpace: "pre" }}>
            {n > 0 ? <span style={{ background: select }}>{line.slice(0, n)}</span> : null}
            {line.slice(n)}
          </div>
        );
      })}
    </div>
  );
};

/** 选区的头：第几行、行里第几个字 → 坐标（按平均字宽估，等宽字体是准的） */
export const selHead = (lines: readonly string[], n: number, charW: number, lineHeight: number) => {
  let left = Math.max(0, n);
  for (let i = 0; i < lines.length; i++) {
    if (left <= lines[i].length || i === lines.length - 1) return { x: Math.min(left, lines[i].length) * charW, y: i * lineHeight + lineHeight / 2 };
    left -= lines[i].length;
  }
  return { x: 0, y: lineHeight / 2 };
};
export const totalChars = (lines: readonly string[]) => lines.reduce((n, l) => n + l.length, 0);

/** 窗口外框：圆角、阴影、三个小圆点和标题 */
export const Frame: React.FC<{ w: number; h: number; dark?: boolean; title?: string; bar?: React.ReactNode; children: React.ReactNode }> = ({ w, h, dark, title, bar, children }) => (
  <div
    style={{
      position: "relative",
      width: w,
      height: h,
      borderRadius: 18,
      overflow: "hidden",
      background: dark ? COLOR.term : "oklch(1 0 0)",
      boxShadow: dark
        ? "0 0 0 1px oklch(1 0 0 / 0.08), 0 50px 120px -40px oklch(0.2 0.03 260 / 0.55)"
        : "0 0 0 1px oklch(0.2 0.02 255 / 0.1), 0 50px 120px -40px oklch(0.2 0.03 260 / 0.45)",
      fontFamily: SANS,
    }}
  >
    <div
      style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 22px",
        background: dark ? COLOR.termBar : "oklch(0.965 0.004 255)",
        borderBottom: `1px solid ${dark ? "oklch(1 0 0 / 0.06)" : "oklch(0.9 0.006 255)"}`,
      }}
    >
      {["oklch(0.68 0.17 28)", "oklch(0.8 0.14 85)", "oklch(0.72 0.15 150)"].map((c) => (
        <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, flex: "none" }} />
      ))}
      {bar ?? <span style={{ flex: 1, textAlign: "center", marginRight: 72, fontSize: 18, color: dark ? COLOR.termDim : COLOR.ink2 }}>{title}</span>}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 52, bottom: 0 }}>{children}</div>
  </div>
);

/** 浏览器：地址栏里是网址 */
export const Browser: React.FC<{ w: number; h: number; url: string; children: React.ReactNode }> = ({ w, h, url, children }) => (
  <Frame
    w={w}
    h={h}
    bar={
      <div style={{ flex: 1, display: "flex", justifyContent: "center", marginRight: 60 }}>
        <div style={{ width: "62%", height: 32, borderRadius: 10, background: "oklch(1 0 0)", boxShadow: "0 0 0 1px oklch(0.88 0.006 255)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 17, color: COLOR.ink2 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {url}
        </div>
      </div>
    }
  >
    {children}
  </Frame>
);

// ---- 代码编辑器 ----

const SYNTAX = { key: "oklch(0.74 0.14 300)", fn: "oklch(0.8 0.12 230)", str: "oklch(0.8 0.13 140)", num: "oklch(0.8 0.13 60)", com: "oklch(0.62 0.03 255)", ink: "oklch(0.86 0.01 255)" };
type Token = readonly [keyof typeof SYNTAX, string];
export type CodeLine = readonly Token[];

/** 深色编辑器：左边行号，一个文件标签；select 那几行注释（从"// "之后算起）按 selected 划选 */
export const CodeEditor: React.FC<{ w: number; h: number; file: string; lines: readonly CodeLine[]; select: readonly number[]; selected: number }> = ({ w, h, file, lines, select, selected }) => {
  let left = selected;
  return (
    <Frame
      w={w}
      h={h}
      dark
      bar={
        <div style={{ display: "flex", alignItems: "flex-end", alignSelf: "stretch", marginLeft: 18 }}>
          <div style={{ padding: "0 22px", height: 40, display: "flex", alignItems: "center", gap: 8, borderRadius: "10px 10px 0 0", background: COLOR.term, color: COLOR.termBright, fontSize: 17 }}>
            <span style={{ color: "oklch(0.72 0.12 230)", fontFamily: MONO, fontWeight: 700, fontSize: 14 }}>TS</span>
            {file}
          </div>
        </div>
      }
    >
      <div style={{ padding: "26px 0", fontFamily: MONO, fontSize: 23, lineHeight: "38px" }}>
        {lines.map((tokens, i) => {
          const text = tokens.map(([, t]) => t).join("");
          let body: React.ReactNode;
          if (select.includes(i)) {
            const col = text.indexOf("// ") + 3;
            const n = Math.max(0, Math.min(text.length - col, left));
            left -= text.length - col;
            body = (
              <span style={{ color: SYNTAX.com }}>
                {text.slice(0, col)}
                <span style={{ background: "oklch(0.5 0.12 258 / 0.62)", color: COLOR.termBright }}>{text.slice(col, col + n)}</span>
                {text.slice(col + n)}
              </span>
            );
          } else {
            body = tokens.map(([kind, t], j) => (
              <span key={`${j}-${t}`} style={{ color: SYNTAX[kind] }}>
                {t}
              </span>
            ));
          }
          return (
            <div key={`${i}-${text}`} style={{ display: "flex", whiteSpace: "pre" }}>
              <span style={{ width: 70, textAlign: "right", paddingRight: 28, color: "oklch(0.45 0.01 255)" }}>{i + 1}</span>
              {body}
            </div>
          );
        })}
      </div>
    </Frame>
  );
};
/** 编辑器里一行的坐标（相对窗口内容区左上角）：行号栏 70 + 留白 28，等宽字 23px */
export const codePos = (line: number, col: number) => ({ x: 98 + col * 23 * 0.6, y: 26 + line * 38 + 19 });

// ---- 聊天 ----

export type Message = { from: "them" | "me"; lines: readonly string[]; at: number; name?: string };

const Avatar: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 46 }) => (
  <span style={{ width: size, height: size, borderRadius: size / 2, background: color, color: "oklch(1 0 0)", display: "grid", placeItems: "center", fontSize: size * 0.42, fontWeight: 600, flex: "none" }}>{name.slice(0, 1)}</span>
);

/** 一个人对一个人的聊天：头部名字，消息气泡，底部输入框。selected 是第一条对方消息被划选了几个字 */
export const Chat: React.FC<{
  w: number;
  h: number;
  frame: number;
  name: string;
  avatar: string;
  messages: readonly Message[];
  selected?: number;
  /** 被划选的是第几条消息 */
  selectIndex?: number;
  input: string;
  placeholder: string;
  caret?: boolean;
}> = ({ w, h, frame, name, avatar, messages, selected = 0, selectIndex = -1, input, placeholder, caret }) => {
  return (
    <Frame w={w} h={h} title="">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "oklch(0.975 0.004 255)" }}>
        <div style={{ height: 76, display: "flex", alignItems: "center", gap: 16, padding: "0 30px", background: "oklch(1 0 0)", borderBottom: "1px solid oklch(0.92 0.005 255)" }}>
          <Avatar name={name} color={avatar} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: COLOR.ink }}>{name}</div>
            <div style={{ fontSize: 16, color: COLOR.green, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: COLOR.green }} />
              在线
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 18, padding: "24px 30px" }}>
          {messages.map((m, i) => {
            if (frame < m.at) return null;
            const t = Math.min(1, (frame - m.at) / 12);
            const sel = i === selectIndex ? selected : 0;
            const mine = m.from === "me";
            return (
              <div
                key={`${m.at}-${m.lines[0]}`}
                style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", opacity: t, transform: `translateY(${16 * (1 - t)}px) scale(${0.96 + 0.04 * t})`, transformOrigin: mine ? "right bottom" : "left bottom" }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "14px 20px",
                    borderRadius: 22,
                    borderBottomLeftRadius: mine ? 22 : 6,
                    borderBottomRightRadius: mine ? 6 : 22,
                    background: mine ? COLOR.ink : "oklch(1 0 0)",
                    boxShadow: mine ? "none" : "0 0 0 1px oklch(0.92 0.005 255)",
                  }}
                >
                  <SelLines lines={m.lines} selected={sel} size={25} lineHeight={38} color={mine ? "oklch(0.98 0 0)" : COLOR.ink} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <InputBox text={input} placeholder={placeholder} caret={caret} frame={frame} />
        </div>
      </div>
    </Frame>
  );
};

/** 输入框：有字时显示字和光标，没字时显示占位 */
export const InputBox: React.FC<{ text: string; placeholder: string; caret?: boolean; frame: number; minHeight?: number }> = ({ text, placeholder, caret, frame, minHeight = 64 }) => (
  <div style={{ minHeight, borderRadius: 20, background: "oklch(1 0 0)", boxShadow: "inset 0 0 0 1.5px oklch(0.88 0.006 255)", padding: "16px 22px", fontSize: 25, lineHeight: "36px", color: text ? COLOR.ink : COLOR.faint, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
    <span>
      {text || placeholder}
      {caret && text ? <span style={{ display: "inline-block", width: 2.5, height: 30, marginLeft: 3, verticalAlign: "-6px", background: COLOR.ink, opacity: Math.floor(frame / 20) % 2 ? 0.15 : 1 }} /> : null}
    </span>
    <span style={{ width: 44, height: 44, borderRadius: 22, background: text ? COLOR.ink : "oklch(0.9 0.005 255)", display: "grid", placeItems: "center", flex: "none" }}>
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="oklch(1 0 0)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </span>
  </div>
);

/** 团队工作区：左边频道栏，右边一个频道的消息和输入框 */
export const Workspace: React.FC<{
  w: number;
  h: number;
  frame: number;
  channel: string;
  messages: readonly Message[];
  selected?: number;
  input: string;
  placeholder: string;
  caret?: boolean;
}> = ({ w, h, frame, channel, messages, selected = 0, input, placeholder, caret }) => (
  <Frame w={w} h={h} title="">
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div style={{ width: 250, background: "oklch(0.3 0.06 300)", padding: "28px 0", color: "oklch(0.85 0.03 300)", fontSize: 21 }}>
        <div style={{ padding: "0 26px 22px", fontSize: 24, fontWeight: 700, color: "oklch(0.98 0 0)" }}>Product Team</div>
        {["general", "release", "design", "random"].map((c) => (
          <div key={c} style={{ padding: "8px 26px", background: c === channel ? "oklch(0.45 0.09 300)" : undefined, color: c === channel ? "oklch(0.99 0 0)" : undefined, fontWeight: c === channel ? 600 : 400 }}>
            # {c}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "oklch(1 0 0)" }}>
        <div style={{ height: 70, display: "flex", alignItems: "center", padding: "0 30px", fontSize: 24, fontWeight: 700, color: COLOR.ink, borderBottom: "1px solid oklch(0.92 0.005 255)" }}># {channel}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 22, padding: "20px 30px" }}>
          {messages.map((m, i) => {
            if (frame < m.at) return null;
            const t = Math.min(1, (frame - m.at) / 12);
            return (
              <div key={`${m.at}-${i}`} style={{ display: "flex", gap: 16, opacity: t, transform: `translateY(${14 * (1 - t)}px)` }}>
                <Avatar name={m.name ?? "?"} color={m.from === "me" ? "oklch(0.45 0.08 255)" : "oklch(0.6 0.12 40)"} size={48} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLOR.ink, marginBottom: 4 }}>
                    {m.name}
                    <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 16, color: COLOR.faint }}>{m.from === "me" ? "刚刚" : "10:24"}</span>
                  </div>
                  <SelLines lines={m.lines} selected={i === 0 ? selected : 0} size={24} lineHeight={36} color={COLOR.ink} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <InputBox text={input} placeholder={placeholder} caret={caret} frame={frame} />
        </div>
      </div>
    </div>
  </Frame>
);

/** 写邮件：收件人、主题、正文 */
export const Mail: React.FC<{ w: number; h: number; frame: number; to: string; subject: string; body: string; caret?: boolean }> = ({ w, h, frame, to, subject, body, caret }) => (
  <Frame w={w} h={h} title="新邮件">
    <div style={{ position: "absolute", inset: 0, background: "oklch(1 0 0)", padding: "10px 40px", fontSize: 24, color: COLOR.ink }}>
      {[
        ["收件人", to],
        ["主题", subject],
      ].map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 20, padding: "18px 0", borderBottom: "1px solid oklch(0.92 0.005 255)" }}>
          <span style={{ width: 90, color: COLOR.faint }}>{k}</span>
          <span>{v}</span>
        </div>
      ))}
      <div style={{ paddingTop: 30, lineHeight: "40px", fontSize: 26, minHeight: 200 }}>
        {body ? body : <span style={{ color: COLOR.faint }}>正文</span>}
        {caret && body ? <span style={{ display: "inline-block", width: 2.5, height: 30, marginLeft: 3, verticalAlign: "-6px", background: COLOR.ink, opacity: Math.floor(frame / 20) % 2 ? 0.15 : 1 }} /> : null}
      </div>
    </div>
  </Frame>
);

// ---- 备忘录 ----

/** 一页备忘录：标题、正文。lines 按行给，"1. " 这样开头的行画成编号列表；每行 at 帧落下（不给就一直在） */
export const Notes: React.FC<{ w: number; h: number; frame: number; title: string; lines: readonly { text: string; at?: number }[]; caret?: boolean }> = ({ w, h, frame, title, lines, caret }) => {
  const shown = lines.filter((l) => l.at === undefined || frame >= l.at);
  return (
    <Frame w={w} h={h} title={title}>
      <div style={{ position: "absolute", inset: 0, background: "oklch(0.995 0.003 85)", padding: "40px 60px", fontFamily: SANS, color: COLOR.ink }}>
        <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 26 }}>{title}</div>
        <div style={{ fontSize: 30, lineHeight: "52px" }}>
          {shown.map((l, i) => {
            const t = l.at === undefined ? 1 : Math.min(1, (frame - l.at) / 10);
            const item = /^(\d+)\. (.*)$/.exec(l.text);
            return (
              <div key={`${i}-${l.text}`} style={{ display: "flex", gap: 14, opacity: t, transform: `translateY(${-14 * (1 - t)}px)` }}>
                {item ? <span style={{ width: 34, textAlign: "right", color: COLOR.cinnabar, fontWeight: 600 }}>{item[1]}.</span> : null}
                <span>{item ? item[2] : l.text}</span>
              </div>
            );
          })}
          {caret ? <span style={{ display: "inline-block", width: 2.5, height: 34, marginTop: 6, background: COLOR.ink, opacity: Math.floor(frame / 20) % 2 ? 0.15 : 1 }} /> : null}
        </div>
      </div>
    </Frame>
  );
};
