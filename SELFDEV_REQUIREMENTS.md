# Hermes Studio 自用版改造需求文档

> 本文档用于指导「自用版」(hermes-studio-self) 的改造工作。
> 读者：接手此项目的 AI 工具 / 开发者。
> 仓库：`D:\OneDrive\steven\code\ai\13IDE\hermes-studio`（本地），GitHub: `stevenwang288/hermes-studio`

---

## 一、背景与目标

本项目是 **Hermes Studio 桌面版** 的一个自用 fork。目的是维护一个带自研功能的「自用版」，日常使用它，与上游官方版（`EKKOLearnAI/hermes-studio`）区分开。

**核心诉求：**
1. 自用版能从**本地源码直接启动**（`npm run dev:isolated`），无需构建 exe、无需经过 GitHub CI
2. 自用版与官方版**并行运行互不冲突**（端口、进程、数据目录全隔离）
3. 自研功能正常可用：内置浏览器 Cookie 导入、earmark 标注控件
4. 上游更新能合并进自用版

---

## 二、仓库与版本约定

| 项 | 说明 |
|---|---|
| 上游官方仓库 | `https://github.com/EKKOLearnAI/hermes-studio`（remote 名 `upstream`） |
| 自用版仓库 | `https://github.com/stevenwang288/hermes-studio`（remote 名 `origin`） |
| 本地源码路径 | `D:\OneDrive\steven\code\ai\13IDE\hermes-studio` |
| 版本号规则 | **只改 `fork.x` 后缀**，大版本号跟随上游。当前 `0.6.47-fork.2`。每次自定义改动提交前，将 `fork.2` 升为 `fork.3` 以便区分 |

**版本号位置（两个文件必须同步改）：**
- `package.json` 顶层 `"version"`
- `packages/desktop/package.json` 的 `"version"`

---

## 三、开发板(自用版)本地启动方案

### 3.1 为什么不能直接 `npm run dev`

桌面版是 Electron 应用，本地启动需要处理几个环境冲突：

1. **`ELECTRON_RUN_AS_NODE=1` 环境变量**：这个变量由 Hermes Studio 运行时设置（用于让 electron 二进制当 Node 用）。但如果启动 electron 主程序时继承它，electron 会退化成 Node 模式，`require("electron")` 返回路径字符串而非 API，整个应用无法启动。**必须清除它**。
2. **`HERMES_DESKTOP_PORT`**：桌面版默认端口 8748（动态分配）。自用版要指定独立端口避开冲突。
3. **`HERMES_DESKTOP_RUNTIME_DIR`**：开发模式（非打包）下，代码从 `resources/python/` 找 Hermes runtime，但该目录在开发模式不存在。需要指向复用桌面板已装的 runtime。

### 3.2 已实现的启动脚本

启动脚本：`packages/desktop/scripts/dev-self.cjs`

```js
#!/usr/bin/env node
delete process.env.ELECTRON_RUN_AS_NODE
delete process.env.ELECTRON_FORCE_RENDERER_ACCESSIBILITY
delete process.env.NODE_OPTIONS

const electron = require('electron')
const { spawnSync } = require('child_process')
const { env } = process

env.HERMES_DESKTOP_PORT = '8749'
env.HERMES_DESKTOP_RUNTIME_DIR = 'C:\\Users\\baba1\\.hermes-web-ui\\desktop-runtime\\hermes\\0.20.0\\win-x64'

const result = spawnSync(electron, ['.'], {
  stdio: 'inherit',
  env,
  cwd: __dirname,
})
process.exit(result.status ?? 0)
```

### 3.3 启动命令

```bash
cd D:\OneDrive\steven\code\ai\13IDE\hermes-studio\packages\desktop
npm run build:main        # 编译主进程 TS → dist/main/
node scripts/dev-self.cjs # 启动自用版(Electron窗口, 端口8749)
```

### 3.4 需要解决的问题

启动脚本已能跑通，但有遗留问题：
- **`spawnSync` 里 `require('electron')` 返回路径字符串**，但路径正确，能 spawn 成功（部分场景 exit 1 需排查）
- **单实例锁冲突**：`app.requestSingleInstanceLock` 用应用名做锁。已改 `APP_USER_MODEL_ID` 为 `com.hermeswebui.studio.self`，但 `app.getName()` 需确认锁用的是新名字（当前 `package.json` name 已改为 `hermes-studio-self`）

