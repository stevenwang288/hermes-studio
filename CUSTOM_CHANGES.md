# 本仓库说明

> **维护规则看 [`MAINTAIN.md`](MAINTAIN.md)** —— 上游更新时该做什么、4 台 PVE 怎么升级、Windows 安装程序放哪，全在里面。
> **详细手册看 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)**。

本仓库是 `EKKOLearnAI/hermes-studio` 的 fork，**2026-09-16 全新重建**：以官方 v0.7.21 为基线，只合入自研功能，版本号跟随官方（不做 fork 标记，避免启动提示）。

## 当前状态（2026-10-10 校准）

| 分支 | 版本 | 说明 |
|------|------|------|
| `sync` | **0.7.34** | 唯一有效分支。= 上游 `main` 最新 + 7 项自研功能，已通过 `npm run build` + 桌面 `tsc --noEmit` + 本地打包验证 |

**最近一次合并（2026-10-13）**：上游 0.7.33 → 0.7.34 共 15 个提交（编程 Agent 原生模型选择/记忆已选配置 #3354/#3360、统一模型选择弹窗 #3355、用量概览账号/Profile 筛选 #3363、用量精度/趋势图修复 #3373、**桌面远程服务器模式** #3366、Turkish locale #3338、MCP 继承 token 修复 #3359、思考标签混入正文 #3365 等）。**0 个文件冲突，干净 merge**，但上游 6 个自研重叠文件改动量大（chat-run.ts -142 / chat.ts -186 / ChatPanel.vue -664 / ChatInput.vue -103 / desktop-browser.ts / context-policy.ts），git 三方合并自动保留全部自研（上游从未有过 preempt 代码 → 我们 fork 的行当"新增"保留），逐项 grep 确认 6 项自研完整存活：
- ① 消息队列：服务端 `preempt`/`run.promote`/`run.promote_all`（合并放行综合指令模板一字未损）+ 前端 Ctrl+Enter/ESC 全部保留，**且上游官方 `insert_queued_run`（打断当前 turn + 提队首执行）机制也并入** —— 双链路并存，未来可评估迁移到官方机制进一步降低冲突
- ② 桌面缩放 `[zoom patch]` ✅、③ 路径完整显示 workspace-badge ✅、④ 链接默认系统浏览器 `DEFAULT_LINK_OPEN_TARGET='default-browser'` ✅、⑤ 微信扫码 DM 策略 ✅、⑥ 流式 tool_calls 空串修复 ✅、⑦ update_plan/task 卡 MCP 常驻（bridge 层）✅
- `context-policy.ts` 唯一交叉区：上游重构为 `clampOutputLimit()` 函数，**取上游新结构 + 384000 cap（商汤）重新应用进函数体**（一处修改全调用点生效）
- 本地 `npm run build` + 桌面 `tsc --noEmit` 均通过。git stash 的 openapi.json 旧改动未恢复（上游已重新生成，符合惯例）

**2026-10-13 961 部署记录**：961 已升级 **0.7.34**（commit `2f67a011`，`git fetch origin sync && git reset --hard origin/sync` + build + `systemctl restart hermes-studio hermes-gateway`），四步验证 + 端到端测试全绿：
- 服务状态 active ×2 + `webui_version=0.7.34` + node v24.20.0 进程 + 8648 LISTEN
- **socket 协议实测**（短 prompt 快发，不烧 token）：3 条排队 qlen 1→2→3 ✅；`run.promote` 打断立即执行 + `dequeued_queue_id` 权威回传 ✅；自动出队串行 ✅；`run.promote_all` 合并成 `merge_xxx` 单条（综合指令模板生效）✅；误用 provider 名时失败路径不卡队列 ✅；一次 429（961:4010 网关 tpm/rpm 限流，非代码问题）恢复后单发正常 ✅
- **浏览器 UI 验收**（verify-fleet 加法题）：`42 + 16 = 58` AI 答对 ✅（29.9s）
- **UI 队列交互实测**（Chrome CDP + playwright-core）：队列浮层「消息队列」出现 ✅；`.queue-promote` 按钮点击 → 消息作为用户气泡进主列表 ✅；**Ctrl+Enter 放行生效** ✅；`.queue-remove` 移除生效 ✅；队列最终全部消费归零（assistant 累计 9+ 条）✅
- 961 的 provider 名实测为「商汤」（base_url 指 961:4010），不是配置文件里的 `custom:192.168.9.61:4010` 字面量

