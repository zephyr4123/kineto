// GitHub 仓库卡片：snug-promo 和 snug-demo 的落版都用，点亮 Star 的那一下也在这里。
// 字体栈和 snug-promo 的 theme 同一组：界面字用本机系统字（Remotion 的 Chrome 里只有 system-ui 能调到 SF），中文落到苹方
const SF = `system-ui, "PingFang SC", sans-serif`;
const ZH = `"PingFang SC", system-ui, sans-serif`;

/** GitHub 仓库卡片（900×250）：starred 是否已点亮 Star，burst 是点亮那一下迸开的小点（0→1） */
export const RepoCard: React.FC<{ starred: boolean; burst?: number }> = ({ starred, burst = 1 }) => (
  <div
    style={{
      width: 900,
      height: 250,
      borderRadius: 24,
      background: "#ffffff",
      boxShadow: "0 30px 80px rgba(20,40,90,0.18), 0 0 0 1px rgba(20,40,90,0.08)",
      fontFamily: SF,
      padding: "30px 36px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, color: "#0969da" }}>
      <svg width="34" height="34" viewBox="0 0 16 16">
        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" fill="#59636e" />
      </svg>
      <span>
        zephyr4123 / <b>snug</b>
      </span>
      <span style={{ fontSize: 20, color: "#59636e", border: "1.5px solid #d1d9e0", borderRadius: 14, padding: "2px 12px" }}>Public</span>
    </div>
    <div style={{ marginTop: 14, fontFamily: ZH, fontSize: 28, color: "#59636e" }}>为 UU远程 打造的 Mac 移动端工作区</div>
    <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18, fontSize: 26, color: "#25292e" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 12, border: "1.5px solid #d1d9e0", background: starred ? "#fff8c5" : "#f6f8fa", fontWeight: 600 }}>
        <span style={{ color: starred ? "#d4a72c" : "#59636e", fontSize: 30, transform: `scale(${1 + 0.6 * (starred ? 1 - burst : 0)})` }}>{starred ? "★" : "☆"}</span>
        {starred ? "Starred" : "Star"}
        {starred
          ? Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <div key={i} style={{ position: "absolute", left: 38 + Math.cos(a) * 46 * burst, top: 26 + Math.sin(a) * 46 * burst, width: 8, height: 8, borderRadius: 4, background: "#e3b341", opacity: 1 - burst }} />;
            })
          : null}
      </div>
      <div style={{ padding: "10px 22px", borderRadius: 12, border: "1.5px solid #d1d9e0", background: "#f6f8fa", fontWeight: 600, color: "#59636e" }}>⑂ Fork</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, color: "#59636e" }}>
        <span style={{ width: 16, height: 16, borderRadius: 8, background: "#f05138", display: "inline-block" }} />
        Swift · MIT
      </div>
    </div>
  </div>
);
