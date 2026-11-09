import { AbsoluteFill } from "remotion";
import { Seal } from "../../../engine/speakmore/Seal";
import { Backdrop } from "../components/kit";
import { NUM, SANS, TONE, VERSION, ZH } from "../theme";

// 第四支的封面：片子是回顾式数字卡，封面就把三个数字摆出来——播放、下载、贡献者，都是片子里报过、有截图的数。
// 底用片子落版那张（靛青夜色、图标五道声纹居中当大影子），上面是图标、小写的 speakmore 和版本号，下面一行功能。
// 横版 16:9（B 站 / 视频号 / 抖音 / X），竖版 3:4（小红书），和前三支一样。
const T = TONE.night;
const STATS = [
  { value: "16.7", unit: "万", label: "次播放" },
  { value: "762", unit: "", label: "次下载" },
  { value: "12", unit: "", label: "位社区贡献者" },
] as const;
const ALL = [1, 1, 1, 1, 1];

const Brand: React.FC<{ icon: number; word: number }> = ({ icon, word }) => (
  <div style={{ display: "flex", alignItems: "center", gap: word * 0.22 }}>
    <div style={{ filter: "drop-shadow(0 18px 36px oklch(0.1 0.03 262 / 0.6))" }}>
      <Seal size={icon} bars={ALL} base={1} />
    </div>
    <span style={{ fontFamily: NUM, fontWeight: 700, fontVariationSettings: '"wdth" 100, "opsz" 96', fontSize: word, lineHeight: 1, letterSpacing: "-0.02em", color: T.ink }}>speakmore</span>
    <span style={{ padding: "4px 16px", borderRadius: 999, border: `2px solid ${T.ink2}`, fontFamily: NUM, fontWeight: 500, fontSize: word * 0.24, color: T.ink2 }}>{VERSION}</span>
  </div>
);

const Stat: React.FC<{ s: (typeof STATS)[number]; size: number; align: "center" | "flex-start" }> = ({ s, size, align }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: size * 0.1 }}>
    <div style={{ display: "flex", alignItems: "flex-end", gap: size * 0.04 }}>
      <span style={{ fontFamily: NUM, fontWeight: 800, fontVariationSettings: '"wdth" 75, "opsz" 96', fontSize: size, lineHeight: 0.86, letterSpacing: "-0.012em", color: T.ink }}>{s.value}</span>
      {s.unit ? <span style={{ fontFamily: ZH, fontSize: size * 0.5, lineHeight: 1, color: T.accent, paddingBottom: size * 0.02 }}>{s.unit}</span> : null}
    </div>
    <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: size * 0.2, letterSpacing: "0.08em", color: T.ink2 }}>{s.label}</span>
  </div>
);

const Line: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: ZH, fontSize: size, color: T.ink, letterSpacing: "0.06em" }}>语音输入 语音翻译 划词翻译</div>
);

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="night" side="center" />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 92 }}>
      <Brand icon={160} word={132} />
      <div style={{ display: "flex", gap: 150 }}>
        {STATS.map((s) => (
          <Stat key={s.label} s={s} size={250} align="center" />
        ))}
      </div>
      <Line size={60} />
    </AbsoluteFill>
  </AbsoluteFill>
);

export const CoverPortrait: React.FC = () => (
  <AbsoluteFill>
    <Backdrop tone="night" side="center" />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
      <Brand icon={112} word={92} />
      <div style={{ display: "flex", flexDirection: "column", gap: 46, alignItems: "flex-start" }}>
        {STATS.map((s) => (
          <Stat key={s.label} s={s} size={205} align="flex-start" />
        ))}
      </div>
      <Line size={50} />
    </AbsoluteFill>
  </AbsoluteFill>
);
