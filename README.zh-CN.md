<div align="center">

<h1>kineto</h1>

<p><b>为 coding agent 打造的视频工作室，基于 <a href="https://www.remotion.dev">Remotion</a>。</b></p>
<p>用自然语言描述一条视频，由 Claude Code 或 Codex 通过一个 CLI 完成制作，<br/>每个素材、每次渲染都有据可查。</p>

<a href="https://kineto.zephyrxiang.com/renders/kineto-promo/kineto-promo-714bded14437.mp4">
  <img src=".github/assets/kineto-teaser.gif" width="820" alt="kineto 宣传片预览：Clawd 拖着彩虹尾迹穿过光环，随后羽毛笔写出 kineto">
</a>

<p><sub>▶ 预览为无声循环。<a href="https://kineto.zephyrxiang.com/renders/kineto-promo/kineto-promo-714bded14437.mp4">观看 55 秒完整宣传片</a>，该片在本仓库内使用 kineto 制作。</sub></p>

<p>
<a href="https://github.com/zephyr4123/kineto/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zephyr4123/kineto/actions/workflows/ci.yml/badge.svg"></a>
<a href="https://github.com/zephyr4123/kineto/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zephyr4123/kineto"></a>
<img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
<img alt="Node" src="https://img.shields.io/badge/node-22.18%2B%20%7C%2023.6%2B-339933?logo=node.js&logoColor=white">
<img alt="Remotion" src="https://img.shields.io/badge/remotion-4.0.532-0B84F3">
</p>

<p><a href="README.md">English</a> · <b>简体中文</b></p>

</div>

## ✨ 为什么做 kineto

- 网上用 AI 制作的视频越来越多，但制作过程很少公开。
- coding agent 已经能编写 Remotion 代码，但缺少约束时会沿用过时的 API、随意放置文件，渲染结束后也不记录产物。
- kineto 为 agent 提供一个 CLI，作为修改记录的唯一入口；场景与时间线等创作部分仍使用标准 Remotion 编写。
- 用自然语言提出需求，得到真实的 MP4，即视频领域的 vibe coding。

<table>
<tr>
<td width="50%" valign="top">

**🚪 唯一入口**
<ul>
<li>所有记录都经由 <code>./kineto</code> 修改</li>
<li>JSON 输出、稳定的退出码，报错附带下一步操作提示</li>
<li><code>./kineto check</code> 在 CI 中发现手工改动</li>
</ul>

</td>
<td width="50%" valign="top">

**🏷️ 素材来源可追溯**
<ul>
<li>按内容寻址，记录许可证、作者与出处；没有许可证的文件拒绝入库</li>
<li>生成类素材另记录服务商、模型与提示词</li>
</ul>

</td>
</tr>
<tr>
<td valign="top">

**🧾 每次渲染均有记录**
<ul>
<li>支持视频、单个场景、静帧与 GIF</li>
<li>每次导出记录 git 版本、编码与 Remotion 版本</li>
<li>存储接入 CDN 后，记录中附带可分享的链接</li>
</ul>

</td>
<td valign="top">

**🔌 可插拔**
<ul>
<li>存储：本地，或任意 S3 兼容服务</li>
<li>工具：配音、字幕转写、AI 生图，各自在 <code>kineto.config.yaml</code> 中启用</li>
</ul>

</td>
</tr>
</table>

## 🚀 快速开始

```bash
git clone https://github.com/zephyr4123/kineto.git && cd kineto
npm install
./kineto setup        # 安装官方 Remotion agent skills
./kineto doctor       # 检查 Node、依赖、配置、存储与 skills
./kineto new hello --title "你好 kineto"
./kineto studio hello # 编写场景时实时预览
./kineto render hello
```

使用 agent 时，在仓库内打开它并提出视频需求即可。agent 会读取 [`AGENTS.md`](AGENTS.md) 并按其中的规范执行。

## 🧭 工作原理

```
用户          「做一条 30 秒带配音的发布短片」
  ↓
agent         读取 AGENTS.md 与官方 Remotion skills，转换为 CLI 调用
  ↓
kineto CLI    唯一入口：JSON 输出、稳定的退出码、带提示的报错
  ↓
kernel        视频目录 · 素材库 · 渲染 · 同步 · 检查
  ↓
策略          引擎：Remotion · 存储：本地、S3 兼容 · 工具：配音、字幕转写、生图
```

| | 内容 | 位置 |
|---|---|---|
| 🎬 视频 | 代码、元数据与渲染历史 | `videos/<id>/` |
| 🖼️ 素材 | 按内容寻址的文件，附许可证、作者与出处 | `assets/manifest.jsonl` + 存储后端 |
| 📦 渲染 | 每次导出的 git 版本、编码与 Remotion 版本 | `videos/<id>/renders.jsonl` + 存储后端 |

