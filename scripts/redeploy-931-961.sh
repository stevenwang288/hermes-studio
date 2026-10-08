#!/bin/bash
# 重试部署: 对 931/961 (936 单独处理) 重新 git pull sync + build + restart
# 用法: bash redeploy.sh
set -e
deploy_one() {
  local V=$1 DIR=$2 SRV=$3
  echo ">>> 开始重部署 $V @ $(date +%H:%M:%S)"
  ssh pve-vm-$V "bash -s" <<EOF
set -e
export PATH="\$HOME/.nvm/versions/node/v24.20.0/bin:\$PATH"
cd $DIR || { echo "目录不存在: $DIR"; exit 1; }
git pull origin sync || { echo "GIT_PULL_FAILED"; exit 1; }
npm run build 2>&1 | tail -3
systemctl restart $SRV
sleep 3
echo "=== \$(hostname) version=\$(node -e 'console.log(require(\"./package.json\").version)') active=\$(systemctl is-active ${SRV%% *}) ==="
EOF
  echo ">>> $V 完成 @ $(date +%H:%M:%S)"
}
deploy_one 931 /opt/hermes-studio-ekko "hermes-web-ui hermes-gateway"
deploy_one 961 /opt/hermes-studio "hermes-studio hermes-gateway"
