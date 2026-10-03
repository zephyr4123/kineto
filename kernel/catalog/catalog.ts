// 视频库：videos/<id>/ 一个目录一条记录，video.json 是这条记录的元数据。
// video.json 属于受控区，只经由这里的函数改写，保证每次写入都过 schema。
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { isNodeError, KinetoError } from "../errors.ts";
import { videoDir, type KinetoPaths } from "../paths.ts";
import { compositionOwner, readCompositionIds } from "./compositions.ts";
import { ALIAS_RE, VIDEO_ID_MAX, VIDEO_ID_RE, VideoManifest, VideoStatus } from "./schema.ts";

const MANIFEST_FILE = "video.json";
const TEXT_EXT = new Set([".ts", ".tsx", ".md", ".json"]);

export function assertVideoId(id: string): void {
  if (!VIDEO_ID_RE.test(id) || id.length > VIDEO_ID_MAX) {
    throw new KinetoError("INVALID_ID", `Invalid video id "${id}"`, {
      hint: `Use lowercase letters, digits and single hyphens, at most ${VIDEO_ID_MAX} chars (e.g. corner-hit).`,
    });
  }
}

export async function readVideo(paths: KinetoPaths, id: string): Promise<VideoManifest> {
  const file = path.join(videoDir(paths, id), MANIFEST_FILE);
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (err) {
    if (isNodeError(err, "ENOENT")) {
      throw new KinetoError("VIDEO_NOT_FOUND", `Video "${id}" does not exist`, {
        hint: "Run `./kineto list` to see existing videos, or `./kineto new` to create one.",
      });
    }
    throw err;
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new KinetoError("VIDEO_INVALID", `videos/${id}/${MANIFEST_FILE} is not valid JSON`, { cause: err });
  }
  const parsed = VideoManifest.safeParse(json);
  if (!parsed.success) {
    throw new KinetoError("VIDEO_INVALID", `videos/${id}/${MANIFEST_FILE}: ${z.prettifyError(parsed.error)}`, {
      hint: "video.json is managed by the kineto CLI; restore it with git and change it via `./kineto update`.",
    });
  }
  if (parsed.data.id !== id) {
    throw new KinetoError("VIDEO_INVALID", `videos/${id}/${MANIFEST_FILE} declares id "${parsed.data.id}"`, {
      hint: "The id in video.json must equal its directory name.",
    });
  }
  return parsed.data;
}

