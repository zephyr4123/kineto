// 工具插件宿主：发现 tools/<name>/index.ts，按配置启用，运行，把产物带着许可证与来历收进素材库。
// 热插拔：插件目录放进来就能被发现，kineto.config.yaml 里写了 tools.<name> 才会运行；
// 核心命令从不导入插件，一个插件坏了只影响它自己。
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { assetStorageKey, ingestAsset, readManifest, type AssetRecord } from "../assets/assets.ts";
import { ASSET_ID_RE } from "../catalog/schema.ts";
import { assertAliasAvailable, linkAsset, readVideo } from "../catalog/catalog.ts";
import type { LoadedConfig } from "../config.ts";
import { isNodeError, KinetoError } from "../errors.ts";
import { withFileLock, withRepoLock } from "../lock.ts";
import type { KinetoPaths } from "../paths.ts";
import type { StorageBackend } from "../storage/types.ts";
import { syncAll } from "../sync/sync.ts";
import { removeOrphanedWorkDirs } from "../workdirs.ts";
import type { ToolInput, ToolSpec } from "./define.ts";

const TOOL_NAME_RE = /^[a-z][a-z0-9-]*$/;

export interface ToolListing {
  name: string;
  summary?: string;
  enabled: boolean;
  // 导入或声明有问题时的原因；有 error 就运行不了
  error?: string;
}

export async function listTools(paths: KinetoPaths, loaded: LoadedConfig): Promise<ToolListing[]> {
  const listing: ToolListing[] = [];
  for (const name of await toolNames(paths)) {
    const enabled = Object.hasOwn(loaded.config.tools, name);
    try {
      listing.push({ name, summary: (await loadTool(paths, name)).summary, enabled });
    } catch (err) {
      listing.push({ name, enabled, error: (err as Error).message });
    }
  }
  return listing;
}

export async function loadTool(paths: KinetoPaths, name: string): Promise<ToolSpec> {
  if (!TOOL_NAME_RE.test(name) || !(await toolNames(paths)).includes(name)) {
    throw new KinetoError("TOOL_NOT_FOUND", `No tool named "${name}"`, { hint: "Run `./kineto tool list` to see the tools." });
  }
  let mod: { default?: unknown };
  try {
    mod = (await import(pathToFileURL(path.join(paths.toolsDir, name, "index.ts")).href)) as { default?: unknown };
  } catch (err) {
    throw new KinetoError("TOOL_INVALID", `tools/${name} failed to load: ${(err as Error).message}`, {
      hint: `Fix tools/${name}/index.ts; heavy dependencies belong inside run(), not at the top level.`,
      cause: err,
    });
  }
  const spec = mod.default as Partial<ToolSpec> | undefined;
  if (!spec || spec.name !== name || typeof spec.run !== "function" || typeof spec.summary !== "string" || !spec.config) {
    throw new KinetoError("TOOL_INVALID", `tools/${name}/index.ts must default-export defineTool({ name: "${name}", summary, config, run })`, {
      hint: "See tools/README.md for the plugin contract.",
    });
  }
  return spec as ToolSpec;
}

export interface RunToolInput {
  args: string[];
  // 插件自己的选项，外加通用的 --license
  flags: Record<string, string | boolean | undefined>;
  to?: string;
  as?: string;
  onProgress?: (message: string) => void;
}

export interface RunToolResult {
  tool: string;
  asset: AssetRecord;
  linked: { video: string; alias: string; staticFile: string } | null;
}

