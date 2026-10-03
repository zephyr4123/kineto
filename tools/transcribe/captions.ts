// 字幕粒度的纯逻辑。whisper.cpp 逐词出时间戳时按 token 切分：一个汉字常被拆成两个 token、各自解码成 U+FFFD，
// 中日韩文字的逐词结果因此是乱码；短语级结果由整段解码，文字完整。
import type { Caption } from "@remotion/captions";

// 这些语言没有空格分词，逐词结果本来也不适合做字幕：直接按短语出
const PHRASE_LANGUAGES = new Set(["zh", "ja", "ko", "yue"]);

export const wantsPhrases = (language: string): boolean => PHRASE_LANGUAGES.has(language);

export const hasSplitCharacters = (captions: { text: string }[]): boolean => captions.some((c) => c.text.includes("�"));

export function phraseCaptions(segments: { text: string; offsets: { from: number; to: number } }[]): Caption[] {
  return segments
    .map((s) => ({ text: s.text.trim(), startMs: s.offsets.from, endMs: s.offsets.to, timestampMs: null, confidence: null }))
    .filter((c) => c.text !== "");
}
