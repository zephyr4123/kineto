// 测试用的内存 S3 传输层：记下每次上传 / 下载，断言缓存与幂等行为
import { readFile, writeFile } from "node:fs/promises";
import type { ObjectHead, S3Transport } from "../storage/s3.ts";

export class FakeTransport implements S3Transport {
  // sha256 为 undefined 模拟别处上传、没有 kineto 元数据的对象
  objects = new Map<string, { body: Buffer; contentType: string; sha256: string | undefined }>();
  uploads: string[] = [];
  downloads: string[] = [];
  async head(key: string): Promise<ObjectHead | null> {
    const o = this.objects.get(key);
    return o ? { size: o.body.length, sha256: o.sha256 } : null;
  }
  async download(key: string, dest: string): Promise<{ sha256: string | undefined } | null> {
    const o = this.objects.get(key);
    if (!o) return null;
    this.downloads.push(key);
    await writeFile(dest, o.body);
    return { sha256: o.sha256 };
  }
  async upload(file: string, key: string, meta: { contentType: string; sha256: string }): Promise<void> {
    this.uploads.push(key);
    this.objects.set(key, { body: await readFile(file), ...meta });
  }
  async probe(): Promise<void> {}
}

