// 配音：文本 → 语音 WAV。目前由腾讯云语音合成实现；工具按能力命名，换服务商不换命令。
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { KinetoError } from "../../kernel/errors.ts";
import { defineTool } from "../../kernel/tools/define.ts";
import { callTencentCloud } from "../_shared/tencentcloud.ts";
import { pcmToWav, splitText } from "./text.ts";

const Config = z
  .object({
    secretId: z.string().min(1),
    secretKey: z.string().min(1),
    region: z.string().default("ap-guangzhou"),
    // 音色 id，见 https://cloud.tencent.com/document/product/1073/92668
    voice: z.number().int().default(101001),
    sampleRate: z.union([z.literal(8000), z.literal(16000), z.literal(24000)]).default(16000),
    speed: z.number().min(-2).max(6).default(0),
    volume: z.number().min(-10).max(10).default(0),
    language: z.enum(["zh", "en"]).default("zh"),
  })
  .strict();

// 单次请求的字数上限（服务商规定）：中文 150 字、英文 500 字母
const LIMIT = { zh: 150, en: 500 } as const;

export default defineTool({
  name: "tts",
  summary: "Turn text into a voiceover WAV (Tencent Cloud TTS)",
  config: Config,
  args: [{ name: "text", description: "What to say; long text is split by sentence and joined seamlessly" }],
  options: {
    voice: { type: "string", value: "id", description: "Voice id (default from config)" },
    speed: { type: "string", value: "n", description: "-2 (slow) … 6 (fast), 0 is normal" },
    language: { type: "string", value: "zh|en", description: "Primary language of the text" },
  },
  async run(ctx) {
    const text = ctx.args[0]!;
    const voice = z.coerce.number().int().parse(ctx.flags.voice ?? ctx.config.voice);
    const speed = z.coerce.number().min(-2).max(6).parse(ctx.flags.speed ?? ctx.config.speed);
    const language = z.enum(["zh", "en"]).parse(ctx.flags.language ?? ctx.config.language);
    const { sampleRate, volume } = ctx.config;
    const chunks = splitText(text, LIMIT[language]).filter((c) => c.trim() !== "");
    if (chunks.length === 0) throw new KinetoError("INVALID_ARGUMENT", "Nothing to say: the text is empty", { hint: "Pass the text to speak." });

    const parts: Buffer[] = [];
    for (const [i, chunk] of chunks.entries()) {
      ctx.progress(`synthesizing ${i + 1}/${chunks.length}…`);
      const res = await callTencentCloud<{ Audio: string }>({
        credentials: ctx.config,
        service: "tts",
        version: "2019-08-23",
        action: "TextToVoice",
        region: ctx.config.region,
        params: {
          Text: chunk,
          SessionId: randomUUID(),
          Codec: "pcm",
          SampleRate: sampleRate,
          VoiceType: voice,
          Speed: speed,
          Volume: volume,
          PrimaryLanguage: language === "zh" ? 1 : 2,
        },
      });
      parts.push(Buffer.from(res.Audio, "base64"));
    }

    const file = path.join(ctx.workDir, "voice.wav");
    await writeFile(file, pcmToWav(Buffer.concat(parts), sampleRate));
    const quoted = text.length > 300 ? `${text.slice(0, 300)}…` : text;
    return {
      file,
      license: "LicenseRef-TencentCloud-TTS",
      author: `Tencent Cloud TTS (voice ${voice})`,
      description: `Voiceover synthesized by Tencent Cloud TTS (voice ${voice}, ${sampleRate} Hz, speed ${speed}) from: "${quoted}"`,
    };
  },
});
