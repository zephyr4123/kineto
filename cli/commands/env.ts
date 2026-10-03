import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { KinetoError } from "../../kernel/errors.ts";
import { syncAll } from "../../kernel/sync/sync.ts";
import type { Context } from "../context.ts";
import { defineCommand } from "../command.ts";

type Status = "ok" | "warn" | "fail";
interface Check {
  name: string;
  status: Status;
  detail: string;
  hint?: string;
}

const SKILL_ROUTER = path.join(".agents", "skills", "remotion-best-practices", "SKILL.md");

export const doctorCommand = defineCommand({
  name: "doctor",
  summary: "Check that this machine can make videos: Node, dependencies, config, storage, agent skills",
  async run(ctx) {
    const checks: Check[] = [];
    const add = (c: Check) => checks.push(c);
    const root = ctx.paths.root;

    // 与 ./kineto 外壳同一判据：类型剥离默认开启的版本
    const [major, minor] = process.versions.node.split(".").map(Number) as [number, number];
    add({
      name: "node",
      status: (major === 22 && minor >= 18) || (major === 23 && minor >= 6) || major >= 24 ? "ok" : "fail",
      detail: process.versions.node,
      hint: "Install Node.js 22.18+ or 23.6+.",
    });

    const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    const wanted: string = pkg.dependencies?.remotion;
    const installed = await readJson(path.join(root, "node_modules", "remotion", "package.json"));
    add(
      installed?.version === wanted
        ? { name: "dependencies", status: "ok", detail: `remotion ${installed.version}` }
        : {
            name: "dependencies",
            status: "fail",
            detail: installed ? `remotion ${installed.version} installed, ${wanted} required` : "node_modules missing",
            hint: "Run `npm install`.",
          },
    );

    // Remotion 要求全家桶版本完全一致、不带 ^
    const remotionDeps = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).filter(
      ([n]) => n === "remotion" || n.startsWith("@remotion/"),
    ) as [string, string][];
    const misaligned = remotionDeps.filter(([, v]) => v !== wanted);
    add({
      name: "remotion-versions",
      status: misaligned.length ? "fail" : "ok",
      detail: misaligned.length ? misaligned.map(([n, v]) => `${n}@${v}`).join(", ") : `${remotionDeps.length} packages pinned to ${wanted}`,
      hint: "Pin every remotion / @remotion/* package to the same exact version.",
    });

    try {
      const { source } = await ctx.config();
      add({ name: "config", status: "ok", detail: source });
      const storage = await ctx.storage();
      const info = storage.describe();
      if (typeof info.root === "string") {
        await mkdir(info.root, { recursive: true });
        await access(info.root, constants.W_OK);
      }
      add({ name: "storage", status: "ok", detail: JSON.stringify(info) });
    } catch (err) {
      if (!(err instanceof KinetoError) && !(err instanceof Error)) throw err;
      add({
        name: "config/storage",
        status: "fail",
        detail: err.message,
        hint: err instanceof KinetoError ? err.hint : undefined,
      });
    }

    const skill = await readFile(path.join(root, SKILL_ROUTER), "utf8").catch(() => null);
    const skillVersion = skill?.match(/^version:\s*(\S+)/m)?.[1];
    add(
      !skill
        ? { name: "remotion-skills", status: "warn", detail: "not installed", hint: "Run `./kineto setup`." }
        : skillVersion === wanted
          ? { name: "remotion-skills", status: "ok", detail: `v${skillVersion}` }
          : {
              name: "remotion-skills",
              status: "warn",
              detail: `skills v${skillVersion ?? "?"} vs remotion ${wanted}`,
              hint: "Run `./kineto setup --update` so the agent skills match the Remotion version.",
            },
    );

    try {
      const { drift } = await syncAll(ctx.paths, await ctx.storage(), { check: true });
      add(
        drift.length
          ? { name: "generated-files", status: "warn", detail: drift.join(", "), hint: "Run `./kineto sync`." }
          : { name: "generated-files", status: "ok", detail: "up to date" },
      );
    } catch (err) {
      if (!(err instanceof KinetoError)) throw err;
      add({ name: "generated-files", status: "fail", detail: err.message, hint: err.hint ?? "Run `./kineto check`." });
    }

    // hint 只给需要处理的项，ok 项带 hint 对 agent 是噪音
    const cleaned = checks.map(({ hint, ...c }) => (c.status !== "ok" && hint ? { ...c, hint } : c));
    return { ok: !cleaned.some((c) => c.status === "fail"), checks: cleaned as Check[] };
  },
  exitCode: (d) => (d.ok ? 0 : 1),
  human: (d) =>
    d.checks
      .map((c) => `${{ ok: "✓", warn: "!", fail: "✗" }[c.status]} ${c.name.padEnd(18)} ${c.detail}${c.status !== "ok" && c.hint ? `\n    → ${c.hint}` : ""}`)
      .join("\n"),
});

export const setupCommand = defineCommand({
  name: "setup",
  summary: "Install the official Remotion agent skills and sync generated files",
  options: {
    update: { type: "boolean", description: "Update the installed Remotion skills to the latest version" },
  },
  mutates: true,
  async run(ctx, { flags }) {
    const root = ctx.paths.root;
    const present = await access(path.join(root, SKILL_ROUTER)).then(
      () => true,
      () => false,
    );
    let skills: "present" | "installed" | "updated" = "present";
    if (!present || flags.update === true) {
      const sub = present ? "update" : "add";
      await runSkills(ctx, sub);
      skills = present ? "updated" : "installed";
    }
    const sync = await syncAll(ctx.paths, await ctx.storage());
    return { skills, sync };
  },
  human: (d) => `Remotion skills: ${d.skills}\nGenerated files: ${d.sync.written.length ? d.sync.written.join(", ") : "up to date"}`,
});

// 官方命令会打印安装进度；全部转到 stderr，保证 JSON 模式下 stdout 只有一行结果
function runSkills(ctx: Context, sub: "add" | "update"): Promise<void> {
  const bin = path.join(ctx.paths.root, "node_modules", ".bin", "remotion");
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["skills", sub], { cwd: ctx.paths.root, stdio: ["ignore", 2, 2] });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new KinetoError("SKILLS_INSTALL_FAILED", `\`remotion skills ${sub}\` exited with code ${code}`, {
            hint: "Check network access to github.com, then retry `./kineto setup`.",
          })),
    );
  });
}

async function readJson(file: string): Promise<{ version?: string } | null> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}
