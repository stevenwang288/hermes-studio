#!/bin/bash
# =============================================================================
# sync-upstream.sh — 检查上游 EKKOLearnAI/hermes-studio 更新，自动 merge，
#                   若涉及桌面/客户端代码则重新构建 Windows 安装包
# =============================================================================
# 部署位置：99号 D:\DeSK\hermes-studio\
# 定时任务：schtasks 每天 08:00 执行
# 日志：D:\DeSK\hermes-studio\sync.log
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"
LOG_FILE="$(pwd)/sync.log"
INSTALLER_DIR="$(pwd)/../hermes-studio-installer"
LAST_BUILD_FILE="$(pwd)/last-build.txt"
MERGE_CONFLICT_FILE="$(pwd)/MERGE_CONFLICT.md"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== 开始同步 ==="

# 1. 检查本地是否为 git 仓库
if [ ! -d ".git" ]; then
    log "❌ 不是 git 仓库，退出"
    exit 1
fi

# 2. 确保有 upstream 远程
if ! git remote get-url upstream &>/dev/null; then
    git remote add upstream https://github.com/EKKOLearnAI/hermes-studio.git
    log "ℹ️  已添加 upstream 远程"
fi

# 3. 拉取上游最新
log "拉取上游最新..."
git fetch upstream 2>&1 | tee -a "$LOG_FILE"

# 4. 检查上游是否有更新
LOCAL=$(git rev-parse HEAD)
UPSTREAM=$(git rev-parse upstream/main)

if [ "$LOCAL" = "$UPSTREAM" ]; then
    log "✅ 已是最新（commit: ${LOCAL:0:8}），无需更新"
    exit 0
fi

log "⬆️  上游有新提交: ${UPSTREAM:0:8}（本地: ${LOCAL:0:8}）"

# 5. 记录上游新提交
log "上游新提交:"
git log --oneline HEAD..upstream/main | tee -a "$LOG_FILE"

# 6. 尝试 merge
log "执行 git merge upstream/main ..."
if ! git merge upstream/main --no-edit 2>&1 | tee -a "$LOG_FILE"; then
    log "❌ MERGE 冲突！需要人工处理"
    echo "# Merge Conflict — $(date)" > "$MERGE_CONFLICT_FILE"
    echo "" >> "$MERGE_CONFLICT_FILE"
    git diff --name-only --diff-filter=U >> "$MERGE_CONFLICT_FILE"
    log "冲突文件列表已写入 $MERGE_CONFLICT_FILE"
    log "请人工解决冲突后重新运行本脚本"
    exit 2
fi

log "✅ Merge 成功"

# 7. 检查改动的文件是否涉及桌面/客户端
CHANGED_FILES=$(git diff --name-only HEAD..HEAD@{1} 2>/dev/null || true)
NEEDS_REBUILD=false

if echo "$CHANGED_FILES" | grep -qE "^packages/desktop/|^packages/client/"; then
    NEEDS_REBUILD=true
    log "🔧 检测到桌面/客户端代码变更，需要重新构建"
else
    log "✅ 无需重新构建（未改桌面/客户端代码）"
fi

# 8. 重新构建 Windows 包
if [ "$NEEDS_REBUILD" = true ]; then
    log "开始构建 Windows 安装包..."
    mkdir -p "$INSTALLER_DIR"

    # 构建 client/server
    if npm run build 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Studio 构建成功"
    else
        log "⚠️  Studio 构建失败（可能是上游依赖改变），尝试 npm install 后重试"
        npm install 2>&1 | tee -a "$LOG_FILE"
        npm run build 2>&1 | tee -a "$LOG_FILE" || {
            log "❌ 重试后仍失败，请手工构建"
            exit 3
        }
    fi

    # 构建桌面包
    npm run desktop:install 2>&1 | tee -a "$LOG_FILE"
    if npm --prefix packages/desktop run dist -- --win --publish never 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Windows 桌面包构建成功"

        # 复制安装包到固定目录
        cp -v packages/desktop/release/*.exe "$INSTALLER_DIR/" 2>/dev/null || true
        cp -v packages/desktop/release/*.msi "$INSTALLER_DIR/" 2>/dev/null || true

        # 记录版本号
        VERSION=$(node -e "console.log(require('./package.json').version)")
        echo "v${VERSION} — built at $(date '+%Y-%m-%d %H:%M:%S') — commit ${UPSTREAM:0:8}" > "$LAST_BUILD_FILE"
        log "📦 安装包已复制到 $INSTALLER_DIR"
        log "📝 版本: $VERSION (commit ${UPSTREAM:0:8})"
    else
        log "❌ Windows 桌面包构建失败"
        exit 4
    fi
fi

log "=== 同步完成 ==="