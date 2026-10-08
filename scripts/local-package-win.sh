#!/bin/bash
# ============================================================
# 本地打包 Windows 桌面版 —— 一条命令从重建依赖到交付完成
# 用法: bash scripts/local-package-win.sh
# 后台跑完整流程, 通知响 = 全部完成(零后续步骤)
# 产物: packages/desktop/release/ + 自动拷到 D:\desk (删旧版)
# ============================================================
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_WIN="$(cygpath -m "$ROOT" 2>/dev/null || echo "$ROOT")"
DESK="/d/desk"
VER=$(node -e "console.log(require('$ROOT_WIN/package.json').version)")
START=$(date +%H:%M:%S)
echo "=== 本地打包开始 $VER @ $START ==="

echo "[1/6] 根目录 npm prune --omit=dev (防 dev 依赖打进 webui/node_modules 使 exe 膨胀到 321MB)"
cd "$ROOT" && npm prune --omit=dev --no-audit --no-fund 2>&1 | tail -2
du -sh node_modules

echo "[2/6] desktop 独立安装依赖(含 dev: tsc/electron-builder 需要)"
cd "$ROOT/packages/desktop" && npm ci --include=dev --no-audit --no-fund 2>&1 | tail -2

echo "[3/6] dist:win 打包(首次自动下载 electron 二进制, 需代理 10808, 之后有缓存)"
export HTTPS_PROXY=http://127.0.0.1:10808 HTTP_PROXY=http://127.0.0.1:10808 ELECTRON_GET_USE_PROXY=1
npm run dist:win 2>&1 | tail -6

echo "[4/6] 验证产物大小(期望 195-200MB, >300MB = 没 prune dev)"
EXE="$ROOT/packages/desktop/release/Ekko.Studio-$VER-x64.exe"
if [ ! -f "$EXE" ]; then echo "错误: 找不到产物 $EXE"; exit 1; fi
SIZE=$(stat -c%s "$EXE")
echo "exe: $EXE ($((SIZE/1024/1024))MB)"
if [ "$SIZE" -gt 300000000 ]; then echo "错误: exe 超 300MB, 打包前没 prune dev?"; exit 1; fi

echo "[5/6] 拷贝到 D:/desk (删旧版 exe/blockmap/latest.yml, 只留最新)"
cd "$ROOT/packages/desktop/release"
rm -f "$DESK"/Ekko.Studio-*.exe* "$DESK"/latest.yml 2>/dev/null || true
cp "Ekko.Studio-$VER-x64.exe" "Ekko.Studio-$VER-x64.exe.blockmap" latest.yml "$DESK/"
ls -la "$DESK" | grep -iE "studio.*exe|latest.yml"

echo "[6/6] 恢复根目录 dev 依赖(否则 vue-tsc/eslint 等消失)"
cd "$ROOT" && npm install --include=dev --no-audit --no-fund 2>&1 | tail -2
du -sh node_modules

END=$(date +%H:%M:%S)
echo "=== 全部完成 Ekko.Studio-$VER-x64.exe ($((SIZE/1024/1024))MB, $START -> $END) ==="