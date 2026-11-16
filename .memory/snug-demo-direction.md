---
name: snug-demo-direction
description: Snug 三屏实录演示（snug-demo）的要求：实录不演绎、用户名打码后才上传；画面浅色底、深色只做转场，字幕短，镜头和交互要丰富
metadata:
  node_type: memory
  type: project
  originSessionId: ada5fca0-4236-45b3-ae1f-c34f0cc84b7e
  modified: 2026-11-16T10:30:21.728Z
---

Snug 第二支片子 snug-demo（2026-11-16 开做）是**实录演示**，不是宣传片：素材是主人 11-15 用 OBS 同一时间线录的三块屏（内建屏、外接 4K 屏、Snug 手机屏），交接说明在 snug 仓库的 `footage/handoff-kineto.md`（只在本机，不进 git）。只能剪、加速、推近、加字幕和标注，不改画面里发生的事。

主人 11-16 给的四条要求（原话要点），这一版让我先自由发挥：
1. 语言简短干练，不写主谓宾俱全的口水话（同 [[video-caption-copy]]）。
2. 画面变化要丰富：场景变化、推近推远都要有。
3. 交互要丰富，不要像放 PPT。
4. 每个场景都用很明亮的浅色底，不用深色（「太压抑」）；只有场景切换时可以用深色做临时过渡。

已定：竖版先给小红书；配乐用 SpeakMore 第一支宣传片那首（ADTurnUp《purple sky》）；只加短字幕，不配旁白；手机格套 snug-promo 那台 iPhone（已提升到 `engine/snug/phone.tsx`）。

**隐私**：录像里终端提示符露出了用户名和机器名。主人选了「先打码再上传」：拆三屏时逐帧用 macOS Vision 识别、打马赛克，再逐帧复查到零残留才 `asset add`（存储后端是公开可读的 COS）。以后再接这批素材，照这个流程先打码。

**Why:** 片子的说服力来自真实；主人此前对深色底、口水话字幕、PPT 式轮播都明确反感过（[[video-ui-fidelity]]）。

**How to apply:** 改 snug-demo 时守住「不改画面里发生的事」，标注（波纹、飞行轨迹、高亮框）的时刻和位置要能从录像或 Snug 日志里找到依据；新加的画面文字先过 [[video-caption-copy]]。
