// S3 兼容对象存储当后端：腾讯云 COS、AWS S3、Cloudflare R2、MinIO 都走这一份实现，换的只是配置。
// 对象按内容寻址、只增不删；远端是唯一真相源，本机只留一份只读缓存给 Remotion 读。
import { constants, createReadStream, createWriteStream } from "node:fs";
import { access, chmod, copyFile, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, HeadBucketCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { S3Config } from "../config.ts";
import { KinetoError } from "../errors.ts";
import { sha256File } from "../hash.ts";
import { assertSafeKey, contentTypeFor } from "./keys.ts";
import type { StorageBackend, StoredObject } from "./types.ts";

export interface ObjectHead {
  size: number;
  // 上传时写进对象元数据的 sha256；别处传上去的对象可能没有
  sha256: string | undefined;
}

// 和网络打交道的最薄一层：S3Storage 的逻辑（缓存、幂等、URL）不依赖 SDK，测试时换成内存实现
export interface S3Transport {
  head(objectKey: string): Promise<ObjectHead | null>;
  // 对象不存在时返回 null；存在时返回上传时写进元数据的 sha256（可能没有）
  download(objectKey: string, dest: string): Promise<{ sha256: string | undefined } | null>;
  upload(file: string, objectKey: string, meta: { contentType: string; sha256: string }): Promise<void>;
  probe(): Promise<void>;
}

type Settings = Pick<S3Config, "endpoint" | "region" | "bucket" | "prefix" | "publicUrl">;

export class S3Storage implements StorageBackend {
  readonly name = "s3";
  readonly #settings: Settings;
  readonly #cacheRoot: string;
  readonly #transport: S3Transport;

  constructor(settings: Settings, cacheDir: string, transport: S3Transport) {
    this.#settings = settings;
    // 按桶分目录：换了桶不会误用另一个桶的缓存
    this.#cacheRoot = path.join(path.resolve(cacheDir), settings.bucket);
    this.#transport = transport;
  }

  async put(localFile: string, key: string, options: { sha256?: string } = {}): Promise<StoredObject> {
    assertSafeKey(key);
    const objectKey = this.#objectKey(key);
    // 永远自己算源文件的哈希：远端元数据里的 sha256 是日后判断「完好」的依据，不能照抄调用方给的值
    const [{ size }, hex] = await Promise.all([stat(localFile), sha256File(localFile)]);
    if (options.sha256 !== undefined && options.sha256 !== hex) {
      throw new KinetoError("STORAGE_SOURCE_CORRUPT", `${localFile} hashes to ${hex}, but ${key} is recorded as ${options.sha256}`, {
        hint: "This copy was modified. Re-add the original file with `./kineto asset add`, or push from a machine with an intact copy.",
      });
    }
    const head = await this.#transport.head(objectKey);
    // 同 key 必同内容；远端对不上（大小或哈希）说明被改坏或传了一半，覆盖修复
    const intact = head !== null && head.size === size && (head.sha256 === undefined || head.sha256 === hex);
    if (!intact) await this.#transport.upload(localFile, objectKey, { contentType: contentTypeFor(key), sha256: hex });
    await this.#cacheCopy(localFile, key, hex);
    return { backend: this.name, key, url: this.#url(key), written: !intact };
  }

  async has(key: string): Promise<boolean> {
    return (await this.size(key)) !== null;
  }

  async size(key: string): Promise<number | null> {
    assertSafeKey(key);
    return (await this.#transport.head(this.#objectKey(key)))?.size ?? null;
  }

  async fetch(key: string): Promise<string> {
    const file = this.#cachePath(key);
    if (await exists(file)) return file;
    await mkdir(path.dirname(file), { recursive: true });
    const partial = `${file}.partial-${process.pid}`;
    try {
      const meta = await this.#transport.download(this.#objectKey(key), partial);
      if (!meta) {
        throw new KinetoError("STORAGE_OBJECT_MISSING", `Object not found in s3://${this.#settings.bucket}/${this.#objectKey(key)}`, {
          hint: "Upload it from the machine that has it with `./kineto storage push`, or re-add the asset.",
        });
      }
      // 进缓存前验内容：缓存之后就被当作可信副本，坏内容进去了就不会再被替换
      const expected = meta.sha256 ?? hashInKey(key);
      if (expected !== undefined && (await sha256File(partial)) !== expected) {
        throw new KinetoError("STORAGE_OBJECT_CORRUPT", `s3://${this.#settings.bucket}/${this.#objectKey(key)} does not match its sha256 ${expected}`, {
          hint: "Re-upload it with `./kineto storage push` (or `./kineto asset add` with the original file) from a machine with an intact copy.",
        });
      }
      await chmod(partial, 0o444);
      await rename(partial, file);
    } catch (err) {
      await rm(partial, { force: true });
      throw err;
    }
    return file;
  }

  async probe(): Promise<void> {
    await this.#transport.probe();
  }

  describe() {
    const { endpoint, region, bucket, prefix, publicUrl } = this.#settings;
    return { backend: this.name, endpoint, region, bucket, prefix, publicUrl: publicUrl ?? null, cache: this.#cacheRoot };
  }

  #objectKey(key: string): string {
    return `${this.#settings.prefix}${key}`;
  }

  #cachePath(key: string): string {
    assertSafeKey(key);
    return path.join(this.#cacheRoot, ...key.split("/"));
  }

  #url(key: string): string | null {
    const base = this.#settings.publicUrl;
    return base ? `${base}/${this.#objectKey(key).split("/").map(encodeURIComponent).join("/")}` : null;
  }

  // 刚上传的文件顺手放进缓存，紧接着的 fetch（如渲染完返回路径）不用再下载一遍；
  // 已有缓存但内容不对（被改坏）时用这份完好的替换掉——这也是修复坏缓存的途径。
  // 复制而不是硬链接：缓存要改成只读，硬链接会把调用方自己的文件也改成只读
  async #cacheCopy(localFile: string, key: string, hex: string): Promise<void> {
    const file = this.#cachePath(key);
    if (await exists(file)) {
      if ((await sha256File(file)) === hex) return;
      await rm(file, { force: true });
    }
    await mkdir(path.dirname(file), { recursive: true });
    const partial = `${file}.partial-${process.pid}`;
    try {
      // APFS / btrfs 上是写时复制克隆，不占额外空间也不耗时
      await copyFile(localFile, partial, constants.COPYFILE_FICLONE);
      await chmod(partial, 0o444);
      await rename(partial, file);
    } catch (err) {
      await rm(partial, { force: true });
      throw err;
    }
  }
}

// 素材的 key 本身就带完整哈希（assets/ab/<64 位>.ext）：远端元数据缺失时用它验内容
const hashInKey = (key: string): string | undefined => /^assets\/[0-9a-f]{2}\/([0-9a-f]{64})\.[a-z0-9]+$/.exec(key)?.[1];

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );

