// 提交规范检查：查「这个分支自己的提交」（<base> 与 HEAD 的分叉点到 HEAD）。
// CI 的 conventions 任务和 scripts/ship.sh 都跑它；规则的说明在 AGENTS.md 的「Git and GitHub」一节，
// 这里只放机器判得了的部分。用法：node scripts/conventions.ts [--base <rev>]（默认 origin/main）
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export type Commit = { sha: string; message: string; parents: number; files: string[] };
export type RenderSha = { file: string; sha: string };
export type RangeFacts = {
  commits: Commit[];
  /** 分叉点到 HEAD 的净改动 */
  changedFiles: string[];
  /** 本范围新增的渲染记录里写的 git sha */
  renderShas: RenderSha[];
};
export type Violation = {
  rule: "ai-attribution" | "video-subject" | "changelog" | "render-sha";
  sha?: string;
  message: string;
  hint: string;
};

const AGENTS = "(claude|anthropic|copilot|codex|openai|chatgpt|cursor|gemini|devin|aider)";
const ATTRIBUTION = [
  new RegExp(`^\\s*co-authored-by:.*\\b${AGENTS}\\b.*$`, "im"),
  new RegExp(`^.*generated (with|by)\\W+${AGENTS}\\b.*$`, "im"),
  // 署名尾注是以 🤖 开头的一整行；正文里提到 🤖 不算
  /^\s*🤖.*$/mu,
];

/** 提交信息里的 AI 署名（红线 1），返回命中的那一行 */
export function aiAttribution(message: string): string | undefined {
  for (const re of ATTRIBUTION) {
    const hit = message.match(re);
    if (hit) return hit[0].trim();
  }
  return undefined;
}

// 新建视频、加素材时 CLI 会顺带改这两个文件，不影响「这个提交只关于一条视频」的判断
const VIDEO_NEUTRAL = new Set(["assets/manifest.jsonl", "src/registry.gen.tsx"]);

/** 提交只动了一条视频时返回它的 id */
export function videoOf(files: string[]): string | undefined {
  const ids = new Set<string>();
  for (const f of files) {
    if (VIDEO_NEUTRAL.has(f)) continue;
    const m = /^videos\/([^/]+)\//.exec(f);
    if (!m) return undefined;
    ids.add(m[1]!);
  }
  return ids.size === 1 ? [...ids][0] : undefined;
}

/** 标题以视频 id 开头；speakmore-promo-2 不算 speakmore-promo 开头 */
export const namesVideo = (subject: string, id: string): boolean =>
  subject.startsWith(id) && /^(\s|:|：|$)/.test(subject.slice(id.length));

const PRODUCT_DIRS = ["cli/", "kernel/", "tools/", "engine/", "templates/", "src/"];

/** 改了会影响 kineto 使用者的文件：这类改动要记进 CHANGELOG.md */
export function isProductFile(file: string): boolean {
  if (file === "kineto") return true;
  if (!PRODUCT_DIRS.some((d) => file.startsWith(d))) return false;
  return !(
    /\.test\.tsx?$/.test(file) ||
    file.startsWith("kernel/testing/") ||
    /\.gen\.tsx?$/.test(file) ||
    file.endsWith(".md")
  );
}

const SKIP_CHANGELOG = /^changelog:\s*skip\s*$/im;
const SHA = /^[0-9a-f]{7,64}$/;

