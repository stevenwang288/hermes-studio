#!/bin/bash
# PVE 部署 hermes-studio sync 分支到指定 VM。用法: bash deploy-pve.sh <931|935|936|961>
# 流程: 备份 -> git pull origin sync -> npm install -> build -> 重启服务 -> 验证版本
#
# ⚠️ 铁律(2026-11-07 事故教训): 唯一服务名是 ekko-studio。
#    历史上的 hermes-studio / hermes-web-ui / hermes-gateway 单元已移到
#    /root/systemd-legacy-backup/，绝不能再 restart 它们——否则会和 ekko-studio
#    抢 8648 端口，造成 EADDRINUSE 崩溃循环(表现为对话报 Agent bridge socket closed)。
V=$1
SSH="pve-vm-$V"
SRV="ekko-studio"
case $V in
  931) DIR=/opt/hermes-studio-ekko; EXTRA="";;
  935) DIR=/opt/hermes-studio;     EXTRA="";;
  936) DIR=/opt/hermes-studio-fork; EXTRA="chown -R ubuntu:ubuntu $DIR/dist $DIR/packages 2>/dev/null || true"; NOBAK=1;;
  961) DIR=/opt/hermes-studio;     EXTRA="";;
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
if [ -n "$NOBAK" ]; then
  echo "936 磁盘紧, 跳过整目录备份(git sync 可回退)"
else
  cp -r $DIR ${DIR}.bak.\$(date +%Y%m%d%H%M%S)
fi
echo "--- git pull ---"
git pull origin sync > /tmp/pull_deploy.log 2>&1 || { echo "GIT_PULL_FAILED: \$(tail -1 /tmp/pull_deploy.log)"; echo "提示: PVE 偶发 TLS/HTTP2 抖动, 重跑脚本即可; 936 需用 ubuntu nvm 路径"; exit 1; }
tail -3 /tmp/pull_deploy.log
echo "--- npm install ---"
npm install --include=dev --no-audit --no-fund 2>&1 | tail -3
echo "--- build ---"
npm run build 2>&1 | tail -5
echo "--- 额外处理 ---"
$EXTRA
echo "--- 兜底: 停掉任何遗留服务(正常应为 0 个) ---"
for legacy in hermes-studio hermes-web-ui hermes-gateway; do
  systemctl stop \$legacy 2>/dev/null && echo "  ⚠️ 停掉了遗留服务 \$legacy" || true
done
echo "--- restart $SRV ---"
systemctl restart $SRV
sleep 8
echo -n "active = "; systemctl is-active $SRV
LISTENERS=\$(ss -lnt | grep -c ':8648' || true)
PROCS=\$(ps -eo cmd | grep -c '[d]ist/server/index.js' || true)
echo "8648 监听数 = \$LISTENERS (必须=1)"
echo "进程数     = \$PROCS (必须=1)"
if [ "\$LISTENERS" != "1" ] || [ "\$PROCS" != "1" ]; then
  echo "❌ 端口/进程异常，疑似重复服务打架！请检查: systemctl list-units | grep -iE 'hermes|ekko'"
  exit 1
fi
echo "--- 版本验证 ---"
node -e "console.log('version='+require('./package.json').version)"
echo "http=\$(curl -s -o /dev/null -w '%{http_code}' -m 8 http://127.0.0.1:8648)"
echo "restarts=\$(systemctl show $SRV -p NRestarts --value)"
echo ">>> $V 部署流程完成 @ \$(date +%H:%M:%S)"
EOF
