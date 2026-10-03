// 换到共享存储后端（如 COS）时，把本机已有的对象补传上去：只传素材库与渲染记录引用到的，
// 内容寻址的 key 不变，所以记录本身一行都不用改。
import { assetStorageKey, readManifest } from "../assets/assets.ts";
import { listVideoIds } from "../catalog/catalog.ts";
import { KinetoError } from "../errors.ts";
import type { KinetoPaths } from "../paths.ts";
import { readRenders } from "../render/records.ts";
import type { StorageBackend } from "../storage/types.ts";

export interface PushedObject {
  key: string;
  kind: "asset" | "render";
  // uploaded：目标缺失或损坏，已上传；present：目标已有；missing：本机和目标都没有；
  // corrupt：本机这份与登记的哈希对不上，没有上传
  status: "uploaded" | "present" | "missing" | "corrupt";
  url: string | null;
}

export async function pushObjects(
  paths: KinetoPaths,
  from: StorageBackend,
  to: StorageBackend,
  { reupload = false, onProgress = () => {} }: { reupload?: boolean; onProgress?: (done: number, total: number) => void } = {},
): Promise<{ objects: PushedObject[] }> {
  // 调用方（CLI）在 storage.backend 为 local 时就会拦下；这里兜住传了同一个后端的情况
  if (from === to) {
    throw new KinetoError("STORAGE_PUSH_NOOP", "storage.backend is local, so there is nothing to push to", {
      hint: "Configure a shared backend (storage.backend: s3) in kineto.config.yaml first.",
    });
  }
  const wanted = await referencedObjects(paths);
  const objects: PushedObject[] = [];
  for (const [i, { key, kind, sha256, bytes }] of wanted.entries()) {
    onProgress(i, wanted.length);
    const localSize = await from.size(key);
    if (localSize === null) {
      objects.push({ key, kind, status: (await to.has(key)) ? "present" : "missing", url: null });
      continue;
    }
    try {
      // reupload：远端内容坏了、元数据却对得上（旧版本留下的）时，只能强制重传修复
      const stored = await to.put(await from.fetch(key), key, { sha256, force: reupload, trustRecord: { bytes } });
      objects.push({ key, kind, status: stored.written ? "uploaded" : "present", url: stored.url });
    } catch (err) {
      // 一份坏副本不中止整次 push：记下来，其余照推
      if (!(err instanceof KinetoError) || err.code !== "STORAGE_SOURCE_CORRUPT") throw err;
      objects.push({ key, kind, status: "corrupt", url: null });
    }
  }
  return { objects };
}

async function referencedObjects(paths: KinetoPaths) {
  const seen = new Set<string>();
  const out: { key: string; kind: PushedObject["kind"]; sha256: string; bytes: number }[] = [];
  const add = (key: string, kind: PushedObject["kind"], sha256: string, bytes: number) => {
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ key, kind, sha256, bytes });
  };
  for (const record of (await readManifest(paths)).values()) {
    add(assetStorageKey(record), "asset", record.id.slice("sha256:".length), record.bytes);
  }
  for (const id of await listVideoIds(paths)) {
    for (const r of await readRenders(paths, id)) add(r.storage.key, "render", r.sha256, r.bytes);
  }
  return out;
}
