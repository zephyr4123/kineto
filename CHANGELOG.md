# Changelog

All notable changes to kineto are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and versions follow [Semantic Versioning](https://semver.org/). Pushing a version tag such as `v1.0.0` publishes the matching section
as a GitHub release; tags with a hyphen (`v1.1.0-rc.1`) become prereleases.

## [Unreleased]

## [1.0.0] - 2026-10-03

First stable release.

### CLI and kernel

- `./kineto` as the only way to change records: JSON output when piped, stable exit codes (`0` ok, `1` error, `2` usage), errors with a `code` and a `hint`.
- Video catalog: `new`, `list`, `show`, `update`; one directory per video under `videos/<id>/`.
- Asset library: `asset add`, `link`, `unlink`, `update`, `list`. Assets are content-addressed and every entry needs a license.
- `render` for videos, scenes, GIFs and `<Still>` images. Each render is stored and appended to `renders.jsonl` with git sha, codec and Remotion version. GIFs above 50 fps are rejected because browsers slow them down; `--every-nth-frame` lowers the rate.
- `check` (and `check --deep`) validates records, composition ids, generated files and stored assets. It is the CI gate.
- `studio`, `sync`, `doctor`, `setup`, `--version`.
- Commands that change records take a repository lock, so parallel agents are safe.

### Storage

- Local storage backend (default, zero configuration).
- S3-compatible backend for Tencent COS, AWS S3, Cloudflare R2, Alibaba OSS and MinIO, with a local read-only cache, content type and long-lived cache headers on upload, and a `publicUrl` that puts shareable links into render records.
- `storage push` uploads this machine's assets and renders to the shared backend without re-reading objects the backend already holds intact.
- Integrity checks on both ends: sources are hashed before upload, downloads are verified before they enter the local cache, and `check --deep` reports damaged objects. `asset add --reupload` and `storage push --reupload` repair them.
- `envFile` in `kineto.config.yaml` reads `${ENV}` secrets from a `chmod 600` file outside the repository.

### Tools

- Plugin host: `tool list` and `tool <name>`. Plugins in `tools/<name>/` run only when enabled in `kineto.config.yaml`, and their results enter the asset library with license and provenance.
- `tts`: text to voiceover WAV (Tencent Cloud TTS).
- `transcribe`: speech to captions JSON for `@remotion/captions` (local whisper.cpp). Word-level timing for languages written with spaces; phrase-level for Chinese, Japanese and Korean, one caption page per phrase. `--hint` tells whisper how proper nouns are spelled.

### Agents and project

- `AGENTS.md` with the rules agents follow; the official Remotion agent skills are installed by `./kineto setup`.
- Sample video `corner-hit` and the promo `kineto-promo`, both made with kineto.
- CI on Node 22.18 and 24, release workflow on `v*` tags, Dependabot for actions and npm.

[Unreleased]: https://github.com/zephyr4123/kineto/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/zephyr4123/kineto/releases/tag/v1.0.0
