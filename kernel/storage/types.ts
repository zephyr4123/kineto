// 存储后端是策略：kernel 只认这个接口，local / s3 等实现可以换，调用方无感。
export interface StoredObject {
  backend: string;
  key: string;
  // 能公开访问时给出 URL（如对象存储 + CDN）；纯本地为 null
  url: string | null;
}

export interface StorageBackend {
  readonly name: string;
  // key 是内容寻址的（含哈希），同 key 必同内容，所以已存在就跳过
  put(localFile: string, key: string): Promise<StoredObject>;
  has(key: string): Promise<boolean>;
  // 保证本机有一份可读副本并返回其路径（远端后端在这里下载进缓存）
  fetch(key: string): Promise<string>;
  describe(): Record<string, unknown>;
}
