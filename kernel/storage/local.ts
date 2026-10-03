import { chmod, copyFile, mkdir, rename, rm, stat } from "node:fs/promises";
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
    const [src, existing] = await Promise.all([stat(localFile), stat(dest).catch(() => null)]);
    // 内容寻址：大小一致即视为完好。大小不符说明对象被改坏过（暂存区是硬链接，改暂存文件会改到这里）
    if (existing?.size !== src.size) {
      await mkdir(path.dirname(dest), { recursive: true });
      // 先写临时名再 rename，中途失败不会留下半截文件冒充完整对象
      const partial = `${dest}.partial-${process.pid}`;
      try {
        await copyFile(localFile, partial);
        // 只读：硬链接出去的暂存文件也是只读的，误写会直接报错而不是悄悄污染存储
        await chmod(partial, 0o444);
        await rename(partial, dest);
      } catch (err) {
        await rm(partial, { force: true });
        throw err;
      }
    }
    return { backend: this.name, key, url: null };
  }

  async has(key: string): Promise<boolean> {
    return (await this.size(key)) !== null;
  }

  async size(key: string): Promise<number | null> {
    return stat(this.resolve(key)).then(
      (s) => s.size,
      () => null,
    );
  }

  async fetch(key: string): Promise<string> {
    const file = this.resolve(key);
    if (!(await this.has(key))) {
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
