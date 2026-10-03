import { spawn } from "node:child_process";
import path from "node:path";
import { readVideo } from "../../kernel/catalog/catalog.ts";
import { checkRepo } from "../../kernel/check/check.ts";
import { withRepoLock } from "../../kernel/lock.ts";
import { renderVideo, writeVideoEntry } from "../../kernel/render/render.ts";
import { syncAll, syncVideo } from "../../kernel/sync/sync.ts";
import { defineCommand, str } from "../command.ts";

export const syncCommand = defineCommand({
  name: "sync",
  summary: "Regenerate registry / assets.gen.ts and stage assets for Remotion",
  options: {
    check: { type: "boolean", description: "Only report generated files that are out of date (exit 1 if any)" },
  },
  mutates: true,
  async run(ctx, { flags }) {
    const check = flags.check === true;
    return { check, ...(await syncAll(ctx.paths, await ctx.storage(), { check })) };
  },
  exitCode: (d) => (d.check && d.drift.length > 0 ? 1 : 0),
  human: (d) =>
    d.check
      ? d.drift.length === 0
        ? "Generated files are up to date."
        : `Out of date: ${d.drift.join(", ")}\nRun \`kineto sync\`.`
      : [
          d.written.length ? `Wrote ${d.written.join(", ")}` : "Generated files already up to date.",
          `Staged ${d.staged} asset(s).`,
          ...d.missing.map((m) => `warning: ${m.video}/${m.alias} is not in storage (${m.key})`),
        ].join("\n"),
});

export const checkCommand = defineCommand({
  name: "check",
  summary: "Validate the whole library (CI gate): records, composition ids, assets, generated files",
  async run(ctx) {
    return checkRepo(ctx.paths, await ctx.storage());
  },
  exitCode: (d) => (d.ok ? 0 : 1),
  human: (d) =>
    [
      `${d.ok ? "OK" : "FAILED"}: ${d.videos} video(s), ${d.assets} asset(s), ${d.problems.length} problem(s)`,
      ...d.problems.map((p) => `  ${p.level} [${p.code}] ${p.message}${p.hint ? `\n    hint: ${p.hint}` : ""}`),
    ].join("\n"),
});

export const renderCommand = defineCommand({
  name: "render",
  summary: "Render a video (or one of its scenes), store the file and append to renders.jsonl",
  args: [{ name: "id", description: "Video id" }],
  options: {
    composition: { type: "string", value: "id", description: "Composition to render (default: the video id)" },
    codec: { type: "string", value: "codec", description: "h264 (default), h265, vp8, vp9, prores, gif" },
  },
  async run(ctx, { args, flags }) {
    const { config } = await ctx.config();
    return renderVideo(ctx.paths, await ctx.storage(), config, {
      id: args[0]!,
      composition: str(flags, "composition"),
      codec: str(flags, "codec"),
      onProgress: ({ stage, progress }) => ctx.progress(`${stage} ${Math.round(progress * 100)}%`),
    });
  },
  human: (d) =>
    `Rendered ${d.record.composition} (${d.record.width}x${d.record.height}, ${d.record.durationInFrames}f @ ${d.record.fps}fps, ` +
    `${(d.record.bytes / 1e6).toFixed(1)} MB) in ${(d.record.elapsedMs / 1000).toFixed(1)}s\n${d.file}`,
});

export const studioCommand = defineCommand({
  name: "studio",
  summary: "Sync, then open Remotion Studio with every video, or only one (long-running)",
  args: [{ name: "id", optional: true, description: "Only this video: isolated from other videos' errors and missing assets" }],
  options: {
    port: { type: "string", value: "port", description: "Port for the Studio server" },
  },
  async run(ctx, { args, flags }) {
    const { paths } = ctx;
    const storage = await ctx.storage();
    const id = args[0];
    const entry = await withRepoLock(paths, async () => {
      if (!id) {
        await syncAll(paths, storage);
        return paths.entryPoint;
      }
      await syncVideo(paths, storage, await readVideo(paths, id), paths.publicDir);
      return writeVideoEntry(paths, id);
    });
    const bin = path.join(paths.root, "node_modules", ".bin", "remotion");
    const port = str(flags, "port");
    const studioArgs = ["studio", entry, "--public-dir", paths.publicDir, ...(port ? ["--port", port] : [])];
    const code = await new Promise<number>((resolve, reject) => {
      // Studio 的日志走 stderr：JSON 模式下 stdout 只留最终那一行结果
      const child = spawn(bin, studioArgs, { cwd: paths.root, stdio: ["inherit", 2, 2] });
      child.on("error", reject);
      child.on("exit", (c) => resolve(c ?? 1));
    });
    return { exitCode: code };
  },
  exitCode: (d) => d.exitCode,
  human: () => "Studio stopped.",
});
