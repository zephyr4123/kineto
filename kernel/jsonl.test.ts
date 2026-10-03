import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { appendJsonLine } from "./jsonl.ts";

test("appendJsonLine：文件末尾缺换行时先补一个，新行不会粘到上一行上", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-jsonl-"));
  try {
    const file = path.join(dir, "x.jsonl");
    await appendJsonLine(file, { a: 1 });
    await writeFile(file, '{"a":1}');
    await appendJsonLine(file, { b: 2 });
    assert.equal(await readFile(file, "utf8"), '{"a":1}\n{"b":2}\n');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
