import path from "node:path";
import { KinetoError } from "../errors.ts";

// 各后端共用的 key 规矩：相对、规范化、不越界，否则拒绝
export function assertSafeKey(key: string): void {
  const normalized = path.posix.normalize(key);
  if (path.posix.isAbsolute(key) || normalized.startsWith("..") || normalized !== key) {
    throw new KinetoError("INVALID_STORAGE_KEY", `Unsafe storage key: ${key}`);
  }
}

// 远端对象要带对的 Content-Type，浏览器才会直接播放 / 显示，而不是当成下载
const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".gif": "image/gif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".json": "application/json",
  ".srt": "application/x-subrip",
  ".vtt": "text/vtt",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export const contentTypeFor = (key: string): string =>
  CONTENT_TYPES[path.posix.extname(key).toLowerCase()] ?? "application/octet-stream";
