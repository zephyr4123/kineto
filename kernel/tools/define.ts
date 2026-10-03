// 工具插件契约：工具 = 视频之外的能力（配音、转写、生图……），按能力命名，供应商是它内部的实现细节。
// 插件放在 tools/<name>/index.ts，默认导出 defineTool(...)。顶层只放声明，重依赖在 run() 里再加载：
// `tool list` 会导入每个插件读声明，不能因为某个插件的依赖没装就拖垮列表。
import type { z } from "zod";
import type { AssetRecord } from "../assets/assets.ts";

// 与 CLI 的 OptionSpec / ArgSpec 同形：插件的参数直接复用 CLI 的解析、校验与 help
export interface ToolOption {
  type: "string" | "boolean";
  description: string;
  required?: boolean;
  value?: string;
}

export interface ToolArg {
  name: string;
  description: string;
  optional?: boolean;
}

export interface ToolInput {
  file: string;
  record: AssetRecord;
}

export interface ToolContext<C> {
  // kineto.config.yaml 里 tools.<name> 这一段，已按插件的 schema 校验
  config: C;
  args: string[];
  flags: Record<string, string | boolean | undefined>;
  // 本次运行专用的空目录，运行结束（无论成败）整个删掉
  workDir: string;
  // 这个工具自己的持久目录（.kineto/tools/<name>）：放下载的程序、模型等，跨次运行保留
  dataDir: string;
  // 这个工具的跨进程锁：首次安装、下载模型这类不能被两个进程同时做的步骤包在里面
  lock<T>(fn: () => Promise<T>): Promise<T>;
  // 取素材库里的输入：--to 那条视频的别名，或 sha256:… 素材 id
  input(ref: string): Promise<ToolInput>;
  progress(message: string): void;
}

export interface ToolOutput {
  // workDir 里生成的文件，扩展名决定素材类型
  file: string;
  // 产物同样要有许可证与来历才能进素材库；用户可以用 --license 覆盖
  license: string;
  author: string;
  // 怎么做出来的：服务商、模型、关键参数——几个月后还能复现或解释
  description: string;
  sourceUrl?: string;
}

export interface ToolSpec<C = unknown> {
  name: string;
  summary: string;
  config: z.ZodType<C>;
  args?: ToolArg[];
  options?: Record<string, ToolOption>;
  run(ctx: ToolContext<C>): Promise<ToolOutput>;
}

export const defineTool = <C>(spec: ToolSpec<C>): ToolSpec<C> => spec;
