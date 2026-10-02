#!/bin/bash
# PVE 部署 hermes-studio sync 分支到指定 VM。用法: bash deploy-pve.sh <931|935|936|961>
# 流程: 备份 -> git pull origin sync -> npm install -> build -> 重启服务 -> 验证版本
V=$1
SSH="pve-vm-$V"
case $V in
  931) DIR=/opt/hermes-studio-ekko; SRV="hermes-web-ui hermes-gateway"; EXTRA="";;
  935) DIR=/opt/hermes-studio;     SRV="hermes-studio hermes-gateway"; EXTRA="";;
  936) DIR=/opt/hermes-studio-fork; SRV="hermes-web-ui"; EXTRA="chown -R ubuntu:ubuntu $DIR/dist $DIR/packages 2>/dev/null || true";;
  961) DIR=/opt/hermes-studio;     SRV="hermes-studio hermes-gateway"; EXTRA="";;
  *) echo "bad vm: $V"; exit 1;;
esac
echo ">>> 开始部署 $V ($DIR, 服务: $SRV) @ $(date +%H:%M:%S)"
ssh $SSH "bash -s" <<EOF
set -e
export PATH="\$HOME/.nvm/versions/node/v24.20.0/bin:\$PATH"
cd $DIR || { echo "目录不存在: $DIR"; exit 1; }
node --version
git checkout -- package-lock.json 2>/dev/null || true
echo "--- 磁盘 ---"
df -h /opt | tail -1
echo "--- 备份 ---"
cp -r $DIR ${DIR}.bak.\$(date +%Y%m%d%H%M%S)
echo "--- git pull ---"
git pull origin sync > /tmp/pull_deploy.log 2>&1 || { echo "GIT_PULL_FAILED: $(tail -1 /tmp/pull_deploy.log)"; echo "提示: PVE 偶发 TLS/HTTP2 抖动, 重跑脚本即可; 936 需用 ubuntu nvm 路径"; exit 1; }
tail -3 /tmp/pull_deploy.log
echo "--- npm install ---"
npm install --include=dev --no-audit --no-fund 2>&1 | tail -3
echo "--- build ---"
npm run build 2>&1 | tail -5
echo "--- 额外处理 ---"
$EXTRA
echo "--- restart ---"
systemctl restart $SRV
sleep 5
systemctl is-active $SRV
echo "--- 版本验证 ---"
node -e "console.log('version='+require('./package.json').version)"
echo ">>> $V 部署流程完成 @ \$(date +%H:%M:%S)"
EOF
