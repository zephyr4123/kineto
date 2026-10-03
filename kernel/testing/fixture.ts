// 测试夹具：在临时目录里造一个最小的 kineto 仓库（标记文件 + blank 模板）。
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathsFor, type KinetoPaths } from "../paths.ts";

export interface Fixture {
  root: string;
  paths: KinetoPaths;
  cleanup: () => Promise<void>;
}

const BLANK_COMPOSITIONS = `import { Composition } from "remotion";
import { Video } from "./Video";

export const Compositions: React.FC = () => {
  return (
    <Composition
      id="__KINETO_ID__"
      component={Video}
      durationInFrames={60}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
`;

const BLANK_VIDEO = `export const Video: React.FC = () => {
  return <h1>__KINETO_TITLE__</h1>;
};
`;

export async function makeRepo(): Promise<Fixture> {
  const root = await mkdtemp(path.join(tmpdir(), "kineto-test-"));
  await writeFile(path.join(root, "kineto.config.example.yaml"), "storage:\n  backend: local\n");
  const blank = path.join(root, "templates", "blank");
  await mkdir(blank, { recursive: true });
  await writeFile(path.join(blank, "compositions.tsx"), BLANK_COMPOSITIONS);
  await writeFile(path.join(blank, "Video.tsx"), BLANK_VIDEO);
  await mkdir(path.join(root, "videos"), { recursive: true });
  await mkdir(path.join(root, "src"), { recursive: true });
  return {
    root,
    paths: pathsFor(root),
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export const FIXED_NOW = new Date("2026-10-03T12:00:00.000Z");
