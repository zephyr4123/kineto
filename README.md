<div align="center">

<h1>kineto</h1>

<p><b>An agent-first video studio built on <a href="https://www.remotion.dev">Remotion</a>.</b><br/>
Clone it, point your coding agent at it, get real MP4s — with every video, asset and render tracked like rows in a database.</p>

<p>
<img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
<img alt="Node" src="https://img.shields.io/badge/node-22.18%2B%20%7C%2023.6%2B-339933?logo=node.js&logoColor=white">
<img alt="Remotion" src="https://img.shields.io/badge/remotion-4.0.532-0B84F3">
<img alt="Status" src="https://img.shields.io/badge/status-early-orange">
</p>

<p><b>English</b> · <a href="README.zh-CN.md">简体中文</a></p>

</div>

## Why

Coding agents can write Remotion code, but left alone they guess from stale training data, drop files anywhere and
forget what they rendered. kineto gives them **one CLI as the only door**: it scaffolds videos, registers assets
with their license, renders through Remotion's API and records every result. The agent writes the creative part —
scenes and timelines in plain Remotion — and the CLI owns everything that has to stay consistent.

## Quick start

```bash
git clone https://github.com/zephyr4123/kineto.git && cd kineto
npm install
./kineto setup        # installs the official Remotion agent skills
./kineto doctor       # checks Node, dependencies, config, storage, skills
./kineto new hello --title "Hello kineto"
./kineto studio hello # preview while you (or your agent) write the scenes
./kineto render hello
```

Or just open your agent (Claude Code, Codex, …) in the repo and ask for a video. It reads [`AGENTS.md`](AGENTS.md) and takes it from there.

## How it works

```
person        "make a 30-second launch clip"
  ↓
agent         reads AGENTS.md + official Remotion skills, turns intent into CLI calls
  ↓
kineto CLI    the only door: stable JSON output, stable exit codes, errors with hints
  ↓
kernel        video catalog · asset library · render · sync · check
  ↓
strategies    engine: Remotion · storage backends (local, more to come) · tool plugins (planned)
```

| | What | Where |
|---|---|---|
| Video | Code + metadata + render history, one directory each | `videos/<id>/` |
| Asset | Content-addressed file with license, author and source | `assets/manifest.jsonl` + storage backend |
| Render | Every export with git sha, codec and Remotion version | `videos/<id>/renders.jsonl` + storage backend |

Binaries never enter git: they live in a storage backend chosen in `kineto.config.yaml`
(copy [`kineto.config.example.yaml`](kineto.config.example.yaml); secrets are only ever `${ENV}` references).
Each render bundles only the video it renders, so one broken video never blocks the others.

## CLI

<details>
<summary><code>./kineto help</code></summary>

| Command | Purpose |
|---|---|
| `doctor` | Check that this machine can make videos |
| `setup` | Install the official Remotion agent skills and sync generated files |
| `new <id> --title <text>` | Create a video from a template and register it |
| `list` / `show <id>` / `update <id>` | Browse and edit the catalog |
| `asset add <file\|url> --license <spdx>` | Register an asset (optionally `--to <video> --as <alias>`) |
| `asset link <asset-id> --to <video> --as <alias>` | Reuse a registered asset in another video |
| `asset unlink <alias> --from <video>` | Drop an asset from a video once its code no longer uses it |
| `asset update <asset-id> --license <spdx>` | Correct a registered asset's license or author |
| `asset list` | List assets, or those of one video |
| `studio [id]` | Open Remotion Studio with every video, or only one |
| `render <id>` | Render, store, and record a video or one of its scenes |
| `sync` / `check [--deep]` | Regenerate derived files / validate the whole library (CI gate) |

Output is JSON whenever stdout is not a terminal. Exit codes: `0` ok, `1` error, `2` usage.
Commands that change records take a repository lock, so agents can safely run them in parallel.

</details>

## Development

```bash
npm run verify    # typecheck + lint + tests + ./kineto check --deep — the same gate CI runs
```

The CLI and kernel are TypeScript executed directly by Node's type stripping; there is no build step.

## License

kineto's own code is released under the [MIT License](LICENSE).

kineto is **built with [Remotion](https://www.remotion.dev)**, which has its own license: free for individuals and
companies of up to 3 people, a company license otherwise — see [remotion.pro/license](https://remotion.pro/license).
Using kineto means using Remotion, so those terms apply to you too. Each asset's license is recorded in `assets/manifest.jsonl`.
