// 存储后端是策略：kernel 只认这个接口，local / s3 等实现可以换，调用方无感。
export interface StoredObject {
  backend: string;
  key: string;
  // 能公开访问时给出 URL（如对象存储 + CDN）；纯本地为 null
  url: string | null;
  // 这次 put 是否真的写入（缺失或损坏被修复）；已有完好副本时为 false
  written: boolean;
}

export interface PutOptions {
  sha256?: string;
  force?: boolean;
  trustRecord?: { bytes: number };
}

export interface StorageBackend {
  readonly name: string;
  // key 是内容寻址的（含哈希），同 key 必同内容：已存在且完好就跳过，被改坏了就修复。
  // sha256：已知的内容哈希。所有后端用它判断目标是否完好（不传时只能按大小判断）；
  // 远端后端还用它验源文件，因为远端元数据里的哈希是日后判断完好的依据。
  // force：不管目标是否完好都重新写入（修复用）。
  // trustRecord（storage push 用）：远端后端上目标与登记的大小、哈希都对得上就直接判完好，不读源文件、不碰缓存
  put(localFile: string, key: string, options?: PutOptions): Promise<StoredObject>;
  has(key: string): Promise<boolean>;
  // 对象字节数；不存在为 null（check 用它发现被改坏的对象）
  size(key: string): Promise<number | null>;
  // 保证本机有一份可读副本并返回其路径（远端后端在这里下载进缓存）
  fetch(key: string): Promise<string>;
  // 后端可用（远端凭据有效、桶存在；write 时本地目录还要能建能写），不可用时抛 STORAGE_UNAVAILABLE。
  // 只读探测不改任何文件：check 用它
  probe(options?: { write?: boolean }): Promise<void>;
  describe(): Record<string, unknown>;
}
