// 静态扫描 compositions.tsx 里登记的 composition id（不执行代码，CI 里也能跑）。
// 官方 skill 要求 id 写成 JSX 字符串字面量，所以字面量扫描是可靠的；非字面量返回 null 交给 check 报错。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { videoDir, type KinetoPaths } from "../paths.ts";

export const COMPOSITIONS_FILE = "compositions.tsx";

export function scanCompositionIds(source: string): (string | null)[] {
  return [...source.matchAll(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|\{)/g)].map((m) => m[1] ?? m[2] ?? null);
}

// composition id 归属哪条视频：取最长的匹配视频 id。
// 视频 w 与 w-x 同时存在时，w-x-intro 属于 w-x——w 不能注册它，也不能渲染它。
export function compositionOwner(compositionId: string, videoIds: string[]): string | undefined {
  return videoIds
    .filter((v) => compositionId === v || compositionId.startsWith(`${v}-`))
    .sort((a, b) => b.length - a.length)[0];
}

export async function readCompositionIds(paths: KinetoPaths, id: string): Promise<(string | null)[]> {
  return scanCompositionIds(await readFile(path.join(videoDir(paths, id), COMPOSITIONS_FILE), "utf8"));
}
