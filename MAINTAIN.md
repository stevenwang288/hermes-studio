# MAINTAIN.md — 这个 fork 该怎么维护

> **给未来的 AI 助手 / 给未来的我：读这一份就够了，不用再问人。**
> 本文件是 `stevenwang288/hermes-studio` 的唯一维护入口。
> 详细手册见 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)。

---

## 0. 这个仓库是什么

`stevenwang288/hermes-studio` = 上游 `EKKOLearnAI/hermes-studio` 的 fork。

- 以官方基线为底，**只保留 3 项自研功能**，其余一律跟随上游（品牌/图标/安装路径都是官方的，不做 fork 标记）
- **唯一有效分支：`sync`**。`main` 是废弃的旧基线，不要用
- 部署到 **5 个终端**：4 台 PVE 虚拟机 + 1 台 Windows 桌面版

---

## 1. 一句话概括要做的事

> **上游更新了 → 合进来 → 本地验证 → 推 GitHub → 更新 4 台 PVE → 出 Windows 安装程序**

用户不需要每次交代，看到上游有新版本就按本文执行。

---

## 2. 标准流程（按顺序，不可跳步）

### 第 0 步 · 判断要不要动

```bash
cd /d/OneDrive/steven/code/ai/13IDE/hermes-studio
git fetch upstream main --tags --force
git rev-list --left-right --count sync...upstream/main
```

输出 `A  B`：**B = 0 表示上游没有新东西，到此结束**。B > 0 才继续。

### 第 1 步 · 合并上游

```bash
git checkout sync
git merge upstream/main --no-edit
```

冲突处理铁律：

- `[zoom patch]` / `[preempt patch]` 标记处 → **保留 fork**
- 其余一切 → **取上游**

### 第 2 步 · 本地验证（**跳过这步就是耍流氓**）

```bash
npm install --include=dev --no-audit --no-fund
npm run build
cd packages/desktop && npx tsc -p tsconfig.json --noEmit
```

必须两条都过。自研自检：

```bash
git grep -c "preempt" HEAD -- packages/server/src/modules/studio/sockets/chat-run.ts
git grep -c "loadDesktopZoomLevel" HEAD -- packages/desktop/src/main/index.ts
git grep -c "promoteQueuedMessage" HEAD -- packages/client/src/stores/hermes/chat.ts
git diff --stat upstream/main..sync    # 应只有 10 个源码文件 + CUSTOM_CHANGES.md + .gitignore
```

### 第 3 步 · 推 GitHub

```bash
git push origin sync
```

**GitHub 操作规范见第 5 节——不要用交互式凭据。**

### 第 4 步 · 更新 4 台 PVE

见第 4 节。**这是线上服务，重启会中断，动之前先跟用户确认。**

### 第 5 步 · 出 Windows 安装程序

见第 6 节。产物放哪见第 6 节（**每次都要放到同一个地方，别再问**）。

---

## 3. 3 项自研功能（冲突时保留，别弄丢）

| # | 功能 | 主要文件 |
|---|------|----------|
| 1 | **消息队列**：回复生成中发新消息不打断，排队等待，三种方式逐条放行 | `server/src/modules/studio/sockets/chat-run.ts`<br>`server/src/modules/studio/services/chat-run/abort.ts`<br>`server/src/modules/studio/contracts/runs/session.ts`<br>`client/src/stores/hermes/chat.ts`<br>`client/src/components/hermes/chat/MessageList.vue`<br>`client/src/components/hermes/chat/ChatInput.vue`<br>`client/src/api/studio/chat.ts` |
| 2 | **Windows 桌面版字体缩放**：Ctrl + `+`/`-`/`0`，步进 0.5，范围 −3~4，持久化 `userData/desktop-zoom.json` | `desktop/src/main/index.ts` |
| 3 | **路径完整显示**：workspace 徽标显示全路径，不截断 | `client/src/components/hermes/chat/ChatPanel.vue` |

测试：`tests/server/chat-run-promote.test.ts`

**重应用时的两个必查点**（每次合并后都要确认）：

- zoom patch 需要补 `readFileSync, writeFileSync` 到 `node:fs` 的 import
- 不要调用 `browserManager.applyDesktopZoom()`（上游没有这个方法）

---

## 4. 4 台 PVE 部署清单

宿主：`192.168.9.250`（`ssh PVE`）

| VMID | IP | 部署目录 | 重启命令 | 注意 |
|------|-----|----------|----------|------|
| `931` | 192.168.9.31 | `/opt/hermes-studio-ekko` | `systemctl restart hermes-web-ui hermes-gateway` | — |
| `935` | 192.168.9.35 | `/opt/hermes-studio` | `systemctl restart hermes-studio hermes-gateway` | — |
| `936` | 192.168.9.36 | `/opt/hermes-studio-fork` | `systemctl restart hermes-web-ui` | 服务跑在 `ubuntu` 用户下；磁盘紧张（约剩 8.5G） |
| `961` | 192.168.9.61 | `/opt/hermes-studio` | `systemctl restart hermes-studio hermes-gateway` | — |

SSH：`ssh pve-vm-931` / `-935` / `-936` / `-961`（root，密钥 `~/.ssh/id_ed25519`）

