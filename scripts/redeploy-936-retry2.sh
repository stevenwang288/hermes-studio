#!/bin/bash
# 936 重部署(修正版): git pull 真实退出码判断, 最多重试 5 次
set -e
echo ">>> 936 重部署 @ $(date +%H:%M:%S)"
ssh pve-vm-936 "bash -s" <<'EOF'
set -e
export PATH="/home/ubuntu/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /opt/hermes-studio-fork
PULLED=0
for i in 1 2 3 4 5; do
  echo "--- git pull 尝试 $i @ $(date +%H:%M:%S) ---"
  if git pull origin sync > /tmp/pull936.log 2>&1; then
    PULLED=1
    tail -3 /tmp/pull936.log
    break
  else
    echo "失败: $(tail -1 /tmp/pull936.log)"
    sleep 15
  fi
done
if [ "$PULLED" != "1" ]; then echo "GIT_PULL_FAILED_ALL"; exit 1; fi
npm run build 2>&1 | tail -3
chown -R ubuntu:ubuntu dist packages
systemctl restart hermes-web-ui
sleep 4
ACTIVE=$(systemctl is-active hermes-web-ui)
VERSION=$(node -e "console.log(require('./package.json').version)")
echo "=== $(hostname) version=$VERSION active=$ACTIVE ==="
EOF
echo ">>> 936 完成 @ $(date +%H:%M:%S)"