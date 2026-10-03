import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ingestAsset } from "../assets/assets.ts";
import { createVideo } from "../catalog/catalog.ts";
import { appendRender } from "../render/records.ts";
import { LocalStorage } from "../storage/local.ts";
import { FIXED_NOW, makeRepo } from "../testing/fixture.ts";
import { pushObjects } from "./push.ts";

test("push 把素材库与渲染记录引用的对象补传到目标后端：缺的上传、已有的跳过、两边都没有的报 missing", async () => {
  const fx = await makeRepo();
  try {
    const local = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const shared = new LocalStorage(path.join(fx.root, "shared"));
    const src = path.join(fx.root, "boop.wav");
    await writeFile(src, "boop");
    const asset = await ingestAsset(fx.paths, local, { source: src, license: "CC0-1.0", now: FIXED_NOW });

    await createVideo(fx.paths, { id: "demo", title: "Demo", now: FIXED_NOW });
    const renderKey = "renders/demo/demo-aaaaaaaaaaaa.mp4";
    const renderFile = path.join(fx.root, "r.mp4");
    await writeFile(renderFile, "video");
    await local.put(renderFile, renderKey);
    const record = (key: string) => ({
      renderedAt: FIXED_NOW.toISOString(),
      composition: "demo",
      codec: "h264",
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 60,
      bytes: 5,
      sha256: createHash("sha256").update("video").digest("hex"),
      storage: { backend: "local", key, url: null },
      git: { sha: null, dirty: false },
      remotion: "4.0.532",
      elapsedMs: 1,
    });
    await appendRender(fx.paths, "demo", record(renderKey));
    // 早年在别的机器上渲染、本机从没有过的产物
    await appendRender(fx.paths, "demo", record("renders/demo/demo-bbbbbbbbbbbb.mp4"));

    const first = await pushObjects(fx.paths, local, shared);
    const byKey = Object.fromEntries(first.objects.map((o) => [o.key, o.status]));
    assert.deepEqual(byKey, {
      [`assets/${asset.id.slice(7, 9)}/${asset.id.slice(7)}.wav`]: "uploaded",
      [renderKey]: "uploaded",
      "renders/demo/demo-bbbbbbbbbbbb.mp4": "missing",
    });
    assert.equal(await shared.has(renderKey), true);

    const second = await pushObjects(fx.paths, local, shared);
    assert.deepEqual(
      second.objects.map((o) => o.status),
      ["present", "present", "missing"],
    );
  } finally {
    await fx.cleanup();
  }
});

test("目标后端就是本地存储时报 STORAGE_PUSH_NOOP", async () => {
  const fx = await makeRepo();
  try {
    await mkdir(path.join(fx.root, ".kineto/store"), { recursive: true });
    const local = new LocalStorage(path.join(fx.root, ".kineto/store"));
    await assert.rejects(pushObjects(fx.paths, local, local), { code: "STORAGE_PUSH_NOOP" });
  } finally {
    await fx.cleanup();
  }
});

test("本机副本被改坏的对象记为 corrupt、不中止整次 push；reupload 时远端已有的也重新上传", async () => {
  const fx = await makeRepo();
  try {
    const { chmod } = await import("node:fs/promises");
    const local = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const shared = new LocalStorage(path.join(fx.root, "shared"));
    const ids: string[] = [];
    for (const body of ["one", "two"]) {
      const src = path.join(fx.root, `${body}.wav`);
      await writeFile(src, body);
      ids.push((await ingestAsset(fx.paths, local, { source: src, license: "CC0-1.0", now: FIXED_NOW })).id);
    }
    const keyOf = (id: string) => `assets/${id.slice(7, 9)}/${id.slice(7)}.wav`;
    const broken = await local.fetch(keyOf(ids[0]!));
    await chmod(broken, 0o644);
    await writeFile(broken, "ONE");
    // 目标是 S3 时坏副本在 put 里被发现；这里用一个按哈希验源的假目标模拟
    const verifying = Object.assign(Object.create(shared) as LocalStorage, {
      put: async (file: string, key: string, opts: { sha256?: string; force?: boolean } = {}) => {
        const { sha256File } = await import("../hash.ts");
        if (opts.sha256 && (await sha256File(file)) !== opts.sha256) {
          const { KinetoError } = await import("../errors.ts");
          throw new KinetoError("STORAGE_SOURCE_CORRUPT", `${file} is corrupt`);
        }
        return shared.put(file, key, opts);
      },
    });
    const first = await pushObjects(fx.paths, local, verifying);
    assert.deepEqual(Object.fromEntries(first.objects.map((o) => [o.key, o.status])), { [keyOf(ids[0]!)]: "corrupt", [keyOf(ids[1]!)]: "uploaded" });
    const again = await pushObjects(fx.paths, local, verifying, { reupload: true });
    assert.equal(again.objects.find((o) => o.key === keyOf(ids[1]!))?.status, "uploaded");
  } finally {
    await fx.cleanup();
  }
});

test("远端已有完好副本时，本机副本坏了（大小也变了）仍判 present：比的是登记值，不是本机文件", async () => {
  const fx = await makeRepo();
  try {
    const { chmod } = await import("node:fs/promises");
    const { S3Storage } = await import("../storage/s3.ts");
    const { FakeTransport } = await import("../testing/fake-s3.ts");
    const local = new LocalStorage(path.join(fx.root, ".kineto/store"));
    const fake = new FakeTransport();
    const s3 = new S3Storage({ endpoint: "https://s3.example.com", region: "r", bucket: "b", prefix: "", publicUrl: undefined }, path.join(fx.root, "cache"), fake);
    const src = path.join(fx.root, "one.wav");
    await writeFile(src, "one");
    const asset = await ingestAsset(fx.paths, local, { source: src, license: "CC0-1.0", now: FIXED_NOW });
    assert.deepEqual((await pushObjects(fx.paths, local, s3)).objects.map((o) => o.status), ["uploaded"]);
    const copy = await local.fetch(`assets/${asset.id.slice(7, 9)}/${asset.id.slice(7)}.wav`);
    await chmod(copy, 0o644);
    await writeFile(copy, "ONE, but longer");
    assert.deepEqual((await pushObjects(fx.paths, local, s3)).objects.map((o) => o.status), ["present"]);
    assert.equal(fake.uploads.length, 1);
  } finally {
    await fx.cleanup();
  }
});
