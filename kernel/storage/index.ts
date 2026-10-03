import path from "node:path";
import type { KinetoConfig } from "../config.ts";
import { KinetoError } from "../errors.ts";
import type { KinetoPaths } from "../paths.ts";
import { LocalStorage } from "./local.ts";
import type { StorageBackend } from "./types.ts";

// 按配置选存储策略；新增后端（如 s3 兼容的 COS）只需在这里加一个分支
export function createStorage(config: KinetoConfig, paths: KinetoPaths): StorageBackend {
  switch (config.storage.backend) {
    case "local": {
      const root = path.resolve(paths.root, config.storage.local.root);
      // 这两个目录会被整体删除重建，存储放在里面会被一并清空
      for (const volatile of [paths.publicDir, paths.tmpDir]) {
        if (root === volatile || root.startsWith(volatile + path.sep)) {
          throw new KinetoError("CONFIG_INVALID", `storage.local.root (${root}) is inside ${volatile}, which kineto wipes`, {
            hint: "Point storage.local.root somewhere else, e.g. .kineto/store.",
          });
        }
      }
      return new LocalStorage(root);
    }
  }
}

export type { StorageBackend, StoredObject } from "./types.ts";
