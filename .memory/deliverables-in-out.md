---
name: deliverables-in-out
description: 交付的成片、封面、投稿页一律放到 out/<视频 id>/，汇报给这个路径；不要只报 .kineto/cache 里的渲染路径
metadata:
  node_type: memory
  type: feedback
  originSessionId: ada5fca0-4236-45b3-ae1f-c34f0cc84b7e
  modified: 2026-11-16T12:36:18.685Z
---

定稿要交付的东西都放进 `out/<视频 id>/`（已被 .gitignore 挡住，只在本机）：成片 `<id>.mp4`、横竖封面 `<id>-cover.png` / `<id>-cover-portrait.png`、投稿文案 `publish.html`。做法是 `./kineto render` 之后把 renders.jsonl 记录里的 `file` 复制过去（`cp -p`，只读出缓存，不动 `.kineto/`）。

**Why:** 2026-11-16 snug-demo 第四版只报了 `.kineto/cache/…/renders/…` 里的路径，主人追问「你咋把这支影片放到 .cache 下了？这个也是 kineto 的输出」。之前几支（snug-promo、speakmore-promo-*）都在 `out/<id>/` 里。

**How to apply:** 成片定稿或封面渲好时，同一步把文件复制到 `out/<id>/`。汇报时先给 `out/<id>/` 里的路径，再附 renders.jsonl 记录和公开 URL；中间版本也照这样放进去，覆盖同名文件，免得主人去缓存里翻。相关：[[publish-copy-titles]]
