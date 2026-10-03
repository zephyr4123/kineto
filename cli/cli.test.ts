// 端到端调用真实的 ./kineto 可执行文件：cwd 指向临时夹具仓库，验证 CLI 契约
// （非 TTY 输出 JSON、错误进 stderr、退出码稳定）。
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeRepo } from "../kernel/testing/fixture.ts";

const BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "kineto");

function kineto(cwd: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });
  const parse = (s: string) => (s.trim() ? JSON.parse(s) : null);
  return { status: r.status, out: parse(r.stdout), err: parse(r.stderr) };
}

test("非 TTY 下 help 输出机器可读的命令清单", async () => {
  const fx = await makeRepo();
  try {
    const r = kineto(fx.root, "help");
    assert.equal(r.status, 0);
    assert.equal(r.out.ok, true);
    const names = r.out.data.commands.map((c: { name: string }) => c.name);
    for (const name of ["new", "list", "show", "asset add", "sync", "check", "render", "doctor"]) {
      assert.ok(names.includes(name), `missing command ${name}`);
    }
  } finally {
    await fx.cleanup();
  }
});

test("new → list → show 走通，new 之后 check 直接通过", async () => {
  const fx = await makeRepo();
  try {
    const created = kineto(fx.root, "new", "demo", "--title", "Demo video");
    assert.equal(created.status, 0, JSON.stringify(created.err));
    assert.equal(created.out.data.video.id, "demo");

    const list = kineto(fx.root, "list");
    assert.deepEqual(
      list.out.data.videos.map((v: { id: string }) => v.id),
      ["demo"],
    );

    const show = kineto(fx.root, "show", "demo");
    assert.equal(show.out.data.video.title, "Demo video");
    assert.deepEqual(show.out.data.compositions, ["demo"]);

    const check = kineto(fx.root, "check");
    assert.equal(check.status, 0, JSON.stringify(check.out ?? check.err));
  } finally {
    await fx.cleanup();
  }
});

test("asset add 登记并挂到视频上，show 能看到别名", async () => {
  const fx = await makeRepo();
  try {
    kineto(fx.root, "new", "demo", "--title", "Demo");
    const file = path.join(fx.root, "boop.wav");
    await writeFile(file, "hello");
    const added = kineto(fx.root, "asset", "add", file, "--license", "CC0-1.0", "--to", "demo", "--as", "boop");
    assert.equal(added.status, 0, JSON.stringify(added.err));
    assert.match(added.out.data.asset.id, /^sha256:/);
    const show = kineto(fx.root, "show", "demo");
    assert.equal(show.out.data.assets[0].alias, "boop");
    assert.equal(kineto(fx.root, "check").status, 0);
  } finally {
    await fx.cleanup();
  }
});

test("用法错误退出码 2、业务错误退出码 1，错误以 JSON 写到 stderr", async () => {
  const fx = await makeRepo();
  try {
    const unknownFlag = kineto(fx.root, "list", "--bogus");
    assert.equal(unknownFlag.status, 2);
    assert.equal(unknownFlag.err.error.code, "USAGE");
    assert.equal(unknownFlag.out, null);

    const noLicense = kineto(fx.root, "asset", "add", "x.png");
    assert.equal(noLicense.status, 2);
    assert.match(noLicense.err.error.message, /--license/);

    const unknownCmd = kineto(fx.root, "explode");
    assert.equal(unknownCmd.status, 2);

    const missing = kineto(fx.root, "show", "ghost");
    assert.equal(missing.status, 1);
    assert.equal(missing.err.error.code, "VIDEO_NOT_FOUND");
    assert.ok(missing.err.error.hint);
  } finally {
    await fx.cleanup();
  }
});

test("仓库外运行报 NOT_IN_KINETO_REPO", () => {
  const r = kineto(path.parse(process.cwd()).root, "list");
  assert.equal(r.status, 1);
  assert.equal(r.err.error.code, "NOT_IN_KINETO_REPO");
});

function kinetoAsync(cwd: string, ...args: string[]): Promise<{ status: number | null; out: any; err: any }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) =>
      resolve({ status, out: stdout.trim() ? JSON.parse(stdout) : null, err: stderr.trim() ? JSON.parse(stderr) : null }),
    );
  });
}

test("写在命令前面的参数报用法错误，而不是被静默丢弃", async () => {
  const fx = await makeRepo();
  try {
    assert.equal(kineto(fx.root, "--check", "sync").status, 2);
    assert.equal(kineto(fx.root, "--bogus", "list").status, 2);
    assert.equal(kineto(fx.root, "--json", "list").status, 0);
  } finally {
    await fx.cleanup();
  }
});

