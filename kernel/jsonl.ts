// 只追加记录（assets/manifest.jsonl、renders.jsonl）的唯一写入口。
import { appendFile, open } from "node:fs/promises";
import { isNodeError } from "./errors.ts";

export async function appendJsonLine(file: string, value: unknown): Promise<void> {
  // 末尾缺换行（例如被手工编辑过）时先补一个，否则新行会粘到上一行上，两条记录一起坏掉
  let prefix = "";
  try {
    const fh = await open(file, "r");
    try {
      const { size } = await fh.stat();
      if (size > 0) {
        const last = Buffer.alloc(1);
        await fh.read(last, 0, 1, size - 1);
        if (last[0] !== 0x0a) prefix = "\n";
      }
    } finally {
      await fh.close();
    }
  } catch (err) {
    if (!isNodeError(err, "ENOENT")) throw err;
  }
  await appendFile(file, prefix + JSON.stringify(value) + "\n");
}
