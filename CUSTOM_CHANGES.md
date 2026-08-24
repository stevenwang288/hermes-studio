# 本 Fork 的自定义改动（stevenwang288/hermes-studio）

本仓库是 `EKKOLearnAI/hermes-studio` 的 fork。`main` 分支 = **上游最新 + 本 fork
的两个自定义改动**（消息队列、桌面字体缩放）。所有改动都固化在源码里、带清晰
`[zoom patch]` / `[preempt patch]` 标记，**上游更新后 merge 回来不会被覆盖**。

> ⚠️ **credits 点数系统已于 2026-08-13 从本仓库剥离**（`git revert 99718a54`）。
> 点数系统属于独立的收费 CDE 平台项目（见 vault「项目笔记-收费CDE平台.md」），
> 与本 Web 面板 fork 无关，代码不在此仓库维护。

**每次部署请优先使用本 fork，而不是上游原版。**

---

## 同步记录（2026-08-25）

- 上游已更新到 `8a194dc7`（v0.6.47 release + 1 个 hotfix，41 个新提交，从 `c8a271aa` 到 `8a194dc7`）
- **上游版本跨度**：v0.6.44 → **v0.6.47**（含多个 release：0.6.45 / 0.6.46 / 0.6.47）
- **merge 上游**：`git merge upstream/main`，**7 个文件冲突**，全部手工解决
- **上游新功能**（主要）：
  - 聊天保持思考时长跨导航（#2723）
  - 独立社交消息推送（#2718，Telegram/飞书/微信）
  - App Relay 路由选择（#2683）
  - Git 感知文件浏览器（#2674）
  - 可复用 Agent 预设（#2644）
  - coding agent 队列插入（#2667）—— **上游也实现了队列插入，与我们的消息队列共存**
  - 图片生成/编辑模型选择（#2691）
  - 会话折叠、群聊房间邀请码、上传大小可配置等
- **本 fork 改动**：消息队列 + 字体缩放 + 侧边栏折叠，全部保留（`preempt`/`promoteQueuedMessage`/`queuedUserMessages` 已验证）
- **冲突解决明细**：
  - `run-chat/index.ts` / `chat.ts`：上游加 `push_enabled`，我们加 `preempt`，**共存**
  - `package.json` / `desktop/package.json`：版本 → **0.6.47-fork.1**
  - `MessageList.vue`：保留我们的队列 UI + 补回上游 `MessageQueueFloatPanel`（coding agent 队列浮窗，与我们的用户消息队列独立）+ `queuedPreview` helper（上游有重复定义，删我们的手动副本）
  - `ChatPanel.vue`：保留我们的 `recentIds` 去重 + 上游分类菜单/折叠
  - `openapi.json`：取上游版本
- **编译验证**：✅ 通过（vue-tsc 类型检查 + vite build + tsc server + build-server，产物含 ESP32-C3 firmware）
- **npm 环境踩坑**：本机 `.npmrc` 配置了 `omit=dev`（`npm config get omit` 返回 `dev`），导致 `npm install` 默认不装 devDependencies（vite/vue-tsc/文档类包全缺失）。**必须用 `npm install --include=dev`** 强制装 devDependencies 才能 build。

---

## 同步记录（2026-08-19）

- 上游已更新到 `5100e8e`
- **本 fork 新增 2 个改动**（见下方改动三、改动四），已在 36号 实测验证通过
- 版本：**0.6.45-fork.1**（不变）

---

## 改动三：URL 点击跳转系统默认浏览器（Windows 桌面版）

### 问题背景
Hermes Studio 桌面版（Electron）在 `MarkdownRenderer.vue` 中点击 URL 时，通过 `openUrlInDesktopBrowser` 调用 `browser.createTab(url, true)` 在**内置浏览器面板**中打开。用户希望在 Windows 桌面上点 URL 直接跳转到**系统默认浏览器**（如 Chrome/Edge），而不是在 Studio 的内置面板里。

### 解决方案（本 fork 已实现）
在 Electron 主进程和渲染进程之间新增一条 `openUrl` IPC 通道，用 `shell.openExternal(url)` 替换原有的 `browser.createTab(url, true)` 行为。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `packages/desktop/src/preload/index.ts` | 新增 `openUrl` IPC 通道（`hermes-desktop:open-url`） |
| `packages/desktop/src/main/index.ts` | 新增 `ipcMain.handle('hermes-desktop:open-url')` → `shell.openExternal` |
| `packages/client/src/utils/desktop-bridge.ts` | `HermesDesktopBridge` 接口新增 `openUrl?: (url: string) => Promise<boolean>` |
| `packages/client/src/utils/desktop-browser.ts` | `openUrlInDesktopBrowser` 优先调 `bridge.openUrl`，失败回退 `browser.createTab` |
| `README.md` | 文档更新 |

