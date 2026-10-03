import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { ingestAsset } from "../assets/assets.ts";
import { createVideo, linkAsset } from "../catalog/catalog.ts";
import { KinetoError } from "../errors.ts";
import { LocalStorage } from "../storage/local.ts";
import { FIXED_NOW, makeRepo } from "../testing/fixture.ts";
import { verifyStoredAssets } from "./deep.ts";

test("远端对象内容损坏（fetch 报 STORAGE_OBJECT_CORRUPT）记为 ASSET_CORRUPT，继续检查其余素材", async () => {
  const fx = await makeRepo();
  try {
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    await createVideo(fx.paths, { id: "demo", title: "Demo", now: FIXED_NOW });
    for (const [alias, body] of [["a", "aaa"], ["b", "bbb"]] as const) {
      const src = path.join(fx.root, `${alias}.wav`);
      await writeFile(src, body);
      const asset = await ingestAsset(fx.paths, store, { source: src, license: "CC0-1.0", now: FIXED_NOW });
      await linkAsset(fx.paths, "demo", alias, asset.id);
    }
    let fetched = 0;
    const corrupt = Object.assign(Object.create(store) as LocalStorage, {
      fetch: async (key: string) => {
        fetched++;
        if (fetched === 1) throw new KinetoError("STORAGE_OBJECT_CORRUPT", `remote ${key} is corrupt`, { hint: "re-upload" });
        return store.fetch(key);
      },
    });
    const problems = await verifyStoredAssets(fx.paths, corrupt);
    assert.equal(fetched, 2);
    assert.deepEqual(problems.map((p) => p.code), ["ASSET_CORRUPT"]);
    assert.equal(problems[0]!.hint, "re-upload");
  } finally {
    await fx.cleanup();
  }
});
