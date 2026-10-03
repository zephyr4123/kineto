// 渲染：暂存这条视频 → 只打包这条视频 → selectComposition → renderMedia → 入存储 → 追加 renders.jsonl。
// 走 Node API 而不是 `npx remotion render`：拿得到结构化结果，才能入库和留痕。
// 只打包目标视频是硬要求：别的视频模块顶层就加载素材（官方字体示例即如此），
// 一条视频缺素材或写坏了，不能拖累整个仓库都渲染不了。
import { execFile } from "node:child_process";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { VERSION } from "remotion/version";
import { listVideoIds, readVideo } from "../catalog/catalog.ts";
import { compositionOwner } from "../catalog/compositions.ts";
import type { KinetoConfig } from "../config.ts";
import { KinetoError } from "../errors.ts";
import type { KinetoPaths } from "../paths.ts";
import { sha256File } from "../assets/assets.ts";
import type { StorageBackend } from "../storage/types.ts";
import { withRepoLock } from "../lock.ts";
import { syncVideo } from "../sync/sync.ts";
import { appendRender, type RenderRecord } from "./records.ts";
import { remotionSettings } from "./settings.ts";

// 只开放有明确用途的编码；扩展名表自己维护，不依赖 Remotion 的内部 API
export const CODEC_EXTENSIONS = {
  h264: "mp4",
  h265: "mp4",
  vp8: "webm",
  vp9: "webm",
  prores: "mov",
  gif: "gif",
} as const;
export type SupportedCodec = keyof typeof CODEC_EXTENSIONS;

export interface RenderProgress {
  stage: "bundle" | "render";
  // 0~1
  progress: number;
}

export interface RenderOptions {
  id: string;
  composition?: string;
  codec?: string;
  onProgress?: (p: RenderProgress) => void;
}

export interface RenderResult {
  record: RenderRecord;
  file: string;
}

export async function renderVideo(
  paths: KinetoPaths,
  storage: StorageBackend,
  config: KinetoConfig,
  options: RenderOptions,
): Promise<RenderResult> {
  const video = await readVideo(paths, options.id);
  const compositionId = options.composition ?? video.id;
  if (compositionOwner(compositionId, await listVideoIds(paths)) !== video.id) {
    throw new KinetoError("COMPOSITION_NOT_IN_VIDEO", `Composition "${compositionId}" does not belong to video "${video.id}"`, {
      hint: `Composition ids of this video are "${video.id}" or start with "${video.id}-".`,
    });
  }
  const codec = options.codec ?? "h264";
  if (!Object.hasOwn(CODEC_EXTENSIONS, codec)) {
    throw new KinetoError("INVALID_ARGUMENT", `Unsupported codec "${codec}"`, {
      hint: `Use one of: ${Object.keys(CODEC_EXTENSIONS).join(", ")}.`,
    });
  }
  const ext = CODEC_EXTENSIONS[codec as SupportedCodec];

  // 本次渲染专用的 public dir：只含这条视频的素材，打包时也不怕别的命令同时重建共享暂存区
  const workDir = path.join(paths.tmpDir, `render-${process.pid}-${Date.now()}`);
  const publicDir = path.join(workDir, "public");
  const entryPoint = videoEntryFile(paths, video.id);
  const { missing } = await withRepoLock(paths, async () => {
    const synced = await syncVideo(paths, storage, video, publicDir);
    await writeVideoEntry(paths, video.id);
    return synced;
  });
  if (missing.length > 0) {
    await rm(workDir, { recursive: true, force: true });
    throw new KinetoError(
      "ASSET_UNAVAILABLE",
      `Assets of "${video.id}" are not in storage: ${missing.map((m) => m.alias).join(", ")}`,
      { hint: "Configure the storage backend that holds them, or re-add the files with `kineto asset add`." },
    );
  }

  const started = Date.now();
  const report = options.onProgress ?? (() => {});
  let serveUrl: string | undefined;
  try {
    serveUrl = await bundle({
      entryPoint,
      publicDir,
      rspack: remotionSettings.rspack,
      onProgress: (p) => report({ stage: "bundle", progress: p / 100 }),
    });
    const composition = await selectComposition({ serveUrl, id: compositionId, inputProps: {}, logLevel: "error" }).catch(
      (err: unknown) => {
        throw new KinetoError("COMPOSITION_NOT_FOUND", `Cannot load composition "${compositionId}": ${(err as Error).message}`, {
          hint: `Check the ids registered in videos/${video.id}/compositions.tsx, then run \`kineto check\`.`,
          cause: err,
        });
      },
    );

    await mkdir(paths.tmpDir, { recursive: true });
    const tmp = path.join(paths.tmpDir, `${compositionId}-${process.pid}-${Date.now()}.${ext}`);
    await renderMedia({
      serveUrl,
      composition,
      codec: codec as SupportedCodec,
      outputLocation: tmp,
      inputProps: {},
      imageFormat: remotionSettings.videoImageFormat,
      licenseKey: config.remotion.licenseKey,
      logLevel: "error",
      onProgress: ({ progress }) => report({ stage: "render", progress }),
    });

    try {
      const [hex, { size }] = await Promise.all([sha256File(tmp), stat(tmp)]);
      const key = `renders/${video.id}/${compositionId}-${hex.slice(0, 12)}.${ext}`;
      const stored = await storage.put(tmp, key);
      const record: RenderRecord = {
        renderedAt: new Date().toISOString(),
        composition: compositionId,
        codec,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        bytes: size,
        sha256: hex,
        storage: { backend: stored.backend, key: stored.key, url: stored.url },
        git: await gitState(paths.root),
        remotion: VERSION,
        elapsedMs: Date.now() - started,
      };
      await appendRender(paths, video.id, record);
      return { record, file: await storage.fetch(key) };
    } finally {
      await rm(tmp, { force: true });
    }
  } finally {
    if (serveUrl) await rm(serveUrl, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
  }
}

export const videoEntryFile = (paths: KinetoPaths, id: string) => path.join(paths.stateDir, "entries", `${id}.tsx`);

// 单视频入口：只注册这一条视频，供 render 和 `kineto studio <id>` 使用
export async function writeVideoEntry(paths: KinetoPaths, id: string): Promise<string> {
  const file = videoEntryFile(paths, id);
  const compositions = path.relative(path.dirname(file), path.join(paths.videosDir, id, "compositions")).split(path.sep).join("/");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    `// 由 kineto 生成：只注册视频 ${id}，其它视频的代码与素材都不参与打包\n` +
      `import { Folder, registerRoot } from "remotion";\n` +
      `import { Compositions } from "${compositions}";\n\n` +
      `const Root: React.FC = () => (\n  <Folder name="${id}">\n    <Compositions />\n  </Folder>\n);\n\n` +
      `registerRoot(Root);\n`,
  );
  return file;
}

const run = promisify(execFile);

async function gitState(cwd: string): Promise<RenderRecord["git"]> {
  try {
    const [{ stdout: sha }, { stdout: status }] = await Promise.all([
      run("git", ["rev-parse", "HEAD"], { cwd }),
      run("git", ["status", "--porcelain"], { cwd }),
    ]);
    return { sha: sha.trim(), dirty: status.trim() !== "" };
  } catch {
    // 不在 git 仓库里（或还没有任何提交）：如实记为未知，不阻断渲染
    return { sha: null, dirty: true };
  }
}
