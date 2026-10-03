import { readdir } from "node:fs/promises";
import path from "node:path";
import { createVideo, listVideos, readVideo, updateVideo } from "../../kernel/catalog/catalog.ts";
import { readCompositionIds } from "../../kernel/catalog/compositions.ts";
import { VideoStatus } from "../../kernel/catalog/schema.ts";
import { readManifest } from "../../kernel/assets/assets.ts";
import { KinetoError } from "../../kernel/errors.ts";
import { videoDir } from "../../kernel/paths.ts";
import { readRenders } from "../../kernel/render/records.ts";
import { syncAll } from "../../kernel/sync/sync.ts";
import { defineCommand, str } from "../command.ts";

export const newCommand = defineCommand({
  name: "new",
  summary: "Create a video from a template and register it",
  args: [{ name: "id", description: "Video id: lowercase letters, digits, hyphens (e.g. corner-hit)" }],
  options: {
    title: { type: "string", required: true, value: "text", description: "Human-readable title" },
    description: { type: "string", value: "text", description: "What the video is about" },
    template: { type: "string", value: "name", description: "Template under templates/ (default: blank)" },
  },
  async run(ctx, { args, flags }) {
    const video = await createVideo(ctx.paths, {
      id: args[0]!,
      title: str(flags, "title")!,
      description: str(flags, "description"),
      template: str(flags, "template"),
    });
    await syncAll(ctx.paths, await ctx.storage());
    const dir = videoDir(ctx.paths, video.id);
    const files = (await readdir(dir, { recursive: true, withFileTypes: true }))
      .filter((f) => f.isFile())
      .map((f) => path.relative(ctx.paths.root, path.join(f.parentPath, f.name)))
      .sort();
    return {
      video,
      files,
      next: [
        `Write the video in videos/${video.id}/ (Video.tsx timeline, scenes/, compositions.tsx registrations)`,
        "Preview with `kineto studio`",
        `Render with \`kineto render ${video.id}\``,
      ],
    };
  },
  human: (d) => `Created ${d.video.id} ("${d.video.title}")\n${d.files.map((f) => `  ${f}`).join("\n")}\n\nNext:\n${d.next.map((n) => `  - ${n}`).join("\n")}`,
});

export const listCommand = defineCommand({
  name: "list",
  summary: "List videos with status and latest render",
  options: {
    status: { type: "string", value: VideoStatus.options.join("|"), description: "Only videos with this status" },
  },
  async run(ctx, { flags }) {
    const status = str(flags, "status");
    if (status !== undefined && !VideoStatus.safeParse(status).success) {
      throw new KinetoError("INVALID_ARGUMENT", `Unknown status "${status}"`, {
        hint: `Use one of: ${VideoStatus.options.join(", ")}.`,
      });
    }
    const videos = (await listVideos(ctx.paths)).filter((v) => !status || v.status === status);
    return {
      videos: await Promise.all(
        videos.map(async (v) => {
          const renders = await readRenders(ctx.paths, v.id);
          const last = renders.at(-1);
          return {
            id: v.id,
            title: v.title,
            status: v.status,
            tags: v.tags,
            updatedAt: v.updatedAt,
            renders: renders.length,
            lastRender: last ? { renderedAt: last.renderedAt, composition: last.composition, key: last.storage.key } : null,
          };
        }),
      ),
    };
  },
  human: (d) =>
    d.videos.length === 0
      ? "No videos yet. Create one with `kineto new <id> --title <text>`."
      : d.videos.map((v) => `${v.id.padEnd(24)} ${v.status.padEnd(9)} renders:${v.renders}  ${v.title}`).join("\n"),
});

export const showCommand = defineCommand({
  name: "show",
  summary: "Show one video: metadata, compositions, assets and render history",
  args: [{ name: "id", description: "Video id" }],
  async run(ctx, { args }) {
    const video = await readVideo(ctx.paths, args[0]!);
    const [manifest, renders, compositions] = await Promise.all([
      readManifest(ctx.paths),
      readRenders(ctx.paths, video.id),
      readCompositionIds(ctx.paths, video.id).catch(() => []),
    ]);
    const assets = Object.entries(video.assets).map(([alias, id]) => {
      const record = manifest.get(id);
      return { alias, staticFile: record ? `${video.id}/${alias}${record.ext}` : null, ...(record ?? { id }) };
    });
    return { video, compositions, assets, renders };
  },
  human: (d) =>
    [
      `${d.video.id}  [${d.video.status}]  ${d.video.title}`,
      d.video.description && `  ${d.video.description}`,
      `compositions: ${d.compositions.join(", ") || "(none)"}`,
      `assets: ${d.assets.map((a) => `${a.alias} → ${a.staticFile ?? "MISSING"}`).join(", ") || "(none)"}`,
      `renders: ${d.renders.length}`,
      ...d.renders.slice(-5).map((r) => `  ${r.renderedAt}  ${r.composition}  ${r.codec}  ${r.storage.key}`),
    ]
      .filter(Boolean)
      .join("\n"),
});

export const updateCommand = defineCommand({
  name: "update",
  summary: "Change a video's title, description, status or tags",
  args: [{ name: "id", description: "Video id" }],
  options: {
    title: { type: "string", value: "text", description: "New title" },
    description: { type: "string", value: "text", description: "New description" },
    status: { type: "string", value: VideoStatus.options.join("|"), description: "New status" },
    tag: { type: "string", multiple: true, value: "tag", description: "Replace tags (repeatable)" },
  },
  async run(ctx, { args, flags }) {
    const tags = flags.tag as string[] | undefined;
    const video = await updateVideo(ctx.paths, args[0]!, {
      title: str(flags, "title"),
      description: str(flags, "description"),
      status: str(flags, "status") as VideoStatus | undefined,
      tags,
    });
    return { video };
  },
  human: (d) => `Updated ${d.video.id}: [${d.video.status}] ${d.video.title}`,
});
