// 宣传片的音效都在这里用代码合成（方波 / 三角波 / 噪声，8-bit 风格），没有任何外部音源，按 CC0 入库。
// 配乐另找，不在这里做。
// 用法：node videos/kineto-promo/audio/synth.ts <输出目录>
// 产出 sfx.wav（所有音效拼成一条）与 rain.wav（雨声环境音），并重写 sfx-map.ts（每个音效的起止秒数）。
// 改了这里要重新生成并用 `./kineto asset add <输出目录>/sfx.wav --license CC0-1.0 --to kineto-promo --as sfx` 重新登记。
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 44100;
const outDir = process.argv[2];
if (!outDir) throw new Error("usage: node synth.ts <out-dir>");
mkdirSync(outDir, { recursive: true });

// ---------- 基础 ----------
type Wave = "square" | "triangle" | "saw" | "sine" | "noise";
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE: Record<string, number> = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const n = (name: string) => {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return NOTE[m[1]] + (Number(m[2]) + 1) * 12;
};

// 伪随机：NES 风格的 15 位线性反馈移位寄存器
function lfsr(seed = 1) {
  let r = seed;
  return () => {
    const bit = (r ^ (r >> 1)) & 1;
    r = (r >> 1) | (bit << 14);
    return r & 1 ? 1 : -1;
  };
}

let noiseValue = 1;

// 一条音轨：浮点采样缓冲，往里叠音
class Track {
  seconds: number;
  data: Float32Array;
  constructor(seconds: number) {
    this.seconds = seconds;
    this.data = new Float32Array(Math.ceil(seconds * SR));
  }
  // 一个音：wave 波形、freq 频率（可以是随时间变化的函数）、ADSR 包络
  tone(
    t0: number,
    dur: number,
    freq: number | ((t: number) => number),
    opts: { wave?: Wave; duty?: number; vol?: number; a?: number; d?: number; s?: number; r?: number; vibrato?: number; vibRate?: number; seed?: number } = {},
  ) {
    const { wave = "square", duty = 0.5, vol = 0.3, a = 0.005, d = 0.08, s = 0.6, r = 0.05, vibrato = 0, vibRate = 6, seed = 7 } = opts;
    const start = Math.floor(t0 * SR);
    const total = Math.floor((dur + r) * SR);
    const noise = lfsr(seed);
    let phase = 0;
    let held = 0;
    for (let i = 0; i < total; i++) {
      const idx = start + i;
      if (idx < 0 || idx >= this.data.length) continue;
      const t = i / SR;
      const f0 = typeof freq === "function" ? freq(t) : freq;
      const f = f0 * (1 + vibrato * Math.sin(2 * Math.PI * vibRate * t));
      phase += f / SR;
      const p = phase % 1;
      let v: number;
      if (wave === "square") v = p < duty ? 1 : -1;
      else if (wave === "triangle") v = 4 * Math.abs(p - 0.5) - 1;
      else if (wave === "saw") v = 2 * p - 1;
      else if (wave === "sine") v = Math.sin(2 * Math.PI * phase);
      else {
        // 噪声：按 freq 的速率换样
        if (Math.floor(phase) !== held) {
          held = Math.floor(phase);
          noiseValue = noise();
        }
        v = noiseValue;
      }
      let env: number;
      if (t < a) env = t / a;
      else if (t < a + d) env = 1 - (1 - s) * ((t - a) / d);
      else if (t < dur) env = s;
      else env = s * Math.max(0, 1 - (t - dur) / r);
      this.data[idx] += v * env * vol;
    }
    return this;
  }
  mix(other: Track, t0: number, gain = 1) {
    const start = Math.floor(t0 * SR);
    for (let i = 0; i < other.data.length; i++) {
      const idx = start + i;
      if (idx >= 0 && idx < this.data.length) this.data[idx] += other.data[i] * gain;
    }
    return this;
  }
  // 回声
  echo(delay: number, feedback: number, wet: number) {
    const dly = Math.floor(delay * SR);
    const out = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) out[i] = this.data[i] + (i >= dly ? out[i - dly] * feedback : 0);
    for (let i = 0; i < this.data.length; i++) this.data[i] = this.data[i] * (1 - wet) + out[i] * wet;
    return this;
  }
  lowpass(cut: number) {
    const k = 1 - Math.exp((-2 * Math.PI * cut) / SR);
    let y = 0;
    for (let i = 0; i < this.data.length; i++) this.data[i] = y += k * (this.data[i] - y);
    return this;
  }
  fade(fromSec: number, toSec: number) {
    for (let i = Math.floor(fromSec * SR); i < this.data.length; i++) {
      const t = i / SR;
      this.data[i] *= Math.max(0, 1 - (t - fromSec) / Math.max(0.001, toSec - fromSec));
    }
    return this;
  }
}

