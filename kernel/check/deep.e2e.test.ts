// check --deep 真实打包每条视频取运行时注册的 composition id（约数秒），兜住静态扫描看不见的写法。
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmod, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeRepo } from "../testing/fixture.ts";
import { createVideo, linkAsset } from "../catalog/catalog.ts";
import { assetStorageKey, ingestAsset } from "../assets/assets.ts";
import { LocalStorage } from "../storage/local.ts";
import { syncAll } from "../sync/sync.ts";
import { checkRepo } from "./check.ts";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// 用展开写法传 id：静态扫描只看得到 id={...}，会当成「非字面量」；这里刻意绕开，id 落进视频 b 的命名空间
const SPREAD = `import { AbsoluteFill, Composition } from "remotion";

const Red: React.FC = () => <AbsoluteFill style={{ backgroundColor: "red" }} />;
const props = { ["i" + "d"]: "b-stolen" } as { id: string };

export const Compositions: React.FC = () => (
  <>
    <Composition id="a" component={Red} durationInFrames={10} fps={30} width={160} height={90} />
    <Composition {...props} component={Red} durationInFrames={10} fps={30} width={160} height={90} />
  </>
);
`;

const codes = (r: { problems: { code: string }[] }) => r.problems.map((p) => p.code).sort();

test("check --deep 报出运行时才能看到的越界 composition id 与同尺寸篡改的素材；静态 check 看不到", async () => {
  const fx = await makeRepo();
  try {
    await symlink(path.join(REPO, "node_modules"), path.join(fx.root, "node_modules"));
    const store = new LocalStorage(path.join(fx.root, ".kineto/store"));
    await createVideo(fx.paths, { id: "a", title: "A" });
    await createVideo(fx.paths, { id: "b", title: "B" });
    await writeFile(path.join(fx.root, "videos/a/compositions.tsx"), SPREAD);
    const src = path.join(fx.root, "pic.png");
    await writeFile(src, "hello");
    const rec = await ingestAsset(fx.paths, store, { source: src, license: "MIT" });
    await linkAsset(fx.paths, "b", "pic", rec.id);
    await syncAll(fx.paths, store);
    const stored = await store.fetch(assetStorageKey(rec));
    await chmod(stored, 0o644);
    await writeFile(stored, "HELLO");
    assert.equal(await readFile(stored, "utf8"), "HELLO");

    assert.deepEqual(codes(await checkRepo(fx.paths, store)), []);
    assert.deepEqual(codes(await checkRepo(fx.paths, store, { deep: true })), ["ASSET_CORRUPT", "COMPOSITION_ID_PREFIX"]);
  } finally {
    await fx.cleanup();
  }
});