### 效果
- 桌面版点击聊天消息中的 URL → 直接跳转到 **Windows 默认浏览器**打开
- 如果 `openUrl` IPC 不可用（如旧版 preload），自动回退到内置浏览器面板

---

## 改动四：对话标题右侧路径显示完整宽度

### 问题背景
对话标题右侧的 `workspace-badge` 只显示路径最后一段（`split("/").pop()`），且 CSS 限制 `max-width: 160px`，长路径被截断。

### 解决方案（本 fork 已实现）
1. 模板：去掉 `split("/").pop()`，直接显示完整路径
2. CSS：`max-width: 160px` → `min(520px, 55vw)`
3. `header-session-title` 加 `min-width: 0` 确保标题可收缩，让路径优先占宽
4. 路径文本改用等宽字体（`ui-monospace`），方便阅读目录结构

### 涉及文件

| 文件 | 改动 |
|------|------|
| `packages/client/src/components/hermes/chat/ChatPanel.vue` | 模板显示完整路径；CSS 放宽宽度限制 + 等宽字体 |

### 效果
- 工作区路径完整显示（不再截断为最后一段）
- 宽度自适应，最长 `min(520px, 55vw)`
- 标题自动收缩让位

---

## 同步记录（2026-08-18）

- 上游已更新到 `4751fd36`（v0.6.44 release）
- **merge 上游**：`git merge upstream/main`（自动合并，零冲突）
- **上游新功能**（7 个提交）：
  - `d596dfc3` Provider 分组折叠状态持久化（`useCollapsedProviderGroups`）
  - `571a246d` 文件名点开头不误判为路径穿越
  - `a246da34` 无 model catalog 不报错
  - `e5343d57` bridge 后备 provider 回退
  - `973e1a5c` bridge 去重预存用户消息
  - `2cfac0d3` 前端 changelog 0.6.44
  - `4751fd36` release 0.6.44
- **本 fork 三个改动**（消息队列、字体缩放、侧边栏折叠）均通过 `[fork]` / `[zoom patch]` / `[user-controlled queue]` 标记保护，merge 后全保留
- **冲突检查**：上游 `d596dfc3` 改 `ChatPanel.vue`（模型选择弹窗区域），与本 fork 侧边栏折叠（分类分组区域）无重叠，零冲突
- 当前版本：**0.6.44**；本 fork 三个自定义改动已验证保留

---

## 同步记录（2026-08-13）

- 上游已更新到 `0899f7eb`（v0.6.42 之后 1 个 hotfix：#2511 群聊滚动摘要游标安全）
- **merge 上游**：`git merge upstream/main`（自动合并，零冲突）+ `git revert 99718a54`（剥离 credits）
- **消息队列 bug 修复**（3 处改动，已在 36号 实测验证通过）：
  - 后端 `abort.ts`：`markAbortCompleted` 发出的 `run.queued` 补上 `queued_messages` 字段，前端用服务器权威队列替换
  - 前端 `chat.ts`：`handleRunQueuedEvent` 找不到 `dequeued` 消息时强制 `dropQueuedUserMessage` 移除 UI 队列
  - 前端 `MessageList.vue`：隐藏上游 #2477 的「安全排队插入」按钮（`v-if="false"`），避免与本 fork 的「↑ 立即发送」图标重复，同时移除未使用的 `canInsertQueuedMessages` 计算属性
- 当前版本：**0.6.42 + hotfix + 消息队列修复**；本 fork 两个自定义改动已验证保留

---

## 改动一：消息队列（发新消息排队，ESC / ↑ / Ctrl+Enter 逐条放行）

### 问题背景
默认行为：当前回复还在流式生成（`isWorking`）时，用户再发一条消息会**直接打断
当前回复**，立刻生成新回复。长回复场景下用户想连续追问只能排队等，或者发一条
就把上一条掐断。

### 解决方案（本 fork 已实现）
- **普通发送不打断，只排队**：`isWorking` 时新消息进入队尾（`state.queue.push`），
  当前回复完成后由 `dequeueNextQueuedRun` 自动按序拾取。
