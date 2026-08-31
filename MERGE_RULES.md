# 合并规则 — 上游同步冲突处理标准

> 本文件定义每次把 `EKKOLearnAI/hermes-studio`(最上游) 同步进本 fork 时，
> 遇到冲突"听谁的"。目标是:**最上游有新功能照单全收 + 本 fork 个人喜好功能一个不丢。**

## 总原则

1. **代码冲突** → 带 fork 标记的保留 fork 版，其余取上游
2. **配置文件冲突** → 取上游，但**保留 fork 独有依赖**
3. **文档冲突** → 取上游
4. **目录结构变了** → 跟着上游走，把 fork 独有的文件搬到新位置

---

## 一、fork 独有功能清单(合并时 MUST 保留)

| # | 功能 | 标记/特征 | 保留策略 |
|---|------|----------|---------|
| 1 | 默认深色主题 + 内置壁纸 | `useTheme.ts` 的 `brightness: dark` + 壁纸数据 | 取 fork，重新应用减号上游不冲突部分 |
| 2 | 消息队列 | `preempt` / `promote` / `queued` 标记 + ChatInput ESC/Ctrl+Enter | **保留 fork 版** |
| 3 | Windows 桌面字体缩放 | `[zoom patch]` 注释块 | **保留 fork 版** |
| 4 | earmark 注解系统 | `toggleEarmark` / `earmark-server` 依赖 / `startEarmark()` | **保留 fork 版，跟随目录迁移** |
| 5 | Cookie 导入 | `cookie-importer/` + `importBrowserCookies` | **保留 fork 版** |
| 6 | URL 跳系统默认浏览器 | `openUrl` IPC | 保留 fork 版 |
| 7 | 路径完整显示 | `ChatPanel.vue` 去掉 pop() | 保留 fork 版 |
| 8 | 自定义图标 | `desktop/build/icon.ico` 等 | 保留 fork 版 |

## 二、依赖合并规则(package.json / desktop package.json)

- **上游新增的依赖** → 全部保留(它们是新功能需要的)
- **fork 独有依赖** → 全部保留(它们是个人功能需要的)
- 冲突时 = **两边依赖都写上**(取并集)
- lock 文件冲突 → 取上游后跑 `npm install` 重新生成

## 三、目录结构变化处理

- 上游把 `packages/server/src/services/earmark.ts` 移到
  `packages/server/src/modules/studio/services/earmark.ts`
  → **fork 的 earmark 也跟着移过去**，并同步更新 import 路径
- 上游删了 `shutdown.ts`(重构了)— fork 的改动要么迁到新文件，要么弃用

## 四、冲突文件逐个策略

| 文件 | 策略 |
|------|------|
| `README.md` / `README_zh.md` / `docs/*` | 取 **上游** |
| `package-lock.json` / `desktop/package-lock.json` | 取上游后 `npm install` |
| `package.json` / `desktop/package.json` | 依赖取并集 |
| `App.vue` | 上游为主，检查 fork 壁纸/主题逻辑是否被覆盖 |
| `MessageList.vue` | 上游为主，**补回 fork 队列按钮逻辑** |
| `desktop/src/main/index.ts` | 上游为主，**补回 `[zoom patch]` 块** |
| `server/src/index.ts` | 上游为主，**补回 `startEarmark()` 启动** |
| `services/earmark.ts` | **迁移到新目录** `modules/studio/services/` |
| `services/shutdown.ts` | 遵循上游删除，fork 改动评估迁移 |

## 五、合并后强制验证(缺一不可)

```bash
npm install            # 安装合并后的依赖
npm run build          # 必须编译通过
npm run test           # 跑单测
npm run harness:check  # 检查硬规则
# 手动回归:深色主题/消息队列/earmark/cookie/缩放 五项功能可用
```
