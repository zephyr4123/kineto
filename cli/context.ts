// 命令运行时的依赖，全部惰性创建：help 之类不碰仓库的命令在仓库外也能跑。
import { loadConfig, type LoadedConfig } from "../kernel/config.ts";
import { findRoot, pathsFor, type KinetoPaths } from "../kernel/paths.ts";
import { createStorage, type StorageBackend } from "../kernel/storage/index.ts";

export class Context {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  // 进度提示只在人类终端里显示；JSON 模式下保持 stdout/stderr 干净
  readonly progress: (message: string) => void;
  #paths: KinetoPaths | undefined;
  #config: LoadedConfig | undefined;
  #storage: StorageBackend | undefined;

  constructor(cwd: string, env: NodeJS.ProcessEnv, progress: (message: string) => void) {
    this.cwd = cwd;
    this.env = env;
    this.progress = progress;
  }

  get paths(): KinetoPaths {
    return (this.#paths ??= pathsFor(findRoot(this.cwd)));
  }

  async config(): Promise<LoadedConfig> {
    return (this.#config ??= await loadConfig(this.paths, this.env));
  }

  async storage(): Promise<StorageBackend> {
    return (this.#storage ??= await createStorage((await this.config()).config, this.paths));
  }
}
