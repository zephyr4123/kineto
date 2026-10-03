import { test } from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ingestAsset, readManifest } from "../assets/assets.ts";
import { createVideo, linkAsset, readVideo } from "../catalog/catalog.ts";
import { loadConfig } from "../config.ts";
import { LocalStorage } from "../storage/local.ts";
import { FIXED_NOW, makeRepo, type Fixture } from "../testing/fixture.ts";
import { listTools, loadTool, runTool } from "./host.ts";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// 一个最小插件：把输入素材（可选）和文本拼起来写成 .txt；每次运行在仓库根留一个标记，证明它被执行过
const ECHO = `import { z } from "zod";
import { writeFile, appendFile, readFile } from "node:fs/promises";
import path from "node:path";

export default {
  name: "echo",
  summary: "Write text into a .txt asset",
  config: z.object({ prefix: z.string().default("") }).strict(),
  args: [{ name: "text", description: "What to write" }],
  options: { from: { type: "string", value: "ref", description: "Prepend this input asset" } },
  async run(ctx) {
    await appendFile(path.join(ctx.workDir, "..", "..", "..", "ran.log"), "x");
    const before = ctx.flags.from ? await readFile((await ctx.input(String(ctx.flags.from))).file, "utf8") : "";
    const file = path.join(ctx.workDir, "out.txt");
    await writeFile(file, before + ctx.config.prefix + ctx.args[0]);
    return { file, license: "CC0-1.0", author: "echo tool", description: "Echoed: " + ctx.args[0] };
  },
};
`;

async function setup(config: string): Promise<{ fx: Fixture; store: LocalStorage }> {
  const fx = await makeRepo();
  await symlink(path.join(REPO, "node_modules"), path.join(fx.root, "node_modules"));
  await mkdir(path.join(fx.root, "tools/echo"), { recursive: true });
  await writeFile(path.join(fx.root, "tools/echo/index.ts"), ECHO);
  await mkdir(path.join(fx.root, "tools/broken"), { recursive: true });
  await writeFile(path.join(fx.root, "tools/broken/index.ts"), 'throw new Error("needs a missing dependency");\n');
  // 下划线开头的目录是插件之间共享的代码，不是插件
  await mkdir(path.join(fx.root, "tools/_shared"), { recursive: true });
  await writeFile(path.join(fx.root, "tools/_shared/util.ts"), "export const x = 1;\n");
  await writeFile(path.join(fx.root, "kineto.config.yaml"), config);
  return { fx, store: new LocalStorage(path.join(fx.root, ".kineto/store")) };
}

const ran = async (fx: Fixture) =>
  readFile(path.join(fx.root, "ran.log"), "utf8").then(
    (s) => s.length,
    () => 0,
  );

test("tool list：列出插件与是否启用；导入失败的插件单独报错，不影响别的", async () => {
  const { fx } = await setup("tools:\n  echo:\n    prefix: '> '\n");
  try {
    const config = await loadConfig(fx.paths, {});
    const tools = await listTools(fx.paths, config);
    assert.deepEqual(
      tools.map((t) => ({ name: t.name, enabled: t.enabled, ok: t.error === undefined })),
      [
        { name: "broken", enabled: false, ok: false },
        { name: "echo", enabled: true, ok: true },
      ],
    );
    assert.match(tools[0]!.error!, /missing dependency/);
    assert.equal(tools[1]!.summary, "Write text into a .txt asset");
    await assert.rejects(loadTool(fx.paths, "nope"), { code: "TOOL_NOT_FOUND" });
    await assert.rejects(loadTool(fx.paths, "../etc"), { code: "TOOL_NOT_FOUND" });
  } finally {
    await fx.cleanup();
  }
});

test("没在配置里启用的工具拒绝运行，提示怎么启用", async () => {
  const { fx, store } = await setup("{}\n");
  try {
    const config = await loadConfig(fx.paths, {});
    const spec = await loadTool(fx.paths, "echo");
    await assert.rejects(runTool(fx.paths, store, config, spec, { args: ["hi"], flags: {} }), {
      code: "TOOL_NOT_ENABLED",
      hint: /tools:\n {2}echo:/,
    });
    assert.equal(await ran(fx), 0);
  } finally {
    await fx.cleanup();
  }
});

