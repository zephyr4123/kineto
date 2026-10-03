import type { Context } from "./context.ts";

export interface OptionSpec {
  type: "string" | "boolean";
  description: string;
  required?: boolean;
  multiple?: boolean;
  // help 里显示的取值占位符，如 <license>
  value?: string;
}

export interface ArgSpec {
  name: string;
  description: string;
  optional?: boolean;
}

export type Flags = Record<string, string | boolean | string[] | undefined>;

export interface CommandSpec<D = unknown> {
  // 多级命令用空格分隔，如 "asset add"
  name: string;
  summary: string;
  args?: ArgSpec[];
  options?: Record<string, OptionSpec>;
  // 改受控区的命令在仓库锁里执行，并行发出的命令会被串行化
  mutates?: boolean;
  run(ctx: Context, input: { args: string[]; flags: Flags }): Promise<D>;
  // 人类可读的输出；不提供时打印缩进后的 JSON
  human?(data: D): string;
  // 默认 0；check 这类「执行成功但结论是不通过」的命令返回 1
  exitCode?(data: D): number;
}

export const defineCommand = <D>(spec: CommandSpec<D>): CommandSpec<D> => spec;

export class UsageError extends Error {
  readonly hint: string | undefined;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "UsageError";
    this.hint = hint;
  }
}

export const str = (flags: Flags, name: string): string | undefined => {
  const v = flags[name];
  return typeof v === "string" ? v : undefined;
};