---

## 四、【重点】内置浏览器 Cookie 导入功能落地

### 4.1 现状

用户核心痛点：**内置浏览器打开 B站/YouTube 显示未登录**，尽管本机 Chrome 已登录。

**已证实的事实：**
- `D:\ask\cookies_final.json` 存在，含 **2892 条 cookie**（B站 28 条、YouTube 78 条），由 ABE 解密工具链生成
- cookie 快照文件（`.hermes-session-cookies.json`）里**已有 B站 31 条**，但刷新后 B站仍显示"登录"按钮
- 内置浏览器是 Electron 内嵌 Chromium，**不是**你系统 Chrome

**根因有两层：**

**层1：importer 工具链残缺**
- `packages/desktop/cookie-importer/main.go` 用的是 `browsercookie` 第三方库
- Chrome ≥127 的 cookie 用 **App-Bound Encryption (ABE)** 加密，`browsercookie` 只能解 DPAPI，遇 ABE 报错 `LOCKED`
- 真正的 ABE 解密工具链在 `packages/desktop/cookie-importer/abe-decrypt/`（step1/2/3 三阶段 Python 脚本，需 SYSTEM 提权），产物就是 `D:\ask\cookies_final.json`

**层2：设备指纹不匹配**
- 即使 cookie 注入成功，内置浏览器 UA 暴露 `hermes-studio/0.6.47-fork.1 Electron/42.3.0`
- B站后端风控认为「cookie 声称的身份」≠「访问环境指纹」，拒绝登录

### 4.2 已做的代码修复（`browser-manager.ts`）

`importBrowserCookies` 方法已加 **ABE 回退**：当 `hermes-cookie-importer.exe`（browsercookie）失败时，自动读取 `D:\ask\cookies_final.json` 并通过 `session.cookies.set` 注入。

```typescript
// importBrowserCookies 的 catch 分支里，尝试读 ABE 产物注入
const candidatePaths = [
  'D:\\ask\\cookies_final.json',
  'C:\\ask\\cookies_final.json',
  join(process.env.USERPROFILE || '', 'ask', 'cookies_final.json'),
]
// 对每个 cookie 调 browserSession.cookies.set({...})
```

**保留的功能（勿删）：**
- `restoreTabs` 用 `Promise.allSettled` + 兜底空白页（根治 `Browser tab not found` 报错）
- `navigate` 在 tab 不存在时刷新 state 而非裸抛

### 4.3 UA 伪装修复（已做，`browser-manager.ts` 的 `buildTab`）

```typescript
// 每个新 tab 创建时
contents.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
)
// 隐藏 navigator.webdriver
const hideWebdriver = () => {
  contents.executeJavaScript(
    `Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined });`
  ).catch(() => {})
}
contents.on('dom-ready', hideWebdriver)
contents.on('did-navigate', hideWebdriver)
```

### 4.4 还需验证/可能的问题

- UA 伪装实际是否让 B站识别为已登录（需自用版真实浏览器测试）
- UA 版本号 `Chrome/148.0.0.0` 是否与你系统 Chrome 匹配
- ABE 回退注入的 cookie 是否被 B站接受（指纹一致后）

---

## 五、【重点】earmark 标注控件功能落地

### 5.1 现状

earmark 是元素圈选标注系统（上游独立 npm 包：`earmark` / `earmark-server` / `earmark-mcp`）。

**基础设施已就位：**
- broker 服务运行于 `127.0.0.1:7331`（`/health` 返回 `{ok:true, sessions, count}`）
- 前端 bundle 已打包：`packages/desktop/src/main/browser/earmark-bundle.js`（60KB）
- 注入入口：`browser-manager.ts` 的 `toggleEarmark(tabId)`

### 5.2 已修的 bug（`browser-manager.ts` + bundle）

**原 bug：** earmark-bundle.js 末尾留了一句字符串字面量 `'Earmark.createEarmark({endpoint:http://127.0.0.1:7331})'`，**根本没执行**（是字符串不是代码），且 `endpoint:http://` 缺引号语法错误。导致注入后 overlay 从不初始化，broker `sessions` 永远为 0。

**修复：**
```typescript
// toggleEarmark 注入 bundle 后追加调用
await record.view.webContents.executeJavaScript(
  bundle + `\n;(() => { Earmark.createEarmark({ endpoint: "http://127.0.0.1:7331" }); })();`,
  true,
)
```
同时删掉了 bundle 末尾的无用字符串字面量。

