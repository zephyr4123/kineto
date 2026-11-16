---
name: snug-demo-direction
description: Snug 三屏实录演示（snug-demo）的要求：实录不演绎、用户名打码后才上传；先用 slogan 点题、不分章；手机上要有手指可视化、鼠标指针抹干净；字讲究不套模板；配乐不剪歌
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

**v1 之后主人的意见（11-16），v2 照此改：**
- 配乐中途换段很突兀：不要剪歌拼接（还因为小节长量错了 0.08 秒）。现在从歌的饱满段（第 8 小节）起一刀不剪放到片尾的小节头。
- 画面文字「AI 味」重：英文小标、圆点分隔、白色胶囊标签、蓝条都不要；字要融进交互（引线标注、打字回显、Snug 日志原文打出来）。固定的角标可以随意，跟内容走的字要讲究。
- 手机上的操作看着像鼠标点的：要明确的手指可视化。录像里的鼠标指针要抹干净 —— 不只箭头，还有文字上的 I 形光标、Safari 链接上的小手，以及手机屏换到 580 宽那段缩小了的箭头（scratchpad 流程：模板匹配追踪 → 只在指针形状里 inpaint → 逐种复查到零）。
- 背景别像铺了张纯色，但也不要炫。
- 推远时 Mac 屏糊：按显示宽度挑预先缩好的清晰度档位。
- 开头先讲这是什么，用 slogan「Make UU Remote Native on iPhone」引子，不要一上来就说三屏实录；不要总分结构，按过程走。
- 收尾要有 GitHub 卡片点亮 Star 的交互（同 snug-promo）。

**Why:** 片子的说服力来自真实；主人此前对深色底、口水话字幕、PPT 式轮播都明确反感过（[[video-ui-fidelity]]）。

**How to apply:** 改 snug-demo 时守住「不改画面里发生的事」，标注和手指的时刻、位置要能从录像或 Snug 日志里找到依据（日志原文在 snug 仓库 `footage/cuts/rough-v2.edl.json` 的 events）；新加的画面文字先过 [[video-caption-copy]]。