test("运行工具：产物带插件给的许可证与来历进素材库，挂到视频上，工作目录删干净", async () => {
  const { fx, store } = await setup("tools:\n  echo:\n    prefix: '> '\n");
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo", now: FIXED_NOW });
    const config = await loadConfig(fx.paths, {});
    const spec = await loadTool(fx.paths, "echo");
    const result = await runTool(fx.paths, store, config, spec, { args: ["hello"], flags: {}, to: "demo", as: "note" });

    assert.equal(result.asset.license, "CC0-1.0");
    assert.equal(result.asset.author, "echo tool");
    assert.equal(result.asset.ext, ".txt");
    assert.equal(result.asset.description, "Echoed: hello");
    assert.deepEqual(result.linked, { video: "demo", alias: "note", staticFile: "demo/note.txt" });
    assert.equal((await readVideo(fx.paths, "demo")).assets.note, result.asset.id);
    assert.equal(await readFile(await store.fetch(`assets/${result.asset.id.slice(7, 9)}/${result.asset.id.slice(7)}.txt`), "utf8"), "> hello");
    assert.deepEqual(await readdir(fx.paths.tmpDir).catch(() => []), []);
  } finally {
    await fx.cleanup();
  }
});

test("--license 覆盖插件给的许可证；输入可以是视频上的别名，读到的是素材库里的文件", async () => {
  const { fx, store } = await setup("tools:\n  echo:\n");
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo", now: FIXED_NOW });
    const src = path.join(fx.root, "in.txt");
    await writeFile(src, "IN:");
    const input = await ingestAsset(fx.paths, store, { source: src, license: "CC-BY-4.0", now: FIXED_NOW });
    await linkAsset(fx.paths, "demo", "source", input.id);
    const config = await loadConfig(fx.paths, {});
    const spec = await loadTool(fx.paths, "echo");
    const result = await runTool(fx.paths, store, config, spec, {
      args: ["x"],
      flags: { from: "source", license: "CC-BY-4.0" },
      to: "demo",
      as: "out",
    });
    assert.equal(result.asset.license, "CC-BY-4.0");
    assert.equal(await readFile(await store.fetch(`assets/${result.asset.id.slice(7, 9)}/${result.asset.id.slice(7)}.txt`), "utf8"), "IN:x");

    await assert.rejects(
      runTool(fx.paths, store, config, spec, { args: ["x"], flags: { from: "nope" }, to: "demo", as: "out2" }),
      { code: "ASSET_NOT_LINKED" },
    );
  } finally {
    await fx.cleanup();
  }
});

test("别名只差大小写、--to/--as 不成对、配置段不合法：都在运行工具之前报错，不白花钱；同名别名重跑则改指新产物", async () => {
  const { fx, store } = await setup("tools:\n  echo:\n    prefix: 3\n");
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo", now: FIXED_NOW });
    const spec = await loadTool(fx.paths, "echo");
    const bad = await loadConfig(fx.paths, {});
    await assert.rejects(runTool(fx.paths, store, bad, spec, { args: ["x"], flags: {} }), { code: "CONFIG_INVALID" });

    await writeFile(path.join(fx.root, "kineto.config.yaml"), "tools:\n  echo:\n");
    const config = await loadConfig(fx.paths, {});
    const first = await runTool(fx.paths, store, config, spec, { args: ["a"], flags: {}, to: "demo", as: "note" });
    assert.equal(await ran(fx), 1);
    await assert.rejects(runTool(fx.paths, store, config, spec, { args: ["b"], flags: {}, to: "demo", as: "nOTE" }), {
      code: "ALIAS_CONFLICT",
    });
    await assert.rejects(runTool(fx.paths, store, config, spec, { args: ["b"], flags: {}, to: "demo" }), {
      code: "INVALID_ARGUMENT",
    });
    assert.equal(await ran(fx), 1);
    // 不挂视频时只进素材库
    const loose = await runTool(fx.paths, store, config, spec, { args: ["c"], flags: {} });
    assert.equal(loose.linked, null);
    assert.ok((await readManifest(fx.paths)).has(loose.asset.id));
    assert.notEqual(loose.asset.id, first.asset.id);
    // 重做一版配音之类：同一个别名改指新产物
    const redo = await runTool(fx.paths, store, config, spec, { args: ["d"], flags: {}, to: "demo", as: "note" });
    assert.equal((await readVideo(fx.paths, "demo")).assets.note, redo.asset.id);
    await access(fx.paths.assetsManifest);
  } finally {
    await fx.cleanup();
  }
});

