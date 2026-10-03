import path from "node:path";
import type { KinetoConfig } from "../config.ts";
import { KinetoError } from "../errors.ts";
import type { KinetoPaths } from "../paths.ts";
import { LocalStorage } from "./local.ts";
import type { StorageBackend } from "./types.ts";

// 按配置选存储策略；新增后端只需在这里加一个分支
export async function createStorage(config: KinetoConfig, paths: KinetoPaths): Promise<StorageBackend> {
  switch (config.storage.backend) {
    case "local": {
      const root = path.resolve(paths.root, config.storage.local.root);
      // 这两个目录会被整体删除重建，存储放在里面会被一并清空。
      // 按不区分大小写比较：macOS 默认文件系统上 .kineto/Public 就是 .kineto/public
      const lower = root.toLowerCase();
      for (const volatile of [paths.publicDir, paths.tmpDir]) {
        const v = volatile.toLowerCase();
        if (lower === v || lower.startsWith(v + path.sep)) {
          throw new KinetoError("CONFIG_INVALID", `storage.local.root (${root}) is inside ${volatile}, which kineto wipes`, {
            hint: "Point storage.local.root somewhere else, e.g. .kineto/store.",
          });
        }
      }
      return new LocalStorage(root);
    }
    case "s3": {
      // schema 已保证选了 s3 就有这一段；AWS SDK 只在真用 s3 时才加载
      const s3 = config.storage.s3!;
      const { S3Storage, awsTransport } = await import("./s3.ts");
      return new S3Storage(s3, paths.cacheDir, awsTransport(s3));
    }
  }
}

export type { StorageBackend, StoredObject } from "./types.ts";
