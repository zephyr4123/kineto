import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeRepo, FIXED_NOW } from "../testing/fixture.ts";
import { createVideo, linkAsset, listVideos, readVideo, unlinkAsset, updateVideo } from "./catalog.ts";

const SHA = "sha256:" + "a".repeat(64);

test("createVideo 复制模板、替换占位符并写入 draft 状态的 video.json", async () => {
  const fx = await makeRepo();
  try {
    const video = await createVideo(fx.paths, { id: "corner-hit", title: "终于撞到角落了", now: FIXED_NOW });
    assert.equal(video.status, "draft");
    assert.equal(video.createdAt, FIXED_NOW.toISOString());
    const comps = await readFile(path.join(fx.root, "videos/corner-hit/compositions.tsx"), "utf8");
    assert.match(comps, /id="corner-hit"/);
    const body = await readFile(path.join(fx.root, "videos/corner-hit/Video.tsx"), "utf8");
    assert.match(body, /终于撞到角落了/);
    assert.deepEqual(await readVideo(fx.paths, "corner-hit"), video);
  } finally {
    await fx.cleanup();
  }
});

test("模板里带引号的占位符替换成 JSON 字符串字面量：标题含引号也不会写坏代码", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "templates/blank/Title.tsx"), 'export const TITLE = "__KINETO_TITLE__";\n');
    await createVideo(fx.paths, { id: "q", title: 'Say "hi" \\ <b>' });
    const src = await readFile(path.join(fx.root, "videos/q/Title.tsx"), "utf8");
    assert.equal(src, `export const TITLE = ${JSON.stringify('Say "hi" \\ <b>')};\n`);
  } finally {
    await fx.cleanup();
  }
});

test("createVideo 拒绝非法 id、重复 id 和不存在的模板", async () => {
  const fx = await makeRepo();
  try {
    await assert.rejects(createVideo(fx.paths, { id: "Bad_Id", title: "x" }), { code: "INVALID_ID" });
    await createVideo(fx.paths, { id: "a", title: "x" });
    await assert.rejects(createVideo(fx.paths, { id: "a", title: "x" }), { code: "VIDEO_EXISTS" });
    await assert.rejects(createVideo(fx.paths, { id: "b", title: "x", template: "nope" }), {
      code: "TEMPLATE_NOT_FOUND",
    });
  } finally {
    await fx.cleanup();
  }
});

test("listVideos 按 id 排序；video.json 的 id 与目录名不符时报 VIDEO_INVALID", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "zeta", title: "z" });
    await createVideo(fx.paths, { id: "alpha", title: "a" });
    assert.deepEqual((await listVideos(fx.paths)).map((v) => v.id), ["alpha", "zeta"]);

    const file = path.join(fx.root, "videos/zeta/video.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    await writeFile(file, JSON.stringify({ ...json, id: "other" }));
    await assert.rejects(readVideo(fx.paths, "zeta"), { code: "VIDEO_INVALID" });
  } finally {
    await fx.cleanup();
  }
});

test("updateVideo 只改允许的字段并刷新 updatedAt；非法状态报 INVALID_ARGUMENT", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "a", title: "x", now: FIXED_NOW });
    const later = new Date("2026-10-04T00:00:00.000Z");
    const v = await updateVideo(fx.paths, "a", { status: "review", tags: ["fun"] }, later);
    assert.equal(v.status, "review");
    assert.deepEqual(v.tags, ["fun"]);
    assert.equal(v.updatedAt, later.toISOString());
    assert.equal(v.createdAt, FIXED_NOW.toISOString());
    await assert.rejects(updateVideo(fx.paths, "a", { status: "done" as never }), { code: "INVALID_ARGUMENT" });
    await assert.rejects(updateVideo(fx.paths, "missing", { title: "y" }), { code: "VIDEO_NOT_FOUND" });
  } finally {
    await fx.cleanup();
  }
});

test("linkAsset 写入别名引用；别名必须是合法标识符", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "a", title: "x" });
    const v = await linkAsset(fx.paths, "a", "boop", SHA);
    assert.deepEqual(v.assets, { boop: SHA });
    await assert.rejects(linkAsset(fx.paths, "a", "boop-loud", SHA), { code: "INVALID_ALIAS" });
  } finally {
    await fx.cleanup();
  }
});

test("标题里的 $ 替换模式（$& $$ $`）原样保留，不会被 replaceAll 解释", async () => {
  const fx = await makeRepo();
  try {
    await writeFile(path.join(fx.root, "templates/blank/Title.tsx"), 'export const TITLE = "__KINETO_TITLE__";\n');
    const title = "Make $$$ fast: $& and $` end";
    await createVideo(fx.paths, { id: "d", title });
    const src = await readFile(path.join(fx.root, "videos/d/Title.tsx"), "utf8");
    assert.equal(src, `export const TITLE = ${JSON.stringify(title)};\n`);
  } finally {
    await fx.cleanup();
  }
});

test("空标题报 INVALID_ARGUMENT，且不留下视频目录", async () => {
  const fx = await makeRepo();
  try {
    await assert.rejects(createVideo(fx.paths, { id: "e", title: "  " }), { code: "INVALID_ARGUMENT" });
    await assert.rejects(readVideo(fx.paths, "e"), { code: "VIDEO_NOT_FOUND" });
  } finally {
    await fx.cleanup();
  }
});

