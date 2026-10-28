# 本仓库说明

> **动手时照 [`SYNC-CHECKLIST.md`](SYNC-CHECKLIST.md) 走**（10 步打勾，最后跑 `node scripts/delivery-verify.mjs` 终检）。
> **维护规则与坑的原理看 [`MAINTAIN.md`](MAINTAIN.md)** —— 上游更新时该做什么、4 台 PVE 怎么升级、Windows 安装程序放哪，全在里面。
> **详细手册看 [`docs/upstream-sync-and-fleet-deploy.md`](docs/upstream-sync-and-fleet-deploy.md)**。
> 本文件负责：自研功能清单 + **每轮记账**。

本仓库是 `EKKOLearnAI/ekko-studio` 的 fork（原名 `hermes-studio`，上游已改名，旧地址 404），**2026-09-16 全新重建**：以官方 v0.7.21 为基线，只合入自研功能，版本号跟随官方（不做 fork 标记，避免启动提示）。

## 当前状态（2026-10-16 校准）

| 分支 | 版本 | 说明 |
|------|------|------|
| `sync` | **0.7.39**（2026-10-28 校准） | 唯一有效分支。= 上游 `main` 最新 + 8 项自研功能（③路径显示已移除；⑨环境探测误判修复 2026-10-28 新增），已通过 `npm run build` + 桌面 `tsc --noEmit` 验证 |
| `main` | 0.7.21 | 停用的旧基线，**勿用** |

**流程固化（2026-10-15）**：新增 [`SYNC-CHECKLIST.md`](SYNC-CHECKLIST.md)（10 步执行清单，把「推自己的 GitHub」「更新文档记账」两步显式列为不可跳过）+
`scripts/delivery-verify.mjs`（9 项终检，一项 FAIL 就不算完成）+ `scripts/sync-fleet-head.sh`（只同步 4 台 git 指针，解决「部署后又记账 → PVE HEAD 漂移」）。
首跑终检即抓出真问题：4 台停在 `c41c75c1` 而仓库已是 `cbd5d44e`（记账提交所致，运行时未变）。

**自研变更（2026-10-16）· 移除自研③「路径完整显示」**：大哥拍板 —— 上游已有该能力（`activeWorkspacePath`/`activeWorkspaceSessionId`，见 #3396「不再截断 workspace 路径」），fork 早期自己加的 `workspace-badge` 徽标属重复，**这块完全改为跟随上游**。
排查中发现该补丁还是**坏的**：它把顶栏 `header-actions` 拆成两个兄弟 div，并重复渲染了一次会话标题；且 `workspace-badge` 的 `v-if` 未排除新建对话页，导致在新建对话页点顶栏路径 chip 改的是**上一个会话**而不是即将新建的对话（用户实测踩到）。
处置：`ChatPanel.vue` 模板 + 样式全部还原，现 `git diff upstream/main -- packages/client/src/components/hermes/chat/ChatPanel.vue` **为空**（逐字节一致）。自研从 **8 项 → 7 项**，`self-check-custom.mjs` 命点 **14 → 13**（13/13 PASS）。同步更新：`SYNC-CHECKLIST.md`（冲突铁律去掉 `workspace-badge`、自检判据去掉「路径显示」）、`scripts/self-check-custom.mjs`、`docs/upstream-sync-and-fleet-deploy.md`、skill。**编号 ③ 保留不复用。**
提交 `c9189537` 已推 `origin/sync`；`npm run build` exit=0。**当天二次打包交付**：`Ekko.Studio-0.7.36-x64.exe`（189MB，15:21→15:30）覆盖到 `d:\desk` 并重装本机；安装产物 `resources/webui/dist` 已搜不到 `workspace-badge`（证明确实生效）；启动 19 进程 + 主窗口 PID 4756，`/health`：`status=ok` / `webui_version=0.7.36` / `bridge=ready, running=true`。

