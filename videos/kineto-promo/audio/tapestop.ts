// 磁带骤停：取一首 WAV 的开头到 cutSec，之后 stopSec 秒内转速从 1 降到 0（音高跟着往下掉），再静音。
// 用法：node videos/kineto-promo/audio/tapestop.ts <输入.wav> <输出.wav> <cutSec> <stopSec>
// 开场的音乐就是这样从 Stage 1 剪出来的：变天那一拍，音乐像磁带卡住一样停下。
import { readFileSync, writeFileSync } from "node:fs";

const [input, output, cutArg, stopArg] = process.argv.slice(2);
if (!input || !output || !cutArg || !stopArg) throw new Error("usage: node tapestop.ts <in.wav> <out.wav> <cutSec> <stopSec>");

const buf = readFileSync(input);
let off = 12;
let dataOff = 0;
let dataLen = 0;
let channels = 2;
let rate = 44100;
let bits = 16;
while (off < buf.length) {
  const id = buf.toString("ascii", off, off + 4);
  const size = buf.readUInt32LE(off + 4);
  if (id === "fmt ") {
    channels = buf.readUInt16LE(off + 10);
    rate = buf.readUInt32LE(off + 12);
    bits = buf.readUInt16LE(off + 22);
  }
  if (id === "data") {
    dataOff = off + 8;
    dataLen = size;
    break;
  }
  off += 8 + size + (size % 2);
}
if (bits !== 16) throw new Error(`only 16-bit PCM is supported, got ${bits}-bit`);

const frames = Math.floor(dataLen / (2 * channels));
const sample = (i: number, c: number) => (i >= 0 && i < frames ? buf.readInt16LE(dataOff + (i * channels + c) * 2) : 0);

const cut = Math.round(Number(cutArg) * rate);
const stop = Math.round(Number(stopArg) * rate);
const out = new Int16Array((cut + stop) * channels);
for (let i = 0; i < cut; i++) for (let c = 0; c < channels; c++) out[i * channels + c] = sample(i, c);

// 转速按 (1 - t)^1.6 衰减；读位置按转速累加，线性插值取样；最后 30ms 淡出防爆音
let pos = cut;
for (let j = 0; j < stop; j++) {
  const t = j / stop;
  const speed = Math.pow(1 - t, 1.6);
  const i0 = Math.floor(pos);
  const k = pos - i0;
  const fade = Math.min(1, (stop - j) / (0.03 * rate));
  for (let c = 0; c < channels; c++) {
    const v = sample(i0, c) * (1 - k) + sample(i0 + 1, c) * k;
    out[(cut + j) * channels + c] = Math.round(v * fade);
  }
  pos += speed;
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + out.byteLength, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * channels * 2, 28);
header.writeUInt16LE(channels * 2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(out.byteLength, 40);
writeFileSync(output, Buffer.concat([header, Buffer.from(out.buffer)]));
console.log(`wrote ${output}: ${((cut + stop) / rate).toFixed(3)}s`);
