import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeRepo } from "../testing/fixture.ts";
import { LocalStorage } from "../storage/local.ts";
import { createVideo, linkAsset } from "../catalog/catalog.ts";
import { syncAll } from "../sync/sync.ts";
import { checkRepo } from "./check.ts";

async function cleanRepo() {
  const fx = await makeRepo();
  const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
  await createVideo(fx.paths, { id: "demo", title: "Demo" });
  await syncAll(fx.paths, store);
  return { fx, store };
}

const codes = (report: { problems: { code: string }[] }) => report.problems.map((p) => p.code).sort();

test("sync 过的干净仓库检查通过", async () => {
  const { fx, store } = await cleanRepo();
  try {
    const report = await checkRepo(fx.paths, store);
    assert.deepEqual(report.problems, []);
    assert.equal(report.ok, true);
    assert.equal(report.videos, 1);
  } finally {
    await fx.cleanup();
  }
});

test("composition id 必须是带视频 id 前缀的字符串字面量，且全库唯一", async () => {
  const { fx, store } = await cleanRepo();
  try {
    const file = path.join(fx.root, "videos/demo/compositions.tsx");
    const original = await readFile(file, "utf8");
    await writeFile(file, original.replace('id="demo"', 'id="other"'));
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_ID_PREFIX"]);

    await writeFile(file, original.replace('id="demo"', "id={name}"));
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_ID_NOT_LITERAL"]);

    await writeFile(file, original + original.replace("export const Compositions", "export const More"));
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_ID_DUPLICATE"]);
  } finally {
    await fx.cleanup();
  }
});

test("<Composition> 只能写在 compositions.tsx 里", async () => {
  const { fx, store } = await cleanRepo();
  try {
    await writeFile(
      path.join(fx.root, "videos/demo/Extra.tsx"),
      'import { Composition } from "remotion";\nexport const X = () => <Composition id="demo-x" component={() => null} durationInFrames={1} fps={30} width={10} height={10} />;\n',
    );
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_OUTSIDE_REGISTRY"]);
  } finally {
    await fx.cleanup();
  }
});

test("生成文件漂移、引用未登记素材、坏的 renders.jsonl 都被报出", async () => {
  const { fx, store } = await cleanRepo();
  try {
    await createVideo(fx.paths, { id: "second", title: "Second" });
    await linkAsset(fx.paths, "demo", "ghost", "sha256:" + "c".repeat(64));
    await appendFile(path.join(fx.root, "videos/demo/renders.jsonl"), '{"bad":true}\n');
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), [
      "ASSET_NOT_FOUND",
      "GENERATED_OUT_OF_DATE",
      "RENDERS_INVALID",
    ]);
  } finally {
    await fx.cleanup();
  }
});

test("缺 video.json 或 compositions.tsx 的视频目录被报出", async () => {
  const { fx, store } = await cleanRepo();
  try {
    const { mkdir, rm } = await import("node:fs/promises");
    await mkdir(path.join(fx.root, "videos/stray"));
    await rm(path.join(fx.root, "videos/demo/compositions.tsx"));
    const report = await checkRepo(fx.paths, store);
    assert.equal(report.ok, false);
    assert.deepEqual(codes(report), ["COMPOSITIONS_MISSING", "VIDEO_NOT_FOUND"]);
  } finally {
    await fx.cleanup();
  }
});
