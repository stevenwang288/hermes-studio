#!/usr/bin/env bash
# 把 4 台 PVE 的 git HEAD 同步到 origin/sync 最新。
#
# 适用场景：部署后又产生了新提交（记账 / 脚本修复 / 纯文档改动），
#          运行时代码没变，不需要 build + restart（不中断服务），
#          只需把 git 指针快进，保持 4 台与仓库一致。
#
# 改动了 packages/ 下源码时别用这个 —— 走 scripts/deploy-one-vm.sh 完整部署。
#
# 用法：bash scripts/sync-fleet-head.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

VMS=(
  "931:/opt/hermes-studio-ekko"
  "935:/opt/hermes-studio"
  "936:/opt/hermes-studio-fork"
  "961:/opt/hermes-studio"
)

WANT="$(git ls-remote origin sync 2>/dev/null | awk '{print $1}')"
if [ -z "$WANT" ]; then
  echo "FATAL: 取不到 origin/sync，检查本机到 GitHub 的网络（代理节点可能挂了）"
  exit 1
fi
echo "目标 commit = ${WANT:0:8}"
echo "=============================================="

# 在某台机器上尝试 fetch + reset，成功返回 0
try_io() {
  local vm="$1" dir="$2"
  ssh -o ConnectTimeout=10 -o BatchMode=yes "pve-vm-$vm" "
    cd $dir || exit 2
    for i in 1 2 3; do
      git fetch origin sync >/dev/null 2>&1
      FET=\$(git rev-parse --verify --quiet FETCH_HEAD 2>/dev/null)
      if [ -n \"\$FET\" ] && [ \"\$FET\" = \"$WANT\" ]; then
        git reset --hard \"$WANT\" >/dev/null 2>&1 && exit 0
      fi
      sleep 2
    done
    exit 1
  " >/dev/null 2>&1
}

# GnuTLS 持续抖动时的旁路：本地打增量 bundle，内网 scp 过去
try_bundle() {
  local vm="$1" dir="$2" base="$3"
  local bundle="/tmp/sync-head-$vm.bundle"
  git bundle create "$bundle" "$base..sync" >/dev/null 2>&1 || return 1
  scp -o ConnectTimeout=10 "$bundle" "pve-vm-$vm:/tmp/$(basename "$bundle")" >/dev/null 2>&1 || return 1
  ssh -o ConnectTimeout=10 -o BatchMode=yes "pve-vm-$vm" "
    cd $dir || exit 2
    git fetch /tmp/$(basename "$bundle") sync:incoming >/dev/null 2>&1
    git reset --hard \"$WANT\" >/dev/null 2>&1
    rm -f /tmp/$(basename "$bundle")
    exit 0
  " >/dev/null 2>&1
  rm -f "$bundle"
  rm -f "$bundle"
}

overall=0
for pair in "${VMS[@]}"; do
  vm="${pair%%:*}"
  dir="${pair##*:}"
  before="$(ssh -o ConnectTimeout=10 -o BatchMode=yes "pve-vm-$vm" "cd $dir && git rev-parse --short=7 HEAD" 2>/dev/null)"
  after=""

  if try_io "$vm" "$dir"; then
    echo "  $vm: git 直连 OK"
  elif [ -n "$before" ] && git rev-parse --verify --quiet "$before" >/dev/null 2>&1 && try_bundle "$vm" "$dir" "$before"; then
    echo "  $vm: 走 bundle 内网直传（GitHub 侧握手失败）"
  else
    echo "  $vm: ✗ 同步失败，需人工处理"
    overall=1
    continue
  fi

  after="$(ssh -o ConnectTimeout=10 -o BatchMode=yes "pve-vm-$vm" "cd $dir && git rev-parse --short=7 HEAD" 2>/dev/null)"
  if [ "$after" = "${WANT:0:7}" ]; then
    echo "         HEAD $before -> $after  ✓"
  else
    echo "         HEAD $before -> ${after:-未知}  ✗ 期望 ${WANT:0:7}"
    overall=1
  fi
done

echo "=============================================="
if [ $overall -eq 0 ]; then
  echo "4 台 git 指针已全部对齐 ${WANT:0:8}（未重启服务，运行时未变）"
else
  echo "有机器未对齐 —— 见上方 ✗"
fi
exit $overall
