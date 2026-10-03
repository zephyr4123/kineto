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
