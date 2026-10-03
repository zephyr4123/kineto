// 真实渲染（会起 Chrome headless shell，约 10 秒）：验证渲染全链路与「视频之间互相隔离」。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeRepo } from "../testing/fixture.ts";
import { createVideo, linkAsset } from "../catalog/catalog.ts";
import { loadConfig } from "../config.ts";
import { LocalStorage } from "../storage/local.ts";
import { readRenders } from "./records.ts";
import { renderVideo } from "./render.ts";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const TINY = `import { AbsoluteFill, Composition, Still } from "remotion";

const Red: React.FC = () => <AbsoluteFill style={{ backgroundColor: "red" }} />;

export const Compositions: React.FC = () => (
  <>
    <Composition id="demo" component={Red} durationInFrames={10} fps={30} width={320} height={180} />
    <Still id="demo-cover" component={Red} width={640} height={360} />
  </>
);
`;

test("render 只打包目标视频：另一条视频模块加载即抛错、还缺素材，也不影响这一条", async () => {
  const fx = await makeRepo();
  try {
    await symlink(path.join(REPO, "node_modules"), path.join(fx.root, "node_modules"));
    await createVideo(fx.paths, { id: "demo", title: "Demo" });
    await writeFile(path.join(fx.root, "videos/demo/compositions.tsx"), TINY);
    await createVideo(fx.paths, { id: "broken", title: "Broken" });
    await writeFile(path.join(fx.root, "videos/broken/compositions.tsx"), 'throw new Error("boom");\nexport const Compositions = () => null;\n');
    await linkAsset(fx.paths, "broken", "ghost", "sha256:" + "0".repeat(64));

    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const { config } = await loadConfig(fx.paths, {});
    const { record, file } = await renderVideo(fx.paths, store, config, { id: "demo" });

    assert.equal(record.composition, "demo");
    assert.deepEqual([record.width, record.height, record.durationInFrames], [320, 180, 10]);
    assert.ok((await stat(file)).size > 0);
    assert.equal(record.bytes, (await stat(file)).size);
    assert.deepEqual((await readRenders(fx.paths, "demo")).map((r) => r.sha256), [record.sha256]);

    // <Still> 出图片：默认 png，同样入库留痕
    const still = await renderVideo(fx.paths, store, config, { id: "demo", composition: "demo-cover" });
    assert.equal(still.record.codec, "png");
    assert.deepEqual([still.record.width, still.record.height, still.record.durationInFrames], [640, 360, 1]);
    assert.match(still.record.storage.key, /^renders\/demo\/demo-cover-[0-9a-f]{12}\.png$/);
    assert.deepEqual((await readFile(still.file)).subarray(1, 4).toString(), "PNG");
    assert.equal((await readRenders(fx.paths, "demo")).length, 2);
    // 图片格式只给 <Still>，视频编码只给视频，用反了直接报错而不是悄悄出个怪文件
    await assert.rejects(renderVideo(fx.paths, store, config, { id: "demo", composition: "demo-cover", codec: "h264" }), {
      code: "INVALID_ARGUMENT",
    });
    await assert.rejects(renderVideo(fx.paths, store, config, { id: "demo", codec: "png" }), { code: "INVALID_ARGUMENT" });

    await assert.rejects(renderVideo(fx.paths, store, config, { id: "demo", codec: "toString" }), {
      code: "INVALID_ARGUMENT",
    });
    // 失败的渲染不留下临时目录
    await assert.rejects(renderVideo(fx.paths, store, config, { id: "broken" }), { code: "ASSET_NOT_FOUND" });
    const { readdir } = await import("node:fs/promises");
    assert.deepEqual(await readdir(fx.paths.tmpDir).catch(() => []), []);
  } finally {
    await fx.cleanup();
  }
});
