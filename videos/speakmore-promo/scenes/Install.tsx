import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp } from "../../../engine/motion";
import { assets } from "../assets.gen";
import { Caption } from "../components/Caption";
import { Glyph } from "../components/Glyph";
import { Seal } from "../components/Seal";
import type { Camera } from "../components/Stage";
import { type Row, type Seg, Terminal } from "../components/Terminal";
import { Window } from "../components/Window";
import { CHIP_ICONS, UI_ICONS } from "../icons";
import { show } from "../motion";
import { COLOR, EASE, SANS, WINDOW } from "../theme";

// 第六章 两种装法：安装包（拖进"应用程序"，Apple 芯片和 Intel 两个包同等，经 Apple 公证）→
// 一个终端：一行命令装好，接着敲 speakmore status、model、usage。
// 终端里的字都是真的：安装那段照 SpeakMore 的 install.sh 打印的原话（版本、芯片取本机），
// 三条命令是 2026-10-16 在本机跑出来的输出，只删了两行因为临时切中文才冒出来的语言提示。

const INSTALL = "curl -fsSL https://dl.zephyrxiang.com/speakmore/install.sh | bash";

/** 安装脚本的一行：✓ 是绿的，标题加粗，空字符串是空行 */
const ok = (text: string): Seg[] => [{ text: "  " }, { text: "✓", tone: "green" }, { text: ` ${text}` }];
const head = (text: string): Seg[] => [{ text: `  ${text}`, tone: "bold" }];
const plain = (text: string): Seg[] => [{ text }];

const INSTALLER: Seg[][] = [
  plain(""),
  head("SpeakMore installer"),
  plain(""),
  head("Checks"),
  ok("macOS 26.5"),
  ok("Apple silicon"),
  ok("System tools found"),
  ok("Download server reachable"),
  ok("Gemini reachable"),
  ok("OpenAI reachable"),
  plain(""),
  head("Install"),
  ok("Downloaded"),
  ok("Checksum OK"),
  ok("Unpacked SpeakMore 0.6.2"),
  ok("Installed to ~/.speakmore"),
  ok("speakmore command: ~/.local/bin/speakmore"),
  plain(""),
  head("Installed SpeakMore 0.6.2"),
  plain(""),
];

const STATUS: Seg[][] = [
  [{ text: "SpeakMore 0.6.2 · 运行中", tone: "bold" }],
  plain(""),
  plain("  可以用了：点进任意输入框，按一下右 Option 键开始说话，再按一下结束，文字会贴进去。"),
  plain(""),
  [{ text: "  key       ", tone: "faint" }, { text: "已保存，验证通过" }],
  [{ text: "  权限      ", tone: "faint" }, { text: "麦克风 " }, { text: "✓", tone: "green" }, { text: "   输入监控 " }, { text: "✓", tone: "green" }, { text: "   辅助功能 " }, { text: "✓", tone: "green" }],
  [{ text: "  热键      ", tone: "faint" }, { text: "右 Option 键" }],
  [{ text: "  模型      ", tone: "faint" }, { text: "Gemini 的 gemini-3.6-flash（MINIMAL）" }],
  [{ text: "  主题      ", tone: "faint" }, { text: "朱砂（cinnabar）" }],
  [{ text: "  今天      ", tone: "faint" }, { text: "6 次 · 580 字 · 5 分 23 秒 · $0.014" }],
  [{ text: "  累计      ", tone: "faint" }, { text: "12 次 · 772 字 · 6 分 48 秒 · 每分钟 114 字 · $0.015" }],
  plain(""),
];

const MODEL: Seg[][] = [
  [{ text: "模型", tone: "bold" }],
  plain(""),
  [{ text: "  " }, { text: "●", tone: "green" }, { text: " gemini   Gemini   gemini-3.6-flash         key 存着" }],
  [{ text: "    openai   OpenAI   gpt-audio-mini（默认）   " }, { text: "还没有 key", tone: "faint" }],
  plain(""),
  plain("  现在用的是 Gemini 的 gemini-3.6-flash · 默认"),
  plain(""),
];

const USAGE: Seg[][] = [
  [{ text: "用量", tone: "bold" }],
  plain(""),
  [{ text: "           花费   token   听写   模型回话", tone: "faint" }],
  [{ text: "  今天", tone: "faint" }, { text: "   $0.014   22.2K      6   一般 3.7 秒，慢时 9.7 秒" }],
  [{ text: "  本月", tone: "faint" }, { text: "   $0.015   25.2K      7   一般 3.7 秒，慢时 9.7 秒" }],
  [{ text: "  累计", tone: "faint" }, { text: "   $0.015   25.2K      7   一般 3.7 秒，慢时 9.7 秒" }],
  plain(""),
  [{ text: "  钱是按各家官方标准价估算的美元；Gemini 在免费额度内用的其实不收钱。", tone: "faint" }],
];

// 终端的时间线：一条命令敲完，输出一行一行出来，停一下再敲下一条
const TERM_START = 236;
const { rows: ROWS, marks: MARKS } = (() => {
  const rows: Row[] = [];
  const marks: number[] = [];
  let at = TERM_START;
  const run = (command: string, typing: number, output: Seg[][], step: number, hold: number) => {
    marks.push(at);
    rows.push({ at, typing, segs: [{ text: command }] });
    at += typing + 8;
    for (const segs of output) {
      rows.push({ at, segs });
      at += step;
    }
    at += hold;
  };
  run(INSTALL, 66, INSTALLER, 5, 18);
  run("speakmore status", 22, STATUS, 3, 34);
  run("speakmore model", 20, MODEL, 3, 30);
  run("speakmore usage", 20, USAGE, 3, 0);
  marks.push(at);
  return { rows, marks };
})();