### 5.3 还需验证/可能的问题

- earmark overlay 是否真正注入成功（broker `sessions` 是否 > 0）
- 前端工具栏四向箭头按钮 → IPC `hermes-desktop:browser-toggle-earmark` → `toggleEarmark` 链路是否通（注意：MCP server 未暴露 earmark 开关，只能 UI 按钮触发）
- broker 数据是否持久化、agent 能否读取标注

---

## 六、与应用原版(上游)的冲突隔离清单

| # | 冲突源 | 原版值 | 自用版需要 | 位置 |
|---|---|---|---|---|
| 1 | **应用名 `name`** | `hermes-studio` | `hermes-studio-self`（已改） | `package.json` |
| 2 | **进程 ID** `APP_USER_MODEL_ID` | `com.hermeswebui.studio` | `com.hermeswebui.studio.self`（已改） | `src/main/index.ts:21` |
| 3 | **WebUI 端口** | `HERMES_DESKTOP_PORT` 默认 8748（动态） | 指定 8749（已改进 dev-self.cjs） | 启动脚本 |
| 4 | **userData 目录** | 基于 `app.getName()` → `~/.hermes-web-ui` | `~\AppData\Roaming\hermes-studio-self`（name 改了自动隔离） | 跟随 name |
| 5 | **Hermes runtime** | 打包在 exe `resources/` | 复用已装的 `~/.hermes-web-ui/desktop-runtime/hermes/0.20.0/win-x64` | `HERMES_DESKTOP_RUNTIME_DIR` |
| 6 | **环境变量** `ELECTRON_RUN_AS_NODE=1` | 由运行时设置 | 必须清除，否则 electron 变 Node 模式 | 启动脚本 |
| 7 | **窗口标题** | `Hermes Studio` | `Hermes Studio (自用版)`（已改 index.ts） | `src/main/index.ts` |

---

## 七、MCP 与多实例注意事项

- 自用版和桌面版**共享同一份 `~/.hermes` 配置和 MCP server 配置**。这意味着**两个实例的 MCP 是同一个**，若同时开两个，MCP 工具的连接归属会切换（用户手动停用 MCP 会影响桌面版 agent）。这是已知限制。
- 备份的策略：日常用桌面版 + MCP；需要改代码测试时关掉桌面版，只开自用版。

---

## 八、近期待办（按优先级）

1. **验证 Cookie 导入**：自用版内置浏览器打开 B站，确认 UA 伪装后能登录（ABE 回退注入的 cookie + 伪装的 UA）
2. **验证 earmark**：自用版点工具栏箭头按钮，查 broker `sessions` 是否 > 0
3. **修复 dev-self.cjs**：`spawnSync` exit 1 的问题
4. **确认单实例锁**：自用版使用独立锁名
5. **版本号升到 `fork.3`**（下次改动前）
6. **把上游领先的 4 个提交合并进自用版**（`#2730` 跨 coding agent tool calls 可能和自研队列冲突，需重点处理）

---

## 九、自研功能清单（相对上游）

自用版领先上游 70 个提交，核心自研功能：
- 消息队列系统（排队、逐条放行、合并 promote、覆盖检测）
- 内置浏览器 Cookie 导入（Chrome/Edge 登录态）
- Cookie ABE 解密工具链
- 内置浏览器 UA 伪装
- earmark 标注控件
- tab 竞态修复
- 桌面版字体缩放
- 侧边栏 UI 调整

---

## 十、如何验证改造成功

**Cookie 导入验证（关键判据）：**
1. `npm run build:main && node scripts/dev-self.cjs` 启动自用版
2. 打开内置浏览器 → 导航到 `https://www.bilibili.com/`
3. 点工具栏"导入Cookie"按钮
4. **刷新页面，B站右上角显示用户头像（已登录）** = 成功

**earmark 验证（关键判据）：**
1. 自用版打开任一网页
2. 点内置浏览器工具栏四向箭头图标（earmark开关）
3. `curl http://127.0.0.1:7331/health` 返回的 `sessions` 字段 > 0 = 注入成功
4. 页面上出现可圈选的标注 overlay = 成功

---

*文档版本：1.0  |  基于 hermes-studio 源码 0.6.47-fork.2  |  2026-08-26*