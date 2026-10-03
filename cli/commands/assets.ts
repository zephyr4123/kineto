import { assertAlias, linkAsset, listVideos, readVideo } from "../../kernel/catalog/catalog.ts";
import { KinetoError } from "../../kernel/errors.ts";
import { ingestAsset, readManifest } from "../../kernel/assets/assets.ts";
import { syncAll } from "../../kernel/sync/sync.ts";
import { defineCommand, str, UsageError } from "../command.ts";

export const assetAddCommand = defineCommand({
  name: "asset add",
  summary: "Register a file or URL in the asset library (license required), optionally link it to a video",
  args: [{ name: "source", description: "Local file path or http(s) URL" }],
  options: {
    license: {
      type: "string",
      required: true,
      value: "license",
      description: 'SPDX id (CC0-1.0, CC-BY-4.0, MIT…) or exact terms, e.g. "Pexels License"',
    },
    author: { type: "string", value: "name", description: "Creator / copyright holder" },
    "source-url": { type: "string", value: "url", description: "Where the file came from (defaults to the URL)" },
    description: { type: "string", value: "text", description: "What the asset is" },
    to: { type: "string", value: "video", description: "Link the asset to this video (use with --as)" },
    as: { type: "string", value: "alias", description: "camelCase alias, becomes assets.<alias> in code" },
  },
  mutates: true,
  async run(ctx, { args, flags }) {
    const to = str(flags, "to");
    const alias = str(flags, "as");
    if ((to === undefined) !== (alias === undefined)) {
      throw new UsageError("--to and --as must be used together", "Example: --to corner-hit --as boop");
    }
    // 先把挂接会用到的一切校验完，再入库：避免素材已入库、挂接却失败的半成品状态
    if (to && alias) {
      assertAlias(alias);
      await readVideo(ctx.paths, to);
      await listVideos(ctx.paths);
    }
    const storage = await ctx.storage();
    const asset = await ingestAsset(ctx.paths, storage, {
      source: args[0]!,
      license: str(flags, "license")!,
      author: str(flags, "author"),
      sourceUrl: str(flags, "source-url"),
      description: str(flags, "description"),
    });
    if (!to || !alias) return { asset, linked: null };
    await linkAsset(ctx.paths, to, alias, asset.id);
    await syncAll(ctx.paths, storage);
    return { asset, linked: { video: to, alias, staticFile: `${to}/${alias}${asset.ext}` } };
  },
  human: (d) =>
    `Added ${d.asset.id} (${d.asset.ext}, ${d.asset.bytes} bytes, ${d.asset.license})` +
    (d.linked
      ? `\nLinked to ${d.linked.video} as "${d.linked.alias}": staticFile(assets.${d.linked.alias}) → ${d.linked.staticFile}`
      : ""),
});

export const assetLinkCommand = defineCommand({
  name: "asset link",
  summary: "Link an already registered asset to a video (no re-upload, metadata untouched)",
  args: [{ name: "asset-id", description: "sha256:… id from `kineto asset list`" }],
  options: {
    to: { type: "string", required: true, value: "video", description: "Video to link the asset to" },
    as: { type: "string", required: true, value: "alias", description: "camelCase alias, becomes assets.<alias> in code" },
  },
  mutates: true,
  async run(ctx, { args, flags }) {
    const [assetId] = args as [string];
    const to = str(flags, "to")!;
    const alias = str(flags, "as")!;
    assertAlias(alias);
    const asset = (await readManifest(ctx.paths)).get(assetId);
    if (!asset) {
      throw new KinetoError("ASSET_NOT_FOUND", `No asset ${assetId} in the library`, {
        hint: "Run `kineto asset list` for ids, or register the file with `kineto asset add`.",
      });
    }
    await listVideos(ctx.paths);
    await linkAsset(ctx.paths, to, alias, asset.id);
    await syncAll(ctx.paths, await ctx.storage());
    return { asset, linked: { video: to, alias, staticFile: `${to}/${alias}${asset.ext}` } };
  },
  human: (d) => `Linked ${d.asset.id} to ${d.linked.video} as "${d.linked.alias}": staticFile(assets.${d.linked.alias})`,
});

export const assetListCommand = defineCommand({
  name: "asset list",
  summary: "List registered assets, or the assets linked to one video",
  options: {
    video: { type: "string", value: "id", description: "Only assets linked to this video, with their aliases" },
  },
  async run(ctx, { flags }) {
    const manifest = await readManifest(ctx.paths);
    const videoId = str(flags, "video");
    if (!videoId) return { assets: [...manifest.values()] };
    const video = await readVideo(ctx.paths, videoId);
    return {
      assets: Object.entries(video.assets).map(([alias, id]) => ({ alias, ...(manifest.get(id) ?? { id, missing: true }) })),
    };
  },
  human: (d) =>
    d.assets.length === 0
      ? "No assets."
      : d.assets
          .map((a) => `${"alias" in a ? `${a.alias}: ` : ""}${a.id}${"ext" in a ? ` ${a.ext} ${a.license}` : " MISSING"}`)
          .join("\n"),
});
