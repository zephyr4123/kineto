// 渲染：暂存这条视频 → 只打包这条视频 → selectComposition → renderMedia（<Still> 走 renderStill）→ 入存储 → 追加 renders.jsonl。
// 走 Node API 而不是 `npx remotion render`：拿得到结构化结果，才能入库和留痕。
// 只打包目标视频是硬要求：别的视频模块顶层就加载素材（官方字体示例即如此），
// 一条视频缺素材或写坏了，不能拖累整个仓库都渲染不了。
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { VERSION } from "remotion/version";
import { listVideoIds, readVideo } from "../catalog/catalog.ts";
import { compositionOwner } from "../catalog/compositions.ts";
import type { KinetoConfig } from "../config.ts";
import { KinetoError } from "../errors.ts";
import type { KinetoPaths } from "../paths.ts";
import { sha256File } from "../hash.ts";
import type { StorageBackend } from "../storage/types.ts";
import { withRepoLock } from "../lock.ts";
import { removeOrphanedWorkDirs } from "../workdirs.ts";
import { syncVideo, type MissingAsset } from "../sync/sync.ts";
import { gitState } from "./git.ts";
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

// <Still>（只有一帧的 composition）出图片，如封面、缩略图
export const STILL_EXTENSIONS = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
} as const;
export type StillFormat = keyof typeof STILL_EXTENSIONS;

export interface RenderProgress {
  stage: "bundle" | "render";
  // 0~1
  progress: number;
}

export interface RenderOptions {
  id: string;
  composition?: string;
  codec?: string;
  // 只给 GIF：每 n 帧取一帧
  everyNthFrame?: number;
  onProgress?: (p: RenderProgress) => void;
}

export interface RenderResult {
  record: RenderRecord;
  file: string;
}

