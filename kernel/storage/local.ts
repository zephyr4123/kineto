import { constants } from "node:fs";
import { access, chmod, copyFile, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { isNodeError, KinetoError } from "../errors.ts";
import { sha256File } from "../hash.ts";
import { assertSafeKey } from "./keys.ts";
import type { StorageBackend, StoredObject } from "./types.ts";

// 本地目录当存储：零配置的默认后端，clone 下来不配任何东西也能跑通全链路。
export class LocalStorage implements StorageBackend {
  readonly name = "local";
  readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    assertSafeKey(key);
    return path.join(this.root, ...key.split("/"));
  }

  async put(localFile: string, key: string, options: { sha256?: string; force?: boolean } = {}): Promise<StoredObject> {
    const dest = this.resolve(key);
    const [src, existing] = await Promise.all([stat(localFile), stat(dest).catch(() => null)]);
    // 已存在的对象要复核：暂存区是硬链接，改暂存文件就是改这里。给了哈希按哈希比，否则按大小比
    const intact =
      options.force !== true &&
      existing !== null &&
      existing.size === src.size &&
      (options.sha256 === undefined || (await sha256File(dest)) === options.sha256);
    if (intact) {
      // 早期写入或被人改过权限的对象，顺手恢复只读
      if (existing.mode & 0o222) await chmod(dest, 0o444);
    } else {
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
    return { backend: this.name, key, url: null, written: !intact };
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

  async probe({ write = false }: { write?: boolean } = {}): Promise<void> {
    try {
      if (write) {
        await mkdir(this.root, { recursive: true });
        await access(this.root, constants.W_OK);
      } else {
        // 只读：目录还不存在只说明本机没存过东西，不算错；存在就得读得了
        await access(this.root, constants.R_OK).catch((err: unknown) => {
          if (!isNodeError(err, "ENOENT")) throw err;
        });
      }
    } catch (err) {
      throw new KinetoError("STORAGE_UNAVAILABLE", `Local storage ${this.root} is not usable: ${(err as Error).message}`, {
        hint: "Point storage.local.root at a directory you can write to, or fix its permissions.",
        cause: err,
      });
    }
  }

  describe() {
    return { backend: this.name, root: this.root };
  }
}