- **三种显式放行方式**，每次只放行队首一条、并打断当前回复立即执行：
  - 队列项的「↑ 立即发送」按钮
  - 输入框按 **ESC**
  - 输入框按 **Ctrl+Enter**（macOS 上为 Cmd+Enter）
- 后端新增 `run.promote` 事件：把指定排队消息提升到队首并打断当前 run。
- abort 幂等保护（`abortFinalized`）：`handleAbort` 与 bridge terminal chunk 会
  并发触发 `markAbortCompleted`，不加保护会清掉刚启动的下一条 run 的状态。

### 涉及文件
| 文件 | 改动 |
|---|---|
| `packages/server/src/services/hermes/run-chat/index.ts` | `preempt?: boolean` 分流（true=插队打断 / 缺省=队尾排队）；新增 `run.promote` 事件 |
| `packages/server/src/services/hermes/run-chat/abort.ts` | `abortFinalized` 幂等保护；出队队首时带 `dequeued_queue_id` |
| `packages/server/src/services/hermes/run-chat/types.ts` | `SessionState.abortFinalized?: boolean` |
| `packages/client/src/stores/hermes/chat.ts` | 发送带 `preempt:false`；新增 `promoteQueuedMessage` action 走 `run.promote` |
| `packages/client/src/components/hermes/chat/ChatInput.vue` | ESC / Ctrl+Enter 放行队首一条 |
| `packages/client/src/components/hermes/chat/MessageList.vue` | 队列项「↑ 立即发送」按钮 + 样式 |
| `packages/client/src/api/hermes/chat.ts` | `StartRunRequest.preempt?: boolean` |

### 效果
- 回复生成中发送新消息 → 显示为「排队中」，不打断当前回复。
- ESC / ↑ / Ctrl+Enter → 每次放行一条排队消息，立即执行。
- 当前回复正常完成后，排队消息自动按序执行。

---

## 改动二：Windows 桌面版字体缩放快捷键（Ctrl+加号 / Ctrl+减号）

### 问题背景
Hermes Studio 桌面版（`packages/desktop`，Electron）在 Windows/Linux 上执行了：

```ts
if (process.platform !== 'darwin') Menu.setApplicationMenu(null)
```

即**整个原生菜单栏被移除**（Web UI 自带页面内控件，不需要原生菜单）。
但副作用是：Electron 默认的「缩放」快捷键（View 菜单里的
`Ctrl+=` / `Ctrl+-` / `Ctrl+0`）**也随菜单一起失效了**。
用户在 Windows 桌面上按 Ctrl+加号/减号完全没反应，界面字体无法放大缩小。
作者多次收到反馈但未处理。

### 解决方案（本 fork 已实现）
在主进程 `packages/desktop/src/main/index.ts` 中：

1. **新增缩放工具函数**（`[zoom patch]` 标记段）：
   - `loadDesktopZoomLevel()` / `saveDesktopZoomLevel()` —— 缩放级别持久化到
     `userData/desktop-zoom.json`，**重启应用后保留上次的缩放级别**。
   - `installDesktopZoomShortcuts(window)` —— 用 `webContents.on('before-input-event')`
     拦截键盘事件，重新注册缩放快捷键。
2. **快捷键绑定**：
   - `Ctrl +` / `Ctrl =` / 小键盘 `Ctrl+Add` → 放大（步进 0.5）
   - `Ctrl -` / 小键盘 `Ctrl+Subtract` → 缩小（步进 0.5）
   - `Ctrl 0` → 重置为 100%
   - 范围限制：`ZOOM_MIN = -3`（约 12.5%）～ `ZOOM_MAX = 4`（约 400%）
3. **挂载位置**：
   - 主窗口 `createWindow()` 内调用 `installDesktopZoomShortcuts(mainWindow)`
   - 独立聊天窗口 `openChatWindow()` 内调用 `installDesktopZoomShortcuts(chatWindow)`
4. **平台限定**：`if (process.platform !== 'win32') return` —— 只影响 Windows；
   macOS 保留系统默认菜单缩放，互不干扰。

### 效果
- Windows 桌面版：`Ctrl+加号` 放大字体/UI，`Ctrl+减号` 缩小，`Ctrl+0` 还原。
- 设置记住，重启不丢。
- 无需任何设置界面（按用户要求）。

### 文件清单
| 文件 | 改动 |
|---|---|
| `packages/desktop/src/main/index.ts` | 新增 `[zoom patch]` 函数块（约 60 行）+ 2 处挂载调用 + `node:fs` import 扩展 |

---

## 如何跟上上游更新（保留本 fork 改动）

