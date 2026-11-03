---
name: gh-account-lock
description: kineto 的 GitHub 账号锁在专用 gh 配置上，不受别的会话切号影响；推送 403 时先查这里
metadata:
  node_type: memory
  type: project
  originSessionId: ada5fca0-4236-45b3-ae1f-c34f0cc84b7e
  modified: 2026-11-03T12:06:46.579Z
---

本机 gh 登着两个号（公司 huang-suxiang_scale、个人 zephyr4123）。另一个项目的 Claude Code 跑公司项目时会不停把全局活动账号切成公司号，这是避免不了的；git 推送走 `gh auth git-credential`，用的就是活动账号。2026-11-03 一次 ship 跑到一半被切走，推送报 `denied to huang-suxiang_scale`。

锁了两层：
- `.claude/settings.local.json` 的 `env.GH_CONFIG_DIR` 指向 `~/.config/gh-zephyr4123/`（hosts.yml 只登 zephyr4123；token 在钥匙串里，不落盘）。本仓库里 Claude Code 的所有 gh / git 命令只认这份配置。开新会话才生效。
- `scripts/ship.sh` 启动时按 origin 的 owner 取该账号的 token 放进 `GH_TOKEN`，从终端或别的项目跑 ship 也锁得住。

**排查：** 推送 403 → `echo $GH_CONFIG_DIR` 看会话是否带上了锁；`GH_CONFIG_DIR=~/.config/gh-zephyr4123 gh auth status` 看 token 是否过期，过期就在默认配置里 `gh auth login` 重登 zephyr4123（钥匙串里的 token 两份配置共用）。全局切号钩子 `~/.claude/hooks/gh-account-gate.sh` 判断活动账号时读的还是全局 hosts.yml，全局被切走时会在本仓库多报一句"已切换"，不影响锁定（改钩子被权限检查拦了，留给用户决定）。
