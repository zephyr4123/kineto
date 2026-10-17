// 机械计数器：每一位是一条 0–9 的竖带，最低位跟着数连续地滚，高一位只在低位从 9 进到 10 的那一格里跟着滚一格，
// 像里程表。数涨得快时，滚得快的那几位带一点虚，读起来是"在转"而不是在闪。

const DIGIT = "0.6em";
const COMMA = "0.3em";

/**
 * value：此刻的数（可以带小数）；final：最后停在的数，决定有几位、逗号在哪；
 * speed：此刻每帧涨多少，用来给转得快的位加虚。
 */
export const Counter: React.FC<{ value: number; final: number; speed: number }> = ({ value, final, speed }) => {
  const digits = String(Math.round(final)).length;
  const columns: React.ReactNode[] = [];
  for (let k = digits - 1; k >= 0; k--) {
    const place = 10 ** k;
    const whole = Math.floor(value / place);
    const lower = value - whole * place;
    const roll = k === 0 ? lower : Math.max(0, lower - (place - 1));
    const pos = (whole % 10) + roll;
    // 还没涨到这一位时不露出来（位置照样占着，数停下时不挪）
    const lit = k === 0 || value >= place ? 1 : 0;
    const blur = Math.min(6, Math.max(0, (speed / place - 0.25) * 5));
    columns.push(
      <span key={`d${k}`} style={{ display: "inline-block", width: DIGIT, height: "1em", overflow: "hidden", opacity: lit }}>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            transform: `translateY(${-pos}em)`,
            filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          }}
        >
          {/* 末尾再接一个 0：从 9 往上滚时接得上 */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
            <span key={i} style={{ height: "1em", lineHeight: 1, textAlign: "center" }}>
              {d}
            </span>
          ))}
        </span>
      </span>,
    );
    if (k > 0 && k % 3 === 0) {
      columns.push(
        <span key={`c${k}`} style={{ display: "inline-block", width: COMMA, lineHeight: 1, textAlign: "center", opacity: value >= place ? 1 : 0 }}>
          ,
        </span>,
      );
    }
  }
  return <span style={{ display: "inline-flex", lineHeight: 1 }}>{columns}</span>;
};
