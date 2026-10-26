#!/usr/bin/env bash
# 把当前分支合进 main（npm run ship）：本地查规范 → 推分支等 CI → 绿了把同一个提交 fast-forward 推到 main → 删分支。
# main 的规则集只收在别的分支上跑绿过的提交，这条命令就是那条路。合主干要用户点头，用户说合并了再跑。
# 只用 fast-forward：GitHub 网页上的 rebase / squash 合并会换 sha，renders.jsonl 里记的 sha 就对不上了。
set -euo pipefail

die() {
  printf 'ship: %s\n' "$1" >&2
  if [[ -n "${2:-}" ]]; then printf '  hint: %s\n' "$2" >&2; fi
  exit 1
}

command -v gh >/dev/null || die "gh (GitHub CLI) is not installed" "install it and run gh auth login"
cd "$(git rev-parse --show-toplevel)"

branch="$(git symbolic-ref --quiet --short HEAD)" || die "HEAD is detached" "check out the branch you want to ship"
[[ "$branch" != main ]] || die "you are on main" "ship runs from a branch: git switch -c feat/<name>, commit, then npm run ship"
[[ -z "$(git status --porcelain)" ]] || die "the working tree has uncommitted changes" "commit or stash them first: CI only sees what is committed"

git fetch --quiet origin main
git merge-base --is-ancestor origin/main HEAD ||
  die "origin/main has commits this branch does not have" "git merge origin/main, then ship again. Do not rebase: it changes commit shas that renders.jsonl may already record"
[[ -n "$(git rev-list origin/main..HEAD)" ]] || die "nothing to ship: this branch has no commits beyond origin/main"
if git show-ref --verify --quiet refs/heads/main; then
  git merge-base --is-ancestor main HEAD ||
    die "local main has commits that are not on this branch" "push or move them to a branch first; ship never rewrites main"
fi

# 先在本地查一遍规范，省得推上去等几分钟才知道
node scripts/conventions.ts --base origin/main

sha="$(git rev-parse HEAD)"
git push --quiet -u origin "$branch"

# 推送后 GitHub 要几秒才建出这次的 CI 运行
run=""
for _ in $(seq 1 30); do
  # gh 偶尔网络抖一下（实测碰到过 EOF），等待期间的报错都当作"再等等"
  run="$(gh run list --workflow ci --branch "$branch" --commit "$sha" --event push --limit 1 --json databaseId --jq '.[0].databaseId // empty' 2>/dev/null)" || run=""
  [[ -n "$run" ]] && break
  sleep 2
done
[[ -n "$run" ]] || die "no ci run found for ${sha:0:7} within 60s" "check gh auth status and gh run list --branch $branch, then run ship again"

printf 'ship: waiting for ci run %s on %s\n' "$run" "${sha:0:7}"
# 自己轮询运行的状态，不用 gh run watch：实测它在运行早已结束后还会挂住不返回（一次挂了 10 分钟）。
# 查询出错（网络抖动）就等下一轮，最多等 30 分钟
result=""
for _ in $(seq 1 180); do
  result="$(gh run view "$run" --json status,conclusion --jq '.status + "/" + .conclusion' 2>/dev/null)" || result=""
  [[ "$result" == completed/* ]] && break
  sleep 10
done
[[ "$result" == completed/success ]] ||
  die "ci run $run on ${sha:0:7} did not pass (${result:-status unknown})" "gh run view $run --log-failed; fix it on the branch and ship again (a flaky job: gh run rerun $run --failed)"

# 推的是分支上跑绿的同一个提交；不是 fast-forward 时 GitHub 会拒绝，这里不加 --force
git push --quiet origin "$sha:refs/heads/main"
git switch --quiet main 2>/dev/null || git switch --quiet -c main --track origin/main
git merge --quiet --ff-only "$sha"
git push --quiet origin --delete "$branch"
git branch --quiet -d "$branch"
printf 'ship: %s is on main at %s\n' "$branch" "${sha:0:7}"
