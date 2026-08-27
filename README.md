# 爱马仕 (Hermes Studio) — 自用 Fork

基于 [EKKOLearnAI/hermes-studio](https://github.com/EKKOLearnAI/hermes-studio) 的个人定制版，默认深色主题，内置自研功能。

## 与上游的区别

| 功能 | 说明 |
|------|------|
| 默认深色主题 | 不跟随系统，打开即深色 + 矩阵绿壁纸 |
| 消息队列 | 回复生成中发消息排队不打断；ESC / ↑ / Ctrl+Enter 逐条放行 |
| Windows 字体缩放 | Ctrl+加减号缩放界面，重启保留 |
| earmark 注解 | 内置浏览器圈选页面元素加备注，broker 随服务启动 |
| Cookie 导入 | 从系统 Chrome 导入登录态到内置浏览器 |
| URL 跳转 | 点聊天里的 URL 跳系统默认浏览器 |
| 路径完整显示 | 对话标题右侧完整显示工作区路径 |
| 自定义图标 | 深色圆角方块 + 渐变 H |
| 内置壁纸 | 14 种深色主题壁纸可选 |

## 安装

### Windows 桌面版（推荐）

1. 从 GitHub Actions 下载最新 `AimaShi-*-x64.exe`（见 [BUILD_RELEASE.md](./BUILD_RELEASE.md)）
2. 双击运行，选择安装目录，完成
3. 开始菜单搜索「爱马仕」启动

### 网页版部署（931 服务器）

```bash
cd /opt/hermes-studio-ekko
git fetch fork main && git reset --hard fork/main
npm ci --include=dev
npm run build
systemctl stop hermes-web-ui
cp -r dist /usr/lib/node_modules/hermes-web-ui/dist
cp package.json /usr/lib/node_modules/hermes-web-ui/package.json
systemctl start hermes-web-ui
```

访问 `http://192.168.9.31:8648`

### 本地开发

```bash
npm ci --include=dev
npm run dev          # 开发模式
npm run build        # 编译产物
npm run test         # 单元测试
```

## 配置

| 环境变量 | 说明 | 默认 |
|---------|------|------|
| `HERMES_HOME` | Hermes Agent 数据目录 | `~/.hermes` |
| `HERMES_WEB_UI_HOME` | Web UI 状态目录 | `~/.hermes-web-ui` |
| `HERMES_WEBUI_STATE_DIR` | 同上（备选） | — |

## 文档

- [CUSTOM_CHANGES.md](./CUSTOM_CHANGES.md) — fork 改动详情与上游同步记录
- [BUILD_RELEASE.md](./BUILD_RELEASE.md) — 编译、下载、部署完整流程
- [DEVELOPMENT.md](./DEVELOPMENT.md) — 开发规范（上游维护）
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架构说明（上游维护）

## 仓库结构

```
packages/
  client/    — Vue 3 前端
  server/    — Koa API + Socket.IO
  desktop/   — Electron 桌面壳
tests/       — Vitest + Playwright 测试
.github/     — CI workflows（desktop-manual-build / desktop-release）
```

## 版本

当前：`0.6.47-fork.5`（上游 v0.6.47 + fork 改动）

上游同步策略：`git merge upstream/main`，冲突时保留带 `[zoom patch]` / `[preempt patch]` 标记的代码块，其余取上游。
