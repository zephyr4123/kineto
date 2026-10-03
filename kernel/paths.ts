// 仓库内的路径约定只在这里定义一次，其它模块一律从 KinetoPaths 取。
import { existsSync } from "node:fs";
import path from "node:path";
import { KinetoError } from "./errors.ts";
import { remotionSettings } from "./render/settings.ts";

// 带占位符的示例配置是入库文件，用它当仓库根标记
const ROOT_MARKER = "kineto.config.example.yaml";

export interface KinetoPaths {
  root: string;
  videosDir: string;
  templatesDir: string;
  assetsManifest: string;
  registryFile: string;
  entryPoint: string;
  configFile: string;
  configExample: string;
  stateDir: string;
  publicDir: string;
  tmpDir: string;
  // 远端存储后端在本机的只读缓存
  cacheDir: string;
}

export function pathsFor(root: string): KinetoPaths {
  const at = (...p: string[]) => path.join(root, ...p);
  return {
    root,
    videosDir: at("videos"),
    templatesDir: at("templates"),
    assetsManifest: at("assets", "manifest.jsonl"),
    registryFile: at("src", "registry.gen.tsx"),
    entryPoint: at(remotionSettings.entryPoint),
    configFile: at("kineto.config.yaml"),
    configExample: at(ROOT_MARKER),
    stateDir: at(".kineto"),
    publicDir: at(remotionSettings.publicDir),
    tmpDir: at(".kineto", "tmp"),
    cacheDir: at(".kineto", "cache"),
  };
}

export const videoDir = (paths: KinetoPaths, id: string) => path.join(paths.videosDir, id);

export function findRoot(start: string = process.cwd()): string {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, ROOT_MARKER))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new KinetoError("NOT_IN_KINETO_REPO", `No kineto repository found from ${start}`, {
        hint: `Run kineto inside a clone of the kineto repo (looked for ${ROOT_MARKER}).`,
      });
    }
    dir = parent;
  }
}
