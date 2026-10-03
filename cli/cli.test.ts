// 端到端调用真实的 ./kineto 可执行文件：cwd 指向临时夹具仓库，验证 CLI 契约
// （非 TTY 输出 JSON、错误进 stderr、退出码稳定）。
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
