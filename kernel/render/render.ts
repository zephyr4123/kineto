// 渲染：sync → bundle → selectComposition → renderMedia → 入存储 → 追加 renders.jsonl。
// 走 Node API 而不是 `npx remotion render`：拿得到结构化结果，才能入库和留痕。
import { execFile } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { VERSION } from "remotion/version";
import { readVideo } from "../catalog/catalog.ts";
import type { KinetoConfig } from "../config.ts";
import { KinetoError } from "../errors.ts";
import type { KinetoPaths } from "../paths.ts";
import { sha256File } from "../assets/assets.ts";
import type { StorageBackend } from "../storage/types.ts";
import { syncAll } from "../sync/sync.ts";
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
  if (compositionId !== video.id && !compositionId.startsWith(`${video.id}-`)) {
    throw new KinetoError("COMPOSITION_NOT_IN_VIDEO", `Composition "${compositionId}" does not belong to video "${video.id}"`, {
      hint: `Composition ids of this video are "${video.id}" or start with "${video.id}-".`,
    });
  }
  const codec = options.codec ?? "h264";
  if (!(codec in CODEC_EXTENSIONS)) {
    throw new KinetoError("INVALID_ARGUMENT", `Unsupported codec "${codec}"`, {
      hint: `Use one of: ${Object.keys(CODEC_EXTENSIONS).join(", ")}.`,
    });
  }
  const ext = CODEC_EXTENSIONS[codec as SupportedCodec];

  const synced = await syncAll(paths, storage);
  const missing = synced.missing.filter((m) => m.video === video.id);
  if (missing.length > 0) {
    throw new KinetoError(
      "ASSET_UNAVAILABLE",
      `Assets of "${video.id}" are not in storage: ${missing.map((m) => m.alias).join(", ")}`,
      { hint: "Configure the storage backend that holds them, or re-add the files with `kineto asset add`." },
    );
  }

  const started = Date.now();
  const report = options.onProgress ?? (() => {});
  const serveUrl = await bundle({
    entryPoint: paths.entryPoint,
    publicDir: paths.publicDir,
    rspack: remotionSettings.rspack,
    onProgress: (p) => report({ stage: "bundle", progress: p / 100 }),
  });
  try {
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
    await rm(serveUrl, { recursive: true, force: true });
  }
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