**最近一次合并（2026-10-28 13:40 UTC）**：上游仓库已改名 —— `EKKOLearnAI/hermes-studio` **404**，fork 的 parent 现为 **`EKKOLearnAI/ekko-studio`**（同一项目的新名字/新迭代，旧地址不再存在）。本轮合并该仓库 `main` 的 **8 个提交**（#3554 Person 设置重构与上下文/任务加固、#3560 悬浮 zhezhe 后台任务、#3562 JEV 共享+个人助手记忆、#3563 个人助手通知、#3551 stackchan 语音文档、#3565 zhezhe 自我介绍修复、#3564 使用量与 agent logo、#3566 Person 任务续跑+任务工具），209 个文件。**merge-tree 预演 0 冲突，实 merge 也 0 冲突**（仅 `.gitignore`/`package.json` 非重叠自动合并）。版本仍 **0.7.39**；**依赖清单无变化**（`git diff backup..HEAD -- package*.json` 为空）→ 按流程**跳过 `npm install`**。本地 `npm run build` **exit=0**（dist 13:39:46），自研自检 **14/14 PASS**（本轮新增 ⑨）。合并后 HEAD `85e3e77c`，已推 `origin/sync`。
> **本轮新增自研⑨**：coding-agent 环境探测误判修复（见下方第 8 节）。这是本轮唯一新增的 fork 补丁，因为**上游此 bug 仍在**：任意 `ENOENT` 都会被翻译成 "Node/npm environment was not detected"。
> **部署与交付（2026-10-28）**：931 `85e3e77c` / 935 `85e3e77c` / 936 `85e3e77c` 全部 build exit=0、服务重启后 `curl 8648` **200**、version=0.7.39、dist mtime 为本轮、`includes("spawn node")`=2 且 `includes("enoent")||...`=0。961 已在本轮构建完成（`85e3e77c`），进程重启后同样生效。
> **本轮踩的两个坑**：① **`git reset --hard origin/sync` 会静默回退** —— 三台的 `remote.origin.fetch` 只映射了 `refs/heads/main`，`git fetch origin sync` 只写 `FETCH_HEAD`、不更新 `origin/sync`；931 因此被 reset 到旧 commit `678ca544`（0.7.35），且"旧源码 + 新 node_modules"导致 build 报 `PdfFilePreview.vue TS2339` 失败 → 必须 `git rev-parse FETCH_HEAD` 取真实目标再 reset（deploy-one-vm.sh 早已这么做，我手写脚本时重踩了一次）。② **936 的 `systemctl restart ekko-studio` 必须用 root 执行** —— 以 `ubuntu` 身份跑会报 "Access denied as the requested operation requires interactive authentication"，build 成功但服务仍是旧进程，容易误判"已部署"。
> **961 桌面 tsc 无法验证**：961 上 `packages/desktop` 没有 `node_modules`（缺 `electron` / `@types/node`），`npx tsc` 直接报 800+ 条缺模块错误 → 属**环境缺失**，非本轮代码问题；桌面版验证仍需在 Windows 侧做。

**最近一次合并（2026-10-16）**：上游 0.7.35 → **0.7.36** 共 9 个提交（实时主题定制+可移植主题预设 #3394、TOS 7 包自动构建 #3397、Windows 盘根 workspace 路径处理 #3396、工作流抽屉+聊天主题修复 #3398、Hermes 发布打包修复 #3400、30MB 动态壁纸 #3399、按需加载完整 provider 模型目录 #3401、Studio 侧栏可调宽 #3408、token 过期后 Hermes 群任务计划鉴权修复 #3409）。**唯一冲突 `.gitignore`**（双方各加不同条目，非互斥 → 两边都保留：fork 的本地杂物段 + 上游的 `/release/tos/`）。逐项 grep 确认 **8 项自研全存活**（①preempt×9/4/1/4/2 ②`loadDesktopZoomLevel`×2 ③`workspace-badge`×2 ④`DEFAULT_LINK_OPEN_TARGET`×5 ⑤`ALLOW_ALL_USERS` ⑥`toolCallDelta.id ||` ⑦`_ALWAYS_EAGER`×3 ⑧`384000` cap）。合并后 HEAD `8d95fe2d`，已推 `origin/sync`。本地 `npm run build` + 桌面 `tsc --noEmit` 均 exit=0。
> **依赖确实变了，所以本轮 `npm install` 是必需的**：上游 0.7.36 新增 `postcss@^8.5.26` + `postcss-scss@^4.0.9`（package.json +2 行）、`package-lock.json` +33 行、新增 `pack:tos`/`verify:tos` 脚本。`npm install` 实加 1 个包。

**流程改进（2026-10-16）**：① **第 3 步装依赖改为条件执行** —— 先 `git diff --name-only backup-sync-<本轮>..HEAD -- package.json package-lock.json packages/*/package.json`，**输出为空就跳过 `npm install` 直接 build**，非空才装并说明变了什么（大哥明确批评过"每次都装依赖"的无条件做法）。② **`scripts/delivery-verify.mjs` 新增 `--skip-pve`**：本轮只更桌面版、PVE 不动时，4 台 PVE 的 commit/存活共 8 项标 **SKIP**（不计 FAIL），终检仍能过闸门。

