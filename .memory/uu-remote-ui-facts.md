---
name: uu-remote-ui-facts
description: 画 UU远程 手机端界面时已核实的样子：竖屏黑边、横屏右侧工具栏、键盘弹出把画面整体上推、电脑键盘排布，以及各自的出处
metadata:
  node_type: memory
  type: reference
  originSessionId: ada5fca0-4236-45b3-ae1f-c34f0cc84b7e
  modified: 2026-11-14T05:03:15.872Z
---

画 UU远程 手机端（snug-promo 里）时已经对过实机图的事实，2026-11-13 核实：

- **原版竖屏**：整块桌面等比缩到手机宽，上下是大片黑边，有效画面约占屏高三成；底部工具栏「展开所有窗口 / 显示桌面 / 键盘 / 操作」。出处：Snug README 的对比图 `dl.zephyrxiang.com/snug/media/compare-uu-original.cf4158d1.png`（实机是深色模式）。
- **原版横屏**：没有状态栏，桌面按屏高缩放、左右留黑；右边一列竖排工具栏，从上到下「操作 / 键盘 / 显示桌面 / 展开所有窗口」（最后一项分两行）。出处：公开测评 ai-bot.cn/netease-uuremote-review 里的横屏录屏和截图（深色模式）。
- **键盘弹出时整个远程画面往上推**，屏幕顶部那一截被推出去（标题栏、菜单栏看不见），不是缩放到剩余空间。出处：Snug README 演示视频 `dl.zephyrxiang.com/snug/media/phone-demo.a97e46d1.mp4`。所以演示打字时，输入位置必须落在窗口下半截。Safari 地址栏在顶上，照实演会看不到字。
- **电脑键盘**：「☐ 组合键模式」+ Control / Shift / Option / ⌘，数字一排、字母三排，Space、Enter 平分最后三格，底下两个翻页点；横屏时键盘占屏高约一半。出处同上测评的横屏截图。

**How to apply:** 改 snug-promo 里 UU 的界面前先对照这几条，没核实过的样子（比如浅色模式下横屏工具栏的配色）在汇报里标「未验证」。配合 [[video-ui-fidelity]]。