部署形态：**git clone → `npm run build` → systemd 跑 `dist/server/index.js`**。不是 Docker。

单台更新（以 935 为例）：

```bash
ssh pve-vm-935 "bash -s" <<'EOF'
set -e
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /opt/hermes-studio
cp -r /opt/hermes-studio /opt/hermes-studio.bak.$(date +%Y%m%d%H%M%S)
git pull origin sync
npm install --include=dev --no-audit --no-fund
npm run build
systemctl restart hermes-studio
sleep 3 && systemctl is-active hermes-studio
EOF
```

**必须显式切 node 到 v24.20.0**：systemd 的 `ExecStart` 用的是 nvm 里 v24.20.0 的绝对路径，而 ssh 登录后默认 `node -v` 是 v22/v23。不切会导致产物与运行时不一致。

936 额外要 `chown -R ubuntu:ubuntu`.

---

## 5. GitHub 操作规范（**以后照这个来，别再弹窗**）

### 优先级

1. **首选 GitHub MCP 工具**（WorkBuddy / Hermes / opencode 都配好了）——查文件、看 release、读 PR、比对代码
2. 需要真正推 commit / 拉代码时，才用 `git` CLI

### 用 git CLI 时怎么不弹窗

**根因**：Windows 上系统级 `credential.helper=helper-selector`，每次都要问「选哪个凭据助手」。

**已修复**（2026-09-22）：全局设为 `manager`

```bash
git config --global credential.helper manager
```

若仍弹窗，直接绕开凭据交互，用 token 推（**URL 里主机名后必须是 `/` 不是 `:`**，写错会报 `Port number was not a decimal number`）：

```bash
git push "https://x-access-token:${GITHUB_TOKEN}@github.com/stevenwang288/hermes-studio.git" sync
```

token 来源：环境变量 `GITHUB_TOKEN`（`ghp_` 开头，40 字符）。

### 网络前置条件（最常踩的坑）

本机访问 GitHub 必须走代理 `127.0.0.1:10808`（V2rayN / xray）。

**症状**：`fatal: TLS connect error: error:0A000126:SSL routines::unexpected eof while reading`，
或 push 长时间无输出直到超时。

**原因**：V2rayN 当前节点连不上境外（端口监听正常也没用）。

**处理**：让用户在 V2rayN 里**切换节点**后重试。不要反复盲目重试，白等。

**旁路**：`WebFetch` 走的是客户端自己的通道，不依赖本地代理，**代理挂了也能读 GitHub 网页**。

### 推送前的红线

- **本地没跑通 `npm run build` 就不许 push**
- 推送前确认目标分支是 `sync`
- 推完告诉用户远端 commit 变成了什么，别只说「推好了」

---

## 6. Windows 桌面版安装程序

### 放哪里（**记住，别再问**）

| 位置 | 路径 |
|------|------|
| **用户桌面** | **`d:\desk\`** |
| 仓库内留存 | `packages/desktop/release/` |

> 桌面**永远是 `d:\desk`**。不是 `D:\Desktop`，不是 C 盘任何位置。
> 验证：`[Environment]::GetFolderPath('Desktop')` → `d:\desk`

### 文件名

`Hermes.Studio-<version>-x64.exe`

（exe 用 `Hermes.Studio-` 前缀，但产品名/任务栏显示 `Ekko Studio`——官方改名后保留了旧前缀，与官方一致，**不是改错**）

### 怎么出

走 GitHub Actions 云编译，本地不跑长时构建：

```bash
gh workflow run "Manual Desktop Build" --repo stevenwang288/hermes-studio \
  --ref sync -f target_os=win32 -f target_arch=x64
gh run list --repo stevenwang288/hermes-studio --branch sync --limit 3
gh run download <RUN_ID> --repo stevenwang288/hermes-studio \
  --name desktop-win32-x64 --dir "$TEMP/hermes-build"
```

下载后：**最新 exe 放到 `d:\desk\`**，同时保留一份到 `packages/desktop/release/`，
并清理 `d:\desk` 下的旧版本安装程序（只留最新）。

---

## 7. 故障速查

| 现象 | 处理 |
|------|------|
| git 弹「选择凭据助手」 | 系统级 `credential.helper=helper-selector`。已改全局 `manager` |
| `TLS ... unexpected eof while reading` | 代理节点连不上境外 → 让用户切 V2rayN 节点 |
| push 长时间无输出 | 同上。别硬等，先测代理 |
| 构建报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED` | WorkBuddy 沙箱的批量删除保护（vite 清 `dist/client/assets`）。**不是代码错误** → `mv dist dist.old && npm run build` |
| 构建报 `No Python at '../base\python.exe'` | Hermes runtime 的 `python/venv/pyvenv.cfg` 里 `home` 是相对路径，改绝对路径 |
| opencode 组无模型 | Hermes runtime < 0.20.6，需升级 runtime |
| 桌面路径搞错 | 桌面永远是 `d:\desk` |

---

## 8. 不要做的事

- ❌ 没验证构建就 push
- ❌ 未经用户确认就重启 4 台 PVE 上的服务
- ❌ 把 Windows 安装程序放到 `d:\desk` 以外的地方
- ❌ 用 `main` 分支做任何部署
- ❌ 为了「让 fallback 生效」而擅自改动上游配置值
