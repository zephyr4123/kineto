<div align="center">

<h1>kineto</h1>

<p><b>An agent-first video studio built on <a href="https://www.remotion.dev">Remotion</a>.</b></p>
<p>Describe a video in plain words. Claude Code or Codex builds it through one CLI,<br/>and every asset and render stays on record.</p>

<a href="https://kineto.zephyrxiang.com/renders/kineto-promo/kineto-promo-714bded14437.mp4">
  <img src=".github/assets/kineto-teaser.gif" width="820" alt="kineto promo preview: Clawd flies through rings on a rainbow trail, then a quill writes kineto">
</a>

<p><sub>▶ The preview loops without sound. <a href="https://kineto.zephyrxiang.com/renders/kineto-promo/kineto-promo-714bded14437.mp4">Watch the full 55-second promo</a>, made in this repository with kineto.</sub></p>

<p>
<a href="https://github.com/zephyr4123/kineto/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zephyr4123/kineto/actions/workflows/ci.yml/badge.svg"></a>
<a href="https://github.com/zephyr4123/kineto/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zephyr4123/kineto"></a>
<img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
<img alt="Node" src="https://img.shields.io/badge/node-22.18%2B%20%7C%2023.6%2B-339933?logo=node.js&logoColor=white">
<img alt="Remotion" src="https://img.shields.io/badge/remotion-4.0.532-0B84F3">
</p>

<p><b>English</b> · <a href="README.zh-CN.md">简体中文</a></p>

</div>

## ✨ Why kineto

- AI-made videos are everywhere, yet the way they are made is rarely visible.
- Coding agents already write Remotion code. Left alone, they guess outdated APIs, scatter files and lose track of what they rendered.
- kineto gives the agent one CLI as the only way to change records. The creative work, scenes and timelines, stays in plain Remotion.
- You ask in natural language and get a real MP4. This is vibe coding applied to video.

<table>
<tr>
<td width="50%" valign="top">

**🚪 One door**
<ul>
<li>Every record changes through <code>./kineto</code></li>
<li>JSON output, stable exit codes, errors with a next step</li>
<li><code>./kineto check</code> catches hand edits in CI</li>
</ul>

</td>
<td width="50%" valign="top">

**🏷️ Provenance for every asset**
<ul>
<li>Content-addressed files with license, author and source; files without a license are refused</li>
<li>Generated media also records the provider, model and prompt</li>
</ul>

</td>
</tr>
<tr>
<td valign="top">

**🧾 Every render on file**
<ul>
<li>Videos, scenes, stills and GIFs</li>
<li>Git sha, codec and Remotion version per export</li>
<li>A shareable link when storage sits behind a CDN</li>
</ul>

</td>
<td valign="top">

**🔌 Pluggable**
<ul>
<li>Storage: local, or any S3-compatible service</li>
<li>Tools: voiceover, captions and image generation, each enabled in <code>kineto.config.yaml</code></li>
</ul>

</td>
</tr>
</table>

## 🚀 Quick start

```bash
git clone https://github.com/zephyr4123/kineto.git && cd kineto
npm install
./kineto setup        # install the official Remotion agent skills
./kineto doctor       # check Node, dependencies, config, storage and skills
./kineto new hello --title "Hello kineto"
./kineto studio hello # preview while the scenes are being written
./kineto render hello
```

With an agent, open it in the repository and ask for a video. It reads [`AGENTS.md`](AGENTS.md) and works from there.

## 🧭 How it works

```
person        "make a 30-second launch clip with a voiceover"
  ↓
agent         reads AGENTS.md and the official Remotion skills, issues CLI calls
  ↓
kineto CLI    the only door: JSON output, stable exit codes, errors with hints
  ↓
kernel        video catalog · asset library · render · sync · check
  ↓
strategies    engine: Remotion · storage: local, S3-compatible · tools: tts, transcribe, image
```

