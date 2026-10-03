# tools/ — tool plugins

A **tool** is a capability that lives outside Remotion and produces media: a voiceover, captions, an image.
Each tool is a plugin in `tools/<name>/index.ts`, named after the capability (`tts`, not the vendor).
The provider is an implementation detail behind it, so swapping providers never changes the command.

```bash
./kineto tool list                                   # every plugin, enabled or not
./kineto tool <name> --help                          # its arguments and options
./kineto tool <name> … --to <video> --as <alias>     # run it; the result lands in the asset library
```

## Built-in tools

| Tool | What it does | Provider | Cost |
|---|---|---|---|
| `transcribe` | Speech in an audio/video asset → captions JSON (`Caption[]` from `@remotion/captions`) | whisper.cpp, local | Free. First run builds whisper.cpp and downloads the model (needs git, make, a C compiler) |
| `tts` | Text → voiceover WAV | Tencent Cloud TTS | Billed per character |
| `image` | Prompt → image | Tencent Hunyuan Hy-Image-3.0 on TokenHub | Billed per image |

## Hot-pluggable by configuration

A tool runs only when `kineto.config.yaml` has a `tools.<name>` section; the section holds its settings
(see `kineto.config.example.yaml`). Core commands never import plugins, and `tool list` imports each one
in isolation: a broken plugin or a missing dependency only affects that tool.

## What every run guarantees

- **Checks before spending.** The tool must be enabled, its settings valid, `--to`/`--as` usable,
  before the plugin runs. Paid APIs are not called for a run that would fail anyway.
- **Results are assets.** The output goes through the same path as `./kineto asset add`: content-addressed into
  storage, appended to `assets/manifest.jsonl` with a license, an author and a description of how it was made.
  `--license` overrides the license the tool records.
- **Inputs come from the library.** Tools that read media (like `transcribe`) take an alias of the `--to` video
  or a `sha256:` asset id, never a loose file. Provenance is known, so derived outputs inherit the input's license.
- **Re-running re-points.** Running again with the same `--as` links the alias to the new result. The old asset
  stays in the library.

## Writing a plugin

```ts
// tools/<name>/index.ts
import { z } from "zod";
import { defineTool } from "../../kernel/tools/define.ts";

export default defineTool({
  name: "<name>",                         // = directory name, kebab-case, the capability
  summary: "One line for `tool list`",
  config: z.object({ apiKey: z.string() }).strict(),   // schema of tools.<name> in kineto.config.yaml
  args: [{ name: "text", description: "…" }],
  options: { voice: { type: "string", value: "id", description: "…" } },
  async run(ctx) {
    // ctx.config   validated settings          ctx.args / ctx.flags   parsed CLI input
    // ctx.workDir  empty, deleted after run    ctx.dataDir            persistent: .kineto/tools/<name>
    // ctx.input(ref)  an asset of the --to video (alias) or by id → { file, record }
    // ctx.progress(message)
    return { file, license: "…", author: "…", description: "how it was made: provider, model, parameters" };
  },
});
```

Rules:

- **Top level stays light.** Import heavy dependencies inside `run()`; `tool list` imports every plugin.
- **Secrets only via `${ENV}`** in the config section, never in code or arguments.
- **Options `--to`, `--as`, `--license`, `--json`, `--help` are reserved.**
- **Throw `KinetoError` with a stable `code` and a `hint`.** Agents branch on the code and follow the hint.
- **Code shared by plugins goes in a directory starting with `_`**, such as `_shared/`. It is not treated as a plugin.
- **Tests live next to the plugin** (`*.test.ts`). `npm test` runs them.
