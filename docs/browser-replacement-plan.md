# 内置浏览器替换方案（WebContentsView → 系统 Chrome/Edge + CDP）

> 作者：99号  日期：2026-10-02  状态：**已部分实施（2026-10-02）**
> 背景：升级 0.7.27 后用户提出——内置浏览器体验/能力不像"正常浏览器"，要求评估替换。

## 0. 实施记录（2026-10-02）

| # | 决策 | 落地 |
|---|---|---|
| 1 | 用户点 URL 默认打开方式 | **已实施**：`desktop-browser.ts` 默认 `default-browser` + `desktop/src/main/index.ts` 的 `open-external-url` **优先 spawn 系统 Chrome**（探测 3 个标准路径，未装回落系统默认）。原因：系统默认浏览器是夸克（QuarkHTM），Win11 无可靠命令行改默认（SetUserFTA 已商业化且 21H1+ 失效，官方只支持 GUI） |
| 2 | 内置浏览器错位 | **已修复**：`browser-manager.ts` `setViewport` 乘主窗口 `getZoomFactor()`（字体缩放 zoom patch 导致 CSS px/DIP 不一致） |
| 3 | 方案 A（CDP 接管系统 Chrome 重构内置浏览器） | **未实施**（用户选择 Hermes 层强制 Chrome，不动系统默认；内置浏览器保留为手动打开面板的兜底） |

> 结论：用户诉求（"点 URL 用正常浏览器"）已通过 Hermes 层达成，**系统级默认浏览器仍是夸克**，方案 A 仅在需要"面板内嵌正常浏览器"时才值得实施。

---

## 1. 结论先行

| # | 项 | 结论 |
|---|---|---|
| 1 | 0.7.27 内置浏览器改进 | **只有 MCP 自动化层**（tab 上限 12/顺序批次/大页面/JEV 评估），**内核与 UI 零改动** |
| 2 | 是否值得替换 | 值得。现有 4 大硬伤（指纹/登录态/代理/无 CDP）全是 WebContentsView 架构性缺陷 |
| 3 | 推荐方案 | **CDP 接管系统 Chrome**（找不到时自动降级 Edge），复用现有 95% 自动化代码 |
| 4 | 首选浏览器 | **Chrome**（指纹即真 Chrome、登录态/ABE cookie 导入链已打通）；备选 **Edge**（Windows 必装） |

## 2. 0.7.27 内置浏览器改了什么（核实结果）

| 提交 | 内容 | 层级 |
|---|---|---|
| faa1ca6c #3207 | MCP 顺序操作批次 | 自动化层 |
| 5254ad54 #3206 | 保留 12 个 tab、溢出淘汰最旧 | 自动化层 |
| d2ec3d12 #3212 | 大页面支持、移除操作确认门槛 | 自动化层 |
| 2b20237c #3215 | 操作反馈 + 紧凑快照 | 自动化层 |
| ffdb8fff #3208 | 浏览器自动化 JEV 评估可选 | 自动化层 |

**内核侧**：`browser-manager.ts` 仍是 Electron `WebContentsView`（Chromium 148/Electron 42），无内核升级、无 UI 改动。内置浏览器 = 桌面版窗口内的 Chromium 视图 + `DesktopBrowserPanel.vue` 控制条。

## 3. 现有内置浏览器 4 大硬伤（架构性，非 bug）

| # | 硬伤 | 根因 | 现状 |
|---|---|---|---|
| 1 | 指纹不匹配 | UA 暴露 `hermes-studio/... Electron/42` | 已做 UA 伪装+隐藏 webdriver，但 B 站等风控仍可能识别 |
| 2 | 登录态不可靠 | cookie 导入需 ABE 解密链（Chrome≥127），注入后指纹不一致仍不认 | 2892 条 cookie 已破，但"Chrome cookie + Electron 指纹"组合被拒 |
| 3 | 代理绕行 | profile 默认 `proxyMode: direct`，完全绕过系统代理 | YouTube/Google 必超时，需手改 profile |
| 4 | 无 CDP 端口 | `--remote-debugging-port` 被吞，外部工具无法注入/调试 | 只能走桌面版 IPC |

## 4. 关键有利事实：自动化层已经是 CDP

`browser-automation.ts`（472 行）**全部**通过 `contents.debugger.sendCommand()` 调 CDP 域（Accessibility/DOM/Runtime/Input/Page），Electron 内置 `webContents.debugger` 只是 CDP 传输层。→ **替换 WebContentsView 不需要动自动化层，只换 CDP 传输层**，95% 代码复用。

## 5. 推荐方案：CDP 接管系统 Chrome（方案 A）

### 5.1 架构

```
DesktopBrowserPanel.vue（前端不变：tab/导航/截图/交互接口保持）
        │ IPC（不变）
        ▼
browser-manager.ts ──► engine: 'embedded'（现状 WebContentsView，保留兜底）
        │            └─ engine: 'system'（新）spawn 系统 Chrome/Edge
        ▼
CDPClient 抽象（新增 browser-cdp-client.ts）
   ├─ 后端 A：Electron contents.debugger（现状，embedded 用）
   └─ 后端 B：ws://127.0.0.1:<随机端口>（system 用，标准 CDP）
        ▼
browser-automation.ts（472 行全部复用，仅注入点改 CDPClient）
```

