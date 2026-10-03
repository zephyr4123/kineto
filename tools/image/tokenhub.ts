// 腾讯云大模型服务平台 TokenHub 的混元生图（Hy-Image-3.0）：同步接口，一次请求直接返回图片链接。
// 旧的混元大模型平台（hunyuan.tencentcloudapi.com 的 SubmitHunyuanImageJob）已于 2026-09-30 停服。
import { KinetoError } from "../../kernel/errors.ts";

const ENDPOINT = "https://tokenhub.tencentmaas.com/v1/wand/hunyuan-image/v3-generation";
const MODEL = "hy-image-v3";
// 生成一张图通常十几秒；给足余量，但不能无限等
const TIMEOUT_MS = 3 * 60_000;

export interface GenerateInput {
  apiKey: string;
  prompt: string;
  size: string;
  revise: boolean;
  seed?: number;
  // 图上的文字水印，最多 16 个字符
  footnote?: string;
}

export interface GenerateOutput {
  // 临时链接，12 小时内有效
  url: string;
  revisedPrompt: string | undefined;
  requestId: string | undefined;
}

// 宽高各在 [512, 2048]，面积不超过 1024×1024
export function isValidSize(size: string): boolean {
  const m = /^(\d+)x(\d+)$/.exec(size);
  const [w, h] = m ? [Number(m[1]), Number(m[2])] : [0, 0];
  return m !== null && w >= 512 && h >= 512 && w <= 2048 && h <= 2048 && w * h <= 1024 * 1024;
}

export function checkSize(size: string): string {
  if (!isValidSize(size)) {
    throw new KinetoError("INVALID_ARGUMENT", `Invalid image size "${size}"`, {
      hint: "Use WIDTHxHEIGHT with each side in 512..2048 and at most 1048576 pixels, e.g. 1280x720 or 1024x1024.",
    });
  }
  return size;
}

export async function generateImage(input: GenerateInput, fetchImpl: typeof fetch = fetch): Promise<GenerateOutput> {
  const body = {
    model: MODEL,
    prompt: input.prompt,
    size: input.size,
    revise: input.revise,
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    ...(input.footnote === undefined ? {} : { footnote: input.footnote }),
  };
  const res = await fetchImpl(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((err: unknown) => {
    throw new KinetoError("TOOL_FAILED", `TokenHub image request failed: ${(err as Error).message}`, {
      hint: "Check the network, then retry.",
      cause: err,
    });
  });
  const text = await res.text().catch((err: unknown) => {
    throw new KinetoError("TOOL_FAILED", `TokenHub image response was cut off: ${(err as Error).message}`, {
      hint: "Retry. The provider may still bill this request; check usage in the TokenHub console.",
      cause: err,
    });
  });
  let json: { data?: { url?: string; revised_prompt?: string }[]; request_id?: string; error?: { message?: string } } | undefined;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  if (!res.ok) throw httpError(res.status, json?.error?.message ?? text.slice(0, 300));
  const first = json?.data?.[0];
  if (!first?.url) {
    throw new KinetoError("TOOL_FAILED", `TokenHub returned no image: ${text.slice(0, 300)}`, { hint: "Retry, or rephrase the prompt." });
  }
  return { url: first.url, revisedPrompt: first.revised_prompt, requestId: json?.request_id };
}

// 按「下一步该做什么」归类：密钥不对 / 去控制台处理额度与计费 / 改提示词或参数
function httpError(status: number, detail: string): KinetoError {
  const message = `TokenHub image generation failed: HTTP ${status}: ${detail}`;
  if (status === 401) {
    return new KinetoError("TOOL_AUTH_FAILED", message, {
      hint: "Check tools.image.apiKey (a TokenHub API key, usually a ${ENV} reference into your envFile).",
    });
  }
  if (status === 402 || status === 403 || status === 429) {
    return new KinetoError("TOOL_SERVICE_UNAVAILABLE", message, {
      hint: "In the TokenHub console: enable the service, claim the free quota or turn on pay-as-you-go, and allow this key to use hy-image-v3. HTTP 429 means wait and retry.",
    });
  }
  return new KinetoError("TOOL_FAILED", message, {
    hint: status >= 500 ? "The provider failed; retry later." : "Rephrase the prompt (content moderation rejects some prompts) or check the options.",
  });
}

// 按文件头判断格式：Content-Type 可能是 application/octet-stream，不能信
export function sniffImageExt(bytes: Buffer): ".png" | ".jpg" | ".webp" {
  if (bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return ".png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP") return ".webp";
  throw new KinetoError("TOOL_FAILED", "The generated file is not a PNG, JPEG or WebP image", { hint: "Retry." });
}