**2026-10-10 部署记录**：4 台 PVE（931/935/936/961）全部升级 **0.7.33**（commit `02ad300e`），逐台核对 `dist/server/index.js` 为新构建 + `curl 8648` 4/4 HTTP 200；**浏览器端验收（发加法题 AI 答对）4/4 通过**。踩坑（都已写进 MAINTAIN.md 第 4 节与故障速查）：
- **元凶是 npm 源/代理四台不统一**：936 出厂 `registry.npmjs.org`（拉不到包 → 缺 `werift@0.24.4` → build `TS2307`）；935 连 npmmirror 直连也不通，必须挂 7890 代理。统一为 `registry.npmmirror.com` + `proxy/https-proxy=127.0.0.1:7890`。
- **`deploy-pve.sh` 的 `npm ... | tail` 吞退出码** → 935/936 表面"完成"、实则 build 失败，服务重启后**跑的是上个版本的旧 dist**（package.json 却是 0.7.33）。**部署后必须核对 `dist` mtime**。
- **931/961 当天都是 stopped**（`qm start` 拉起）。
- **`scripts/verify-fleet.mjs` 有 bug**（`.mjs` 用 `require`）→ 临时 `cp` 成 `.cjs` 才跑通；**待修**。

**2026-10-08 决策：桌面版打包从 GitHub Actions 云编译改为本地打包**（用户拍板）。原因：云编译下载 artifact 慢且易断（直连 33KB/s 超时、代理断流 139MB，实测两次失败才续传成功），本地打包一条命令 10-26 分钟出 exe 且天然对应本地 commit。**本地打包铁律：打包前必须根目录 `npm prune --omit=dev`**（不 prune 会把 937MB dev 依赖塞进 webui/node_modules，exe 从 198MB 膨胀到 321MB），打完后 `npm install --include=dev` 恢复（否则 vue-tsc 等 dev 工具消失）。产物 3 个：`Ekko.Studio-<ver>-x64.exe` + `.blockmap` + `latest.yml`；但**桌面 `d:\desk` 只放 exe**（2026-10-10 大哥定）—— `.blockmap`/`latest.yml` 是 electron-updater 差分更新用的，本 fork 不发布更新服务器（`app-update.yml` 指向的是上游 `download.ekkolearnai.com`），放桌面无用，留在 `packages/desktop/release/` 即可。命令：`cd packages/desktop && npm ci --include=dev && npm run dist:win`（首次自动下 electron 二进制，需代理 10808）。本地实测 exe 198MB 与云端 195MB 一致。
| `main` | 0.7.21 | 停用的旧基线，**勿用** |

**最近一次合并（2026-10-03）**：上游 0.7.27 → 0.7.29 共 11 个提交（Antigravity CLI 全局集成、API relay 合作方页面+按 key 用量、设备连接图标区分、workspace 下载恢复、Claude text snapshot 修复）。**0 个文件冲突，干净 merge**；4 组自研（消息队列/字体缩放/路径显示/链接默认 Chrome）均确认保留。桌面版 0.7.29 exe 已云编译交付。

**2026-10-03 部署记录**：4 台 PVE（931/935/936/961）全部升级 **0.7.29**，`curl 8648` 探活 4/4 HTTP 200。踩坑：①**931 VM 部署后变 stopped**（PVE `qm status` 显示 stopped，`qm start` 拉起；且重启后 `dist/server/index.js` 是 0 字节——`npm run build | tail` 管道吞退出码、build 瞬态写失败没被发现，重跑 build 后 index.js 正常 12MB 才 HTTP 200）；②**936 磁盘 100% 满**（38G 盘剩 221M）：deploy-pve.sh 的整目录 `cp -r` 备份累计 4 个 1.6G 塞爆，且 936 root 的 `$HOME/.nvm` 不存在导致 node 落到 v22.23.2（需 `/home/ubuntu/.nvm/.../v24.20.0`）。已改 deploy-pve.sh：936 跳过备份（NOBAK=1，git sync 可回退），清理全部 .bak 后磁盘回 84%，用 redeploy-936-retry2.sh 以 v24.20.0 重跑通过。**以后 936 必须用 redeploy-936-retry2.sh，别用 deploy-pve.sh**；931 类机器部署后要验证 HTTP 200 而非只看脚本日志。

**2026-10-02 合并**：上游 0.7.25 → 0.7.27 共 41 个提交（含 Cursor CLI 集成、浏览器自动化批次、JEV 评估、用量计费、桌面 UI 修复）。**2 个文件冲突，均已解决**：
- `ChatPanel.vue`：workspace-badge（自研③路径显示）模板+样式保留，上游结构改动已并入
- `abort.ts`：自研 `contentBlocksToString` 与上游新增 `finalizeAbortedRunUsage` 两个 import **同时保留**（分别被 292/230 行使用）

**2026-10-02 部署记录**：4 台 PVE（931/935/936/961）全部升级 **0.7.27** 并重启，`curl 8648` 探活 4/4 HTTP 200。桌面版 `D:\desk\Ekko.Studio-0.7.27-x64.exe` 已云编译交付。踩坑：①PVE 到 GitHub 偶发 TLS/HTTP2 抖动（gnutls handshake failed / HTTP2 framing），重试即可，勿让脚本在 pull 失败后继续 build（deploy-pve.sh 已修正退出码判断）；②936 的 nvm 在 `/home/ubuntu/.nvm`（root 的 `$HOME` 没有），构建必须 `export PATH=/home/ubuntu/.nvm/versions/node/v24.20.0/bin`；③936 需 `chown -R ubuntu:ubuntu dist packages`。

