import { access, copyFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { KinetoError } from "../errors.ts";
import type { StorageBackend, StoredObject } from "./types.ts";

// 本地目录当存储：零配置的默认后端，clone 下来不配任何东西也能跑通全链路。
export class LocalStorage implements StorageBackend {
  readonly name = "local";
  readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    const normalized = path.posix.normalize(key);
    if (path.posix.isAbsolute(key) || normalized.startsWith("..") || normalized !== key) {
      throw new KinetoError("INVALID_STORAGE_KEY", `Unsafe storage key: ${key}`);
    }
    return path.join(this.root, ...key.split("/"));
  }

  async put(localFile: string, key: string): Promise<StoredObject> {
    const dest = this.resolve(key);
    if (!(await exists(dest))) {
      await mkdir(path.dirname(dest), { recursive: true });
      // 先写临时名再 rename，中途失败不会留下半截文件冒充完整对象
      const partial = `${dest}.partial-${process.pid}`;
      await copyFile(localFile, partial);
      await rename(partial, dest);
    }
    return { backend: this.name, key, url: null };
  }

  async has(key: string): Promise<boolean> {
    return exists(this.resolve(key));
  }

  async fetch(key: string): Promise<string> {
    const file = this.resolve(key);
    if (!(await exists(file))) {
      throw new KinetoError("STORAGE_OBJECT_MISSING", `Object not found in local storage: ${key}`, {
        hint: "The file was never stored on this machine. Re-add the asset, or configure the shared storage backend.",
      });
    }
    return file;
  }

  describe() {
    return { backend: this.name, root: this.root };
  }
}

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );
