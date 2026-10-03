// 字幕转写：本机 whisper.cpp，免费、离线。输出 Remotion 的 Caption[] JSON，
// 直接配合官方 captions 用法（@remotion/captions 的 createTikTokStyleCaptions 等）。
// 英文等用空格分词的语言逐词出时间戳；中日韩按短语出（逐词会把汉字劈成乱码，见 captions.ts）。
// whisper.cpp 与模型在第一次用时才下载编译进 .kineto/tools/transcribe/，不用的人零负担。
import { execFile } from "node:child_process";
import { access, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { Caption } from "@remotion/captions";
import { z } from "zod";
import { KinetoError } from "../../kernel/errors.ts";
import { defineTool } from "../../kernel/tools/define.ts";
import { hasSplitCharacters, phraseCaptions, wantsPhrases } from "./captions.ts";

const MODELS = [
  "tiny",
  "tiny.en",
  "base",
  "base.en",
  "small",
  "small.en",
  "medium",
  "medium.en",
  "large-v1",
  "large-v2",
  "large-v3",
  "large-v3-turbo",
] as const;

const Config = z
  .object({
    // small 兼顾中文准确率与速度（模型约 470MB）；纯英文可用 small.en / base.en
    model: z.enum(MODELS).default("small"),
    // 1.5.5 用 make 就能编译（1.7.4 起要 cmake），也是 Remotion 文档用的版本
    whisperCppVersion: z.string().default("1.5.5"),
    // whisper 的语言代码（zh、en、ja……）；auto 让它自己判断
    language: z.string().default("auto"),
    // 提示 whisper 专有名词怎么拼（产品名、人名），如 "kineto, Claude Code"
    hint: z.string().min(1).optional(),
  })
  .strict();

const REPO = path.resolve(import.meta.dirname, "..", "..");
const run = promisify(execFile);

export default defineTool({
  name: "transcribe",
  summary: "Transcribe speech in an audio/video asset into captions JSON (local whisper.cpp, free)",
  config: Config,
  args: [{ name: "input", description: "Alias of an audio/video asset in the --to video, or a sha256:… asset id" }],
  options: {
    language: { type: "string", value: "code", description: "Spoken language: zh, en, ja… (default from config, auto-detect)" },
    model: { type: "string", value: "model", description: `whisper model: ${MODELS.join(", ")}` },
    hint: { type: "string", value: "words", description: 'How proper nouns are spelled, e.g. "kineto, Claude Code"' },
  },
  async run(ctx) {
    const model = z.enum(MODELS).parse(ctx.flags.model ?? ctx.config.model);
    const language = String(ctx.flags.language ?? ctx.config.language);
    const hint = typeof ctx.flags.hint === "string" ? ctx.flags.hint : ctx.config.hint;
    const version = ctx.config.whisperCppVersion;
    const input = await ctx.input(ctx.args[0]!);

    // 重依赖在这里才加载：没启用这个工具的人不受它影响。两个内部路径函数没有从包入口导出，
    // 版本按 AGENTS.md 规则锁死，升级 Remotion 时类型检查会发现它们变了
    const { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } = await import("@remotion/install-whisper-cpp");
    const { getWhisperExecutablePath } = await import("@remotion/install-whisper-cpp/dist/install-whisper-cpp.js");
    const { getModelPath } = await import("@remotion/install-whisper-cpp/dist/download-whisper-model.js");

    const whisperDir = path.join(ctx.dataDir, `whisper.cpp-${version}`);
    // 两个进程同时首次运行时，后一个会把前一个正在编译的目录当成残缺目录删掉：安装与下载串行做
    await ctx.lock(async () => {
      const executable = getWhisperExecutablePath(whisperDir, version);
      if (!(await exists(executable))) {
        // 上次编译到一半失败会留下残缺目录，installWhisperCpp 遇到它会静默跳过，先清掉
        await rm(whisperDir, { recursive: true, force: true });
        ctx.progress(`installing whisper.cpp ${version} (first use only, a few minutes)…`);
        await installWhisperCpp({ version, to: whisperDir, printOutput: false }).catch((err: unknown) => {
          throw new KinetoError("TOOL_FAILED", `Building whisper.cpp ${version} failed: ${(err as Error).message}`, {
            hint: "It needs git, make and a C/C++ compiler (macOS: xcode-select --install; Linux: build-essential).",
            cause: err,
          });
        });
        if (!(await exists(executable))) {
          throw new KinetoError("TOOL_FAILED", `whisper.cpp was built but ${executable} is missing`, { hint: `Delete ${whisperDir} and retry.` });
        }
      }
      // downloadWhisperModel 在 printOutput:false 时会把下载中断留下的残缺模型当成已下载：
      // 下载成功后才写完成标记，没有标记的模型文件一律删掉重下
      const modelFile = getModelPath(whisperDir, model);
      const complete = `${modelFile}.complete`;
      if (!(await exists(complete))) {
        await rm(modelFile, { force: true });
        await downloadWhisperModel({
          model,
          folder: whisperDir,
          printOutput: false,
          onProgress: (downloaded, total) => ctx.progress(`downloading model ${model}: ${Math.round((downloaded / total) * 100)}%`),
        }).catch((err: unknown) => {
          throw new KinetoError("TOOL_FAILED", `Downloading whisper model ${model} failed: ${(err as Error).message}`, {
            hint: "Check the network (the model comes from huggingface.co), then retry.",
            cause: err,
          });
        });
        await writeFile(complete, "");
      }
    });

    // whisper.cpp 只吃 16kHz 单声道 wav；用 Remotion 自带的 ffmpeg 转，不要求本机另装
    const wav = path.join(ctx.workDir, "input-16k.wav");
    await run(path.join(REPO, "node_modules", ".bin", "remotion"), ["ffmpeg", "-i", input.file, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wav]).catch(
      (err: unknown) => {
        throw new KinetoError("TOOL_FAILED", `Cannot read audio from ${input.record.id}: ${(err as Error).message.split("\n").slice(-3).join(" ")}`, {
          hint: "The input must be an audio or video file with an audio track.",
          cause: err,
        });
      },
    );

    const common = {
      inputPath: wav,
      whisperPath: whisperDir,
      whisperCppVersion: version,
      model,
      modelFolder: whisperDir,
      language: language as never,
      printOutput: false,
      ...(hint ? { additionalArgs: ["--prompt", hint] } : {}),
      onProgress: (p: number) => ctx.progress(`transcribing with ${model}: ${Math.round(p * 100)}%`),
    };
    const failed = (err: unknown) =>
      new KinetoError("TOOL_FAILED", `whisper.cpp failed on ${input.record.id}: ${(err as Error).message.split("\n").slice(-3).join(" ")}`, {
        hint: `If the model file is damaged, delete ${whisperDir} and retry.`,
        cause: err,
      });

    ctx.progress(`transcribing with ${model}…`);
    let granularity: "word" | "phrase" = "word";
    let detected = language;
    let captions: Caption[] = [];
    if (!wantsPhrases(language)) {
      const words = await transcribe({ ...common, tokenLevelTimestamps: true }).catch((err: unknown) => {
        throw failed(err);
      });
      captions = toCaptions({ whisperCppOutput: words }).captions;
      detected = words.result.language;
    }
    // 中日韩，或自动识别后发现逐词结果把字劈坏了：按短语重转。
    // tokensPerItem 传 0 才能去掉每段 1 个 token 的限制（传 null 会被包内改回 1）
    if (wantsPhrases(language) || hasSplitCharacters(captions)) {
      granularity = "phrase";
      const phrases = await transcribe({ ...common, tokenLevelTimestamps: false, tokensPerItem: 0 }).catch((err: unknown) => {
        throw failed(err);
      });
      captions = phraseCaptions(phrases.transcription);
      detected = phrases.result.language;
    }
    if (captions.length === 0) {
      throw new KinetoError("TOOL_FAILED", `No speech found in ${input.record.id}`, { hint: "Check that the input actually contains speech." });
    }

    const file = path.join(ctx.workDir, "captions.json");
    await writeFile(file, JSON.stringify(captions, null, 2) + "\n");
    // 字幕是输入的衍生品：许可证与作者跟着输入走
    return {
      file,
      license: input.record.license,
      author: input.record.author ?? "see source asset",
      description:
        `Captions of ${input.record.id} transcribed with whisper.cpp ${version} (model ${model}, language ${detected}, ` +
        `${granularity}-level${hint ? `, hint "${hint}"` : ""}); Remotion Caption[] JSON`,
    };
  },
});

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );
