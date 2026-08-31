#!/bin/bash
# =============================================================================
# auto-sync-upstream.sh — 一键完成"最上游更新 + 合并保留个人功能 + 推送到自己 GitHub"
#
# 用法:  bash auto-sync-upstream.sh
#   或设为 Windows 定时任务每天自动跑
#
# 流程:
#   1. 拉取最上游 EKKOLearnAI/hermes-studio
#   2. 若无更新 → 直接退出
#   3. 备份当前 main → backup-main-<日期>
#   4. 执行 merge，按 MERGE_RULES.md 规则解决冲突
#   5. 安装依赖 + 构建验证
#   6. 推送到你自己 GitHub (origin)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"
LOG="sync-log.txt"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }
die() { log "❌ $*"; exit 1; }

UPSTREAM_REMOTE="upstream"
UPSTREAM_REPO="https://github.com/EKKOLearnAI/hermes-studio.git"
MERGED=false

log "===== 自动同步开始 ====="

# 1. 确保有 upstream
if ! git remote get-url $UPSTREAM_REMOTE &>/dev/null; then
    git remote add $UPSTREAM_REMOTE "$UPSTREAM_REPO"
    log "✅ 已添加 upstream"
fi

# 2. 拉取上游
git fetch $UPSTREAM_REMOTE main && log "✅ 拉取上游完成"

# 3. 检查是否有更新
LOCAL=$(git rev-parse HEAD)
UPSTREAM=$(git rev-parse $UPSTREAM_REMOTE/main)
if [ "$LOCAL" = "$UPSTREAM" ]; then
    log "✅ 已是最新 (${LOCAL:0:8})，无需更新"
    exit 0
fi

log "⬆️ 上游有新提交: 本地 ${LOCAL:0:8} → 上游 ${UPSTREAM:0:8}"
git log --oneline HEAD..$UPSTREAM_REMOTE/main | head -30

# 4. 备份
BACKUP="backup-main-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP" && log "🛟 已备份到分支 $BACKUP"

# 5. 合并
log "执行合并..."
if ! git merge $UPSTREAM_REMOTE/main --no-edit 2>&1 | tee -a "$LOG"; then
    # 有冲突 → 按 MERGE_RULES.md 处理(交给解决脚本/人工)
    log "⚠️ 合并有冲突，见 MERGE_RULES.md 逐个解决"
    git status --short
    exit 1
fi
MERGED=true
log "✅ 合并成功"

# 6. 新功能/结构迁移(如有 earmark 目录变化)
#    (此处可挂自动迁移脚本 migrate-earmark.sh)

log "===== 合并完成，开始验证 ====="

# 7. 安装依赖 + 构建
npm install 2>&1 | tee -a "$LOG" || die "npm install 失败"
npm run build 2>&1 | tee -a "$LOG" || die "npm run build 失败"
log "✅ 构建通过"

# 8. 推送(仅当有合并才推)
if [ "$MERGED" = true ]; then
    git push origin main 2>&1 | tee -a "$LOG" && log "✅ 已推送到你的 GitHub"
fi

log "===== 同步完成 ====="
log "🎉 现在你有: 上游最新功能 + 全部个人功能"
