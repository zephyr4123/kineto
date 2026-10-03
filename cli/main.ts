// CLI 契约（AGENTS.md 里有同样的说明）：
// - stdout 不是终端或带 --json 时输出 JSON：成功 {"ok":true,"command",...,"data"} 写 stdout，
//   失败 {"ok":false,"error":{code,message,hint}} 写 stderr
// - 退出码：0 成功；1 业务错误或结论不通过（check、sync --check）；2 用法错误
// - 未知参数、缺必填参数、写在命令前面的参数一律报错，不猜
// - 顶层 ok 与退出码一致：check 不通过时 ok 为 false，报告照样放在 data 里
import { parseArgs } from "node:util";
import { z } from "zod";
import { KinetoError } from "../kernel/errors.ts";
import { withRepoLock } from "../kernel/lock.ts";
import { findRoot, pathsFor } from "../kernel/paths.ts";
import { loadTool } from "../kernel/tools/host.ts";
import type { CommandSpec, Flags } from "./command.ts";
import { UsageError } from "./command.ts";
import { COMMANDS } from "./commands/index.ts";
import { toolCommand } from "./commands/tools.ts";
import { Context } from "./context.ts";

const GLOBAL_OPTIONS = {
  json: { type: "boolean", description: "Force JSON output (default when stdout is not a terminal)" },
  help: { type: "boolean", description: "Show help for the command" },
} as const;

async function main(argv: string[]): Promise<number> {
  const json = argv.includes("--json") || !process.stdout.isTTY;
  const interactive = !json && process.stderr.isTTY;
  try {
    // 命令前只允许全局开关；其它参数放在命令前会被静默忽略（例如 `./kineto --check sync` 会真的去写），所以直接报错
    const first = argv.findIndex((a) => !a.startsWith("-"));
    const leading = first === -1 ? argv : argv.slice(0, first);
    const misplaced = leading.find((a) => !["--json", "--help", "-h"].includes(a));
    if (misplaced) {
      throw new UsageError(`Option ${misplaced} must come after the command`, "Usage: kineto <command> [options]");
    }
    const words = argv.filter((a) => !a.startsWith("-"));
    if (words.length === 0 || words[0] === "help") {
      const target = words[0] === "help" ? (resolve(words.slice(1)) ?? (await resolveTool(words.slice(1)))) : undefined;
      return print(json, "help", target ? commandHelp(target.spec) : globalHelp());
    }
    const resolved = resolve(words) ?? (await resolveTool(words));
    if (!resolved) {
      throw new UsageError(`Unknown command "${words[0]}"`, "Run `./kineto help` to list commands.");
    }
    const { spec } = resolved;
    if (argv.includes("--help") || argv.includes("-h")) return print(json, "help", commandHelp(spec));

    const { args, flags } = parse(spec, argv.slice(argv.indexOf(words[resolved.depth - 1]!) + 1));
    const ctx = new Context(process.cwd(), process.env, interactive ? progressLine : () => {});
    const run = () => spec.run(ctx, { args, flags });
    const data = spec.mutates ? await withRepoLock(ctx.paths, run) : await run();
    if (interactive) process.stderr.write("\r\x1b[2K");
    const code = spec.exitCode?.(data) ?? 0;
    print(json, spec.name, data, spec.human, code === 0);
    return code;
  } catch (err) {
    if (interactive) process.stderr.write("\r\x1b[2K");
    return fail(json, err);
  }
}

function resolve(words: string[]): { spec: CommandSpec<any>; depth: number } | undefined {
  for (const depth of [2, 1]) {
    const name = words.slice(0, depth).join(" ");
    const spec = COMMANDS.find((c) => c.name === name);
    if (spec && words.length >= depth) return { spec, depth };
  }
  return undefined;
}

// `tool <name>` 不在静态命令表里：用到时才去 tools/<name> 加载插件，核心命令永远不碰插件代码
async function resolveTool(words: string[]): Promise<{ spec: CommandSpec<any>; depth: number } | undefined> {
  if (words[0] !== "tool" || words[1] === undefined) return undefined;
  const spec = await loadTool(pathsFor(findRoot(process.cwd())), words[1]);
  return { spec: toolCommand(spec), depth: 2 };
}

