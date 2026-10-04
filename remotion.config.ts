/**
 * 只对 `npx remotion …` CLI 生效；kineto 的渲染走 Node API，读的是同一份 kernel/render/settings.ts。
 * All configuration options: https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";
import { remotionSettings } from "./kernel/render/settings.ts";

Config.setEntryPoint(remotionSettings.entryPoint);
Config.setPublicDir(remotionSettings.publicDir);
Config.setRspack(remotionSettings.rspack);
Config.setVideoImageFormat(remotionSettings.videoImageFormat);
Config.setChromiumOpenGlRenderer(remotionSettings.chromiumOpenGlRenderer);
Config.setOverwriteOutput(true);