> 前提：两个改动都在**少量文件、带清晰标记**（`[zoom patch]` / `[preempt patch]`
> / `[user-controlled patch]`），合并时能快速识别。

### 完整 SOP（2026-08-13 实操验证）

```bash
# 1. 拉取上游最新
git fetch upstream main

# 2. 查看差距（确认上游改了什么、我们有多少领先）
git rev-list --left-right --count upstream/main...main
git log --oneline main..upstream/main   # 上游新提交
git log --oneline upstream/main..main   # 我们领先的提交

# 3. 检查上游是否也实现了类似功能（如排队消息 #2477 就是上游独立的实现）
#    如果上游有同名/同功能，决定保留谁的版本

# 4. 合入上游（自动合并一般成功）
git merge upstream/main --no-edit
# 若有冲突：
#   - 带 [zoom patch] / [preempt patch] / [user-controlled patch] 标记的代码块 → 保留我们自己的
#   - 其余代码 → 以上游为准
#   - CUSTOM_CHANGES.md 保留 fork 版本

# 5. 剥离无关功能（如 credits 点数系统归属另一个项目）
git revert <要剥离的提交SHA> --no-edit
# 检查上游是否有同类功能需要剥离：
#   curl -s "https://api.github.com/search/code?q=credits+repo:EKKOLearnAI/hermes-studio"
#   （上游 0 结果，见 2026-08-13 实操）

# 6. 编译验证
npm run build

# 7. 更新 CUSTOM_CHANGES.md 中的同步记录

# 8. 推送
git push origin main
```

### GitHub 网页一键同步（仅限零冲突）
1. 打开本 fork 仓库页 → **Sync fork** → **Update branch**。
2. 无冲突则直接完成；有冲突时回到上面的本地方式解决。

### 冲突时的铁律
- 我们的改动只出现在：
  - `packages/desktop/src/main/index.ts` 的 `[zoom patch]` 标记段 + import 行 + 2 行调用
  - `run-chat/{index,abort,types}.ts`、`client/.../chat*.{vue,ts}` 的队列功能块
- 合并冲突时：**带上面标记的代码块一律保留我们自己的版本**；其余以上游为准。

---

## 部署说明

### 网页版（在线安装 / 手动部署）
从本 fork 构建前端+后端产物：
```bash
git clone https://github.com/stevenwang288/hermes-studio.git
cd hermes-studio
npm install
npm run build
# 产物在 dist/ 下，按上游部署文档发布
```

### Windows 桌面版
```bash
cd hermes-studio/packages/desktop
npm install
npm run build
```
构建出的安装包/主进程产物即包含两个改动。详见上游 `packages/desktop/README.md`。

> 注意：`packages/desktop/dist/main/index.js` 中的 `[zoom patch]` 是本 fork 编译产物，
> **不要**用上游的 dist 覆盖，构建请从本 fork 源码进行。

## 上游同步 — 2026-08-17 21:25

- **上游版本**: v0.6.42-29-g509615bf (509615bf)
- **合并提交**: fc31a6e9
- **上游新提交 (28 个)**: 

- **自研改动保留**: Windows 字体缩放 + 消息队列修复
- **编译结果**: ✅ 通过

## 上游同步 — 2026-08-17（详细记录）

- **上游版本**: v0.6.42-29-g509615bf
- **合并提交**: fc31a6e9（merge upstream/main）+ d68b5c43（冲突修复）
- **上游新提交 (28 个)**: 509615bf c5bd1b3c 304a384e d0d72e2a 7d68a7dd d6bed4cc 85a8028c 72f767be b72e8a2b d99810a8 4826a325 cda57610 4120d13c 1684c086 d4c4ec3b af9129a7 9a885ad4 6f1f52f9 626b4f5c f586fa69 9d5ce1ee 1a0b7246 d9ea9f48 8a9bf5f4 763d85d6 c6289ec5 8839a450 ebb5face
- **冲突情况**:
  - `docs/openapi.json` → 采用上游版本（自动生成）
  - `MessageList.vue` → merge 冲突保留本地，上游 9d5ce1ee 的 Pi agent 改动被误丢
- **冲突修复 (d68b5c43)**: 手工补回 Pi agent 头像(chatSessionAgentAvatar) + clarify responseMode editor + MessageItem :assistant-agent
- **自研改动保留**: Windows 字体缩放 + 消息队列，均已验证；编译 ✅
- **新工具**: scripts/sync-upstream.sh（同步）+ scripts/deploy-fleet.py（部署 31/35/36/61）
