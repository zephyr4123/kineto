// CLI 契约（AGENTS.md 里有同样的说明）：
// - stdout 不是终端或带 --json 时输出 JSON：成功 {"ok":true,"command",...,"data"} 写 stdout，
//   失败 {"ok":false,"error":{code,message,hint}} 写 stderr
// - 退出码：0 成功；1 业务错误或结论不通过（check、sync --check）；2 用法错误
// - 未知参数、缺必填参数一律报错，不猜
import { parseArgs } from "node:util";
import { KinetoError } from "../kernel/errors.ts";
import type { CommandSpec, Flags } from "./command.ts";
import { UsageError } from "./command.ts";
import { COMMANDS } from "./commands/index.ts";
import { Context } from "./context.ts";

const GLOBAL_OPTIONS = {
  json: { type: "boolean", description: "Force JSON output (default when stdout is not a terminal)" },
  help: { type: "boolean", description: "Show help for the command" },
} as const;

async function main(argv: string[]): Promise<number> {
  const json = argv.includes("--json") || !process.stdout.isTTY;
  const interactive = !json && process.stderr.isTTY;
  try {
    const words = argv.filter((a) => !a.startsWith("-"));
    if (words.length === 0 || words[0] === "help") {
      const target = words[0] === "help" ? resolve(words.slice(1)) : undefined;
      return print(json, "help", target ? commandHelp(target.spec) : globalHelp());
    }
    const resolved = resolve(words);
    if (!resolved) {
      throw new UsageError(`Unknown command "${words[0]}"`, "Run `kineto help` to list commands.");
    }
    const { spec } = resolved;
    if (argv.includes("--help") || argv.includes("-h")) return print(json, "help", commandHelp(spec));

    const { args, flags } = parse(spec, argv.slice(argv.indexOf(words[resolved.depth - 1]!) + 1));
    const ctx = new Context(process.cwd(), process.env, interactive ? progressLine : () => {});
    const data = await spec.run(ctx, { args, flags });
    if (interactive) process.stderr.write("\r\x1b[2K");
    print(json, spec.name, data, spec.human);
    return spec.exitCode?.(data) ?? 0;
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
    throw new UsageError((err as Error).message, `Run \`kineto ${spec.name} --help\`.`);
  }
  const argSpecs = spec.args ?? [];
  if (parsed.positionals.length !== argSpecs.length) {
    const expected = argSpecs.map((a) => `<${a.name}>`).join(" ") || "no arguments";
    throw new UsageError(`kineto ${spec.name} expects ${expected}`, `Run \`kineto ${spec.name} --help\`.`);
  }
  for (const [name, o] of Object.entries(spec.options ?? {})) {
    if (o.required && parsed.values[name] === undefined) {
      throw new UsageError(`Missing required option --${name}`, `Run \`kineto ${spec.name} --help\`.`);
    }
  }
  return { args: parsed.positionals, flags: parsed.values as Flags };
}

function usageLine(spec: CommandSpec<any>): string {
  const args = (spec.args ?? []).map((a) => `<${a.name}>`);
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

function print(json: boolean, command: string, data: unknown, human?: (d: any) => string): number {
  if (json) {
    process.stdout.write(JSON.stringify({ ok: true, command, data }) + "\n");
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
      `\n\nRun \`kineto <command> --help\` for details. Output is JSON when piped; exit codes: 0 ok, 1 error, 2 usage.\n`
    );
  }
  const lines = [`${help.summary}\n`, `Usage: ${help.usage}\n`];
  for (const a of help.args) lines.push(`  <${a.name}>  ${a.description}`);
  for (const [k, o] of Object.entries(help.options)) {
    lines.push(`  --${k}${o.type === "string" ? ` <${o.value ?? k}>` : ""}  ${o.description}${o.required ? " (required)" : ""}`);
  }
  return lines.join("\n") + "\n";
}

function fail(json: boolean, err: unknown): number {
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

function progressLine(message: string) {
  process.stderr.write(`\r\x1b[2K${message}`);
}

process.exitCode = await main(process.argv.slice(2));
