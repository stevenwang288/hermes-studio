# Hermes Studio Windows 桌面版 — 使用与构建指南

> 本 fork（`stevenwang288/hermes-studio`）的 Windows 桌面版操作手册。
> 主控机器：**99号**（192.168.9.99，Windows 11），构建产物放 `D:\DeSK`。
> 更新：2026-08-19

---

## 一、与上游原版的区别（本 fork 自定义改动）

本 fork = 上游最新 + 4 个自定义改动（详见 `CUSTOM_CHANGES.md`）：

| # | 功能 | 说明 |
|---|------|------|
| 1 | **URL 点击跳系统默认浏览器** | 桌面版点聊天里的 URL → 跳 Chrome/Edge 等默认浏览器，不再在内置面板打开 |
| 2 | **标题路径完整显示** | 对话标题右侧的工作区路径完整显示（不限 160px），等宽字体 |
| 3 | 消息队列 | 回复生成中发消息排队不打断；ESC / ↑ / Ctrl+Enter 逐条放行 |
| 4 | Windows 字体缩放 | Ctrl+加号/减号/0 缩放界面，重启后保留 |

> ⚠️ **部署请永远用本 fork，不要用上游原版。** 否则以上功能全部消失。

---

## 二、整机安装（99号 Windows，从零开始）

### 1. 前提软件

| 软件 | 版本要求 | 安装命令 |
|------|---------|---------|
| Git | 任意 | 官网或 winget |
| Node.js | >= 23 | 用 nvm（`nvm install 23`） |
| npm | 随 Node | 自动 |

### 2. 拉取代码（首次）

```bash
cd /d D:\DeSK
git clone https://github.com/stevenwang288/hermes-studio.git
cd hermes-studio
```

### 3. 安装依赖 + 构建 Windows 安装包

```bash
# 根目录：构建 client/server
npm install
npm run build

# 安装 desktop 依赖
npm run desktop:install

# 构建 Windows 安装包（输出到 packages/desktop/release/）
npm --prefix packages/desktop run dist -- --win --publish never
```

产物位置：`D:\DeSK\hermes-studio\packages\desktop\release\*.exe`

### 4. 每日更新的仓库脚本（推荐）

仓库根目录已含自动同步脚本，用法：

```bash
# 检查上游更新 → 自动 merge → 若改到桌面代码则重新构建
bash scripts/sync-upstream.sh
```

## 三、自动更新 + 重新编译（Windows 计划任务）

99号 上已配置 **每天 08:00** 自动执行（见下方「四、定时任务」）。如需手工触发：

```bash
cd /d D:\DeSK\hermes-studio
bash scripts/sync-upstream.sh
```

脚本行为：

1. `git fetch upstream` — 拉取上游最新
2. 检查上游是否更新（对比 `upstream/main` 与本地合并点）
3. 无更新 → 退出（零成本）
4. 有更新 → `git merge upstream/main`（自动合并）
5. **冲突检测**：若 merge 冲突，**不强行解决**，把冲突文件列表写入 `MERGE_CONFLICT.md` 并停止（等人工处理），避免把自定义改动改坏
6. 无冲突 → 若改到 `packages/desktop/` 或 `packages/client/` → 自动重新构建 Windows 包
7. 构建成功 → 把新安装包复制到 `D:\DeSK\hermes-studio-installer\`，写版本号到 `last-build.txt`

## 四、定时任务（已部署在 99号）

| 项 | 值 |
|----|-----|
| 任务名 | `hermes-studio-auto-sync` |
| 触发器 | 每天 08:00 |
| 执行内容 | `sync-upstream.sh`（自动 check + merge + rebuild） |
| 日志 | `D:\DeSK\hermes-studio\sync.log` |

用 `schtasks` 查看：

```bat
schtasks /query /tn hermes-studio-auto-sync /v
```

## 五、日常工作流（99号）

| 场景 | 操作 |
|------|------|
| 启动 Studio 桌面版 | 双击 `D:\DeSK\hermes-studio-installer\Hermes Studio.exe` |
| 查看是否有新版 | `D:\DeSK\hermes-studio\last-build.txt`（含版本+时间） |
| 手动检查上游更新 | `bash D:\DeSK\hermes-studio\scripts\sync-upstream.sh` |
| 升级遇到 merge 冲突 | 看 `MERGE_CONFLICT.md`，把内容发给 36号 |

## 六、注意事项

1. **构建必须从本 fork 源码**，不要用上游 dist 覆盖（`[zoom patch]` / `[preempt patch]` 标记在源码里）。
2. 若新版本提示「检查更新」，忽略——autoUpdater 版本基线已上调（0.6.45-fork.1），不会误提示。
3. `CUSTOM_CHANGES.md` 是改动权威记录，上游 merge 后如发现自定义改动丢失，对照该文档手工补回。
4. 定时任务只做「子集」重建——如果上游改了大量文件（>50），建议人工在 99号 旁边的编辑器里跑一次完整 `npm run build` 再出包。