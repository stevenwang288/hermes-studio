#!/bin/bash
# 单台 PVE 部署（真实退出码版，不用 | tail 吞退出码）
# 用法: bash scripts/deploy-one-vm.sh <931|935|936|961>
set -u
V=$1
ssh "pve-vm-$V" "bash -s" <<EOF
set -u
LOG=/tmp/deploy_$V.log
: > \$LOG
exec >> \$LOG 2>&1

case $V in
  936) export PATH="/home/ubuntu/.nvm/versions/node/v24.20.0/bin:\$PATH"; DIR=/opt/hermes-studio-fork; SRV="ekko-studio";;
  931) export PATH="\$HOME/.nvm/versions/node/v24.20.0/bin:\$PATH"; DIR=/opt/hermes-studio-ekko; SRV="ekko-studio";;
  935) export PATH="\$HOME/.nvm/versions/node/v24.20.0/bin:\$PATH"; DIR=/opt/hermes-studio; SRV="ekko-studio";;
  961) export PATH="\$HOME/.nvm/versions/node/v24.20.0/bin:\$PATH"; DIR=/opt/hermes-studio; SRV="ekko-studio";;
esac
# 铁律: 唯一服务名 ekko-studio。旧名 hermes-studio/hermes-web-ui/hermes-gateway 已弃用,
# 其 unit 已移至 /root/systemd-legacy-backup/。restart 旧名会抢 8648 造成崩溃循环。

echo "########## VM $V START \$(date '+%F %T') ##########"
cd \$DIR || { echo "FATAL: no dir \$DIR"; exit 1; }
echo "node=\$(node --version)  dir=\$DIR"
df -h /opt | tail -1

echo "--- git sync ---"
git checkout -- package-lock.json 2>/dev/null || true
WANT=""
for i in 1 2 3 4 5 6; do
  WANT=\$(git ls-remote origin sync 2>/dev/null | awk '{print \$1}')
  [ -n "\$WANT" ] && break
  echo "ls-remote 尝试 \$i 失败(PVE→GitHub 抖动), 15s 后重试"; sleep 15
done
[ -z "\$WANT" ] && { echo "FATAL: 取不到远端 sync"; exit 2; }
OK=0
for i in 1 2 3 4 5 6; do
  git fetch origin sync >/dev/null 2>&1
  HAVE=\$(git rev-parse FETCH_HEAD 2>/dev/null)
  if [ "\$HAVE" = "\$WANT" ]; then OK=1; break; fi
  echo "fetch 尝试 \$i 未拿到目标 commit(实际=\$HAVE), 15s 后重试"; sleep 15
done
[ \$OK -ne 1 ] && { echo "FATAL: git fetch 未取得 \$WANT"; exit 2; }
git reset --hard "\$WANT" || { echo "FATAL: reset 失败"; exit 2; }
echo "HEAD=\$(git rev-parse --short HEAD)  期望=\$(echo \$WANT | cut -c1-8)"

echo "--- npm install ---"
npm install --include=dev --no-audit --no-fund
rc=\$?; echo "npm_install_exit=\$rc"
[ \$rc -ne 0 ] && { echo "FATAL: npm install 失败"; exit 3; }

echo "--- build ---"
npm run build
rc=\$?; echo "build_exit=\$rc"
[ \$rc -ne 0 ] && { echo "FATAL: build 失败"; exit 4; }
echo "dist_mtime=\$(stat -c %y dist/server/index.js)"

chown -R ubuntu:ubuntu dist packages 2>/dev/null || true

echo "--- restart ---"
for legacy in hermes-studio hermes-web-ui hermes-gateway; do
  systemctl stop \$legacy 2>/dev/null && echo "WARN: 停掉了遗留服务 \$legacy" || true
done
systemctl restart \$SRV
sleep 8
for s in \$SRV; do echo "svc \$s = \$(systemctl is-active \$s)"; done
LISTENERS=\$(ss -lnt | grep -c ':8648' || true)
PROCS=\$(ps -eo cmd | grep -c '[d]ist/server/index.js' || true)
echo "listeners_8648=\$LISTENERS (must=1)"
echo "procs=\$PROCS (must=1)"
if [ "\$LISTENERS" != "1" ] || [ "\$PROCS" != "1" ]; then
  echo "FATAL: 重复服务打架 (8648 监听/进程数不为 1)"; exit 5
fi

echo "--- verify ---"
echo "version=\$(node -e "console.log(require('./package.json').version)")"
echo "http=\$(curl -s -o /dev/null -w '%{http_code}' -m 8 http://127.0.0.1:8648)"
echo "restarts=\$(systemctl show \$SRV -p NRestarts --value)"
echo "########## VM $V DONE \$(date '+%F %T') ##########"
EOF
echo "=========== VM $V 关键结果 ==========="
timeout 40 ssh "pve-vm-$V" "grep -E 'HEAD=|node=|ls-remote|fetch 尝试|npm_install_exit|build_exit|dist_mtime|svc |version=|http=|DONE|FATAL' /tmp/deploy_$V.log" 2>&1
