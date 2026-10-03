<div align="center">

<h1>kineto</h1>

<p><b>An agent-first video studio built on <a href="https://www.remotion.dev">Remotion</a>.</b><br/>
Clone it, point your coding agent at it, get real MP4s — with every video, asset and render tracked like rows in a database.</p>

<p>
<img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A522.18-339933?logo=node.js&logoColor=white">
<img alt="Remotion" src="https://img.shields.io/badge/remotion-4.0.532-0B84F3">
<img alt="Status" src="https://img.shields.io/badge/status-early-orange">
</p>

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
./kineto render corner-hit
```

Then open your agent (Claude Code, Codex, …) in the repo and ask for a video. It reads [`AGENTS.md`](AGENTS.md) and takes it from there.

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
| `asset list` | List assets, or those of one video |
| `studio` | Open Remotion Studio with every video |
| `render <id>` | Render, store, and record a video or one of its scenes |
| `sync` / `check` | Regenerate derived files / validate the whole library (CI gate) |

Output is JSON whenever stdout is not a terminal. Exit codes: `0` ok, `1` error, `2` usage.

</details>

## Development

```bash
npm run verify    # typecheck + lint + tests + ./kineto check — the same gate CI runs
```

The CLI and kernel are TypeScript executed directly by Node's type stripping; there is no build step.

## Credits & license

kineto is **built with [Remotion](https://www.remotion.dev)**. Remotion has its own license: free for individuals
and companies of up to 3 people, a company license otherwise — see [remotion.pro/license](https://remotion.pro/license).
Each asset's license is recorded in `assets/manifest.jsonl`.
