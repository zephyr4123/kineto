import { test } from "node:test";
import assert from "node:assert/strict";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeRepo } from "../testing/fixture.ts";
import { LocalStorage } from "../storage/local.ts";
import { createVideo, linkAsset } from "../catalog/catalog.ts";
import { assetStorageKey, ingestAsset } from "../assets/assets.ts";
import { renderAssetsModule, renderRegistry, syncAll, syncVideo } from "./sync.ts";

test("renderRegistry：每条视频一个 import + 一个同名 <Folder>，无视频时仍是合法组件", () => {
  const out = renderRegistry(["corner-hit", "a2"]);
  assert.match(out, /import \{ Compositions as V_corner_hit \} from "\.\.\/videos\/corner-hit\/compositions";/);
  assert.match(out, /<Folder name="corner-hit">\s*<V_corner_hit \/>\s*<\/Folder>/);
  assert.match(out, /<Folder name="a2">\s*<V_a2 \/>/);
  const empty = renderRegistry([]);
  assert.match(empty, /export const Registry/);
  assert.doesNotMatch(empty, /import/);
});

test("renderAssetsModule：别名映射到 <视频 id>/<别名><扩展名>", () => {
  const out = renderAssetsModule("corner-hit", [
    { alias: "boop", ext: ".wav" },
    { alias: "logo", ext: ".png" },
  ]);
  assert.match(out, /boop: "corner-hit\/boop\.wav",/);
  assert.match(out, /logo: "corner-hit\/logo\.png",/);
  assert.match(renderAssetsModule("x", []), /export const assets = \{\} as const;/);
});

test("syncAll 写生成文件并把素材以硬链接暂存进 public 子目录；check 模式只报漂移不写", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    await createVideo(fx.paths, { id: "demo", title: "Demo" });
    const file = path.join(fx.root, "boop.wav");
    await writeFile(file, "hello");
    const rec = await ingestAsset(fx.paths, store, { source: file, license: "CC0-1.0" });
    await linkAsset(fx.paths, "demo", "boop", rec.id);

    const drift = await syncAll(fx.paths, store, { check: true });
    assert.deepEqual(drift.drift.sort(), ["src/registry.gen.tsx", "videos/demo/assets.gen.ts"]);
    await assert.rejects(readFile(fx.paths.registryFile, "utf8"), { code: "ENOENT" });

    const result = await syncAll(fx.paths, store);
    assert.deepEqual(result.written.sort(), ["src/registry.gen.tsx", "videos/demo/assets.gen.ts"]);
    assert.equal(result.staged, 1);
    // Remotion 的静态服务对 symlink 一律回 404（serve-handler 里 lstat 判定），所以必须是普通文件；
    // 同一 inode 说明是硬链接，不额外占磁盘
    const staged = path.join(fx.paths.publicDir, "demo", "boop.wav");
    const stagedStat = await lstat(staged);
    assert.equal(stagedStat.isSymbolicLink(), false);
    assert.equal(stagedStat.isFile(), true);
    assert.equal(stagedStat.ino, (await lstat(await store.fetch(assetStorageKey(rec)))).ino);

    assert.deepEqual((await syncAll(fx.paths, store, { check: true })).drift, []);
    assert.deepEqual((await syncAll(fx.paths, store)).written, []);
  } finally {
    await fx.cleanup();
  }
});

test("syncVideo：单条视频引用了 manifest 里没有的素材报 ASSET_NOT_FOUND；存储里缺文件记入 missing 而不中断", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const demo = await createVideo(fx.paths, { id: "demo", title: "Demo" });
    const linked = await linkAsset(fx.paths, "demo", "ghost", "sha256:" + "b".repeat(64));
    void demo;
    await assert.rejects(syncVideo(fx.paths, store, linked, fx.paths.publicDir), { code: "ASSET_NOT_FOUND" });

    const fx2 = await makeRepo();
    try {
      const file = path.join(fx2.root, "a.png");
      await writeFile(file, "x");
      const rec = await ingestAsset(fx2.paths, store, { source: file, license: "MIT" });
      await createVideo(fx2.paths, { id: "v", title: "V" });
      await linkAsset(fx2.paths, "v", "pic", rec.id);
      // 换一个空存储：模拟别人 clone 后本机没有这份二进制
      const empty = new LocalStorage(path.join(fx2.root, ".kineto/empty"));
      const result = await syncAll(fx2.paths, empty);
      assert.deepEqual(result.missing, [{ video: "v", alias: "pic", key: assetStorageKey(rec) }]);
      assert.equal(result.staged, 0);
    } finally {
      await fx2.cleanup();
    }
  } finally {
    await fx.cleanup();
  }
});

test("某条视频有悬空素材引用时 syncAll 不整体失败：其它视频照常同步，问题记入 unresolved", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    await createVideo(fx.paths, { id: "good", title: "Good" });
    await createVideo(fx.paths, { id: "bad", title: "Bad" });
    await linkAsset(fx.paths, "bad", "ghost", "sha256:" + "b".repeat(64));
    const result = await syncAll(fx.paths, store);
    assert.deepEqual(result.unresolved, [{ video: "bad", alias: "ghost", asset: "sha256:" + "b".repeat(64) }]);
    assert.match(await readFile(fx.paths.registryFile, "utf8"), /V_good/);
  } finally {
    await fx.cleanup();
  }
});