// 内容寻址的对象永不改变，浏览器和 CDN 都可以永久缓存
const IMMUTABLE = "public, max-age=31536000, immutable";

export function awsTransport(config: S3Config): S3Transport {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const Bucket = config.bucket;
  return {
    async head(Key) {
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket, Key }));
        return { size: res.ContentLength ?? 0, sha256: res.Metadata?.sha256 };
      } catch (err) {
        if (statusOf(err) === 404) return null;
        throw storageError(err, `HEAD ${Key}`);
      }
    },
    async download(Key, dest) {
      let res;
      try {
        res = await client.send(new GetObjectCommand({ Bucket, Key }));
      } catch (err) {
        // 桶不存在也是 404：那是配置错了，不是对象缺失
        if (statusOf(err) === 404 && (err as { name?: string }).name !== "NoSuchBucket") return null;
        throw storageError(err, `GET ${Key}`);
      }
      await pipeline(res.Body as Readable, createWriteStream(dest)).catch((err: unknown) => {
        throw storageError(err, `GET ${Key}`);
      });
      return { sha256: res.Metadata?.sha256 };
    },
    async upload(file, Key, meta) {
      // 大文件自动分片上传（默认 5MB 一片、4 片并行），小文件一次 PUT
      const upload = new Upload({
        client,
        params: {
          Bucket,
          Key,
          Body: createReadStream(file),
          ContentType: meta.contentType,
          CacheControl: IMMUTABLE,
          Metadata: { sha256: meta.sha256 },
        },
      });
      await upload.done().catch((err: unknown) => {
        throw storageError(err, `PUT ${Key}`);
      });
    },
    async probe() {
      await client.send(new HeadBucketCommand({ Bucket })).catch((err: unknown) => {
        throw storageError(err, `HEAD bucket ${Bucket}`);
      });
    },
  };
}

const statusOf = (err: unknown): number | undefined =>
  (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;

// SDK 的错误五花八门，翻译成 agent 能按 code 分支的几种，并告诉它下一步查什么
function storageError(err: unknown, what: string): KinetoError {
  const name = (err as { name?: string }).name ?? "";
  const status = statusOf(err);
  if (status === 403 || ["AccessDenied", "InvalidAccessKeyId", "SignatureDoesNotMatch", "Forbidden"].includes(name)) {
    return new KinetoError("STORAGE_ACCESS_DENIED", `${what}: access denied (${name || status})`, {
      hint: "Check storage.s3.accessKeyId / secretAccessKey, and that this key may read and write the bucket.",
      cause: err,
    });
  }
  if (name === "NoSuchBucket" || (status === 404 && what.startsWith("HEAD bucket"))) {
    return new KinetoError("STORAGE_UNAVAILABLE", `${what}: bucket not found`, {
      hint: "Check storage.s3.bucket, region and endpoint in kineto.config.yaml.",
      cause: err,
    });
  }
  return new KinetoError("STORAGE_UNAVAILABLE", `${what} failed: ${(err as Error).message ?? String(err)}`, {
    hint: "Check the network and storage.s3.endpoint, then retry.",
    cause: err,
  });
}