// ---------- 鼓 ----------
const kick = (tr: Track, t: number, vol = 0.55) => tr.tone(t, 0.12, (x) => 150 * Math.exp(-x * 30) + 45, { wave: "sine", vol, a: 0.001, d: 0.1, s: 0, r: 0.04 });
const crash = (tr: Track, t: number, vol = 0.25) => tr.tone(t, 1.2, 12000, { wave: "noise", vol, a: 0.002, d: 1.2, s: 0, r: 0.2, seed: 5 });

// 和弦音（根音 midi 号 + 大小调）
const chord = (root: string, minor = false) => {
  const r = n(root);
  return [r, r + (minor ? 3 : 4), r + 7];
};

// ---------- 音效 ----------
type Sfx = () => Track;
const SFX: Record<string, Sfx> = {
  thud: () => {
    const t = new Track(0.4);
    t.tone(0, 0.25, (x) => 120 * Math.exp(-x * 12) + 35, { wave: "sine", vol: 0.8, a: 0.001, d: 0.25, s: 0, r: 0.05 });
    t.tone(0, 0.12, 3000, { wave: "noise", vol: 0.3, a: 0.001, d: 0.12, s: 0, r: 0.02 });
    return t;
  },
  key: () => new Track(0.06).tone(0, 0.02, 9000, { wave: "noise", vol: 0.25, a: 0.001, d: 0.02, s: 0, r: 0.01, seed: 13 }),
  enter: () => new Track(0.25).tone(0, 0.07, midi(n("C6")), { vol: 0.2, s: 0.5 }).tone(0.07, 0.1, midi(n("G6")), { vol: 0.2, s: 0.5 }),
  quest: () => {
    const t = new Track(0.9);
    ["C5", "E5", "G5", "C6", "E6"].forEach((m, i) => t.tone(i * 0.07, i === 4 ? 0.4 : 0.07, midi(n(m)), { vol: 0.18, duty: 0.25, s: 0.7, r: 0.2 }));
    return t.echo(0.12, 0.3, 0.3);
  },
  jump: () => new Track(0.3).tone(0, 0.18, (x) => 300 + 1600 * x * 5, { vol: 0.16, duty: 0.25, s: 0.6, r: 0.04 }),
  coin: () => new Track(0.5).tone(0, 0.07, midi(n("B5")), { vol: 0.2, duty: 0.5, s: 0.7 }).tone(0.07, 0.3, midi(n("E6")), { vol: 0.2, duty: 0.5, s: 0.7, r: 0.15 }),
  thunder: () => new Track(2.2).tone(0, 1.8, 600, { wave: "noise", vol: 0.6, a: 0.005, d: 1.8, s: 0, r: 0.3, seed: 17 }).lowpass(400),
  fall: () => new Track(1).tone(0, 0.8, (x) => 1400 * Math.pow(0.18, x / 0.8), { vol: 0.18, duty: 0.5, s: 0.8, r: 0.1, vibrato: 0.01 }),
  hurt: () => new Track(0.4).tone(0, 0.25, (x) => 180 - 120 * x, { wave: "saw", vol: 0.3, s: 0.8, r: 0.05 }).tone(0, 0.2, 2000, { wave: "noise", vol: 0.15, d: 0.2, s: 0 }),
  bonk: () => new Track(0.3).tone(0, 0.08, (x) => 220 - 600 * x, { vol: 0.35, duty: 0.5, a: 0.001, d: 0.08, s: 0, r: 0.02 }),
  pop: () => new Track(0.2).tone(0, 0.08, (x) => 400 + 3000 * x, { vol: 0.18, duty: 0.25, a: 0.001, d: 0.08, s: 0, r: 0.02 }),
  error: () => new Track(0.3).tone(0, 0.18, midi(n("C5")), { vol: 0.12, s: 0.8, r: 0.03 }).tone(0, 0.18, midi(n("C#5")), { vol: 0.12, s: 0.8, r: 0.03 }),
  glitch: () => {
    const t = new Track(0.7);
    for (let i = 0; i < 9; i++) t.tone(i * 0.07, 0.04, 800 + i * 900, { wave: i % 2 ? "noise" : "square", vol: 0.2, a: 0.001, d: 0.04, s: 0, r: 0.005, seed: i + 2 });
    return t;
  },
  fizz: () => new Track(1.2).tone(0, 1, 7000, { wave: "noise", vol: 0.12, a: 0.05, d: 0.95, s: 0, r: 0.1, seed: 23 }).lowpass(3000),
  whoosh: () => new Track(0.6).tone(0, 0.45, (x) => 1500 + 9000 * x, { wave: "noise", vol: 0.22, a: 0.15, d: 0.3, s: 0, r: 0.05, seed: 29 }).lowpass(4000),
  hit: () => {
    const t = new Track(0.5);
    kick(t, 0, 0.7);
    t.tone(0, 0.15, 5000, { wave: "noise", vol: 0.3, a: 0.001, d: 0.15, s: 0, r: 0.02 });
    return t;
  },
  sad: () => {
    const t = new Track(2.6);
    ["G4", "F#4", "F4"].forEach((m, i) => t.tone(i * 0.42, 0.36, midi(n(m)), { vol: 0.18, duty: 0.5, s: 0.8, r: 0.05, vibrato: 0.004 }));
    t.tone(1.26, 1.1, (x) => midi(n("E4")) * (1 - 0.04 * x), { vol: 0.18, duty: 0.5, s: 0.8, r: 0.2, vibrato: 0.03, vibRate: 7 });
    return t;
  },
  beep: () => new Track(0.2).tone(0, 0.09, midi(n("A5")), { vol: 0.18, duty: 0.5, s: 0.8, r: 0.02 }),
  insert: () => {
    const t = new Track(1);
    t.tone(0, 0.07, midi(n("B5")), { vol: 0.22 }).tone(0.07, 0.25, midi(n("E6")), { vol: 0.22, r: 0.1 });
    t.tone(0.16, 0.05, 3000, { wave: "noise", vol: 0.2, d: 0.05, s: 0 });
    ["C5", "G5", "C6", "G6"].forEach((m, i) => t.tone(0.3 + i * 0.05, 0.05, midi(n(m)), { vol: 0.12, duty: 0.25 }));
    return t;
  },
  powerup: () => {
    const t = new Track(1.2);
    for (let i = 0; i < 16; i++) t.tone(i * 0.045, 0.045, midi(n("C4") + i * 2), { vol: 0.14, duty: 0.25, s: 0.7, r: 0.01 });
    return t.echo(0.1, 0.3, 0.3);
  },
  ready: () => new Track(0.5).tone(0, 0.12, midi(n("C5")), { vol: 0.2 }).tone(0.18, 0.12, midi(n("C5")), { vol: 0.2 }),
  go: () => {
    const t = new Track(1);
    for (const m of chord("C5")) t.tone(0, 0.5, midi(m), { vol: 0.13, duty: 0.5, s: 0.8, r: 0.3 });
    crash(t, 0, 0.25);
    kick(t, 0, 0.7);
    return t;
  },
  boing: () => new Track(0.6).tone(0, 0.45, (x) => 180 + 700 * x + 120 * Math.sin(x * 60), { vol: 0.2, duty: 0.25, s: 0.8, r: 0.05 }),
  cannon: () => {
    const t = new Track(1.4);
    t.tone(0, 0.6, (x) => 90 * Math.exp(-x * 4) + 30, { wave: "sine", vol: 0.9, a: 0.001, d: 0.6, s: 0, r: 0.1 });
    t.tone(0, 1, 2500, { wave: "noise", vol: 0.5, a: 0.001, d: 1, s: 0, r: 0.2, seed: 31 });
    return t.lowpass(2500);
  },
  ring: () => new Track(0.6).tone(0, 0.05, midi(n("E6")), { vol: 0.16, duty: 0.25 }).tone(0.05, 0.35, midi(n("B6")), { vol: 0.16, duty: 0.25, r: 0.15 }),
  skid: () => new Track(0.5).tone(0, 0.36, 5000, { wave: "noise", vol: 0.22, a: 0.01, d: 0.35, s: 0.2, r: 0.05, seed: 37 }).lowpass(5000),
  type: () => {
    const t = new Track(0.55);
    for (let i = 0; i < 10; i++) t.tone(i * 0.045, 0.015, 8000 + (i % 3) * 1500, { wave: "noise", vol: 0.2, a: 0.001, d: 0.015, s: 0, r: 0.005, seed: 41 + i });
    return t;
  },
  success: () => new Track(0.6).tone(0, 0.08, midi(n("G5")), { vol: 0.18, duty: 0.25 }).tone(0.08, 0.3, midi(n("C6")), { vol: 0.18, duty: 0.25, r: 0.15 }),
  build: () => {
    const t = new Track(0.7);
    kick(t, 0, 0.8);
    t.tone(0, 0.4, 1500, { wave: "noise", vol: 0.25, a: 0.001, d: 0.4, s: 0, r: 0.05, seed: 43 });
    ["C5", "E5", "G5"].forEach((m, i) => t.tone(0.08 + i * 0.05, 0.05, midi(n(m)), { vol: 0.12 }));
    return t;
  },
  stamp: () => {
    const t = new Track(0.3);
    kick(t, 0, 0.5);
    t.tone(0, 0.05, 4000, { wave: "noise", vol: 0.2, d: 0.05, s: 0 });
    return t;
  },
  corner: () => {
    const t = new Track(1.4);
    ["G5", "G5", "G5", "C6"].forEach((m, i) => t.tone(i * 0.11, i === 3 ? 0.6 : 0.09, midi(n(m)), { vol: 0.18, duty: 0.5, s: 0.8, r: 0.2 }));
    crash(t, 0.33, 0.25);
    return t;
  },
  record: () => {
    const t = new Track(1.6);
    ["C5", "E5", "G5", "C6", "G5", "C6", "E6"].forEach((m, i) => t.tone(i * 0.08, i === 6 ? 0.6 : 0.07, midi(n(m)), { vol: 0.16, duty: 0.25, s: 0.8, r: 0.2 }));
    return t.echo(0.12, 0.3, 0.3);
  },
  sparkle: () => {
    const t = new Track(0.5);
    ["E6", "G#6", "B6"].forEach((m, i) => t.tone(i * 0.04, 0.05, midi(n(m)), { vol: 0.09, duty: 0.125, r: 0.1 }));
    return t;
  },
  launch: () => new Track(1).tone(0, 0.8, (x) => 200 + 2000 * x, { vol: 0.16, duty: 0.25, s: 0.8, r: 0.1, vibrato: 0.02, vibRate: 20 }),
  star: () => {
    const t = new Track(0.9);
    ["C6", "E6", "G6", "C7"].forEach((m, i) => t.tone(i * 0.06, 0.3, midi(n(m)), { vol: 0.1, duty: 0.25, r: 0.2 }));
    return t.echo(0.1, 0.35, 0.35);
  },
};