test("同一视频里只差大小写的别名报 ALIAS_CONFLICT（大小写不敏感的文件系统上会撞文件名）", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "a", title: "x" });
    await linkAsset(fx.paths, "a", "introMusic", SHA);
    await assert.rejects(linkAsset(fx.paths, "a", "intromusic", SHA), { code: "ALIAS_CONFLICT" });
    // 同一个别名重新指向别的素材是显式更新，允许
    await linkAsset(fx.paths, "a", "introMusic", "sha256:" + "f".repeat(64));
  } finally {
    await fx.cleanup();
  }
});

test("new 不能抢占已有 composition 的命名空间：w 已注册 w-x-title 时不能创建视频 w-x", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "w", title: "W" });
    const file = path.join(fx.root, "videos/w/compositions.tsx");
    await writeFile(file, (await readFile(file, "utf8")).replace('id="w"', 'id="w-x-title"'));
    await assert.rejects(createVideo(fx.paths, { id: "w-x", title: "WX" }), { code: "NAMESPACE_TAKEN" });
    await assert.rejects(readVideo(fx.paths, "w-x"), { code: "VIDEO_NOT_FOUND" });
  } finally {
    await fx.cleanup();
  }
});

test("namespace 检查按语法树扫描：字符串里的 /* 骗不过它", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "vid-a", title: "A" });
    const file = path.join(fx.root, "videos/vid-a/compositions.tsx");
    await writeFile(
      file,
      (await readFile(file, "utf8")).replace(
        'id="vid-a"',
        'id="vid-a" defaultProps={{ f: "frames/*.png" }} /><Composition id="vid-a-x-title" component={Video} durationInFrames={1} fps={30} width={10} height={10} />{/* x */}<Composition id="vid-a-spare"',
      ),
    );
    await assert.rejects(createVideo(fx.paths, { id: "vid-a-x", title: "X" }), { code: "NAMESPACE_TAKEN" });
  } finally {
    await fx.cleanup();
  }
});

test("unlinkAsset 摘掉别名并刷新 updatedAt；没挂这个别名报 ASSET_NOT_LINKED", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "a", title: "x", now: FIXED_NOW });
    await linkAsset(fx.paths, "a", "boop", SHA, FIXED_NOW);
    await linkAsset(fx.paths, "a", "fanfare", SHA, FIXED_NOW);
    const later = new Date(FIXED_NOW.getTime() + 1000);
    const { video, assetId } = await unlinkAsset(fx.paths, "a", "boop", later);
    assert.equal(assetId, SHA);
    assert.deepEqual(video.assets, { fanfare: SHA });
    assert.equal(video.updatedAt, later.toISOString());
    assert.deepEqual(await readVideo(fx.paths, "a"), video);
    await assert.rejects(unlinkAsset(fx.paths, "a", "boop"), { code: "ASSET_NOT_LINKED", hint: /fanfare/ });
    // 原型链上的名字不算挂着
    await assert.rejects(unlinkAsset(fx.paths, "a", "toString"), { code: "ASSET_NOT_LINKED" });
  } finally {
    await fx.cleanup();
  }
});

test("代码里还在用 assets.<alias> 时 unlinkAsset 报 ASSET_IN_USE 并点名文件，video.json 不动", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "a", title: "x" });
    await linkAsset(fx.paths, "a", "boop", SHA);
    await linkAsset(fx.paths, "a", "song", SHA);
    await mkdir(path.join(fx.root, "videos/a/scenes"), { recursive: true });
    await writeFile(path.join(fx.root, "videos/a/scenes/Hit.tsx"), "const src = staticFile(assets.boop);\nconst b = assets.boopLoud;\n");
    await writeFile(path.join(fx.root, "videos/a/Mix.ts"), 'export const s = assets["song"];\n');
    const before = await readVideo(fx.paths, "a");
    await assert.rejects(unlinkAsset(fx.paths, "a", "boop"), (err: Error & { code?: string }) => err.code === "ASSET_IN_USE" && /scenes\/Hit\.tsx/.test(err.message));
    await assert.rejects(unlinkAsset(fx.paths, "a", "song"), { code: "ASSET_IN_USE" });
    assert.deepEqual(await readVideo(fx.paths, "a"), before);
    // assets.boopLoud 不算在用 boop；生成文件 assets.gen.ts 本身不算引用
    await writeFile(path.join(fx.root, "videos/a/scenes/Hit.tsx"), "const b = assets.boopLoud;\n");
    await writeFile(path.join(fx.root, "videos/a/assets.gen.ts"), 'export const assets = { boop: "a/boop.wav" } as const;\n');
    assert.deepEqual((await unlinkAsset(fx.paths, "a", "boop")).video.assets, { song: SHA });
  } finally {
    await fx.cleanup();
  }
});

test("video.json 原子写入：不拿锁的读取（asset add 的预检查、render、show）永远读不到写了一半的文件", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo" });
    let writing = true;
    const writer = (async () => {
      for (let i = 0; i < 150; i++) await updateVideo(fx.paths, "demo", { description: "x".repeat(2000 + i) });
      writing = false;
    })();
    let reads = 0;
    const torn: string[] = [];
    while (writing) {
      await readVideo(fx.paths, "demo").catch((err: { code?: string }) => torn.push(err.code ?? String(err)));
      reads++;
    }
    await writer;
    assert.ok(reads > 0);
    assert.deepEqual(torn, []);
  } finally {
    await fx.cleanup();
  }
});