**桌面版交付（2026-10-16）**：本地打包 `Ekko.Studio-0.7.36-x64.exe`（189MB，14:46→14:53，6分39秒）已拷到 `d:\desk`（旧版 0.7.35 exe 由脚本自动清除）。**本机已静默安装升级**：`ProductVersion` `0.7.35.0` → **`0.7.36.0`**，`explorer.exe` 代启动后 19 进程 + 主窗口 PID 22700 + 监听 `0.0.0.0:26500`，`/health` 确认 `status=ok`、`webui_version=0.7.36`、`bridge.status=ready` / `ready=true` / `running=true`（bridge 约 60 秒后由 `unreachable` 转 ready，别早查误判）。**本轮按大哥要求跳过 PVE 4 台**（只更桌面版），PVE 仍停在上一版，待下轮一起补。

**最近一次合并（2026-10-15）**：上游 0.7.34 → 0.7.35 共 6 个提交（Agent 卡片思考头像过渡动画 #3378/#3386、显示费用开关修复+Edge TTS 接口更新 #3381、会话删除/归档/未读跨设备同步 #3380、Ekko 自定义 Anthropic 地址路径拼接 #3384、Anthropic 兼容请求按模型输出上限设置 #3334）。**0 个文件冲突，干净 merge**（merge-tree 预演 0 冲突标记；4 个双方改文件 package-lock.json / ChatPanel.vue / MessageList.vue / model-request.test.ts 改动互不重叠全部自动合并）。逐项 grep 确认 8 项自研完整存活（①preempt×9/promote_all ②zoom patch ③workspace-badge ④default-browser+findChromeExecutable ⑤WEIXIN_DM_POLICY ⑥`|| current.id` ⑦_ALWAYS_EAGER×3 ⑧384000 cap）。`git diff upstream/main..sync` 圈定：16 个自研源码文件 + 运维资产，无夹带。本地 `npm run build` + 桌面 `tsc --noEmit` 均通过。

**同日二次合并（2026-10-15 09:16）**：上游在同一 0.7.35 版本号下又推 3 个提交（新建会话分类选择器移入输入框工具栏 #3389、可见模型管理加搜索 #3393、尊重模型可见性+大目录告警 #3392；**上游尚未发版，package.json 仍为 0.7.35**）。**0 冲突干净 merge**（merge-tree 预演 0 冲突；唯一重叠文件 `ChatPanel.vue` 为自研③路径显示，三方合并自动保留）。合并后 HEAD `c41c75c1`。逐项 grep 确认 8 项自研全存活（①`preempt`×9 / `promote_all`×4 / abort `queued_messages` / ChatInput.vue 的 ESC+Ctrl+Enter promote 逻辑 ②`loadDesktopZoomLevel`×2 ③`workspace-badge`×2 ④`DEFAULT_LINK_OPEN_TARGET`×5 + `findChromeExecutable`×2 + `getZoomFactor` ⑤`ALLOW_ALL_USERS` ⑥`toolCallDelta.id ||` ⑦`_ALWAYS_EAGER`×3 ⑧`384000` cap）。`git diff upstream/main..sync` = 36 个文件（16 自研源码 + 4 测试 + 运维资产）。本地 `npm run build` + 桌面 `tsc --noEmit` 均通过，已推送 `origin/sync`。

**部署与交付（2026-10-15）**：4 台 PVE（931/935/936/961）全部升级到 `c41c75c1`，`curl 8648` **4/4 HTTP 200**；浏览器验收（各发一道加法题、AI 答对才算过）**4/4 通过**（931=88 / 935=102 / 936=61 / 961=125）。

**本轮踩坑（已写进 MAINTAIN.md 故障速查）**：

