---
name: review-proportional
description: 审查力度按活的大小来，小活不开审查子 agent
metadata:
  node_type: memory
  type: feedback
  originSessionId: ada5fca0-4236-45b3-ae1f-c34f0cc84b7e
  modified: 2026-10-26T06:32:09.619Z
---

小规模的活（几个脚本、配置、文档这种量级）不要开对抗审查子 agent，自己跑测试、做正负样本验证就够了。

**Why:** 2026-10-25 给 kineto 定 git/GitHub 规范时我开了两个审查 agent，用户叫停："这不是什么大任务，不要大炮打蚊子"。

**How to apply:** AGENTS.md 里"对抗性审查"那条留给大改动、高风险改动（数据 schema、kernel 核心逻辑、对外 API）；小活靠测试和实跑取证，不额外起 agent。拿不准规模时先问一句。