test("工具配置段引用的密钥没设：只有运行这个工具时报 CONFIG_ENV_MISSING，tool list 照常", async () => {
  const { fx, store } = await setup("tools:\n  echo:\n    prefix: ${KINETO_TEST_NOT_SET}\n");
  try {
    const config = await loadConfig(fx.paths, {});
    assert.deepEqual(
      (await listTools(fx.paths, config)).map((t) => [t.name, t.enabled]),
      [["broken", false], ["echo", true]],
    );
    const spec = await loadTool(fx.paths, "echo");
    await assert.rejects(runTool(fx.paths, store, config, spec, { args: ["x"], flags: {} }), { code: "CONFIG_ENV_MISSING" });
    assert.equal(await ran(fx), 0);
  } finally {
    await fx.cleanup();
  }
});

test("--license 为空、存储后端不可用：都在运行工具之前拒绝", async () => {
  const { fx, store } = await setup("tools:\n  echo:\n");
  try {
    const config = await loadConfig(fx.paths, {});
    const spec = await loadTool(fx.paths, "echo");
    await assert.rejects(runTool(fx.paths, store, config, spec, { args: ["x"], flags: { license: "  " } }), { code: "LICENSE_REQUIRED" });
    const { KinetoError } = await import("../errors.ts");
    const down = Object.assign(Object.create(store) as LocalStorage, {
      probe: async () => {
        throw new KinetoError("STORAGE_UNAVAILABLE", "bucket not found");
      },
    });
    await assert.rejects(runTool(fx.paths, down, config, spec, { args: ["x"], flags: {} }), { code: "STORAGE_UNAVAILABLE" });
    assert.equal(await ran(fx), 0);
  } finally {
    await fx.cleanup();
  }
});

test("产物入库失败时保留下来、报错里给出路径：付费调用的结果不能跟着工作目录一起删掉", async () => {
  const { fx, store } = await setup("tools:\n  echo:\n");
  try {
    const config = await loadConfig(fx.paths, {});
    const spec = await loadTool(fx.paths, "echo");
    await runTool(fx.paths, store, config, spec, { args: ["same"], flags: {} });
    // 同样的内容换一个许可证再登记：素材库拒绝悄悄改写许可证
    let kept = "";
    await assert.rejects(runTool(fx.paths, store, config, spec, { args: ["same"], flags: { license: "MIT" } }), (err: Error) => {
      kept = /kept at (\S+?)\)?$/m.exec(err.message)?.[1] ?? "";
      return true;
    });
    assert.ok(kept.startsWith(path.join(fx.root, ".kineto/tools/echo/unsaved")), kept);
    assert.equal(await readFile(kept, "utf8"), "same");
  } finally {
    await fx.cleanup();
  }
});

