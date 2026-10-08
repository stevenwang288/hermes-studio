#!/bin/bash
# 轮询 GitHub Actions run 直到完成 (用于云编译 exe 下载流程)
RUN_ID="36972683068"
TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | sed -n 's/^password=//p')
for i in $(seq 1 60); do
  STATUS=$(curl --noproxy '*' -sL -H "Authorization: Bearer ${TOKEN}" "https://api.github.com/repos/stevenwang288/hermes-studio/actions/runs/${RUN_ID}" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','?'), d.get('conclusion',''))" 2>/dev/null)
  echo "[$(date +%H:%M:%S)] attempt $i: $STATUS"
  STATE=$(echo $STATUS | awk '{print $1}')
  if [ "$STATE" = "completed" ]; then
    echo "BUILD_DONE conclusion=$(echo $STATUS | awk '{print $2}')"
    exit 0
  fi
  sleep 60
done
echo "TIMEOUT_AFTER_60MIN"
exit 1