// 缺失与损坏分开报：损坏的重新 asset add 不会重传（远端看起来完好），要给出能真正修好的命令
export function assetsUnavailable(videoId: string, missing: MissingAsset[]): KinetoError {
  const corrupt = missing.filter((m) => m.reason === "corrupt");
  const absent = missing.filter((m) => m.reason !== "corrupt");
  if (corrupt.length > 0) {
    const alsoMissing = absent.length > 0 ? `; missing: ${absent.map((m) => m.alias).join(", ")}` : "";
    return new KinetoError("STORAGE_OBJECT_CORRUPT", `Assets of "${videoId}" are damaged in storage: ${corrupt.map((m) => `"${m.alias}"`).join(", ")}${alsoMissing}`, {
      hint: "Re-upload it with the original file: `./kineto asset add <file> --license <license> --reupload`, or `./kineto storage push --reupload` from a machine whose local store has it.",
    });
  }
  return new KinetoError("ASSET_UNAVAILABLE", `Assets of "${videoId}" are not in storage: ${missing.map((m) => m.alias).join(", ")}`, {
    hint: "Configure the storage backend that holds them, or re-add the files with `./kineto asset add`.",
  });
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
  const nth = options.everyNthFrame;
  if (nth !== undefined && (!Number.isInteger(nth) || nth < 1 || (options.codec ?? "h264") !== "gif")) {
    throw new KinetoError("INVALID_ARGUMENT", "--every-nth-frame takes a positive integer and only works with --codec gif", {
      hint: "Example: --codec gif --every-nth-frame 3",
    });
  }
  // 是不是 <Still> 要打包后才知道；未知格式先在这里拦下，不白白打包一次
  if (options.codec !== undefined && !Object.hasOwn(CODEC_EXTENSIONS, options.codec) && !Object.hasOwn(STILL_EXTENSIONS, options.codec)) {
    throw new KinetoError("INVALID_ARGUMENT", `Unsupported codec "${options.codec}"`, {
      hint: `Videos: ${Object.keys(CODEC_EXTENSIONS).join(", ")}. Stills: ${Object.keys(STILL_EXTENSIONS).join(", ")}.`,
    });
  }

  // 本次渲染专用的工作目录：public dir 只含这条视频的素材、入口文件也是私有的，
  // 打包期间不怕别的命令同时重建共享暂存区或改写共享入口；无论成败最后整个删掉
  await removeOrphanedWorkDirs(paths);
  const workDir = path.join(paths.tmpDir, `render-${process.pid}-${Date.now()}`);
  const publicDir = path.join(workDir, "public");
  const started = Date.now();
  const report = options.onProgress ?? (() => {});
  let serveUrl: string | undefined;
  try {
    const { missing } = await withRepoLock(paths, () => syncVideo(paths, storage, video, publicDir));
    if (missing.length > 0) throw assetsUnavailable(video.id, missing);
    const entryPoint = await writeVideoEntry(paths, video.id, path.join(workDir, "entry.tsx"));
    serveUrl = await bundle({
      entryPoint,
      publicDir,
      rspack: remotionSettings.rspack,
      onProgress: (p) => report({ stage: "bundle", progress: p / 100 }),
    });
    const composition = await selectComposition({ serveUrl, id: compositionId, inputProps: {}, logLevel: "error" }).catch(
      (err: unknown) => {
        throw new KinetoError("COMPOSITION_NOT_FOUND", `Cannot load composition "${compositionId}": ${(err as Error).message}`, {
          hint: `Check the ids registered in videos/${video.id}/compositions.tsx, then run \`./kineto check\`.`,
          cause: err,
        });
      },
    );

    const isStill = composition.durationInFrames === 1;
    const codec = options.codec ?? (isStill ? "png" : "h264");
    if (isStill !== Object.hasOwn(STILL_EXTENSIONS, codec)) {
      throw new KinetoError("INVALID_ARGUMENT", `"${compositionId}" is a ${isStill ? "still" : "video"}; "${codec}" is not`, {
        hint: isStill
          ? `Render a <Still> as ${Object.keys(STILL_EXTENSIONS).join(", ")} (default png).`
          : `Render a video as ${Object.keys(CODEC_EXTENSIONS).join(", ")} (default h264).`,
      });
    }
    // 浏览器把帧间隔不到 20ms 的 GIF 当 100ms 放：60fps 的 GIF 会变成慢动作，不如直接拒绝
    if (codec === "gif" && composition.fps / (nth ?? 1) > 50) {
      throw new KinetoError("INVALID_ARGUMENT", `A ${composition.fps} fps GIF plays in slow motion in browsers`, {
        hint: `Add --every-nth-frame ${Math.ceil(composition.fps / 30)} (≤ 30 fps plays at the right speed).`,
      });
    }
    const ext = isStill ? STILL_EXTENSIONS[codec as StillFormat] : CODEC_EXTENSIONS[codec as SupportedCodec];
    const tmp = path.join(workDir, `${compositionId}.${ext}`);
    if (isStill) {
      await renderStill({
        serveUrl,
        composition,
        output: tmp,
        inputProps: {},
        imageFormat: codec as StillFormat,
        licenseKey: config.remotion.licenseKey,
        logLevel: "error",
      });
    } else {
      await renderMedia({
        serveUrl,
        composition,
        codec: codec as SupportedCodec,
        outputLocation: tmp,
        inputProps: {},
        // GIF 也用 JPEG 中间帧，别改成 PNG：在 kineto-promo-teaser 上实测，PNG 帧经 Remotion 的
        // palettegen/paletteuse 流程会静默丢掉开头的帧（126 帧只剩最后 83 帧），JPEG 帧不丢。
        // 合成的测试画面触发不了，所以这一条没有自动化测试守着
        imageFormat: remotionSettings.videoImageFormat,
        everyNthFrame: nth ?? 1,
        licenseKey: config.remotion.licenseKey,
        logLevel: "error",
        onProgress: ({ progress }) => report({ stage: "render", progress }),
      });
    }

    try {
      const [hex, { size }] = await Promise.all([sha256File(tmp), stat(tmp)]);
      const key = `renders/${video.id}/${compositionId}-${hex.slice(0, 12)}.${ext}`;
      const stored = await storage.put(tmp, key, { sha256: hex });
      const record: RenderRecord = {
        renderedAt: new Date().toISOString(),
        composition: compositionId,
        codec,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        ...(nth !== undefined && nth > 1 ? { everyNthFrame: nth } : {}),
        bytes: size,
        sha256: hex,
        storage: { backend: stored.backend, key: stored.key, url: stored.url },
        git: await gitState(paths.root),
        remotion: VERSION,
        elapsedMs: Date.now() - started,
      };
      await withRepoLock(paths, () => appendRender(paths, video.id, record));
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

// 单视频入口：只注册这一条视频。render 写进自己的工作目录，`./kineto studio <id>` 用 .kineto/entries/<id>.tsx
export async function writeVideoEntry(paths: KinetoPaths, id: string, file: string = videoEntryFile(paths, id)): Promise<string> {
  const compositions = path.relative(path.dirname(file), path.join(paths.videosDir, id, "compositions")).split(path.sep).join("/");
  await mkdir(path.dirname(file), { recursive: true });
  // 先写临时文件再 rename：正在打包的进程不会读到写了一半的入口
  const partial = `${file}.partial-${process.pid}`;
  await writeFile(
    partial,
    `// 由 kineto 生成：只注册视频 ${id}，其它视频的代码与素材都不参与打包\n` +
      `import { Folder, registerRoot } from "remotion";\n` +
      `import { Compositions } from "${compositions}";\n\n` +
      `const Root: React.FC = () => (\n  <Folder name="${id}">\n    <Compositions />\n  </Folder>\n);\n\n` +
      `registerRoot(Root);\n`,
  );
  await rename(partial, file);
  return file;
}

