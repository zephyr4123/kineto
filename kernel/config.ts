// 配置驱动：仓库只提交带占位符的 kineto.config.example.yaml；
// 本机的 kineto.config.yaml 不入库，密钥只以 ${ENV} 引用出现，从不落盘。
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import { parse } from "yaml";
import { z } from "zod";
import { isNodeError, KinetoError } from "./errors.ts";
import type { KinetoPaths } from "./paths.ts";

// S3 兼容的对象存储（腾讯云 COS、AWS S3、Cloudflare R2、MinIO……）只差 endpoint 和 region
const S3Config = z
  .object({
    endpoint: z.url(),
    region: z.string().min(1),
    bucket: z.string().min(1),
    // 对象都放在这个前缀下，便于和桶里别的东西隔开；统一成 "" 或以 / 结尾
    prefix: z
      .string()
      .default("")
      .transform((p) => p.replace(/^\/+|\/+$/g, ""))
      .refine((p) => p === "" || p.split("/").every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== "." && s !== ".."), {
        message: "prefix must be plain path segments like team/videos",
      })
      .transform((p) => (p === "" ? "" : `${p}/`)),
    // 能公开访问桶时的根 URL（如 CDN 域名），渲染记录据此给出可分享的链接
    publicUrl: z
      .url()
      .transform((u) => u.replace(/\/+$/, ""))
      .optional(),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    // 2024 年起腾讯云 COS 新桶只支持 virtual-hosted 风格；MinIO 之类自建服务通常要开
    forcePathStyle: z.boolean().default(false),
  })
  .strict();
export type S3Config = z.infer<typeof S3Config>;

const ConfigSchema = z
  .object({
    // 存放密钥的 dotenv 文件（放仓库外、权限 600），${ENV} 在进程环境变量里找不到时再查它
    envFile: z.string().min(1).optional(),
    storage: z
      .object({
        backend: z.enum(["local", "s3"]).default("local"),
        local: z.object({ root: z.string().min(1).default(".kineto/store") }).prefault({}),
        s3: S3Config.optional(),
      })
      .refine((s) => s.backend !== "s3" || s.s3 !== undefined, {
        message: "storage.backend is s3 but there is no storage.s3 section",
        path: ["s3"],
      })
      .prefault({}),
    // 工具插件的配置：写了 tools.<name> 才算启用（值可以为空），每段由插件自己的 schema 校验。
    // 这里存的是未展开的原文：${ENV} 等到运行该工具时才由 LoadedConfig.expand 展开
    tools: z.record(z.string(), z.unknown()).default({}),
    remotion: z
      .object({
        // Remotion 5.0 起渲染必须传 license key；免费授权填 "free-license"
        licenseKey: z.string().min(1).default("free-license"),
      })
      .prefault({}),
  })
  .strict();

export type KinetoConfig = z.infer<typeof ConfigSchema>;

export interface LoadedConfig {
  config: KinetoConfig;
  source: "defaults" | "kineto.config.yaml";
  // 解析后的 envFile 绝对路径（doctor 用它检查文件权限）
  envFile?: string;
  // 用同一套环境变量（进程 + envFile）展开 ${ENV}。工具段延后展开：缺某个工具的密钥，
  // 只有运行这个工具时才报错，不拖垮其他命令
  expand(value: unknown): unknown;
}

export async function loadConfig(paths: KinetoPaths, env: NodeJS.ProcessEnv = process.env): Promise<LoadedConfig> {
  let raw: unknown = {};
  let source: LoadedConfig["source"] = "defaults";
  try {
    raw = parse(await readFile(paths.configFile, "utf8")) ?? {};
    source = "kineto.config.yaml";
  } catch (err) {
    if (!isNodeError(err, "ENOENT")) {
      throw new KinetoError("CONFIG_INVALID", `Cannot read kineto.config.yaml: ${(err as Error).message}`, {
        cause: err,
      });
    }
  }
  const envFile = envFilePath(paths, raw);
  const vars = envFile ? { ...(await readEnvFile(envFile)), ...env } : env;
  const { tools, ...rest } = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const parsed = ConfigSchema.safeParse({ ...(expandEnv(rest, vars) as object), ...(tools == null ? {} : { tools }) });
  if (!parsed.success) {
    throw new KinetoError("CONFIG_INVALID", `Invalid kineto.config.yaml: ${z.prettifyError(parsed.error)}`, {
      hint: "Compare with kineto.config.example.yaml.",
    });
  }
  return { config: parsed.data, source, ...(envFile ? { envFile } : {}), expand: (value) => expandEnv(value, vars) };
}

function envFilePath(paths: KinetoPaths, raw: unknown): string | undefined {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>).envFile : undefined;
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value === "") {
    throw new KinetoError("CONFIG_INVALID", "Invalid kineto.config.yaml: envFile must be a file path", {
      hint: "e.g. envFile: ~/.secrets/kineto.env",
    });
  }
  return value.startsWith("~/") ? path.join(homedir(), value.slice(2)) : path.resolve(paths.root, value);
}

async function readEnvFile(file: string): Promise<Record<string, string>> {
  try {
    return parseEnv(await readFile(file, "utf8")) as Record<string, string>;
  } catch (err) {
    if (!isNodeError(err, "ENOENT")) throw err;
    throw new KinetoError("CONFIG_INVALID", `envFile ${file} does not exist`, {
      hint: "Create it (chmod 600, outside the repo) or remove envFile from kineto.config.yaml.",
    });
  }
}

function expandEnv(value: unknown, env: NodeJS.ProcessEnv): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_m, name: string) => {
      const v = env[name];
      if (v === undefined || v === "") {
        throw new KinetoError("CONFIG_ENV_MISSING", `kineto.config.yaml references \${${name}} but it is not set`, {
          hint: `Export ${name} in your shell or put it in the envFile (never write the secret into the config file).`,
        });
      }
      return v;
    });
  }
  if (Array.isArray(value)) return value.map((v) => expandEnv(v, env));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expandEnv(v, env)]));
  }
  return value;
}
