#!/bin/bash
#=============================================================================
# sync-upstream.sh — 上游同步：合 EKKOLearnAI/hermes-studio 最新，保留自研改动
# 用法: bash scripts/sync-upstream.sh
#
# 工作流:
#   1. 检查工作区干净
#   2. 拉取上游 (EKKOLearnAI/hermes-studio)
#   3. 合入上游 main，自研文件保留本地版本
#   4. npm run build 验证
#   5. git push origin main
#   6. 更新 CUSTOM_CHANGES.md
#=============================================================================

set -euo pipefail

# ---- 自研改动文件（冲突时保留本地版本） ----
OUR_FILES=(
  "packages/desktop/src/main/browser/browser-manager.ts"
  "packages/desktop/src/main/index.ts"
  "packages/server/src/services/hermes/run-chat/index.ts"
  "packages/client/src/stores/hermes/chat.ts"
  "packages/client/src/components/hermes/chat/MessageList.vue"
)

# ---- 颜色 ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ---- 1. 检查工作区 ----
info "检查工作区..."
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  warn "工作区有未提交改动，建议 stash 或提交后再跑"
  git status --short
  exit 1
fi

# ---- 2. 拉取上游 ----
info "拉取上游 (EKKOLearnAI/hermes-studio)..."
git fetch upstream main 2>&1 | tail -2

# ---- 3. 检查是否有新提交 ----
COUNT=$(git rev-list --count main..upstream/main 2>/dev/null || echo 0)
if [ "$COUNT" -eq 0 ]; then
  info "✅ 已是最新，无需同步"
  exit 0
fi
info "上游有 $COUNT 个新提交:"
git log --oneline main..upstream/main

# ---- 4. 合入上游 ----
info "合入 upstream/main..."
MERGE_MSG=$(git log -1 --format="%s" upstream/main 2>/dev/null)
git merge upstream/main --no-edit 2>&1 || true

# 检查冲突
CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
if [ -n "$CONFLICTS" ]; then
  info "检测到冲突文件，按规则处理..."
  for file in $CONFLICTS; do
    if [[ " ${OUR_FILES[*]} " =~ " ${file} " ]]; then
      info "  保留本地版本: $file"
      git checkout --ours -- "$file"
    else
      info "  采用上游版本: $file"
      git checkout --theirs -- "$file"
    fi
    git add "$file"
  done
  git commit --no-edit
  info "冲突已解决"
fi

# 输出 merge 结果
UPSTREAM_SHA=$(git rev-parse --short upstream/main)
MERGE_SHA=$(git rev-parse --short HEAD)
info "合并完成: 上游 $UPSTREAM_SHA → 本 fork $MERGE_SHA"

# ---- 5. 编译验证 ----
info "编译验证 (npm run build)..."
npm run build 2>&1 | tail -10
BUILD_EXIT=${PIPESTATUS[0]}
if [ "$BUILD_EXIT" -ne 0 ]; then
  err "❌ 编译失败，请检查"
  exit 1
fi
info "✅ 编译通过"

# ---- 6. 更新 CUSTOM_CHANGES.md ----
info "更新 CUSTOM_CHANGES.md..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
UPSTREAM_TAG=$(git describe --tags upstream/main 2>/dev/null || echo "$UPSTREAM_SHA")
cat >> CUSTOM_CHANGES.md <<EOF

## 上游同步 — $TIMESTAMP

- **上游版本**: $UPSTREAM_TAG ($UPSTREAM_SHA)
- **合并提交**: $MERGE_SHA
- **上游新提交 ($COUNT 个)**: 
$(git log --oneline main..upstream/main | sed 's/^/  - /')
- **自研改动保留**: Windows 字体缩放 + 消息队列修复
- **编译结果**: ✅ 通过
EOF

# ---- 7. 推送 ----
info "推送到 origin main..."
git push origin main

info "✅ 上游同步完成！"
echo ""
echo "下一步:"
echo "  bash scripts/deploy-fleet.sh     # 部署到 31/35/36/61"
echo "  cd packages/desktop && npm run dist:win  # 打包桌面版 exe"