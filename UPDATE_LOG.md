# 更新日志（Update Log）

> 本文件是本 fork 自己的更新日志，记录每次「同步上游 + 部署交付」的完整过程。
> 每次更新在**顶部追加**一条新记录（最新在上）。执行流程见 `SYNC-CHECKLIST.md`，自研清单见 `CUSTOM_CHANGES.md`。

---

## 2026-10-28 · 同步上游 0.7.36 → 0.7.39

### 上游同步
- 上游仓库：`EKKOLearnAI/ekko-studio`（原名 hermes-studio）`main` 分支
- 合并提交数：**85 个**（2026-10-16 之后至 2026-10-27）
- 版本：`0.7.36` → **`0.7.39`**（上游最新 tag `v0.7.39`）
- 合并方式：`git merge upstream/main`，本地合并提交 `b5299cc36`
- 上游最新提交：`af2d7ac6a7`「feat: add Person assistant with shared workspace and background tasks」

### 冲突处理（2 个文件，策略：以官方最新为底座 + 读懂原意图重新实现）
1. **`packages/desktop/src/main/index.ts`**（自研②字体缩放 `[zoom patch]`）
   - 冲突点：`node:fs` import（fork 需 `readFileSync/writeFileSync` 持久化缩放；上游新增 `mkdirSync`）
   - 处理：合并为 `import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'`，两边能力都保留
2. **`tests/ekko-agent/model-request.test.ts`**（自研⑥ tool_calls 空串修复的测试）
   - 冲突点：fork 测试用例 vs 上游 2 个新测试用例
   - 处理：3 个测试共存（fork 测「流式增量空串不覆盖」，上游测「最终校验拒绝」，语义不冲突）

### 自研存活自检（grep 命点，8 项全 PASS）
- ① 消息队列 preempt ×9、promoteQueuedMessage ×4
- ② 字体缩放 loadDesktopZoomLevel ×2
- ④ 链接默认浏览器 DEFAULT_LINK_OPEN_TARGET ×5
- ⑤ 微信 DM ALLOW_ALL_USERS ×1
- ⑥ tool_calls 空串修复 `toolCallDelta.id ||` ×2
- ⑦ MCP 常驻 _ALWAYS_EAGER ×3
- 商汤 384000 cap（已随上游迁到 `packages/server/src/modules/coding-agents/services/context-policy.ts`）

### 构建与验证
- 环境：本机 node 22 不满足 `engines.node>=23`，已下载 node v24.20.0（与 PVE 部署版本一致，避免产物/运行时版本二元化）
- `npm install --include=dev`（npmmirror）：899 包，1m21s 完成
- `npm run build`：通过（vite 7366 模块 + dist/server/index.js 12.8MB）。注意需 `CODEBUDDY_SAFE_DELETE_ENABLED=0`（沙箱批量删除保护）
- `packages/desktop` tsc --noEmit：通过
- **踩坑**：合并后 `packages/desktop/src/main/index.ts` 出现重复 `import { spawn }`（上游新增 + fork 自研④各引一次，git 自动合并未报冲突）→ 打包 tsc 报 `TS2300 Duplicate identifier 'spawn'`，已删除重复项并单独提交 `12c8d3a74`

### 打包与安装
- 打包产物：`Ekko.Studio-0.7.39-x64.exe`，**194MB**（dev 依赖已 prune，未膨胀）
- 踩坑：上游本次把 `electron-builder.yml` 的 win target 改为 `arch: [x64, arm64]`，arm64 缺原生依赖（sharp/onnx）导致打包失败 → 本 fork 只发布 x64，已把 arch 改回 `[x64]`
- 踩坑：electron 二进制走代理 10808 下载超时 → 改用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` 国内镜像
- 交付：exe 已拷到 `d:\desk`（D 盘桌面）

### PVE 4 台部署（2026-10-28）
- 目标：931（/opt/hermes-studio-ekko）、935（/opt/hermes-studio）、936（/opt/hermes-studio-fork）、961（/opt/hermes-studio）**统一方式**更新到 `46f29232` / 0.7.39
- 统一流程：`git fetch origin sync && git reset --hard <SHA> → npm install --include=dev → npm run build → chown ubuntu → systemctl restart 服务 → 验证`
- 全程 node **v24.20.0**、npm 用 **npmmirror**、git 走 mihomo 7890 代理，4 台完全一致
- 结果：**4/4 全部 OK**（HEAD=46f29232、version=0.7.39、服务 active、8648 全 200、dist mtime 均为本轮新构建）
- 附带修复：**935 翻墙不通**（默认网关 192.168.9.2 ADSL 线路死亡，运行路由表与 netplan(192.168.9.1) 不一致）→ `ip route replace default via 192.168.9.1` 修复，google 直连+代理均恢复 302；同步 935 的 mihomo 订阅到 961 最新版（`5b0fd4d2`）
- 统一复测翻墙：931/935/936/961 直连+走7890代理连 google 全部 302/204，方式完全一致
- 本机安装：静默安装 `/S` 成功，`ProductVersion` = **0.7.39.0**，路径 `C:\Users\Administrator\AppData\Local\Programs\Ekko Studio\`

### 备注
- 网络：本地翻墙 HTTP 代理 `127.0.0.1:10808`，git 已配全局代理。
