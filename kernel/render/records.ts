// 渲染历史：videos/<id>/renders.jsonl，只追加。一行 = 一次成功渲染，
// 记下复现它所需的一切（composition、编码、git 版本、Remotion 版本）和产物在哪。
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { isNodeError, KinetoError } from "../errors.ts";
import { videoDir, type KinetoPaths } from "../paths.ts";

export const RenderRecord = z
  .object({
    renderedAt: z.iso.datetime(),
    composition: z.string().min(1),
    codec: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().positive(),
    durationInFrames: z.number().int().positive(),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    storage: z.object({ backend: z.string().min(1), key: z.string().min(1), url: z.string().nullable() }).strict(),
    // 渲染时工作区有未提交改动则 dirty=true：这次产物无法仅凭 sha 复现
    git: z.object({ sha: z.string().nullable(), dirty: z.boolean() }).strict(),
    remotion: z.string().min(1),
    elapsedMs: z.number().int().nonnegative(),
  })
  .strict();
export type RenderRecord = z.infer<typeof RenderRecord>;

export const rendersFile = (paths: KinetoPaths, id: string) => path.join(videoDir(paths, id), "renders.jsonl");

export async function readRenders(paths: KinetoPaths, id: string): Promise<RenderRecord[]> {
  let text: string;
  try {
    text = await readFile(rendersFile(paths, id), "utf8");
  } catch (err) {
    if (isNodeError(err, "ENOENT")) return [];
    throw err;
  }
  const out: RenderRecord[] = [];
  text.split("\n").forEach((line, i) => {
    if (line.trim() === "") return;
    let json: unknown;
    try {
      json = JSON.parse(line);
    } catch {
      throw rendersError(id, i + 1, "not valid JSON");
    }
    const parsed = RenderRecord.safeParse(json);
    if (!parsed.success) throw rendersError(id, i + 1, z.prettifyError(parsed.error));
    out.push(parsed.data);
  });
  return out;
}

const rendersError = (id: string, line: number, why: string) =>
  new KinetoError("RENDERS_INVALID", `videos/${id}/renders.jsonl line ${line}: ${why}`, {
    hint: "renders.jsonl is append-only and written by `kineto render`; restore it with git.",
  });

export async function appendRender(paths: KinetoPaths, id: string, record: RenderRecord): Promise<void> {
  await appendFile(rendersFile(paths, id), JSON.stringify(RenderRecord.parse(record)) + "\n");
}