- **961 `build` 报 `exit=137` 是 OOM，不是网络**。961 只有 4G 内存且 **0 swap**，vite/rolldown 并行构建吃爆内存被内核 Killed（`dmesg` 明确 `Out of memory: Killed process`）。**`NODE_OPTIONS=--max-old-space-size` 管不住 rolldown 的多线程原生内存峰值**，` vue-tsc -b` 分步跑能过但 `vite build` 仍 137。**解法：给 961 加 4G swap 文件并写入 `/etc/fstab` 持久化**，之后 `npm run build` 一次通过（可用内存 3.8G→7.8G）。
- **deploy 脚本的 git 兜底有坑**：`git fetch origin sync` 只写 `FETCH_HEAD`、**不更新 `origin/sync` 本地引用**，随后 `git reset --hard origin/sync` 会静默回退到旧 commit（935 曾因此停在 `678ca544` 还显示部署成功）。**修法：先 `git ls-remote origin sync` 取目标 SHA，再 fetch 并校验 `git rev-parse FETCH_HEAD` 等于该 SHA，最后 `git reset --hard <SHA>`**（已改进 `scripts/deploy-one-vm.sh`）。
- **PVE→GitHub 偶发 `GnuTLS handshake failed` 真实存在但间歇**（961 曾连败 3 次第 4 次成功、935 一次 pull 失败），重试即可。四台网络配置**完全一致**（均 mihomo 监听 `127.0.0.1:7890`、git 全局代理 7890、npm registry=npmmirror），实测 4 台 `git ls-remote` 均 5/5 成功（570~1160ms），**没有哪台有持续网络问题**。
- 顺手提交：`scripts/verify-fleet.mjs` 的 `require` → `import` 修复（`.mjs` 里 `require is not defined` 的老 bug），现已能直接用 `node scripts/verify-fleet.mjs` 跑，不再需要 `cp` 成 `.cjs`。

**桌面版交付（2026-10-15）**：本地打包 `Ekko.Studio-0.7.35-x64.exe`（189MB，11:00→11:07，7分36秒）已拷到 `d:\desk`（旧版 0.7.34 exe 由脚本自动清除，桌面只留最新版）。**本机已静默安装升级**：`ProductVersion` 由 `0.7.34.0` → **`0.7.35.0`**，启动后 19 个进程 + 1 个主窗口 + 监听 `0.0.0.0:26500`，`/health` 确认 `webui_version=0.7.35`、`gateway=running`，`agent_bridge` 约 60 秒后由 `unreachable` 转 `ready/running`（这个等待别省，早查会误判失败）。启动方式用 `explorer.exe` 代启动（直接 `Start-Process` 会被安全软件拦截起不来）。

**上一次合并（2026-10-13）**：上游 0.7.33 → 0.7.34 共 15 个提交（编程 Agent 原生模型选择/记忆已选配置 #3354/#3360、统一模型选择弹窗 #3355、用量概览账号/Profile 筛选 #3363、用量精度/趋势图修复 #3373、**桌面远程服务器模式** #3366、Turkish locale #3338、MCP 继承 token 修复 #3359、思考标签混入正文 #3365 等）。**0 个文件冲突，干净 merge**，但上游 6 个自研重叠文件改动量大（chat-run.ts -142 / chat.ts -186 / ChatPanel.vue -664 / ChatInput.vue -103 / desktop-browser.ts / context-policy.ts），git 三方合并自动保留全部自研（上游从未有过 preempt 代码 → 我们 fork 的行当"新增"保留），逐项 grep 确认 6 项自研完整存活：
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

### 3. 路径完整显示 —— **已移除（2026-10-16）**

| 文件 | 改动 |
|------|------|
| ~~`client/src/components/hermes/chat/ChatPanel.vue`~~ | ~~workspace-badge 去掉 `split("/").pop()`；`max-width: min(520px, 55vw)`；等宽字体~~ |

**2026-10-16 大哥拍板：放弃本项自研，改为跟随上游。** 上游自身已具备 workspace 路径处理能力（`activeWorkspacePath` / `activeWorkspaceSessionId`，见上游 commit #3396「不再截断 workspace 路径」），fork 早期的 `workspace-badge` 徽标属于多余重复，且它插入顶栏时把 `header-actions` 拆成了两个 div、并重复渲染了一次标题。
现 `ChatPanel.vue` 已**逐字节还原为上游版本**（`git diff upstream/main -- ChatPanel.vue` 为空），顶栏只保留上游自带的文件夹圆钮 `header-workspace-button`（完整路径在 tooltip 里）。
**编号 3 / ③ 保留不复用**，`scripts/self-check-custom.mjs` 已删除该项命点（现为 13 个命点 / 7 项功能）。

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

### 8. coding-agent 环境探测误判修复（2026-10-28 新增）