export async function listVideoIds(paths: KinetoPaths): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(paths.videosDir, { withFileTypes: true });
  } catch (err) {
    if (isNodeError(err, "ENOENT")) return [];
    throw err;
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

export async function listVideos(paths: KinetoPaths): Promise<VideoManifest[]> {
  return Promise.all((await listVideoIds(paths)).map((id) => readVideo(paths, id)));
}

export interface CreateVideoInput {
  id: string;
  title: string;
  description?: string;
  template?: string;
  now?: Date;
}

export async function createVideo(paths: KinetoPaths, input: CreateVideoInput): Promise<VideoManifest> {
  assertVideoId(input.id);
  if (input.title.trim() === "") {
    throw new KinetoError("INVALID_ARGUMENT", "Title must not be empty", { hint: 'Pass --title "<text>".' });
  }
  const templateName = input.template ?? "blank";
  const templateDir = path.join(paths.templatesDir, templateName);
  const templates = await readdir(paths.templatesDir).catch(() => [] as string[]);
  if (!templates.includes(templateName)) {
    throw new KinetoError("TEMPLATE_NOT_FOUND", `Template "${templateName}" does not exist`, {
      hint: `Available templates: ${templates.join(", ") || "(none)"}.`,
    });
  }
  await assertNamespaceFree(paths, input.id);
  const dir = videoDir(paths, input.id);
  try {
    await cp(templateDir, dir, { recursive: true, errorOnExist: true, force: false });
  } catch (err) {
    if (isNodeError(err, "ERR_FS_CP_EEXIST") || isNodeError(err, "EEXIST")) {
      throw new KinetoError("VIDEO_EXISTS", `Video "${input.id}" already exists`, {
        hint: "Pick another id, or edit the existing video.",
      });
    }
    throw err;
  }
  try {
    // id 占位符只用 composition id 合法字符，模板未替换时也能通过 Remotion 的 lint
    await fillTemplate(dir, { "KINETO-VIDEO-ID": input.id, __KINETO_TITLE__: input.title });
    const at = (input.now ?? new Date()).toISOString();
    return await writeVideo(paths, {
      id: input.id,
      title: input.title,
      description: input.description ?? "",
      status: "draft",
      tags: [],
      createdAt: at,
      updatedAt: at,
      assets: {},
    });
  } catch (err) {
    // 半成品目录比没有更糟：会被 list / check 当成一条坏记录
    await rm(dir, { recursive: true, force: true });
    throw err;
  }
}

export interface VideoPatch {
  title?: string;
  description?: string;
  status?: VideoStatus;
  tags?: string[];
}

export async function updateVideo(
  paths: KinetoPaths,
  id: string,
  patch: VideoPatch,
  now: Date = new Date(),
): Promise<VideoManifest> {
  const current = await readVideo(paths, id);
  const next = { ...current, ...definedOnly(patch), updatedAt: now.toISOString() };
  const parsed = VideoManifest.safeParse(next);
  if (!parsed.success) {
    throw new KinetoError("INVALID_ARGUMENT", z.prettifyError(parsed.error), {
      hint: `Status must be one of: ${VideoStatus.options.join(", ")}.`,
    });
  }
  return writeVideo(paths, parsed.data);
}

export async function linkAsset(
  paths: KinetoPaths,
  id: string,
  alias: string,
  assetId: string,
  now: Date = new Date(),
): Promise<VideoManifest> {
  const current = await readVideo(paths, id);
  assertAliasAvailable(current, alias);
  return writeVideo(paths, {
    ...current,
    assets: { ...current.assets, [alias]: assetId },
    updatedAt: now.toISOString(),
  });
}

// 别名会成为暂存文件名；大小写不敏感的文件系统（macOS 默认）上只差大小写的两个别名会撞成同一个文件
export function assertAliasAvailable(video: VideoManifest, alias: string): void {
  assertAlias(alias);
  const clash = Object.keys(video.assets).find((a) => a !== alias && a.toLowerCase() === alias.toLowerCase());
  if (clash) {
    throw new KinetoError("ALIAS_CONFLICT", `Alias "${alias}" differs from existing alias "${clash}" of ${video.id} only by case`, {
      hint: `Reuse "${clash}" or pick a clearly different alias.`,
    });
  }
}

// 新视频 id 不能「吃掉」已有视频登记过的 composition：w 注册了 w-x-title，就不能再建视频 w-x
async function assertNamespaceFree(paths: KinetoPaths, newId: string): Promise<void> {
  const ids = await listVideoIds(paths);
  for (const owner of ids) {
    const literals = await readCompositionIds(paths, owner).catch(() => [] as (string | null)[]);
    for (const literal of literals) {
      if (literal === null) continue;
      if (compositionOwner(literal, [...ids, newId]) !== compositionOwner(literal, ids)) {
        throw new KinetoError("NAMESPACE_TAKEN", `videos/${owner} already registers composition "${literal}", which would fall under "${newId}"`, {
          hint: `Pick a video id that is not a prefix of existing composition ids, e.g. "${newId}-2" or another name.`,
        });
      }
    }
  }
}

export function assertAlias(alias: string): void {
  if (!ALIAS_RE.test(alias)) {
    throw new KinetoError("INVALID_ALIAS", `Invalid asset alias "${alias}"`, {
      hint: "Use a camelCase identifier such as boop or introMusic; it becomes assets.<alias> in code.",
    });
  }
}

async function writeVideo(paths: KinetoPaths, manifest: VideoManifest): Promise<VideoManifest> {
  const valid = VideoManifest.parse(manifest);
  const file = path.join(videoDir(paths, valid.id), MANIFEST_FILE);
  await writeFile(file, JSON.stringify(valid, null, 2) + "\n");
  return valid;
}

async function fillTemplate(dir: string, tokens: Record<string, string>): Promise<void> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !TEXT_EXT.has(path.extname(entry.name))) continue;
    const file = path.join(entry.parentPath, entry.name);
    const text = await readFile(file, "utf8");
    let out = text;
    for (const [token, value] of Object.entries(tokens)) {
      // 带引号的占位符是字符串字面量位置：整体换成 JSON 转义后的字面量，标题含引号、反斜杠也安全
      // 替换值用函数：字符串形式会把标题里的 $& $$ $` 当成替换模式解释
      const quoted = JSON.stringify(value);
      out = out.replaceAll(`"${token}"`, () => quoted).replaceAll(token, () => value);
    }
    if (out !== text) await writeFile(file, out);
  }
}

const definedOnly = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
