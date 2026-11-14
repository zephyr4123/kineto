import { SF } from "../theme";

// Ghostty 的右键菜单（照实机截图）：Snug 把「按住 0.5 秒直接松手」翻译成右键，弹出的就是 Mac 上这个 App 自己的菜单。
// 坐标是 Mac 点；hover 是正被点中的那一项（变蓝）。
export const CTX_W = 228;
export const CTX_ITEM_H = 22;
const ITEMS = [
  "Copy",
  "Paste",
  "-",
  "Split Right",
  "Split Left",
  "Split Down",
  "Split Up",
  "-",
  "Close Split",
  "-",
  "Reset Terminal",
  "Toggle Terminal Inspector",
  "Terminal Read-only",
  "-",
  "Change Tab Title…",
  "Change Terminal Title…",
  "-",
  "AutoFill",
  "Services",
];
export const CTX_H = ITEMS.reduce((h, it) => h + (it === "-" ? 11 : CTX_ITEM_H), 10);

export const ContextMenu: React.FC<{ x: number; y: number; p: number; hover: number }> = ({ x, y, p, hover }) => {
  let top = 5;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CTX_W,
        height: CTX_H,
        borderRadius: 11,
        background: "rgba(242,242,244,0.96)",
        boxShadow: "0 12px 34px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.18)",
        opacity: p,
        transform: `scale(${0.96 + 0.04 * p})`,
        transformOrigin: "0 0",
        fontFamily: SF,
        fontSize: 13.5,
        color: "#1d1d1f",
      }}
    >
      {ITEMS.map((it, i) => {
        if (it === "-") {
          const el = <div key={i} style={{ position: "absolute", left: 12, right: 12, top: top + 5, height: 1, background: "rgba(0,0,0,0.1)" }} />;
          top += 11;
          return el;
        }
        const el = (
          <div key={i} style={{ position: "absolute", left: 5, right: 5, top, height: CTX_ITEM_H, borderRadius: 6, padding: "0 10px", display: "flex", alignItems: "center", background: i === hover ? "#0a64d8" : undefined, color: i === hover ? "#fff" : undefined }}>
            {it}
            {it === "AutoFill" || it === "Services" ? <span style={{ marginLeft: "auto" }}>›</span> : null}
          </div>
        );
        top += CTX_ITEM_H;
        return el;
      })}
    </div>
  );
};

