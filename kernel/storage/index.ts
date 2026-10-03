import path from "node:path";
import type { KinetoConfig } from "../config.ts";
import type { KinetoPaths } from "../paths.ts";
import { LocalStorage } from "./local.ts";
import type { StorageBackend } from "./types.ts";

// 按配置选存储策略；新增后端（如 s3 兼容的 COS）只需在这里加一个分支
export function createStorage(config: KinetoConfig, paths: KinetoPaths): StorageBackend {
  switch (config.storage.backend) {
    case "local":
      return new LocalStorage(path.resolve(paths.root, config.storage.local.root));
  }
}

export type { StorageBackend, StoredObject } from "./types.ts";