// ---------- 输出 ----------
function writeWav(file: string, tr: Track) {
  let peak = 0;
  for (const v of tr.data) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0.89 ? 0.89 / peak : 1;
  const buf = Buffer.alloc(44 + tr.data.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + tr.data.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(tr.data.length * 2, 40);
  for (let i = 0; i < tr.data.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, tr.data[i] * gain)) * 32767), 44 + i * 2);
  writeFileSync(path.join(outDir, file), buf);
}

// 所有音效拼成一条，中间留 0.2 秒静音；记下每个的起止秒数
const GAP = 0.2;
const pieces = Object.entries(SFX).map(([name, make]) => [name, make()] as const);
const total = pieces.reduce((s, [, t]) => s + t.seconds + GAP, 0);
const sheet = new Track(total);
const map: Record<string, [number, number]> = {};
let at = 0;
for (const [name, t] of pieces) {
  sheet.mix(t, at);
  map[name] = [Number(at.toFixed(3)), Number((at + t.seconds).toFixed(3))];
  at += t.seconds + GAP;
}
writeWav("sfx.wav", sheet);
writeFileSync(
  path.join(import.meta.dirname, "sfx-map.ts"),
  `// 由 audio/synth.ts 生成：sfx.wav 里每个音效的起止秒数。\nexport const SFX_MAP = {\n${Object.entries(map)
    .map(([k, [a, b]]) => `  ${k}: [${a}, ${b}],`)
    .join("\n")}\n} as const;\n\nexport type SfxName = keyof typeof SFX_MAP;\n`,
);

// 雨声环境音：第一幕变天之后一直下，单独一条（放在音效之后生成，不影响 sfx.wav 的内容）
function rain() {
  const len = 18;
  const tr = new Track(len);
  tr.tone(0, len, 11000, { wave: "noise", vol: 0.35, a: 0.5, d: 0.1, s: 1, r: 0.01, seed: 51 });
  tr.lowpass(2200);
  for (let i = 0; i < 260; i++) {
    const t = ((i * 7919) % 1000) / 1000 * (len - 0.1);
    tr.tone(t, 0.01, 3000 + ((i * 131) % 5) * 600, { wave: "noise", vol: 0.12, a: 0.001, d: 0.01, s: 0, r: 0.005, seed: 60 + (i % 9) });
  }
  return tr;
}
writeWav("rain.wav", rain());

console.log(`wrote ${Object.keys(map).length} sfx + rain to ${outDir}`);