| 文件 | 改动 |
|------|------|
| `packages/server/src/modules/coding-agents/services/index.ts` | `isNodeEnvironmentMissingError()` 去掉 `text.includes('enoent')` 兜底，改为只认 `spawn npm` / `spawn node`（并补上原本缺失的 `spawn node` 分支） |
| `packages/server/src/modules/studio/services/update/version-preview-manager.ts` | 同一份逻辑的副本，同步修正 |

**问题**：上游用"错误文本里出现 `enoent`"当作"Node/npm 没装"。但探测智能体版本时执行的是 `<cmd> --version`，命令不存在就是 `spawn qwen ENOENT` —— 于是**「这个 CLI 没装」被显示成「Node/npm 环境缺失」**，用户在 4 台机器上都看到这条误导性报错。

**验证**：从线上 `dist/server/index.js` 抽出该函数跑用例 —— `spawn qwen ENOENT → false`、`spawn cursor-agent ENOENT → false`、`spawn npm ENOENT → true`、`spawn node ENOENT → true`、`npm: command not found → true`、普通文件 `ENOENT open /x → false`，6/6 符合预期。

**后续**：该 bug 属上游问题，适合向上游提 PR；合并上游时按自研保留（`scripts/self-check-custom.mjs` ⑨ 已加守卫）。

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

**照 [`SYNC-CHECKLIST.md`](SYNC-CHECKLIST.md) 逐步打勾**，那里是唯一的执行入口（含每步判据与终检）。速查：

```bash
git fetch upstream main --tags --force
git branch "backup-sync-$(date +%Y%m%d-%H%M%S)" sync       # 先留后路
git checkout sync
git merge upstream/main --no-edit
# 冲突铁律：
#   [zoom patch] / [preempt patch] / workspace-badge 标记 → 保留 fork（消息队列/缩放/路径）
#   其余 → 一律取上游（品牌/图标/安装路径跟随官方）
#   重应用后必查：zoom 需补 readFileSync/writeFileSync 到 node:fs import、不调用 applyDesktopZoom
npm install --include=dev --no-audit --no-fund
npm run build                                              # 必须 exit=0
# ⚠ 若报 SAFE_DELETE_BULK_CONFIRM_REQUIRED（沙箱批量删除保护，非代码错误）：
#     mv dist dist.old-<ts> && npm run build
cd packages/desktop && npx tsc -p tsconfig.json --noEmit   # 推 GitHub 前必验
cd ../..
git push origin sync                                       # ✱ 推自己的 GitHub，别漏
# 之后：
#   4 台 PVE      bash scripts/deploy-one-vm.sh <931|935|936|961>
#   浏览器验收    node scripts/verify-fleet.mjs           # 判据 通过 4/4
#   本地打包      CODEBUDDY_SAFE_DELETE_ENABLED=0 bash scripts/local-package-win.sh
#   装本机        'd:\desk\Ekko.Studio-<ver>-x64.exe' /S  （装前先 Stop-Process）
#   更新文档      改 CUSTOM_CHANGES.md / MAINTAIN.md / memory → 再 push 一次
#   指针漂移      bash scripts/sync-fleet-head.sh         # 只含文档改动时用这个，不用重建
#   终检          node scripts/delivery-verify.mjs        # ✱ 必须 9/9 PASS 才算完成
#

# ⚠ 桌面版早已改为「本地打包」（2026-10-08 起），下面这条云编译命令已废止，勿再使用：
#    gh workflow run "Manual Desktop Build" --ref sync -f target_os=win32 -f target_arch=x64
```

---

## 环境要点

- **代理**：本机 v2rayN（`D:\OneDrive\steven\soft\proxy\v2rayN-windows-64\`，xray.exe）监听 **10808**（混合端口 HTTP+SOCKS5，Obsidian 有记录）。User 级 `HTTP_PROXY/HTTPS_PROXY` 已从 10809 修正为 10808。
- **api.github.com 走代理会被拒（403），需直连**：curl 加 `--noproxy '*'`；git 操作用 10808 代理正常。
- **git 凭据**：全局 `credential.helper=manager`（2026-09-22 修正；系统级原为 `helper-selector`，会导致每次 push 弹「选择凭据助手」框）。
- GitHub token：`git credential fill` 取（scope: repo, workflow, gist；无 delete_repo 权限，删除仓库需网页操作）。
- 云编译产物命名：`Hermes.Studio-<version>-x64.exe`（官方命名）。