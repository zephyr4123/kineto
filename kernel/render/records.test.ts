import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { makeRepo } from "../testing/fixture.ts";
import { createVideo } from "../catalog/catalog.ts";
import { appendRender, readRenders, type RenderRecord } from "./records.ts";

const sample: RenderRecord = {
  renderedAt: "2026-10-03T12:00:00.000Z",
  composition: "demo",
  codec: "h264",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 60,
  bytes: 1234,
  sha256: "d".repeat(64),
  storage: { backend: "local", key: "renders/demo/demo-dddddddddddd.mp4", url: null },
  git: { sha: "abc123", dirty: false },
  remotion: "4.0.532",
  elapsedMs: 5000,
};

test("appendRender 追加、readRenders 按写入顺序读回；没有渲染过时返回空数组", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo" });
    assert.deepEqual(await readRenders(fx.paths, "demo"), []);
    await appendRender(fx.paths, "demo", sample);
    await appendRender(fx.paths, "demo", { ...sample, codec: "vp9" });
    assert.deepEqual(
      (await readRenders(fx.paths, "demo")).map((r) => r.codec),
      ["h264", "vp9"],
    );
  } finally {
    await fx.cleanup();
  }
});

test("readRenders 遇到坏行报 RENDERS_INVALID 并指出行号", async () => {
  const fx = await makeRepo();
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo" });
    await appendRender(fx.paths, "demo", sample);
    await appendFile(path.join(fx.root, "videos/demo/renders.jsonl"), '{"codec":"h264"}\n');
    await assert.rejects(readRenders(fx.paths, "demo"), (err: { code: string; message: string }) => {
      assert.equal(err.code, "RENDERS_INVALID");
      assert.match(err.message, /line 2/);
      return true;
    });
  } finally {
    await fx.cleanup();
  }
});
