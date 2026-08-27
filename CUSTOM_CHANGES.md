# Fork 改动详情与上游同步记录

本仓库是 `EKKOLearnAI/hermes-studio` 的个人 fork。以下记录所有自定义改动及其实现方式，供合并上游时参考。

---

## 改动一：默认深色主题 + 内置壁纸

**文件**：`packages/client/src/composables/useTheme.ts`

- 默认 brightness 从 `system` 改为 `dark`
- 旧用户 localStorage 存了 `system` 的也强制覆盖为 `dark`
- 首次打开自动应用「矩阵绿」壁纸（纯黑底）
- 14 种深色壁纸可选：午夜代码、Nord 极光、Dracula、东京之夜、GitHub Dark 等

**文件**：`packages/client/src/data/built-in-wallpapers.ts` — 壁纸定义
**文件**：`packages/client/src/views/hermes/ThemeView.vue` — 壁纸选择 UI

---

## 改动二：消息队列

回复生成中发新消息不打断，排队等待；三种方式逐条放行。

| 文件 | 改动 |
|------|------|
| `server/src/services/hermes/run-chat/index.ts` | `preempt?: boolean` 分流（true=插队打断 / 缺省=队尾）；`run.promote` 事件 |
| `server/src/services/hermes/run-chat/abort.ts` | `abortFinalized` 幂等保护；出队带 `dequeued_queue_id` |
| `server/src/services/hermes/run-chat/types.ts` | `SessionState.abortFinalized?: boolean` |
| `client/src/stores/hermes/chat.ts` | 发送带 `preempt:false`；`promoteQueuedMessage` action |
| `client/src/components/hermes/chat/ChatInput.vue` | ESC / Ctrl+Enter 放行队首 |
| `client/src/components/hermes/chat/MessageList.vue` | 队列项「↑ 立即发送」按钮 |
| `client/src/api/hermes/chat.ts` | `StartRunRequest.preempt?: boolean` |

---

## 改动三：Windows 桌面版字体缩放

| 文件 | 改动 |
|------|------|
| `desktop/src/main/index.ts` | `[zoom patch]` 函数块（约 60 行）：`loadDesktopZoomLevel` / `saveDesktopZoomLevel` / `installDesktopZoomShortcuts`，持久化到 `userData/desktop-zoom.json` |

快捷键：Ctrl+加号放大 / Ctrl+减号缩小 / Ctrl+0 重置（步进 0.5，范围 -3 ~ 4）

---

## 改动四：earmark 注解系统

内置浏览器圈选页面元素加备注，broker 随 Hermes 启动。

| 文件 | 说明 |
|------|------|
| `desktop/src/main/browser/earmark-bundle.js` | overlay 注入 bundle（同步副本在 `desktop/build/`） |
| `desktop/src/main/browser/browser-manager.ts` | `toggleEarmark(tabId)` 注入方法 |
| `server/src/services/earmark.ts` | broker 服务，绑定 127.0.0.1:7331，SQLite 持久化 |
| `server/src/index.ts` | 启动时 `startEarmark()`，关闭时 `stopEarmark()` |
| `desktop/src/preload/index.ts` | `toggleEarmark` IPC 通道 |
| `client/src/components/hermes/chat/DesktopBrowserPanel.vue` | earmark 开关按钮 + 注解列表 |

依赖：`earmark-server@^0.1.1`（dependencies），`earmark-mcp@^0.1.1`（devDependencies，代码未引用）

---

## 改动五：Cookie 导入

从系统 Chrome 导入登录态到内置浏览器。

| 文件 | 说明 |
|------|------|
| `desktop/cookie-importer/main.go` | Go CLI，基于 `browsercookie` 库读取+解密 Chrome Cookie |
| `desktop/cookie-importer/abe-decrypt/` | ABE 解密脚本（Chrome v127+ App-Bound Encryption） |
| `desktop/src/main/browser/browser-manager.ts` | `importBrowserCookies()` 调用 Go CLI |
| `desktop/src/preload/index.ts` | `importBrowserCookies` IPC 通道 |
| `client/src/components/hermes/chat/DesktopBrowserPanel.vue` | 导入按钮 + 四种状态提示 |

限制：Chrome v127+ 启用 ABE 后需 SYSTEM 权限解密，旧版 Chromium 直接可用。

---

## 改动六：URL 跳系统默认浏览器

| 文件 | 改动 |
|------|------|
| `desktop/src/preload/index.ts` | 新增 `openUrl` IPC 通道 |
| `desktop/src/main/index.ts` | `shell.openExternal(url)` |
| `client/src/utils/desktop-bridge.ts` | `openUrl?` 接口 |
| `client/src/utils/desktop-browser.ts` | 优先调 `bridge.openUrl`，失败回退内置面板 |

---

## 改动七：路径完整显示

| 文件 | 改动 |
|------|------|
| `client/src/components/hermes/chat/ChatPanel.vue` | 去掉 `split("/").pop()`；`max-width: min(520px, 55vw)`；等宽字体 |

---

## 改动八：自定义图标

深色圆角方块 + 渐变色 H。文件：`desktop/build/icon.ico`（6 尺寸）、`icon.png`、`client/public/logo.png`。

---

## 上游同步记录

### 2026-08-27 — v0.6.47-fork.5

- 上游更新到 `a5134053`（5 个新提交）
- 冲突 2 个：`openapi.json`（取上游）、`ChatInput.vue`（取上游 async handleSend + 保留 fork 队列逻辑）
- 新增：强制旧用户深色主题 + 默认矩阵绿壁纸 + 自定义图标
- 编译验证通过

### 2026-08-25 — v0.6.47-fork.1

- 上游更新到 `8a194dc7`（41 个新提交，v0.6.44 → v0.6.47）
- 冲突 7 个，全部手工解决
- earmark 集成替换 element-picker

### 2026-08-18 — v0.6.44

- 上游更新到 `4751fd36`，零冲突自动合并

### 2026-08-13 — v0.6.42

- 上游更新到 `0899f7eb`
- 剥离 credits 点数系统（`git revert 99718a54`）

---

## 合并上游 SOP

```bash
git fetch upstream main
git merge upstream/main --no-edit
# 冲突时：带 [zoom patch] / [preempt patch] 标记的保留 fork 版本，其余取上游
npm ci --include=dev
npm run build
# 更新本文件同步记录
git push origin main
```