export async function runTool(
  paths: KinetoPaths,
  storage: StorageBackend,
  loaded: LoadedConfig,
  spec: ToolSpec,
  input: RunToolInput,
): Promise<RunToolResult> {
  const { tools } = loaded.config;
  const { to, as: alias } = input;
  // 先把一切能提前发现的错误拦下，再运行：工具可能按次计费，也可能跑很久
  if (!Object.hasOwn(tools, spec.name)) {
    throw new KinetoError("TOOL_NOT_ENABLED", `Tool "${spec.name}" is not enabled`, {
      hint: `Add it to kineto.config.yaml (see kineto.config.example.yaml for its settings):\ntools:\n  ${spec.name}:`,
    });
  }
  const parsed = spec.config.safeParse(loaded.expand(tools[spec.name] ?? {}));
  if (!parsed.success) {
    throw new KinetoError("CONFIG_INVALID", `Invalid tools.${spec.name} in kineto.config.yaml: ${z.prettifyError(parsed.error)}`, {
      hint: "Compare with kineto.config.example.yaml.",
    });
  }
  if ((to === undefined) !== (alias === undefined)) {
    throw new KinetoError("INVALID_ARGUMENT", "--to and --as must be used together", { hint: "Example: --to promo --as voice" });
  }
  const video = to ? await readVideo(paths, to) : undefined;
  if (video && alias) assertAliasAvailable(video, alias);
  const licenseOverride = input.flags.license;
  if (licenseOverride !== undefined && (typeof licenseOverride !== "string" || licenseOverride.trim() === "")) {
    throw new KinetoError("LICENSE_REQUIRED", "--license must not be empty", {
      hint: "Pass an SPDX id or the exact terms, or leave --license out to keep the license the tool records.",
    });
  }
  // 产物最后要进存储：存储不可用就别先花钱生成
  await storage.probe({ write: true });

  await removeOrphanedWorkDirs(paths);
  const workDir = path.join(paths.tmpDir, `tool-${process.pid}-${Date.now()}`);
  const dataDir = path.join(paths.stateDir, "tools", spec.name);
  await Promise.all([mkdir(workDir, { recursive: true }), mkdir(dataDir, { recursive: true })]);
  try {
    const output = await spec.run({
      config: parsed.data,
      args: input.args,
      flags: input.flags,
      workDir,
      dataDir,
      // 首次安装可能要几分钟，等锁的上限放宽
      lock: (fn) => withFileLock(path.join(dataDir, "lock"), fn, { timeoutMs: 30 * 60_000 }),
      input: (ref) => resolveInput(paths, storage, video, ref),
      progress: input.onProgress ?? (() => {}),
    });
    const file = path.resolve(workDir, output.file);
    const rel = path.relative(workDir, file);
    if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
      throw new KinetoError("TOOL_INVALID", `tools/${spec.name} returned ${output.file}, which is outside its workDir`, {
        hint: "A plugin must write its result inside ctx.workDir.",
      });
    }
    let asset: AssetRecord;
    try {
      asset = await ingestAsset(paths, storage, {
        source: file,
        license: typeof licenseOverride === "string" ? licenseOverride : output.license,
        author: output.author,
        description: output.description,
        sourceUrl: output.sourceUrl,
      });
    } catch (err) {
      // 工具可能刚花了钱：入库失败也不能让产物随 workDir 一起删掉
      throw await keepResult(err, file, dataDir);
    }
    if (!video || !alias) return { tool: spec.name, asset, linked: null };
    await withRepoLock(paths, async () => {
      await linkAsset(paths, video.id, alias, asset.id);
      await syncAll(paths, storage);
    }).catch((err: unknown) => {
      // 产物已经入库：告诉对方去挂接它，别为了挂接重跑一次（可能付费的）工具
      const hint = `The result is already registered as ${asset.id}; link it with \`./kineto asset link ${asset.id} --to ${video.id} --as ${alias}\` instead of running the tool again.`;
      if (err instanceof KinetoError) throw new KinetoError(err.code, `${err.message} (result registered as ${asset.id})`, { hint, cause: err });
      throw new KinetoError("TOOL_RESULT_UNLINKED", `${(err as Error).message} (result registered as ${asset.id})`, { hint, cause: err });
    });
    return { tool: spec.name, asset, linked: { video: video.id, alias, staticFile: `${video.id}/${alias}${asset.ext}` } };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function keepResult(err: unknown, file: string, dataDir: string): Promise<unknown> {
  // 没有可保留的产物（插件返回了不存在的路径等）：原样报原来的错，不留空目录
  if (!(await stat(file).then((s) => s.isFile(), () => false))) return err;
  const kept = path.join(dataDir, "unsaved", `${new Date().toISOString().replace(/[:.]/g, "-")}-${path.basename(file)}`);
  try {
    await mkdir(path.dirname(kept), { recursive: true });
    await copyFile(file, kept);
  } catch {
    return err;
  }
  const hint = `The result was kept at ${kept}; fix the problem, then register it with \`./kineto asset add\`.`;
  if (err instanceof KinetoError) {
    return new KinetoError(err.code, `${err.message} (result kept at ${kept})`, { hint: err.hint ? `${err.hint} ${hint}` : hint, cause: err });
  }
  return new KinetoError("TOOL_RESULT_UNSAVED", `${(err as Error).message} (result kept at ${kept})`, { hint, cause: err });
}

// 输入只收素材库里的东西：来历和许可证已知，产物才能继承它们
async function resolveInput(
  paths: KinetoPaths,
  storage: StorageBackend,
  video: { id: string; assets: Record<string, string> } | undefined,
  ref: string,
): Promise<ToolInput> {
  let id = ref;
  if (!ASSET_ID_RE.test(ref)) {
    if (!video) {
      throw new KinetoError("INVALID_ARGUMENT", `Cannot resolve input "${ref}" without --to`, {
        hint: "Pass --to <video> to use one of its aliases, or a sha256:… asset id.",
      });
    }
    if (!Object.hasOwn(video.assets, ref)) {
      throw new KinetoError("ASSET_NOT_LINKED", `videos/${video.id} has no asset alias "${ref}"`, {
        hint: "Register the input first with `./kineto asset add … --to <video> --as <alias>`.",
      });
    }
    id = video.assets[ref]!;
  }
  const record = (await readManifest(paths)).get(id);
  if (!record) {
    throw new KinetoError("ASSET_NOT_FOUND", `Unknown asset ${id}`, { hint: "List assets with `./kineto asset list`." });
  }
  return { file: await storage.fetch(assetStorageKey(record)), record };
}

async function toolNames(paths: KinetoPaths): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(paths.toolsDir, { withFileTypes: true });
  } catch (err) {
    if (isNodeError(err, "ENOENT")) return [];
    throw err;
  }
  // 下划线开头的目录放插件之间共享的代码
  return entries
    .filter((e) => e.isDirectory() && TOOL_NAME_RE.test(e.name))
    .map((e) => e.name)
    .sort();
}