test("结论不通过时顶层 ok 为 false：check 失败输出 ok:false + 报告，退出码 1", async () => {
  const fx = await makeRepo();
  try {
    kineto(fx.root, "new", "demo", "--title", "Demo");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(fx.root, "videos/stray"));
    const r = kineto(fx.root, "check");
    assert.equal(r.status, 1);
    assert.equal(r.out.ok, false);
    assert.equal(r.out.data.ok, false);
  } finally {
    await fx.cleanup();
  }
});

test("asset add 别名非法时什么都不落盘；asset link 把已登记素材挂到另一条视频", async () => {
  const fx = await makeRepo();
  try {
    kineto(fx.root, "new", "a", "--title", "A");
    kineto(fx.root, "new", "b", "--title", "B");
    const file = path.join(fx.root, "pic.png");
    await writeFile(file, "hello");
    const bad = kineto(fx.root, "asset", "add", file, "--license", "MIT", "--to", "a", "--as", "Bad-Alias");
    assert.equal(bad.status, 1);
    assert.equal(bad.err.error.code, "INVALID_ALIAS");
    assert.deepEqual(kineto(fx.root, "asset", "list").out.data.assets, []);

    const added = kineto(fx.root, "asset", "add", file, "--license", "MIT", "--author", "Jane", "--to", "a", "--as", "pic");
    const linked = kineto(fx.root, "asset", "link", added.out.data.asset.id, "--to", "b", "--as", "photo");
    assert.equal(linked.status, 0, JSON.stringify(linked.err));
    assert.equal(kineto(fx.root, "show", "b").out.data.assets[0].author, "Jane");
    assert.equal(kineto(fx.root, "check").status, 0);
  } finally {
    await fx.cleanup();
  }
});

test("asset unlink 把别名从视频上摘掉，素材留在库里；别的视频还挂着时如实报出", async () => {
  const fx = await makeRepo();
  try {
    kineto(fx.root, "new", "a", "--title", "A");
    kineto(fx.root, "new", "b", "--title", "B");
    const file = path.join(fx.root, "pic.png");
    await writeFile(file, "hello");
    const added = kineto(fx.root, "asset", "add", file, "--license", "MIT", "--to", "a", "--as", "pic");
    kineto(fx.root, "asset", "link", added.out.data.asset.id, "--to", "b", "--as", "photo");

    const r = kineto(fx.root, "asset", "unlink", "pic", "--from", "a");
    assert.equal(r.status, 0, JSON.stringify(r.err));
    assert.deepEqual(r.out.data.unlinked, { video: "a", alias: "pic", assetId: added.out.data.asset.id });
    assert.deepEqual(r.out.data.stillLinkedBy, [{ video: "b", alias: "photo" }]);
    assert.deepEqual(kineto(fx.root, "show", "a").out.data.assets, []);
    assert.equal(kineto(fx.root, "asset", "list").out.data.assets.length, 1);
    assert.equal(kineto(fx.root, "check").status, 0);

    const again = kineto(fx.root, "asset", "unlink", "pic", "--from", "a");
    assert.equal(again.status, 1);
    assert.equal(again.err.error.code, "ASSET_NOT_LINKED");
    assert.equal(kineto(fx.root, "asset", "unlink", "photo").status, 2);
  } finally {
    await fx.cleanup();
  }
});

test("并发的 asset add 被仓库锁串行化：每条都成功、都真的挂上了", async () => {
  const fx = await makeRepo();
  try {
    kineto(fx.root, "new", "v", "--title", "V");
    const runs = await Promise.all(
      [0, 1, 2, 3, 4, 5].map(async (i) => {
        const file = path.join(fx.root, `f${i}.png`);
        await writeFile(file, `content-${i}`);
        return kinetoAsync(fx.root, "asset", "add", file, "--license", "MIT", "--to", "v", "--as", `a${i}`);
      }),
    );
    assert.deepEqual(runs.map((r) => r.status), [0, 0, 0, 0, 0, 0], JSON.stringify(runs.map((r) => r.err)));
    const aliases = kineto(fx.root, "show", "v").out.data.assets.map((a: { alias: string }) => a.alias).sort();
    assert.deepEqual(aliases, ["a0", "a1", "a2", "a3", "a4", "a5"]);
    assert.equal(kineto(fx.root, "check").status, 0);
  } finally {
    await fx.cleanup();
  }
});

test("另一条视频坏了时 new 先报错、不留下半成品目录；空标题报 INVALID_ARGUMENT", async () => {
  const fx = await makeRepo();
  try {
    const { mkdir, access } = await import("node:fs/promises");
    await mkdir(path.join(fx.root, "videos/broken"));
    const r = kineto(fx.root, "new", "fresh", "--title", "Fresh");
    assert.equal(r.status, 1);
    await assert.rejects(access(path.join(fx.root, "videos/fresh")));
    const { rm } = await import("node:fs/promises");
    await rm(path.join(fx.root, "videos/broken"), { recursive: true });
    const empty = kineto(fx.root, "new", "other", "--title", "");
    assert.equal(empty.err.error.code, "INVALID_ARGUMENT");
  } finally {
    await fx.cleanup();
  }
});