const T = { dmg: 6, drag: [70, 130] as const, chips: 40, dmgOut: 206, term: 216, cli: MARKS[1], out: MARKS[4] + 70, end: MARKS[4] + 90 };

export const INSTALL_FRAMES = T.end;
export const INSTALL_CAMERA: Camera = { focus: [[0, 0.55]], zoom: [[0, 1]] };

export const Install: React.FC = () => {
  const frame = useCurrentFrame();
  const drag = interpolate(frame, T.drag, [0, 1], { ...clamp, easing: EASE.inOut });
  const landed = interpolate(frame, [T.drag[1], T.drag[1] + 6, T.drag[1] + 20], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: COLOR.ink }}>
      {/* 一 安装包 */}
      <Caption frame={frame} at={T.dmg} out={T.dmgOut}>
        安装包，拖入即用。
      </Caption>
      <div style={{ position: "absolute", left: 510, top: 250, width: 900, height: 440, ...show(frame, T.dmg + 4, T.dmgOut, 30) }}>
        <Window width={900} height={440} title="SpeakMore">
          <div style={{ position: "absolute", left: 150, top: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <Seal size={170} bars={[1, 1, 1, 1, 1]} base={1} />
            <span style={{ color: WINDOW.text, fontSize: 24 }}>SpeakMore</span>
          </div>
          {/* 拖着走的那个影子 */}
          <div style={{ position: "absolute", left: 150 + 430 * drag, top: 80, opacity: drag > 0 && drag < 1 ? 0.75 : 0, transform: `scale(${1 - 0.15 * drag})` }}>
            <Seal size={170} bars={[1, 1, 1, 1, 1]} base={1} />
          </div>
          <svg viewBox="0 0 160 24" width={160} height={24} style={{ position: "absolute", left: 370, top: 153 }}>
            <path d="M2 12h150M140 3l12 9-12 9" fill="none" stroke={WINDOW.faint} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 8" />
          </svg>
          <div style={{ position: "absolute", left: 570, top: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <Folder size={170} bump={landed} />
            <span style={{ color: WINDOW.text, fontSize: 24 }}>应用程序</span>
          </div>
        </Window>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, display: "flex", justifyContent: "center", gap: 28 }}>
        {[
          { icon: CHIP_ICONS.apple, size: 30, name: "Apple 芯片" },
          { icon: CHIP_ICONS.intel, size: 64, name: "Intel 芯片" },
        ].map((chip, i) => (
          <span
            key={chip.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              width: 300,
              height: 76,
              borderRadius: 16,
              boxShadow: "inset 0 0 0 1.5px oklch(1 0 0 / 0.32)",
              background: "oklch(0.18 0.008 255 / 0.45)",
              fontSize: 30,
              fontWeight: 500,
              color: COLOR.ink,
              ...show(frame, T.chips + i * 8, T.dmgOut),
            }}
          >
            <Glyph icon={chip.icon} size={chip.size} style={{ margin: `${(30 - chip.size) / 2}px 0` }} />
            {chip.name}
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 856, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontSize: 28, color: COLOR.muted, ...show(frame, T.chips + 22, T.dmgOut) }}>
        <Glyph icon={UI_ICONS.check} size={30} style={{ color: COLOR.cinnabar }} />
        经 Apple 公证
      </div>

      {/* 二 命令行 */}
      <Caption frame={frame} at={T.term} out={T.cli}>
        命令行，一行安装。
      </Caption>
      <Caption frame={frame} at={T.cli + 4} out={T.out}>
        原生命令行：状态、模型、用量，随时可查。
      </Caption>
      <div style={{ position: "absolute", left: 300, top: 236, width: 1320, height: 700, ...show(frame, T.term + 6, T.out, 30) }}>
        <Terminal frame={frame} rows={ROWS} width={1320} height={700} title="zsh" />
      </div>

      <Sequence from={T.dmg} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.2} />
      </Sequence>
      <Sequence from={T.drag[1]} layout="none" name="sfx:tick">
        <Audio src={staticFile(assets.sfxTick)} volume={0.4} />
      </Sequence>
      <Sequence from={T.term} layout="none" name="sfx:whoosh">
        <Audio src={staticFile(assets.sfxWhoosh)} volume={0.2} />
      </Sequence>
      {ROWS.filter((r) => r.typing).map((r) => (
        <Sequence key={r.at} from={r.at} durationInFrames={(r.typing ?? 0) + 4} layout="none" name="sfx:type">
          <Audio src={staticFile(assets.sfxType)} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** "应用程序"文件夹：自己画的扁平文件夹，接住拖进来的图标时轻轻一鼓 */
const Folder: React.FC<{ size: number; bump: number }> = ({ size, bump }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: `scale(${1 + 0.06 * bump})` }}>
    <path d="M8 26a6 6 0 0 1 6-6h24l8 8h40a6 6 0 0 1 6 6v6H8z" fill="oklch(0.72 0.09 245)" />
    <rect x="8" y="34" width="84" height="52" rx="6" fill="oklch(0.8 0.08 245)" />
    <path d="M40 72l10-22 10 22M44 64h12" fill="none" stroke="oklch(0.68 0.08 245)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
