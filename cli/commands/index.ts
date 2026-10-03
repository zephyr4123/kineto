import type { CommandSpec } from "../command.ts";
import { assetAddCommand, assetLinkCommand, assetListCommand, assetUpdateCommand } from "./assets.ts";
import { checkCommand, renderCommand, studioCommand, syncCommand } from "./build.ts";
import { doctorCommand, setupCommand } from "./env.ts";
import { listCommand, newCommand, showCommand, updateCommand } from "./videos.ts";

// 顺序即 help 里的展示顺序：先上手，再日常，最后维护
export const COMMANDS: CommandSpec<any>[] = [
  doctorCommand,
  setupCommand,
  newCommand,
  listCommand,
  showCommand,
  updateCommand,
  assetAddCommand,
  assetLinkCommand,
  assetUpdateCommand,
  assetListCommand,
  studioCommand,
  renderCommand,
  syncCommand,
  checkCommand,
];
