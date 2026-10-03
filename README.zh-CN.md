<div align="center">

<h1>kineto</h1>

<p><b>为 coding agent 打造的视频工作室，基于 <a href="https://www.remotion.dev">Remotion</a>。</b><br/>
clone 下来，让你的 agent 接手，就能产出真正的 MP4——每条视频、每个素材、每次渲染都像数据库里的一行记录一样有据可查。</p>

<p>
<img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
<img alt="Node" src="https://img.shields.io/badge/node-22.18%2B%20%7C%2023.6%2B-339933?logo=node.js&logoColor=white">
<img alt="Remotion" src="https://img.shields.io/badge/remotion-4.0.532-0B84F3">
<img alt="Status" src="https://img.shields.io/badge/status-early-orange">
</p>

<p><a href="README.md">English</a> · <b>简体中文</b></p>

</div>

## 为什么做它

coding agent 会写 Remotion 代码，但放任不管时，它会照着过时的训练数据猜 API、把文件随手乱放、渲染完就忘了产物在哪。
kineto 给 agent **一个 CLI 作为唯一的门**：建视频、带许可证登记素材、通过 Remotion 的 API 渲染、记录每一次结果，全都经由它。
agent 只负责创作的部分——用原汁原味的 Remotion 写场景和时间线；所有需要保持一致的东西，归 CLI 管。

## 快速开始

```bash
git clone https://github.com/zephyr4123/kineto.git && cd kineto
npm install
./kineto setup        # 安装官方 Remotion agent skills
./kineto doctor       # 检查 Node、依赖、配置、存储、skills
./kineto new hello --title "你好 kineto"
./kineto studio hello # 一边写场景（或让 agent 写）一边预览
./kineto render hello
```

也可以直接在仓库里打开你的 agent（Claude Code、Codex……），说一句想要什么视频。它会读 [`AGENTS.md`](AGENTS.md)，剩下的自己搞定。

## 工作原理

```
人            「做一条 30 秒的发布短片」
  ↓
agent         读 AGENTS.md 和官方 Remotion skills，把意图翻译成 CLI 调用
  ↓
kineto CLI    唯一的门：稳定的 JSON 输出、稳定的退出码、带下一步提示的错误
  ↓
内核          视频库 · 资产库 · 渲染 · 同步 · 校验
  ↓
策略层        引擎：Remotion · 存储后端（本地，更多在路上） · 工具插件（规划中）
```

| | 是什么 | 在哪 |
|---|---|---|
| 视频 | 代码 + 元数据 + 渲染历史，一条视频一个目录 | `videos/<id>/` |
| 素材 | 按内容寻址的文件，带许可证、作者与来源 | `assets/manifest.jsonl` + 存储后端 |
| 渲染 | 每次导出都记下 git 版本、编码与 Remotion 版本 | `videos/<id>/renders.jsonl` + 存储后端 |

二进制文件从不进 git：它们存放在 `kineto.config.yaml` 选定的存储后端里
（复制 [`kineto.config.example.yaml`](kineto.config.example.yaml) 即可；密钥永远只以 `${ENV}` 引用的形式出现）。
每次渲染只打包要渲染的那一条视频，一条视频出了问题不会拖累其它视频。

## CLI

<details>
<summary><code>./kineto help</code></summary>

| 命令 | 用途 |
|---|---|
| `doctor` | 检查这台机器能不能做视频 |
| `setup` | 安装官方 Remotion agent skills 并同步生成文件 |
| `new <id> --title <text>` | 从模板创建视频并登记 |
| `list` / `show <id>` / `update <id>` | 浏览、修改视频库 |
| `asset add <file\|url> --license <spdx>` | 登记素材（可加 `--to <视频> --as <别名>` 直接挂上） |
| `asset link <asset-id> --to <视频> --as <别名>` | 把已登记的素材复用到另一条视频 |
| `asset list` | 列出素材，或某条视频用到的素材 |
| `studio [id]` | 打开 Remotion Studio：全部视频，或只看一条 |
| `render <id>` | 渲染视频（或其中一个场景）、入库并留痕 |
| `sync` / `check [--deep]` | 重新生成派生文件 / 校验整个视频库（CI 门禁） |

stdout 不是终端时输出 JSON。退出码：`0` 成功，`1` 错误，`2` 用法错误。
修改记录的命令会持有仓库锁，agent 并行调用也安全。

</details>

## 开发

```bash
npm run verify    # 类型检查 + lint + 测试 + ./kineto check --deep，与 CI 的门禁一致
```

CLI 与内核是 TypeScript，直接由 Node 的类型剥离执行，没有编译步骤。

## 许可证

kineto 自身的代码以 [MIT 许可证](LICENSE) 发布。

kineto **基于 [Remotion](https://www.remotion.dev) 构建**，Remotion 有它自己的许可：个人和 3 人以内的公司免费，
其余需要购买公司授权——详见 [remotion.pro/license](https://remotion.pro/license)。使用 kineto 就是在使用 Remotion，
这些条款同样适用于你。每个素材的许可证都记录在 `assets/manifest.jsonl` 里。