### 5.2 实现步骤（预计 2~3 小时）

| # | 步骤 | 改动位置 | 说明 |
|---|---|---|---|
| 1 | 新增 `browser-cdp-client.ts` | 新文件 | 抽象 `sendCommand(cmd, params)` / `on(event, cb)`，两种后端；system 模式用 `ws` 包（electron 已依赖 ws）或手写 WS |
| 2 | profile 增 `engine` 字段 | `browser-profile-store.ts` | `'embedded' \| 'system'`，默认 system |
| 3 | 探测系统浏览器路径 | 新逻辑 | 注册表/标准路径探测 Chrome → Edge（`%ProgramFiles%/Google/Chrome/Application/chrome.exe` 等） |
| 4 | `buildTab()` system 分支 | `browser-manager.ts`（~30%） | spawn Chrome：`--remote-debugging-port=0`（随机端口，读 stderr 拿实际端口）+ `--user-data-dir=<独立 profile 目录>` + `--no-first-run`；`Target.createTarget` 建 tab；导航/标题/崩溃事件改订阅 CDP Page/Network 事件 |
| 5 | 传输层替换 | `browser-automation.ts`（~5%） | `contents.debugger` 引用 → 注入的 CDPClient |
| 6 | 生命周期 | `browser-manager.ts` | 桌面版退出时优雅关闭 Chrome 进程；崩溃自动重启 |
| 7 | 验证 | 本机 + 4 台 PVE | B 站/YouTube 登录态、代理、MCP toolset 全回归 |

### 5.3 为什么这个方案能根治

| 硬伤 | 替换后 |
|---|---|
| 指纹 | 真 Chrome，0 伪装，B 站/YouTube 直接认 |
| 登录态 | 独立 profile + 复用 ABE cookie 导入链（已破 2892 条），cookie 与指纹同源不再冲突 |
| 代理 | Chrome 默认跟随系统代理，外网站直接通；或 profile 配 `fixed_servers=127.0.0.1:10808` |
| CDP | 标准 9222 端口，Playwright/Puppeteer/外部注入全工具链可用 |
| MCP 控制 | 接口不变，agent 控制能力全保留（0.7.27 自动化层原样复用） |

### 5.4 浏览器选型对比

| 维度 | Chrome | Edge | Brave | Electron 换内核 |
|---|---|---|---|---|
| 指纹正常度 | ★★★★★（就是 Chrome） | ★★★★★（Chromium） | ★★★★☆ | ★★☆（还是 Electron） |
| 登录态复用 | ★★★★★（ABE 链已破；用户 Chrome 登录态迁移链路已有） | ★★★★☆（同链路，需 Edge 路径适配） | ★★★☆☆ | ★☆☆☆☆ |
| Windows 必装 | 多数机器有 | ✅ 系统自带 | ❌ 需安装 | — |
| 代理 | 跟随系统 | 跟随系统 | 跟随系统 | 绕系统（现状） |
| 生态/调试 | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★☆ |
| **推荐** | **首选** | **自动降级备选** | 不推荐 | 排除（无意义） |

**选型结论**：Chrome 首选、Edge 自动降级。实现上做"路径探测链"：Chrome → Edge → 都找不到回落 embedded。

### 5.5 风险与缓解

| 风险 | 缓解 |
|---|---|
| 上游同步冲突 | browser-manager/automation 是上游文件，后续 merge 需重应用；方案落地后更新 CUSTOM_CHANGES.md 自研清单（第 4 项：系统浏览器引擎） |
| Chrome 进程残留 | 生命周期事件（before-quit）统一清理；异常崩溃自动重启 |
| 与用户日常 Chrome 冲突 | 强制独立 `--user-data-dir`（放 `~/.hermes-web-ui/desktop-browser/system-profile/`），绝不碰用户 profile |
| CDP 端口占用 | `--remote-debugging-port=0` 随机端口 + 从 stderr 读回实际端口 |

## 6. 备选方案（更轻，若不想动内核）

| 方案 | 做法 | 代价 | 适用 |
|---|---|---|---|
| B. 外部拉起 | 桌面版"浏览器"按钮改为直接拉起系统 Chrome（用户 profile），Hermes 只做辅助 CDP 控制 | 失去面板内嵌 tab 体验 | 可接受独立窗口时 |
| C. 现状修补 | 保留 WebContentsView，只修指纹/代理/cookie | 治标不治本，指纹风控无解 | 不想动架构时 |

**推荐 A**；B 可作为 A 的过渡（先验证 CDP 链路再改面板）；C 仅作临时。

## 7. 决策点

1. 是否按方案 A 实施（我建议：是，折叠进下一轮升级）
2. 浏览器优先级：Chrome → Edge（默认），还是要强制 Chrome only
3. 面板 UI 是否保留标签页式（A 方案保留），还是接受 B 的独立窗口

---

（方案确认后更新本文件为实施记录，并同步 CUSTOM_CHANGES.md 自研清单与 MAINTAIN.md）