test("storage push 在本地存储后端下报 STORAGE_PUSH_NOOP，退出码 1", async () => {
  const fx = await makeRepo();
  try {
    const r = kineto(fx.root, "storage", "push");
    assert.equal(r.status, 1);
    assert.equal(r.err.error.code, "STORAGE_PUSH_NOOP");
  } finally {
    await fx.cleanup();
  }
});

test("storage push 的判定：缺素材才算不通过（退出码 1），历史渲染文件已删除只作提示", async () => {
  // 真推需要网络上的 S3，这里直接验证命令的判定规则
  const { storagePushCommand } = await import("./commands/storage.ts");
  const base = { to: {}, uploaded: 0, present: 1, corrupt: [], objects: [] };
  assert.equal(storagePushCommand.exitCode!({ ...base, missingAssets: [], missingRenders: ["renders/a/a-1.mp4"] }), 0);
  assert.equal(storagePushCommand.exitCode!({ ...base, missingAssets: ["assets/aa/x.wav"], missingRenders: [] }), 1);
  assert.match(storagePushCommand.human!({ ...base, missingAssets: [], missingRenders: ["renders/a/a-1.mp4"] }), /no longer stored/);
});

test("tool list / tool <name>：插件按需加载，参数走同一套解析与 help，产物入库并挂到视频上", async () => {
  const fx = await makeRepo();
  try {
    const { mkdir, symlink } = await import("node:fs/promises");
    await symlink(path.resolve(path.dirname(BIN), "node_modules"), path.join(fx.root, "node_modules"));
    await mkdir(path.join(fx.root, "tools/echo"), { recursive: true });
    await writeFile(
      path.join(fx.root, "tools/echo/index.ts"),
      `import { z } from "zod";
import { writeFile } from "node:fs/promises";
import path from "node:path";
export default {
  name: "echo",
  summary: "Write text into a .txt asset",
  config: z.object({}).strict(),
  args: [{ name: "text", description: "What to write" }],
  options: { shout: { type: "boolean", description: "Uppercase" } },
  async run(ctx) {
    const file = path.join(ctx.workDir, "out.txt");
    await writeFile(file, ctx.flags.shout ? ctx.args[0].toUpperCase() : ctx.args[0]);
    return { file, license: "CC0-1.0", author: "echo", description: "echo" };
  },
};
`,
    );
    await writeFile(path.join(fx.root, "kineto.config.yaml"), "tools:\n  echo:\n");
    kineto(fx.root, "new", "demo", "--title", "Demo");

    const list = kineto(fx.root, "tool", "list");
    assert.deepEqual(list.out.data.tools, [{ name: "echo", summary: "Write text into a .txt asset", enabled: true }]);

    const help = kineto(fx.root, "tool", "echo", "--help");
    assert.match(help.out.data.usage, /^kineto tool echo <text> \[--shout\] \[--to <video>\]/);

    const run = kineto(fx.root, "tool", "echo", "hi", "--shout", "--to", "demo", "--as", "note");
    assert.equal(run.status, 0, JSON.stringify(run.err));
    assert.equal(run.out.data.linked.staticFile, "demo/note.txt");
    assert.equal(kineto(fx.root, "check").status, 0);

    assert.equal(kineto(fx.root, "tool", "echo", "hi", "--bogus").status, 2);
    const missing = kineto(fx.root, "tool", "nope");
    assert.equal(missing.status, 1);
    assert.equal(missing.err.error.code, "TOOL_NOT_FOUND");
  } finally {
    await fx.cleanup();
  }
});

test("--version 输出 package.json 里的版本", async () => {
  const fx = await makeRepo();
  try {
    const { readFile } = await import("node:fs/promises");
    const { version } = JSON.parse(await readFile(path.resolve(path.dirname(BIN), "package.json"), "utf8"));
    const r = kineto(fx.root, "--version");
    assert.equal(r.status, 0);
    assert.equal(r.out.data.version, version);
  } finally {
    await fx.cleanup();
  }
});

test("--version 只能单独用：写在命令后面或带着命令都报用法错误，不静默执行命令", async () => {
  const fx = await makeRepo();
  try {
    const after = kineto(fx.root, "new", "zz", "--title", "T", "--version");
    assert.equal(after.status, 2);
    assert.equal(kineto(fx.root, "list").out.data.videos.length, 0);
    assert.equal(kineto(fx.root, "--version", "list").status, 2);
  } finally {
    await fx.cleanup();
  }
});
