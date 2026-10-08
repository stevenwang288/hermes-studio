#!/bin/bash
# 936 重部署(带网络重试): pull 最多重试 6 次, 成功后才 build + chown + restart
set -e
echo ">>> 936 重部署 @ $(date +%H:%M:%S)"
ssh pve-vm-936 "bash -s" <<'EOF'
set -e
export PATH="/home/ubuntu/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /opt/hermes-studio-fork
PULLED=0
for i in 1 2 3 4 5 6; do
  echo "--- git pull 尝试 $i @ $(date +%H:%M:%S) ---"
  if git pull origin sync 2>&1 | tail -4; then
    PULLED=1
    break
  fi
  echo "pull 失败, 等 20s 重试"
  sleep 20
done
if [ "$PULLED" != "1" ]; then echo "GIT_PULL_FAILED_ALL"; exit 1; fi
npm run build 2>&1 | tail -3
chown -R ubuntu:ubuntu dist packages
systemctl restart hermes-web-ui
sleep 3
ACTIVE=$(systemctl is-active hermes-web-ui)
VERSION=$(node -e "console.log(require('./package.json').version)")
echo "=== $(hostname) version=$VERSION active=$ACTIVE ==="
EOF
echo ">>> 936 完成 @ $(date +%H:%M:%S)"