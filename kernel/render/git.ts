// 渲染时记下代码版本：sha + 工作区是否有未提交改动（dirty 时产物无法仅凭 sha 复现）
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RenderRecord } from "./records.ts";

const run = promisify(execFile);

// renders.jsonl 是渲染自己追加的历史，不影响画面；不排除它，连续渲染时第二个起永远是 dirty
const IGNORED = ":(exclude,glob)videos/*/renders.jsonl";

export async function gitState(cwd: string): Promise<RenderRecord["git"]> {
  try {
    const [{ stdout: sha }, { stdout: status }] = await Promise.all([
      run("git", ["rev-parse", "HEAD"], { cwd }),
      run("git", ["status", "--porcelain", "--", ".", IGNORED], { cwd }),
    ]);
    return { sha: sha.trim(), dirty: status.trim() !== "" };
  } catch {
    // 不在 git 仓库里（或还没有任何提交）：如实记为未知，不阻断渲染
    return { sha: null, dirty: true };
  }
}
