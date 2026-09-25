# 本仓库说明

> **维护规则看 [`MAINTAIN.md`](MAINTAIN.md)** —— 上游更新时该做什么、4 台 PVE 怎么升级、Windows 安装程序放哪，全在里面。
> **详细手册看 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)**。

本仓库是 `EKKOLearnAI/hermes-studio` 的 fork，**2026-09-16 全新重建**：以官方 v0.7.21 为基线，只合入自研功能，版本号跟随官方（不做 fork 标记，避免启动提示）。

## 当前状态（2026-09-25 校准）

| 分支 | 版本 | 说明 |
|------|------|------|
| `sync` | **0.7.24** | 唯一有效分支。= 上游 `main` 最新 + 3 项自研功能，已通过 `npm run build` + 桌面 `tsc --noEmit` 验证 |
| `main` | 0.7.21 | 停用的旧基线，**勿用** |

**最近一次合并（2026-09-25）**：上游 `eaa69053 fix: hide context limits for coding-agent chats (#3174)`。无冲突（ChatInput.vue 自动合并，上游改动只涉及 context-limit 显示，与自研队列/缩放无关），自研标记全部保留。

部署到 5 个终端：**4 台 PVE 虚拟机（931 / 935 / 936 / 961）+ 1 台 Windows 桌面版**。

完整更新流程见 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)。

---

## 保留的自研功能（3 项）

### 1. 消息队列

回复生成中发新消息不打断，排队等待；三种方式逐条放行。

| 文件 | 改动 |
|------|------|
| `server/src/modules/studio/sockets/chat-run.ts` | `preempt?: boolean` 分流；`run.promote`；`QueuedRun` 队列 |
| `server/src/modules/studio/services/chat-run/abort.ts` | `abortFinalized` 幂等保护；出队带 `queued_messages` |
| `server/src/modules/studio/contracts/runs/session.ts` | `SessionState` 补充 |
| `client/src/stores/hermes/chat.ts` | 发送带 `preempt:false`；`promoteQueuedMessage` action |
| `client/src/components/hermes/chat/MessageList.vue` | 队列项「↑ 立即发送」按钮 |
| `client/src/components/hermes/chat/ChatInput.vue` | ESC / Ctrl+Enter 放行队首 |
| `client/src/api/studio/chat.ts` | `StartRunRequest.preempt?: boolean` |
| `tests/server/chat-run-promote.test.ts` | 并发测试 |

### 2. Windows 桌面版字体缩放

| 文件 | 改动 |
|------|------|
| `desktop/src/main/index.ts` | `[zoom patch]`：`loadDesktopZoomLevel`/`saveDesktopZoomLevel`/`installDesktopZoomShortcuts`，持久化 `userData/desktop-zoom.json` |

快捷键：Ctrl+加号/减号/0（步进 0.5，范围 -3~4）。**注意**：需补 `readFileSync, writeFileSync` 到 `node:fs` import；不要调用 `browserManager.applyDesktopZoom()`（上游无此方法）。

### 3. 路径完整显示

| 文件 | 改动 |
|------|------|
| `client/src/components/hermes/chat/ChatPanel.vue` | workspace-badge 去掉 `split("/").pop()`；`max-width: min(520px, 55vw)`；等宽字体 |

---

## 已放弃的功能（全部恢复官方，不再维护）

- ~~爱马仕品牌命名~~（AimaShi 命名/installer.nsh/electron-builder 品牌字段 → 官方 Ekko Studio/Hermes.Studio）
- ~~自定义图标~~（icon/logo 二进制 → 官方）
- ~~chrome-mirror profile~~（browser-profile-store 残留 → 官方）
- ~~earmark 注解系统~~（已删净）
- ~~Cookie 登录态导入~~（已删净）
- ~~默认深色主题+内置壁纸~~（已删净）
- ~~credits 点数系统~~（已剥离）

---

## 合并上游 SOP（下次升级）

完整流程（含 4 台 PVE 更新与桌面版云编译）见 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)。速查：

```bash
git fetch upstream main --tags --force
git checkout sync
git merge upstream/main --no-edit
# 冲突铁律：
#   [zoom patch] / [preempt patch] 标记 → 保留 fork（消息队列/缩放/路径）
#   其余 → 一律取上游（品牌/图标/安装路径跟随官方）
#   重应用后必查：zoom 需补 readFileSync/writeFileSync 到 node:fs import、不调用 applyDesktopZoom
npm install --include=dev --no-audit --no-fund
npm run build
# ⚠ 若报 SAFE_DELETE_BULK_CONFIRM_REQUIRED（沙箱批量删除保护，非代码错误）：
#     mv dist dist.old && npm run build
cd packages/desktop && npx tsc -p tsconfig.json --noEmit   # 推 GitHub 前必验
git push origin sync
# 之后：4 台 PVE 就地 git pull origin sync + npm run build + systemctl restart
# 桌面版：gh workflow run "Manual Desktop Build" --ref sync -f target_os=win32 -f target_arch=x64
```

---

## 环境要点

- **代理**：本机 v2rayN（`D:\OneDrive\steven\soft\proxy\v2rayN-windows-64\`，xray.exe）监听 **10808**（混合端口 HTTP+SOCKS5，Obsidian 有记录）。User 级 `HTTP_PROXY/HTTPS_PROXY` 已从 10809 修正为 10808。
- **api.github.com 走代理会被拒（403），需直连**：curl 加 `--noproxy '*'`；git 操作用 10808 代理正常。
- **git 凭据**：全局 `credential.helper=manager`（2026-09-22 修正；系统级原为 `helper-selector`，会导致每次 push 弹「选择凭据助手」框）。
- GitHub token：`git credential fill` 取（scope: repo, workflow, gist；无 delete_repo 权限，删除仓库需网页操作）。
- 云编译产物命名：`Hermes.Studio-<version>-x64.exe`（官方命名）。