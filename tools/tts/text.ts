// 配音的纯逻辑：长文本切段（服务商单次请求有字数上限）、PCM 拼 WAV。不碰网络，单独测试。

const SENTENCE_END = /[。！？!?；;\n]/;
const CLAUSE_END = /[，,、：:]/;

// 在每个分隔符之后切开，分隔符留在前一段末尾，拼回去与原文一致
function cutAfter(text: string, end: RegExp): string[] {
  const out: string[] = [];
  let cur = "";
  for (const ch of text) {
    cur += ch;
    if (end.test(ch)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

function hardCut(text: string, limit: number): string[] {
  const chars = [...text];
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += limit) out.push(chars.slice(i, i + limit).join(""));
  return out;
}

// 先按句、再按逗号、最后硬切，把每块压到 limit 以内；再把相邻的块尽量合并，减少请求次数、
// 也让语调在句子之间连贯
export function splitText(text: string, limit: number): string[] {
  if (text.trim() === "") return [];
  const pieces = cutAfter(text, SENTENCE_END).flatMap((s) =>
    s.length <= limit ? [s] : cutAfter(s, CLAUSE_END).flatMap((c) => (c.length <= limit ? [c] : hardCut(c, limit))),
  );
  const chunks: string[] = [];
  let cur = "";
  for (const p of pieces) {
    if (cur.length + p.length > limit) {
      if (cur) chunks.push(cur);
      cur = p;
    } else {
      cur += p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// 16 位小端单声道 PCM → 标准 44 字节头的 WAV
export function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // 单声道
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
