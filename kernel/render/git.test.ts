import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gitState } from "./git.ts";

test("渲染记录的追加不算工作区改动：连续渲染多个 composition 时后面的不被误记为 dirty", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-git-"));
  try {
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git("init", "-q");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    await mkdir(path.join(dir, "videos/demo"), { recursive: true });
    await writeFile(path.join(dir, "videos/demo/Video.tsx"), "v1\n");
    await writeFile(path.join(dir, "videos/demo/renders.jsonl"), "");
    git("add", ".");
    git("commit", "-qm", "init");

    assert.equal((await gitState(dir)).dirty, false);
    await writeFile(path.join(dir, "videos/demo/renders.jsonl"), "{}\n");
    assert.equal((await gitState(dir)).dirty, false);
    await writeFile(path.join(dir, "videos/demo/Video.tsx"), "v2\n");
    assert.equal((await gitState(dir)).dirty, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("不在 git 仓库里：sha 记为 null、dirty 记为 true", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kineto-nogit-"));
  try {
    assert.deepEqual(await gitState(dir), { sha: null, dirty: true });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
