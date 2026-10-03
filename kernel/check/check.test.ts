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

test("id 等号两边带空格也会被扫描到；engine/ 里登记 composition 被报出", async () => {
  const { fx, store } = await cleanRepo();
  try {
    const file = path.join(fx.root, "videos/demo/compositions.tsx");
    await writeFile(file, (await readFile(file, "utf8")).replace('id="demo"', 'id = "other"'));
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_ID_PREFIX"]);
    await writeFile(file, (await readFile(file, "utf8")).replace('id = "other"', 'id="demo"'));
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(fx.root, "engine"), { recursive: true });
    await writeFile(path.join(fx.root, "engine/Shared.tsx"), "export const X = () => <Composition id=\"x\" />;\n");
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_OUTSIDE_REGISTRY"]);
  } finally {
    await fx.cleanup();
  }
});

test("composition id 落进另一条视频的命名空间（w 注册 w-x-intro，而 w-x 是另一条视频）被报出", async () => {
  const { fx, store } = await cleanRepo();
  try {
    await createVideo(fx.paths, { id: "w", title: "W" });
    await createVideo(fx.paths, { id: "w-x", title: "WX" });
    await syncAll(fx.paths, store);
    const file = path.join(fx.root, "videos/w/compositions.tsx");
    await writeFile(file, (await readFile(file, "utf8")).replace('id="w"', 'id="w-x-intro"'));
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_ID_PREFIX"]);
  } finally {
    await fx.cleanup();
  }
});

test("存储里的素材大小与 manifest 不符（被改坏）报 ASSET_CORRUPT", async () => {
  const { fx, store } = await cleanRepo();
  try {
    const { ingestAsset, assetStorageKey } = await import("../assets/assets.ts");
    const { chmod } = await import("node:fs/promises");
    const src = path.join(fx.root, "a.png");
    await writeFile(src, "hello");
    const rec = await ingestAsset(fx.paths, store, { source: src, license: "MIT" });
    await linkAsset(fx.paths, "demo", "pic", rec.id);
    await syncAll(fx.paths, store);
    const stored = await store.fetch(assetStorageKey(rec));
    await chmod(stored, 0o644);
    await writeFile(stored, "EDITED-BY-AGENT");
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["ASSET_CORRUPT"]);
  } finally {
    await fx.cleanup();
  }
});

test("check 报出手改出来的大小写冲突别名，以及仓库任意位置（含 .js）里的 composition 登记", async () => {
  const { fx, store } = await cleanRepo();
  try {
    const file = path.join(fx.root, "videos/demo/video.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    json.assets = { introMusic: "sha256:" + "a".repeat(64), intromusic: "sha256:" + "a".repeat(64) };
    await writeFile(file, JSON.stringify(json));
    assert.ok(codes(await checkRepo(fx.paths, store)).includes("ALIAS_CONFLICT"));
    json.assets = {};
    await writeFile(file, JSON.stringify(json));

    const { mkdir } = await import("node:fs/promises");
    await writeFile(path.join(fx.root, "videos/demo/Extra.js"), 'export const X = () => <Composition id="demo-x" />;\n');
    await mkdir(path.join(fx.root, "lib"));
    await writeFile(path.join(fx.root, "lib/More.tsx"), 'export const Y = () => <Still id="demo-y" />;\n');
    assert.deepEqual(codes(await checkRepo(fx.paths, store)), ["COMPOSITION_OUTSIDE_REGISTRY", "COMPOSITION_OUTSIDE_REGISTRY"]);
  } finally {
    await fx.cleanup();
  }
});
