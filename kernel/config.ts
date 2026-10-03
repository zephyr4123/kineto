// 配置驱动：仓库只提交带占位符的 kineto.config.example.yaml；
// 本机的 kineto.config.yaml 不入库，密钥只以 ${ENV} 引用出现，从不落盘。
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { z } from "zod";
import { isNodeError, KinetoError } from "./errors.ts";
import type { KinetoPaths } from "./paths.ts";

const ConfigSchema = z
  .object({
    storage: z
      .object({
        backend: z.enum(["local"]).default("local"),
        local: z.object({ root: z.string().min(1).default(".kineto/store") }).prefault({}),
      })
      .prefault({}),
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
  const parsed = ConfigSchema.safeParse(expandEnv(raw, env));
  if (!parsed.success) {
    throw new KinetoError("CONFIG_INVALID", `Invalid kineto.config.yaml: ${z.prettifyError(parsed.error)}`, {
      hint: "Compare with kineto.config.example.yaml.",
    });
  }
  return { config: parsed.data, source };
}

function expandEnv(value: unknown, env: NodeJS.ProcessEnv): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_m, name: string) => {
      const v = env[name];
      if (v === undefined || v === "") {
        throw new KinetoError("CONFIG_ENV_MISSING", `kineto.config.yaml references \${${name}} but it is not set`, {
          hint: `Export ${name} in your shell (never write the secret into the config file).`,
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