每次渲染只打包目标视频，单条视频出错不会影响其他视频。

## ☁️ 存储

二进制文件不进入 git，统一存放在 `kineto.config.yaml` 指定的存储后端（可参考 [`kineto.config.example.yaml`](kineto.config.example.yaml)）。

- `local` 为默认后端，即仓库内的一个目录，无需配置。
- `s3` 支持腾讯云 COS、AWS S3、Cloudflare R2、阿里云 OSS 与 MinIO，各服务之间只有 endpoint 不同。
- 对象写入后不再修改，上传时附带正确的 Content-Type 与长期缓存头。
- 将 `publicUrl` 设为 CDN 域名后，渲染记录会附带可分享的链接。上方的宣传片即以此方式分发。
- 密钥只以 `${ENV}` 引用的形式出现；`envFile` 可指向仓库外权限为 `600` 的凭据文件。
- 切换到共享后端后，运行 `./kineto storage push` 上传本机已有的素材与渲染产物。

## 🧰 工具

工具是 [`tools/`](tools/README.md) 目录下的插件，用于在 Remotion 之外生产素材。工具按能力命名，在 `kineto.config.yaml` 中启用后才会运行。

| 工具 | 输入 → 输出 | 实现 |
|---|---|---|
| 🗣️ `tts` | 文字 → 配音 WAV | 腾讯云语音合成 |
| 💬 `transcribe` | 素材中的人声 → `@remotion/captions` 可用的字幕 | whisper.cpp，本机运行，免费 |
| 🎨 `image` | 文字描述 → 图片 | 腾讯混元生图 Hy-Image-3.0（TokenHub） |

```bash
./kineto tool tts "每一条视频，都从一行字开始。" --to hello --as voice
./kineto tool transcribe voice --to hello --as captions
```

- 产物与其他素材一样进入素材库，并记录许可证与来源。
- 调用按次计费的接口之前，先校验配置与 `--to` / `--as` 参数。
- 新增插件只需一个文件，详见 [`tools/README.md`](tools/README.md)。

## ⌨️ CLI

<details>
<summary><code>./kineto help</code></summary>

| 命令 | 用途 |
|---|---|
| `doctor` | 检查本机是否具备制作视频的条件 |
| `setup` | 安装官方 Remotion agent skills 并同步生成文件 |
| `new <id> --title <text>` | 从模板新建视频并登记 |
| `list` / `show <id>` / `update <id>` | 浏览与修改视频目录 |
| `asset add <file\|url> --license <spdx>` | 登记素材，可附加 `--to <video> --as <alias>` 挂到视频上 |
| `asset link <asset-id> --to <video> --as <alias>` | 将已登记的素材复用到其他视频 |
| `asset unlink <alias> --from <video>` | 代码不再引用后，将素材从视频上移除 |
| `asset update <asset-id> --license <spdx>` | 更正已登记素材的许可证或作者 |
| `asset list` | 列出全部素材，或某条视频的素材 |
| `tool list` / `tool <name>` | 列出工具插件，或运行其中一个并登记产物 |
| `studio [id]` | 打开 Remotion Studio，查看全部视频或单条视频 |
| `render <id>` | 渲染、存储并记录视频、场景、GIF 或 `<Still>` 静帧 |
| `sync` / `check [--deep]` | 重新生成派生文件 / 校验整个素材库 |
| `storage push` | 将本机的素材与渲染产物上传到共享存储后端 |

- stdout 不是终端时一律输出 JSON。
- 退出码：`0` 成功，`1` 出错，`2` 用法错误。
- 修改记录的命令会获取仓库锁，多个 agent 并行调用是安全的。

</details>

## 🛠️ 开发

```bash
npm run verify    # 类型检查、lint、测试与 ./kineto check --deep（即 CI 门禁）
```

- CLI 与 kernel 使用 TypeScript 编写，由 Node 原生类型剥离直接运行，没有构建步骤。
- 推送 `v*` 标签即发布新版本，变更记录见 [`CHANGELOG.md`](CHANGELOG.md)。

## 📄 许可证

- kineto 自身的代码以 [MIT 许可证](LICENSE) 发布。
- kineto 基于 [Remotion](https://www.remotion.dev) 构建。Remotion 有独立的许可证：个人及 3 人以内的公司免费，其他情况需购买公司许可，详见 [remotion.pro/license](https://remotion.pro/license)。使用 kineto 时同样适用这些条款。
- 每个素材的许可证均记录在 `assets/manifest.jsonl` 中。
