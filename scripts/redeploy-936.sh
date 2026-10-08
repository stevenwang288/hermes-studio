#!/bin/bash
# 936 重部署: 用 ubuntu 用户的 nvm v24.20.0 (对齐 systemd), git pull sync + build + chown + restart
set -e
echo ">>> 936 重部署 @ $(date +%H:%M:%S)"
ssh pve-vm-936 "bash -s" <<'EOF'
set -e
export PATH="/home/ubuntu/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /opt/hermes-studio-fork
git pull origin sync || { echo "GIT_PULL_FAILED"; exit 1; }
npm run build 2>&1 | tail -3
chown -R ubuntu:ubuntu dist packages
systemctl restart hermes-web-ui
sleep 3
echo "=== $(hostname) version=$(node -e 'console.log(require("./package.json").version)') active=$(systemctl is-active hermes-web-ui) ==="
EOF
echo ">>> 936 完成 @ $(date +%H:%M:%S)"