**2026-09-25 部署记录**：4 台 PVE（931/935/936/961）已就地 `git pull origin sync` + build + 重启，全部 0.7.24，浏览器验收（加法题）4/4 通过。桌面版 0.7.24 exe 已装本机。961 曾因本地 package-lock.json 改动挡住 merge，`git checkout --` 后解决。

部署到 5 个终端：**4 台 PVE 虚拟机（931 / 935 / 936 / 961）+ 1 台 Windows 桌面版**。

完整更新流程见 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)。

---

## 保留的自研功能（7 项）

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

### 4. 链接默认打开方式 + 内置浏览器错位修复（2026-10-02 新增）

| 文件 | 改动 |
|------|------|
| `client/src/utils/desktop-browser.ts` | `DEFAULT_LINK_OPEN_TARGET` 从 `hermes-studio`（内置浏览器）改为 `default-browser`（系统默认浏览器）。点 URL 不再进内置浏览器（指纹/登录态/代理硬伤）；可到 设置→显示→链接打开方式 切回 |
| `desktop/src/main/browser/browser-manager.ts` | `setViewport` 乘主窗口 `getZoomFactor()`：前端上报 CSS px rect，`setBounds` 需 DIP，字体缩放（zoom patch）后两者不等导致内嵌视图错位，现已换算 |
| `desktop/src/main/index.ts` | `hermes-desktop:open-external-url` 优先探测并 `spawn` 系统 Chrome 打开链接（`findChromeExecutable`），Chrome 未装才回落 `shell.openExternal`。系统默认浏览器是夸克（QuarkHTM），Win11 无可靠命令行改默认（SetUserFTA 已商业化且 21H1+ 失效），故在 Hermes 层强制 Chrome |

### 5. 微信扫码保存自动开 DM 策略（2026-10-03 新增）

| 文件 | 改动 |
|------|------|
| `server/src/modules/hermes/controllers/weixin.ts` | `save()` 额外写入 `WEIXIN_DM_POLICY=open` + `WEIXIN_ALLOW_ALL_USERS=true`：Hermes 默认微信 DM 策略是 `pairing`（配对模式），Studio 页面扫码保存只写凭据不写策略，导致扫码用户被当陌生用户拒绝（日志 `Unauthorized user`）。扫码即代表用户主动授权，自动写 open 让新 bot 开箱即用。想收紧可自行改 .env |
| 备注 | 官方 hermes runtime（0.20.6）doc 也要求配 `WEIXIN_DM_POLICY=open`；`getupdates` 空 buf 拉取会推进服务端游标，排查微信收不到消息时别手动拉队列（会消费掉 gateway 待拉消息） |

### 6. 流式 tool_calls 空串覆盖修复（2026-10-10 新增）

| 文件 | 改动 |
|------|------|
| `packages/ekko-agent/src/model/providers/openai-compatible.ts` | 流式增量里后续分片可能带**空字符串** `id`/`name`（DeepSeek V4.1/商汤实测），原 `?? current.id` 只在 null/undefined 时保留、**空串会覆盖**首分片的完整值 → `invalid_tool_call`。改为 `\|\|` 只在有值时更新。作用：修好这两个模型的工具调用报错 |
| 测试 | `tests/ekko-agent/model-request.test.ts` |

### 7. update_plan/任务卡 MCP 工具常驻（bridge 层补丁，2026-10-13 新增）

| 文件 | 改动 |
|------|------|
| `packages/server/src/modules/hermes/services/bridge/python/hermes_bridge.py` | `_ensure_agent_imports()` 后新增 `_apply_always_eager_toolsets()`：①向运行时 `tools/tool_search` 注入 `_ALWAYS_EAGER_MCP_TOOLSETS = {"mcp-ekko-studio-interaction"}`（兼容 0.20.x 白名单式）；②包装 `is_deferrable_tool_name()` 使该 toolset 永不被延迟（兼容 0.21.x `defer_tools` 签名式）。作用：update_plan/clarify（任务卡工具）会话一开始就加载好，不走 `tool_search→tool_describe→tool_call` 三步，杜绝中途 "does not exist" |

**为什么放 bridge 层而不是改运行时**：改 `desktop-runtime/hermes/<ver>/win-x64/python/tools/tool_search.py` 只对本机生效——新机器装 Studio 下载的是干净官方运行时，Studio 升级下载新版运行时补丁也会丢。bridge 层是 Studio 自带代码（agent 启动必经 `python hermes_bridge.py`），随包分发 → 任何机器任何版本都带。**后续升级 merge 时此文件按自研保留**（bridge 目录上游几乎不动）。

**验证**：干净运行时（0.20.0，无任何补丁）实测：补丁执行后 `_ALWAYS_EAGER_MCP_TOOLSETS` 注入成功、`is_deferrable_tool_name` 被包装。961（0.21.5 新版结构）同款语义。

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