test("插件返回相对路径按 workDir 解析；返回 workDir 之外的文件报 TOOL_INVALID", async () => {
  const { fx, store } = await setup("tools:\n  rel:\n  escape:\n");
  try {
    for (const [name, file] of [["rel", '"out.txt"'], ["escape", 'path.join(ctx.workDir, "..", "..", "..", "kineto.config.yaml")']] as const) {
      await mkdir(path.join(fx.root, "tools", name), { recursive: true });
      await writeFile(
        path.join(fx.root, "tools", name, "index.ts"),
        `import { z } from "zod";\nimport { writeFile } from "node:fs/promises";\nimport path from "node:path";\n` +
          `export default { name: "${name}", summary: "s", config: z.object({}).strict(), async run(ctx) {\n` +
          `  await writeFile(path.join(ctx.workDir, "out.txt"), "rel");\n` +
          `  return { file: ${file}, license: "CC0-1.0", author: "a", description: "d" };\n} };\n`,
      );
    }
    const config = await loadConfig(fx.paths, {});
    const rel = await runTool(fx.paths, store, config, await loadTool(fx.paths, "rel"), { args: [], flags: {} });
    assert.equal(rel.asset.ext, ".txt");
    await assert.rejects(runTool(fx.paths, store, config, await loadTool(fx.paths, "escape"), { args: [], flags: {} }), { code: "TOOL_INVALID" });
  } finally {
    await fx.cleanup();
  }
});

const plugin = (name: string, body: string) =>
  `import { z } from "zod";\nimport { writeFile, rm } from "node:fs/promises";\nimport path from "node:path";\n` +
  `export default { name: "${name}", summary: "s", config: z.object({}).strict(), async run(ctx) {\n${body}\n} };\n`;

test("插件返回的文件不存在时保留原错误码、不留空的 unsaved 目录；以 .. 开头的文件名不算越界", async () => {
  const { fx, store } = await setup("tools:\n  ghost:\n  dots:\n");
  try {
    await mkdir(path.join(fx.root, "tools/ghost"), { recursive: true });
    await writeFile(path.join(fx.root, "tools/ghost/index.ts"), plugin("ghost", `return { file: "nope.txt", license: "CC0-1.0", author: "a", description: "d" };`));
    await mkdir(path.join(fx.root, "tools/dots"), { recursive: true });
    await writeFile(
      path.join(fx.root, "tools/dots/index.ts"),
      plugin("dots", `await writeFile(path.join(ctx.workDir, "..out.txt"), "dots");\nreturn { file: "..out.txt", license: "CC0-1.0", author: "a", description: "d" };`),
    );
    const config = await loadConfig(fx.paths, {});
    await assert.rejects(runTool(fx.paths, store, config, await loadTool(fx.paths, "ghost"), { args: [], flags: {} }), { code: "ASSET_SOURCE_NOT_FOUND" });
    await assert.rejects(readdir(path.join(fx.root, ".kineto/tools/ghost/unsaved")), { code: "ENOENT" });
    const dots = await runTool(fx.paths, store, config, await loadTool(fx.paths, "dots"), { args: [], flags: {} });
    assert.equal(dots.asset.ext, ".txt");
  } finally {
    await fx.cleanup();
  }
});

test("入库后挂接失败时，错误里带上已入库的素材 id 与改用 asset link 的提示，免得重跑工具再付一次钱", async () => {
  const { fx, store } = await setup("tools:\n  sabotage:\n");
  try {
    await createVideo(fx.paths, { id: "demo", title: "Demo", now: FIXED_NOW });
    await mkdir(path.join(fx.root, "tools/sabotage"), { recursive: true });
    // 运行期间把目标视频删掉：校验时它还在，挂接时已经没了
    await writeFile(
      path.join(fx.root, "tools/sabotage/index.ts"),
      plugin("sabotage", `await rm(path.join(ctx.workDir, "..", "..", "..", "videos", "demo"), { recursive: true });\nawait writeFile(path.join(ctx.workDir, "o.txt"), "x");\nreturn { file: "o.txt", license: "CC0-1.0", author: "a", description: "d" };`),
    );
    const config = await loadConfig(fx.paths, {});
    await assert.rejects(runTool(fx.paths, store, config, await loadTool(fx.paths, "sabotage"), { args: [], flags: {}, to: "demo", as: "out" }), (err: Error & { hint?: string }) => {
      assert.match(err.message, /sha256:[0-9a-f]{64}/);
      assert.match(err.hint ?? "", /asset link sha256:/);
      return true;
    });
  } finally {
    await fx.cleanup();
  }
});
