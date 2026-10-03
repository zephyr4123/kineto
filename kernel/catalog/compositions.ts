// 静态扫描 compositions.tsx 里登记的 composition id（不执行代码，CI 里也能跑）。
// 官方 skill 要求 id 写成 JSX 字符串字面量，所以字面量扫描是可靠的；非字面量返回 null 交给 check 报错。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { videoDir, type KinetoPaths } from "../paths.ts";

export const COMPOSITIONS_FILE = "compositions.tsx";

export function scanCompositionIds(source: string): (string | null)[] {
  return [...source.matchAll(/\bid=(?:"([^"]*)"|'([^']*)'|\{)/g)].map((m) => m[1] ?? m[2] ?? null);
}

export async function readCompositionIds(paths: KinetoPaths, id: string): Promise<(string | null)[]> {
  return scanCompositionIds(await readFile(path.join(videoDir(paths, id), COMPOSITIONS_FILE), "utf8"));
}
