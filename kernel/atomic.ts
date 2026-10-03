import { randomUUID } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";

// 受控文件（video.json、生成文件）不拿锁也会被读（asset add 的预检查、render、check、Remotion 打包）：
// 先写同目录下的临时文件再 rename 覆盖，读的一方永远只看到完整的旧版或新版
export async function writeFileAtomic(file: string, content: string): Promise<void> {
  const tmp = `${file}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(tmp, content);
    await rename(tmp, file);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
}
