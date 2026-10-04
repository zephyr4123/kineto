// Remotion 的两条调用路径共用这一份设置：
// - `npx remotion studio/render` 读 remotion.config.ts（它 import 本文件）
// - kernel 走 Node API，而 Node API 不读 remotion.config.ts，必须显式传参
// 只改这里，两条路径就不会出现两套行为。
export const remotionSettings = {
  entryPoint: "src/index.ts",
  // 每次运行只能有一个 public dir（Remotion 硬限制），由 `./kineto sync` 按视频分子目录暂存
  publicDir: ".kineto/public",
  rspack: true,
  videoImageFormat: "jpeg",
  // @remotion/effects 的大多数特效跑在 WebGL2 上，headless Chrome 默认拿不到 WebGL2 上下文。
  // Remotion 推荐：有 GPU 的桌面用 angle；没有 GPU 的 Linux 服务器（CI、云渲染）用 swangle（CPU 渲染，慢一些）
  chromiumOpenGlRenderer: process.platform === "linux" ? "swangle" : "angle",
} as const;