/** inHistory(sha)：sha 是否是 HEAD 本身或它的祖先 */
export function checkRange(facts: RangeFacts, inHistory: (sha: string) => boolean): Violation[] {
  const out: Violation[] = [];
  for (const c of facts.commits) {
    const short = c.sha.slice(0, 7);
    const line = aiAttribution(c.message);
    if (line) {
      out.push({
        rule: "ai-attribution",
        sha: c.sha,
        message: `${short} carries an AI attribution line: "${line}"`,
        hint: "remove it with git commit --amend (or git rebase -i for older commits) before anything reaches main",
      });
    }
    if (c.parents > 1) continue;
    const id = videoOf(c.files);
    const subject = c.message.split("\n", 1)[0] ?? "";
    if (id && !namesVideo(subject, id)) {
      out.push({
        rule: "video-subject",
        sha: c.sha,
        message: `${short} only touches videos/${id}/ but its subject does not start with the video id: "${subject}"`,
        hint: `reword it as "${id} <what changed>"`,
      });
    }
  }

  const product = facts.changedFiles.filter(isProductFile);
  const skipped = facts.commits.some((c) => SKIP_CHANGELOG.test(c.message));
  if (product.length > 0 && !facts.changedFiles.includes("CHANGELOG.md") && !skipped) {
    const shown = product.slice(0, 5).join(", ") + (product.length > 5 ? ` and ${product.length - 5} more` : "");
    out.push({
      rule: "changelog",
      message: `this branch changes kineto itself (${shown}) but not CHANGELOG.md`,
      hint: 'add a line under "## [Unreleased]" in CHANGELOG.md; for a change users cannot notice (a pure refactor), add the trailer "Changelog: skip" to one of the commits instead',
    });
  }

  for (const r of facts.renderShas) {
    if (!SHA.test(r.sha)) {
      out.push({
        rule: "render-sha",
        message: `${r.file} has a new record whose git sha is not a commit id: "${r.sha}"`,
        hint: "render records are written by ./kineto render; do not edit them by hand",
      });
    } else if (!inHistory(r.sha)) {
      out.push({
        rule: "render-sha",
        message: `${r.file} has a new record for ${r.sha.slice(0, 7)}, which is not in this branch's history`,
        hint: "the branch was probably rebased after rendering. Never rebase rendered commits: bring main in with git merge origin/main. To repair, render again on the current commits",
      });
    }
  }
  return out;
}

function gitIn(cwd: string | undefined) {
  // core.quotePath=false：不然中文文件名会被转义成 "videos/x/\344..."，路径规则就认不出来
  return (...args: string[]) =>
    execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd, encoding: "utf8", maxBuffer: 64 << 20 }).trimEnd();
}

const lines = (text: string) => text.split("\n").filter(Boolean);

/** 从 git 读出 <base> 与 HEAD 分叉以后的事实 */
export function readRange(base: string, cwd?: string): { facts: RangeFacts; inHistory: (sha: string) => boolean } {
  const git = gitIn(cwd);
  const fork = git("merge-base", base, "HEAD");
  const commits = lines(git("rev-list", "--reverse", `${fork}..HEAD`)).map(
    (sha): Commit => ({
      sha,
      message: git("show", "-s", "--format=%B", sha),
      parents: git("rev-list", "--parents", "-n", "1", sha).split(" ").length - 1,
      files: lines(git("diff-tree", "--no-commit-id", "--name-only", "-r", "--root", sha)),
    }),
  );

  const renderShas: RenderSha[] = [];
  let file = "";
  for (const l of git("diff", "--unified=0", fork, "HEAD", "--", "videos/*/renders.jsonl").split("\n")) {
    if (l.startsWith("+++ ")) file = l.replace(/^\+\+\+ b\//, "");
    else if (l.startsWith("+") && l.trim() !== "+") {
      let sha: unknown;
      try {
        sha = (JSON.parse(l.slice(1)) as { git?: { sha?: unknown } }).git?.sha;
      } catch {
        sha = undefined;
      }
      renderShas.push({ file, sha: typeof sha === "string" ? sha : String(sha) });
    }
  }

  return {
    facts: { commits, changedFiles: lines(git("diff", "--name-only", fork, "HEAD")), renderShas },
    // 退出码 0：是祖先；1：不是；其它（对象不存在等）一律当作不在历史里
    inHistory: (sha) => spawnSync("git", ["merge-base", "--is-ancestor", sha, "HEAD"], { cwd }).status === 0,
  };
}

function main(): number {
  const { values } = parseArgs({ options: { base: { type: "string", default: "origin/main" } } });
  const { facts, inHistory } = readRange(values.base);
  const violations = checkRange(facts, inHistory);
  const annotate = process.env.GITHUB_ACTIONS === "true";
  for (const v of violations) {
    process.stderr.write(`${annotate ? "::error::" : "✗ "}[${v.rule}] ${v.message}\n  hint: ${v.hint}\n`);
  }
  const n = facts.commits.length;
  process.stdout.write(
    `conventions: ${n} commit${n === 1 ? "" : "s"} since ${values.base}, ${violations.length} violation${violations.length === 1 ? "" : "s"}\n`,
  );
  return violations.length === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
