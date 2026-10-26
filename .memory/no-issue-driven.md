---
name: no-issue-driven
description: kineto 不走 issue-driven，不为干活、记技术债去开 GitHub issue
metadata:
  node_type: memory
  type: feedback
  originSessionId: ada5fca0-4236-45b3-ae1f-c34f0cc84b7e
  modified: 2026-10-26T07:22:13.065Z
---

kineto 这个项目不用 issue-driven：不要为了跟踪任务、技术债或排查中的发现去开 GitHub issue，也不要建标签。AGENTS.md 红线区块里"Issue 沉淀"那一节在本项目不适用。

**Why:** 2026-10-26 定 git 规范时，我开了 4 个 issue（TS 7 迁移、ESLint 10 迁移、偶发失败的并发测试、干净渲染检查）和 4 个 `kind:` 标签。用户让全部关掉，并明确说这个项目不用 issue-driven。

**How to apply:** 发现的坑和技术债在汇报里点出来，由用户决定做不做；不主动建 issue。相关：[[review-proportional]]
