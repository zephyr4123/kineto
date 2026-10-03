import path from "node:path";
import { KinetoError } from "../../kernel/errors.ts";
import { pushObjects } from "../../kernel/push/push.ts";
import { LocalStorage } from "../../kernel/storage/local.ts";
import { defineCommand } from "../command.ts";

export const storagePushCommand = defineCommand({
  name: "storage push",
  summary: "Upload the assets and renders this machine has into the shared storage backend",
  async run(ctx) {
    const { config } = await ctx.config();
    if (config.storage.backend === "local") {
      throw new KinetoError("STORAGE_PUSH_NOOP", "storage.backend is local, so there is nothing to push to", {
        hint: "Configure a shared backend (storage.backend: s3) in kineto.config.yaml first.",
      });
    }
    // 来源固定是本机的本地存储目录：切到共享后端之前，所有对象都在那里
    const from = new LocalStorage(path.resolve(ctx.paths.root, config.storage.local.root));
    const to = await ctx.storage();
    const { objects } = await pushObjects(ctx.paths, from, to, (i, n) => ctx.progress(`push ${i + 1}/${n}`));
    const count = (s: string) => objects.filter((o) => o.status === s).length;
    const missing = (kind: string) => objects.filter((o) => o.status === "missing" && o.kind === kind).map((o) => o.key);
    return {
      to: to.describe(),
      uploaded: count("uploaded"),
      present: count("present"),
      missingAssets: missing("asset"),
      missingRenders: missing("render"),
      objects,
    };
  },
  // 缺素材就不算通过：别的机器渲染不了。渲染产物可以合法删除（草稿、腾空间），renders.jsonl 只是历史
  exitCode: (d) => (d.missingAssets.length > 0 ? 1 : 0),
  human: (d) =>
    [
      `Uploaded ${d.uploaded}, already there ${d.present}.`,
      ...d.objects.filter((o) => o.status === "uploaded" && o.url).map((o) => `  ${o.url}`),
      ...d.missingAssets.map((k) => `error: asset ${k} is neither on this machine nor in the shared storage`),
      d.missingRenders.length > 0 && `${d.missingRenders.length} older render(s) are no longer stored anywhere (history only).`,
    ]
      .filter(Boolean)
      .join("\n"),
});
