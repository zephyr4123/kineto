import { KinetoError } from "../../kernel/errors.ts";
import type { ToolSpec } from "../../kernel/tools/define.ts";
import { listTools, runTool } from "../../kernel/tools/host.ts";
import { defineCommand, str, type CommandSpec, type OptionSpec } from "../command.ts";

export const toolListCommand = defineCommand({
  name: "tool list",
  summary: "List tool plugins (voiceover, captions, image generation…) and whether they are enabled",
  async run(ctx) {
    return { tools: await listTools(ctx.paths, await ctx.config()) };
  },
  human: (d) =>
    d.tools.length === 0
      ? "No tool plugins in tools/."
      : d.tools
          .map((t) =>
            t.error
              ? `${t.name.padEnd(14)} ✗ ${t.error}`
              : `${t.name.padEnd(14)} ${t.enabled ? "enabled " : "disabled"}  ${t.summary}`,
          )
          .join("\n") + "\n\nRun one with `./kineto tool <name> --help`; enable it under tools: in kineto.config.yaml.",
});

// 每个工具都带的选项：产物挂到哪条视频、叫什么，以及覆盖插件给的许可证
const COMMON_OPTIONS: Record<string, OptionSpec> = {
  to: { type: "string", value: "video", description: "Link the result to this video (use with --as); inputs are its aliases" },
  as: { type: "string", value: "alias", description: "camelCase alias for the result, becomes assets.<alias> in code" },
  license: { type: "string", value: "license", description: "Override the license the tool records for its output" },
};

export function toolCommand(spec: ToolSpec): CommandSpec<Awaited<ReturnType<typeof runTool>>> {
  const reserved = Object.keys(spec.options ?? {}).find((k) => k in COMMON_OPTIONS || k === "json" || k === "help");
  if (reserved) {
    throw new KinetoError("TOOL_INVALID", `tools/${spec.name} declares option --${reserved}, which kineto reserves`, {
      hint: "Rename the option in the plugin.",
    });
  }
  return defineCommand({
    name: `tool ${spec.name}`,
    summary: spec.summary,
    args: spec.args,
    options: { ...spec.options, ...COMMON_OPTIONS },
    async run(ctx, { args, flags }) {
      return runTool(ctx.paths, await ctx.storage(), await ctx.config(), spec, {
        args,
        flags: flags as Record<string, string | boolean | undefined>,
        to: str(flags, "to"),
        as: str(flags, "as"),
        onProgress: ctx.progress,
      });
    },
    human: (d) =>
      `${d.tool}: added ${d.asset.id} (${d.asset.ext}, ${d.asset.bytes} bytes, ${d.asset.license})` +
      (d.linked
        ? `\nLinked to ${d.linked.video} as "${d.linked.alias}": staticFile(assets.${d.linked.alias}) → ${d.linked.staticFile}`
        : ""),
  });
}
