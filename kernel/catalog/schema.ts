import { z } from "zod";

// 视频 id 同时用作目录名、Remotion composition id 前缀和 <Folder> 名，
// 所以取三者交集：小写字母数字 + 单个连字符
export const VIDEO_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const VIDEO_ID_MAX = 48;
// 素材别名会成为生成代码里的属性名（assets.boop），必须是合法标识符
export const ALIAS_RE = /^[a-z][a-zA-Z0-9]*$/;
export const ASSET_ID_RE = /^sha256:[0-9a-f]{64}$/;

export const VideoStatus = z.enum(["draft", "review", "published", "archived"]);
export type VideoStatus = z.infer<typeof VideoStatus>;

export const VideoManifest = z
  .object({
    id: z.string().regex(VIDEO_ID_RE).max(VIDEO_ID_MAX),
    title: z.string().min(1),
    description: z.string(),
    status: VideoStatus,
    tags: z.array(z.string().min(1)),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    // 规格（尺寸 / fps / 时长）不在这里：唯一真相源是 compositions.tsx，Studio 改了会写回那里
    assets: z.record(z.string().regex(ALIAS_RE), z.string().regex(ASSET_ID_RE)),
  })
  .strict();
export type VideoManifest = z.infer<typeof VideoManifest>;