| | What it holds | Where |
|---|---|---|
| 🎬 Video | Code, metadata and render history | `videos/<id>/` |
| 🖼️ Asset | Content-addressed file with license, author and source | `assets/manifest.jsonl` + storage |
| 📦 Render | Each export with git sha, codec and Remotion version | `videos/<id>/renders.jsonl` + storage |

Each render bundles only its own video, so a broken video cannot block the others.

## ☁️ Storage

Assets and renders stay out of git. They go to the backend set in `kineto.config.yaml` (start from [`kineto.config.example.yaml`](kineto.config.example.yaml)).

- `local` is the default: a directory inside the repository, no setup required.
- `s3` works with Tencent COS, AWS S3, Cloudflare R2, Alibaba OSS and MinIO. Only the endpoint changes.
- Objects are immutable and uploaded with their content type and a long-lived cache header.
- With `publicUrl` set to a CDN domain, render records carry a shareable link. The promo above is served this way.
- Secrets appear only as `${ENV}` references. `envFile` can point to a `chmod 600` file outside the repository.
- After switching to a shared backend, `./kineto storage push` uploads what this machine already has.

## 🧰 Tools

Tools are plugins in [`tools/`](tools/README.md) that produce media outside Remotion. Each one is named after its capability, and none runs until it is enabled in `kineto.config.yaml`.

| Tool | Input → output | Provider |
|---|---|---|
| 🗣️ `tts` | Text → voiceover WAV | Tencent Cloud TTS |
| 💬 `transcribe` | Speech in an asset → captions for `@remotion/captions` | whisper.cpp, local and free |
| 🎨 `image` | Prompt → image | Tencent Hunyuan Hy-Image-3.0 (TokenHub) |

```bash
./kineto tool tts "Every video starts with a single line." --to hello --as voice
./kineto tool transcribe voice --to hello --as captions
```

- Results enter the asset library with license and provenance, like any other asset.
- Settings and `--to` / `--as` are checked before a paid API is called.
- A new plugin is one file. See [`tools/README.md`](tools/README.md).

## ⌨️ CLI

<details>
<summary><code>./kineto help</code></summary>

| Command | Purpose |
|---|---|
| `doctor` | Check that this machine can make videos |
| `setup` | Install the official Remotion agent skills and sync generated files |
| `new <id> --title <text>` | Create a video from a template and register it |
| `list` / `show <id>` / `update <id>` | Browse and edit the catalog |
| `asset add <file\|url> --license <spdx>` | Register an asset, optionally with `--to <video> --as <alias>` |
| `asset link <asset-id> --to <video> --as <alias>` | Reuse a registered asset in another video |
| `asset unlink <alias> --from <video>` | Remove an asset from a video once its code no longer uses it |
| `asset update <asset-id> --license <spdx>` | Correct a registered license or author |
| `asset list` | List all assets, or those of one video |
| `tool list` / `tool <name>` | List tool plugins, or run one and register its result |
| `studio [id]` | Open Remotion Studio with every video, or with one |
| `render <id>` | Render, store and record a video, a scene, a GIF or a `<Still>` |
| `sync` / `check [--deep]` | Regenerate derived files / validate the whole library |
| `storage push` | Upload this machine's assets and renders to the shared backend |

- Output is JSON whenever stdout is not a terminal.
- Exit codes: `0` success, `1` error, `2` usage error.
- Commands that change records take a repository lock, so parallel agents are safe.

</details>

## 🛠️ Development

```bash
npm run verify    # typecheck, lint, tests and ./kineto check --deep (the CI gate)
```

- The CLI and kernel are TypeScript run directly by Node's type stripping. There is no build step.
- Releases are published by pushing a version tag such as `v1.0.0`. See [`CHANGELOG.md`](CHANGELOG.md).

## 📄 License

- kineto's own code is released under the [MIT License](LICENSE).
- kineto is built with [Remotion](https://www.remotion.dev), which has its own license: free for individuals and companies of up to three people, a company license otherwise. See [remotion.pro/license](https://remotion.pro/license). These terms apply to anyone using kineto.
- Each asset's license is recorded in `assets/manifest.jsonl`.