function parse(spec: CommandSpec<any>, tokens: string[]): { args: string[]; flags: Flags } {
  const options = Object.fromEntries(
    Object.entries({ ...spec.options, ...GLOBAL_OPTIONS }).map(([k, o]) => [
      k,
      { type: o.type, ...("multiple" in o && o.multiple ? { multiple: true } : {}) },
    ]),
  );
  let parsed;
  try {
    parsed = parseArgs({ args: tokens, options, allowPositionals: true, strict: true });
  } catch (err) {
    throw new UsageError((err as Error).message, `Run \`./kineto ${spec.name} --help\`.`);
  }
  const argSpecs = spec.args ?? [];
  const required = argSpecs.filter((a) => !a.optional).length;
  if (parsed.positionals.length < required || parsed.positionals.length > argSpecs.length) {
    const expected = argSpecs.map((a) => (a.optional ? `[${a.name}]` : `<${a.name}>`)).join(" ") || "no arguments";
    throw new UsageError(`./kineto ${spec.name} expects ${expected}`, `Run \`./kineto ${spec.name} --help\`.`);
  }
  for (const [name, o] of Object.entries(spec.options ?? {})) {
    if (o.required && parsed.values[name] === undefined) {
      throw new UsageError(`Missing required option --${name}`, `Run \`./kineto ${spec.name} --help\`.`);
    }
  }
  return { args: parsed.positionals, flags: parsed.values as Flags };
}

function usageLine(spec: CommandSpec<any>): string {
  const args = (spec.args ?? []).map((a) => (a.optional ? `[${a.name}]` : `<${a.name}>`));
  const opts = Object.entries(spec.options ?? {}).map(([k, o]) => {
    const flag = o.type === "string" ? `--${k} <${o.value ?? k}>` : `--${k}`;
    return o.required ? flag : `[${flag}]`;
  });
  return ["kineto", spec.name, ...args, ...opts].join(" ");
}

const commandHelp = (spec: CommandSpec<any>) => ({
  name: spec.name,
  summary: spec.summary,
  usage: usageLine(spec),
  args: spec.args ?? [],
  options: spec.options ?? {},
});

const globalHelp = () => ({
  usage: "kineto <command> [options]",
  contract: {
    output: "JSON when stdout is not a terminal or --json is given; success on stdout, errors on stderr",
    exitCodes: { "0": "success", "1": "error, or a check that did not pass", "2": "usage error" },
  },
  commands: COMMANDS.map((c) => ({ name: c.name, summary: c.summary, usage: usageLine(c) })),
});

function print(json: boolean, command: string, data: unknown, human?: (d: any) => string, ok = true): number {
  if (json) {
    process.stdout.write(JSON.stringify({ ok, command, data }) + "\n");
  } else if (command === "help") {
    process.stdout.write(formatHelp(data as ReturnType<typeof globalHelp> | ReturnType<typeof commandHelp>));
  } else {
    process.stdout.write((human ? human(data) : JSON.stringify(data, null, 2)) + "\n");
  }
  return 0;
}

function formatHelp(help: ReturnType<typeof globalHelp> | ReturnType<typeof commandHelp>): string {
  if ("commands" in help) {
    const width = Math.max(...help.commands.map((c) => c.name.length));
    return (
      `Usage: ${help.usage}\n\nCommands:\n` +
      help.commands.map((c) => `  ${c.name.padEnd(width)}  ${c.summary}`).join("\n") +
      `\n\nRun \`./kineto <command> --help\` for details. Output is JSON when piped; exit codes: 0 ok, 1 error, 2 usage.\n`
    );
  }
  const lines = [`${help.summary}\n`, `Usage: ${help.usage}\n`];
  for (const a of help.args) lines.push(`  <${a.name}>  ${a.description}`);
  for (const [k, o] of Object.entries(help.options)) {
    lines.push(`  --${k}${o.type === "string" ? ` <${o.value ?? k}>` : ""}  ${o.description}${o.required ? " (required)" : ""}`);
  }
  return lines.join("\n") + "\n";
}

function fail(json: boolean, raw: unknown): number {
  const err = normalize(raw);
  const usage = err instanceof UsageError;
  const known = err instanceof KinetoError;
  const error = {
    code: usage ? "USAGE" : known ? err.code : "INTERNAL",
    message: err instanceof Error ? err.message : String(err),
    ...((usage || known) && err.hint ? { hint: err.hint } : {}),
  };
  if (json) {
    process.stderr.write(JSON.stringify({ ok: false, error }) + "\n");
  } else {
    process.stderr.write(`error [${error.code}] ${error.message}\n`);
    if ("hint" in error) process.stderr.write(`hint: ${error.hint}\n`);
    if (!usage && !known && err instanceof Error && err.stack) process.stderr.write(err.stack + "\n");
  }
  return usage ? 2 : 1;
}

// 把常见的非 kineto 错误翻译成稳定的错误码，agent 才能按 code 分支，而不是对着 INTERNAL 猜
function normalize(err: unknown): unknown {
  if (err instanceof z.ZodError) {
    return new KinetoError("INVALID_ARGUMENT", z.prettifyError(err), { hint: "Check the values you passed." });
  }
  const errno = err as NodeJS.ErrnoException;
  if (errno?.code === "ENOENT") {
    return new KinetoError("FILE_NOT_FOUND", errno.message, { hint: "Check the path; relative paths resolve from your current directory." });
  }
  return err;
}

function progressLine(message: string) {
  process.stderr.write(`\r\x1b[2K${message}`);
}

process.exitCode = await main(process.argv.slice(2));
