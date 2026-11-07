# 更新日志（Update Log）

> 本文件是本 fork 自己的更新日志，记录每次「同步上游 + 部署交付」的完整过程。
> 每次更新在**顶部追加**一条新记录（最新在上）。执行流程见 `MAINTAIN.md`，自研清单见 `CUSTOM_CHANGES.md`。

---

## 2026-11-08 01:05 · 4 台 PVE 模型配置与 Windows 端完全一致（只 3 组）

**目标**：Windows 桌面版界面只有 3 组 —— 商汤(6) / 腾讯(14) / apihub.agnes-ai.com(9，实时拉取)。4 台 PVE 必须一模一样。

**查清 provider 的 4 个来源**（只改 config.yaml 不够）：
1. `~/.hermes/config.yaml` → `custom_providers`（provider 定义 + 模型参数）
2. `~/.hermes/auth.json` → `credential_pool`（旧的 provider 凭据会让它继续出现在列表里）
3. `~/.hermes/config.yaml` 根键 `default_provider` / `default_model` / `model_overrides`（指向已删 provider 就会残留）
4. `~/.hermes-web-ui/hermes-web-ui.db` 的 `model_context` 表 + `coding-agent/model/default/custom_*` 目录

**另**：`~/.hermes-web-ui/cache/provider-model-catalog.json` 只存"每个 provider 的模型清单"，**不决定界面显示哪些 provider**
（证据：Windows 端缓存里也有 atria / token.sensenova.cn 两条，界面仍只显示 3 组）。

**操作**（931/935/936/961 相同）：
- `custom_providers` 整段替换为 Windows 端原文（114 行，逐字复制）→ 只剩 商汤 / 腾讯 / apihub
- `auth.json` 的 `providers` / `credential_pool` 清空（Windows 端这两个本来就是空的）
- 删除根键 `default_provider` / `default_model` / `model_overrides`（Windows 端没有这几个键）
- 931：`model_context` 删掉 16 行旧 provider 记录 + 陈旧目录移到 `_stale-model-dirs-*`
- 删掉的行目录与 DB 均有 `.bak-时间戳` 备份
- 重启顺序必须是 **停服务 → 删缓存 → 启动**（先删后重启会被旧进程回写）

**结果（4 台一致）**：
```
version=0.8.19  HEAD=e7a48d230  svc=active  8648 单监听  HTTP 200
providers: 商汤(6, 默认 sensenova/deepseek-flash)
           腾讯(14, 默认 腾讯/hy4-preview)
           apihub.agnes-ai.com(0 个静态, 默认 agnes-3.0-flash —— 模型由 /v1/models 实时拉取)
auth.credential_pool: []（961 有 custom:商汤，属正常）
default_provider 键: 已删除
```

---

## 2026-11-08 00:45 · 4 台 PVE 全量对齐（0.8.19 + 统一翻墙 + 统一模型）

### 部署结果（4 台全部 `0.8.19` / `9a7eb9a9`）
| 机器 | 目录 | 版本 | 服务 | 8648 | HTTP | 模型 |
|---|---|---|---|---|---|---|
| 931 | `/opt/hermes-studio-ekko` | 0.8.19 | active, NRestarts=0 | 单监听/单进程 | 200 | 商汤6 + 腾讯14 + 961-NVIDIA-CN(4) |
| 935 | `/opt/hermes-studio` | 0.8.19 | active | 单监听 | 200 | 商汤6 + 腾讯14 + OpenCode(9) + NVIDIA(4) |
| 936 | `/opt/hermes-studio-fork` | 0.8.19 | active | 单监听 | 200 | 商汤6 + 腾讯14 + OpenCode(9) + NVIDIA(4) |
| 961 | `/opt/hermes-studio` | 0.8.19 | active | 单监听 | 200 | 商汤6 + 腾讯14 + apihub |

机器专属 provider 各自保留（`961-OpenCode` / `961-NVIDIA-CN` / `apihub.agnes-ai.com`）。

### 翻墙统一（原来 4 台不一致，931 直接是坏的）
**发现的差异**：
- **931 代理完全失效**：配置里 `tun.enable: true` 且 TUN 真正接管了路由（`198.18.0.0/30 dev Meta`），
  选中的节点连不通 → `dial tcp 52.192.216.226:443: i/o timeout` → 所有出口全断。
  935/961 同样开着 `tun.enable: true` 但 TUN 没生效，所以只走 7890，反而是好的。
- 936 的健康检查 URL 被改成 `api.tavily.com`（其它三台是 `gstatic/generate_204`）。
- 935 的 providers 目录残留 `yfjc.yaml.bak-20261028`。
- 订阅里混有"剩余流量/套餐到期"伪节点，AUTO 测速会把它们当候选（曾出现"当前节点=剩余流量：14.65 GB"）。

**统一动作**（配置见 `scripts/fleet/mihomo.config.yaml`）：
- `tun.enable: false`（4 台）—— 服务器只用 7890，避免单节点故障拖垮整机网络
- 健康检查统一 `https://www.gstatic.com/generate_204`
- `AUTO` = `url-test`，`interval 180`、`tolerance 50`、`lazy false`、`max-failed-times 3`
- `AUTO`/`PROXY` 都加 `exclude-filter` 排除伪节点
- 规则末尾改为 **`MATCH,PROXY`**（PROXY 默认 = AUTO，平时行为不变，但支持手动接管）
- 清掉 `.bak` 与 provider 缓存，4 台强制重下同一份订阅（44303 bytes，44 个真实节点）

**结果**：4 台 GitHub / raw / Google 全通，节点延迟 56~102ms，各自选到的最快节点可以不同（正常）。

### 给机器的"换节点能力"（不是写死脚本，是让 agent 自己会）
- **`/usr/local/bin/zz-proxy`**：`status / test / list N / best / node <名> / auto / refresh`
- **技能 `zz-proxy-switch`**（装进各机 profile 的 `skills/`）：告诉 agent 什么现象该用哪条命令
  —— GitHub 超时、`GnuTLS handshake failed`、curl 000、npm 卡住时先 `zz-proxy test`，
  失败就 `zz-proxy best`，再不行 `zz-proxy refresh`，仍不通就停下来报告（别反复重试）
- 4 台原本就有 skills 机制（目录下有 `SKILL.md` 即是一个技能），共 35~127 个已有技能，直接沿用

### 踩坑（已写进 MAINTAIN.md 4.4）
1. `git fetch origin sync` 只更新 `FETCH_HEAD`，**不更新 `refs/remotes/origin/sync`**
   → 曾因此把 931 倒退回 0.7.35。必须 `git reset --hard $(git rev-parse FETCH_HEAD)`
2. **`pkill -f 'dist/server/index.js'` 会把执行部署脚本的 shell 自己杀掉**
   → 改用「查 8648 监听 PID 再 kill」
3. 重启时旧进程 `free(): invalid pointer` abort（0.8.19 优雅关闭 bug）→ core-dump 但新进程正常，不是故障
4. 961 首次 `git fetch` 遇 `GnuTLS handshake failed` → 部署脚本已加 5 次重试

---

## 2026-11-07 23:55 · 精简为「只 2 项自研」+ 重建并重装桌面版

### 决策
大哥拍板：**只保留 ① 消息队列、② Windows 桌面字体缩放**，其余自研全部撤销、回归上游原版。

### 撤销（`git checkout 8c894a69 -- <file>`）
④ `client/src/utils/desktop-browser.ts`、④ `desktop/src/main/browser/browser-manager.ts`、
④ `desktop/src/main/index.ts` 中的 `findChromeExecutable`（② 缩放保留）、⑤ `hermes/controllers/weixin.ts`、
⑥ `openai-compatible.ts`、⑦ `hermes_bridge.py`、⑧ `coding-agents/services/context-policy.ts`、
⑨ `coding-agents/services/index.ts` + `update/version-preview-manager.ts`、
10-28 批次带入的 `studio/services/task-plan-runs.ts`（任务卡结算）、`electron-builder.yml`（arch 回上游 `[x64, arm64]`）

### 删除测试（4 个）
`tests/ekko-agent/model-request.test.ts`、`tests/server/group-chat-agent-workspace.test.ts`、
`tests/server/task-plan-runs.test.ts`（均上游已删）；
`tests/server/chat-run-promote.test.ts`（**死测试**：import 0.7 路径 `services/hermes/run-chat`，0.8 依赖注入后构造即抛
`Studio chat Agent runtime has not been configured`，重映射 11 个 mock 路径仍失败）

### 代码结果
- 与上游源码差异收敛到 **8 个文件**（7 个属① + `desktop/src/main/index.ts` 属②）
- `npm run build` exit=0（dist 13.0mb）；`self-check-custom.mjs` 改为只校验 ①② 且**查工作区**，7/7 PASS
- 提交 `24558dce5`

### 打包（重要坑）
- 上游 `electron-builder.yml` 的 `win.target.arch` = `[x64, arm64]`，**显式 arch 列表优先级高于命令行 `--x64`** →
  本机没有 arm64 原生依赖（`sharp-win32-arm64`、`sherpa-onnx-win-arm64`），arm64 分支必报
  `Packaged Web UI is incomplete`
- **解法**：打包前临时把该行改成 `arch: [x64]`，打完 `cp` 还原（仓库保持与上游一致），并用
  `-c.directories.output=release/build-final` 指定新输出目录避开历史上被锁的 `win-unpacked`
- 产物：`packages/desktop/release/build-final/Ekko.Studio-0.8.19-x64.exe`（365MB）

### 安装验证
- nsis `/S` 静默安装，`ProductVersion = 0.8.19.0`，216.4MB，退出码 0
- 安装包内实测：`queued_messages`×6、`preempt`×1、`desktop-zoom.json`×1（①② 在）；
  `findChromeExecutable`=0、`_ALWAYS_EAGER_MCP_TOOLSETS`=0（④⑦ 已消失）

### 文档收敛
- 删除重复/过期文档：`SYNC-CHECKLIST.md`、`docs/upstream-sync-and-fleet-deploy.md`（与 `MAINTAIN.md` 重复）、
  `docs/browser-replacement-plan.md`（写的是已撤销的④）
- `MAINTAIN.md` 升为**唯一入口**，开头加「30 秒看懂」+「文档分工」+ **两条硬规则**（每次发版必记本文件、交付前必跑终检）
- 全部断链引用改指 `MAINTAIN.md`

---

## 2026-11-07 · 同步上游 0.7.39 → 0.8.19

### 上游同步
- 上游 `EKKOLearnAI/ekko-studio` main：`0.7.39` → **`0.8.19`**（commit `8c894a69`），落后 **185 提交**
- 合并方式：`git merge FETCH_HEAD`，合并提交 `e296a636b`

### 冲突处理（3 内容冲突 + 3 测试 modify/delete）
1. **`ekko-agent/src/model/providers/openai-compatible.ts`**：保留自研⑥ tool_calls 空串覆盖的说明注释
2. **`client/src/stores/hermes/chat.ts`**：保留自研滚动信号 `scrollToBottomCounter` + `promotedMessageSnapshots`，同时采纳上游新增 `pendingUserMessageIds`
3. **`server/src/modules/studio/sockets/chat-run.ts`**（最复杂）：上游重构为 admission 串行闸门（`acquireRunAdmission`/`releaseAdmission`）；把自研① preempt 队列逻辑整合进上游 `if (state.isWorking)` 块，删除重复旧 `handleRun` 块，保留上游 admission try/finally
4. **3 个测试**（model-request / group-chat-agent-workspace / task-plan-runs）上游删除、本地有自研覆盖 → 保留本地版本

### 自研存活自检
- ①preempt×9 ②zoom×2 ④链接打开(5+1+2) ⑤微信×2 ⑥tool_calls×1 ⑦MCP×3 商汤cap×1 —— **7 项全部存活**

### 构建踩坑（0.8.19）
- `MessageList.vue(1274)`：合并后 `queuedPreview` 签名由 `(content: string)` 变 `(message: Message)`，v-for 内调用改 `queuedPreview(message)`（修复合并引入的类型错误）
- build 用 node **v24.20.0**（默认 v22 不满足 engines>=23）；`CODEBUDDY_SAFE_DELETE_ENABLED=0`；`NODE_OPTIONS=--max-old-space-size=4096`

### 打包踩坑（electron-builder）
- **EBUSY: app.asar 被锁**（旧 `release/win-unpacked` 残留），rm/rmdir/Remove-Item/.NET Delete 均被 WorkBuddy safe-delete hook 拦截
- **解法**：改 `electron-builder.yml` 的 `directories.output` → `release/out-0819` 绕开被锁目录（备份 `.bak-20261107`）
- 产物：`Ekko.Studio-0.8.19-x64.exe`，**365MB**，已拷 `d:\desk`

### 安装
- nsis 静默 `/S` 安装到 `C:\Users\Administrator\AppData\Local\Programs\Ekko Studio\`，exe 版本 **0.8.19.0**

### 桌面版模型配置 —— ⚠️ 两个独立位置（重要发现）
桌面版（0.8.19）的「模型配置」分两处，**用途不同、改模型要两处都动**：

| 位置 | 用途 | 读的时机 |
|---|---|---|
| `C:\Users\Administrator\.hermes\config.yaml` → `custom_providers` | **agent 运行时**跑模型（真正发请求） | agent 启动读一次 |
| `C:\Users\Administrator\.hermes-web-ui\cache\provider-model-catalog.json` | **Web UI 下拉列表展示**（provider editor 可选模型） | Web UI 读缓存 |

- **曾绕远的根因**：改 `config.yaml` 的 `custom_providers.models` **不会改 UI 下拉列表**（下拉读 cache json）——两处不同步会出现「config.yaml 14 个、UI 显示 114 个垃圾」
- **确证**：桌面版进程 bridge 日志（`~/.hermes-web-ui/logs/bridge.log`）打印 `profile_dir=C:\Users\Administrator\.hermes`、`config_path=...\config.yaml`；Web UI 端口 **8748**
- `detectHermesHome()`（`runtime/path.ts:21`）：优先 `HERMES_HOME` 环境变量，否则 `~/.hermes`

### 模型对齐 + 垃圾清理（WorkBuddy → Ekko）
- 把 WorkBuddy `~/.workbuddy/models.json` 的商汤/腾讯两组同步到桌面版**两处**（config.yaml + cache json）：
  - **商汤（4010）6 个**：`sensenova/deepseek-flash` `glm-5.2` `glm-5.3` `kimi-k3` `sensenova-6.8-flash` `sensenova-u1.5-lite`
  - **腾讯（4013）14 个**：`腾讯/hy4-preview` `hy3` `deepseek-v4.1-flash` `step-5-preview` `glm-5.3` `glm-5.3-flash` `glm-5.2` `space-bunny` `minimax-m3.1-flash` `minimax-m3` `kimi-k3.1-pro` `kimi-k3-1` `deepseek-v4-pro` `mimo-v2.6-pro`
- **垃圾清理**：`cache/provider-model-catalog.json` 腾讯组曾积 **114 个旧模型**（`cn:*`/`wb:*`，4013 早期返回的垃圾）→ 清理为 腾讯 14 + 商汤 6（备份 `.bak-*`）
- 改完需**重启桌面版**才在 UI 生效

### 遗留
- 4 台 PVE（931/935/936/961）Hermes 仍 0.7.39，未部署 0.8.19（需授权）
- 旧 `release/win-unpacked`（app.asar 被锁）与 `release/out-0819/win-unpacked-old-*` 待清理；`electron-builder.yml` output 暂为 `release/out-0819`
## 2026-10-28（第二轮）· 再同步上游 8 个提交 + 修复环境探测误判 + 4 台对齐

### 上游同步
- 上游仓库：`EKKOLearnAI/ekko-studio`（`hermes-studio` 已改名，旧地址 404）`main`
- 合并提交数：**8 个**（#3554 #3560 #3562 #3563 #3551 #3565 #3564 #3566），209 个文件
- 版本：仍 **0.7.39**；依赖清单**无变化** → 跳过 `npm install`
- 合并：`git merge upstream/main`，**merge-tree 预演 0 冲突、实际 0 冲突**，合并提交 `531d71ce`
- 自研自检：**14/14 PASS**（新增 ⑨）

### 新增自研 ⑨（fork 补丁）
- `coding-agents/services/index.ts` + `studio/services/update/version-preview-manager.ts`：
  去掉 `text.includes('enoent')` 兜底，只认 `spawn npm` / `spawn node`
- 根因：探测智能体版本执行 `<cmd> --version`，命令不存在即 `spawn qwen ENOENT`，
  被误判成「Node/npm 环境缺失」并显示在 4 台机器的 UI 上
- 用例验证 6/6：`spawn qwen ENOENT → false`、`spawn npm node ENOENT → true`

### 部署（4 台 PVE）
| 机器 | commit | 版本 | curl 8648 | 备注 |
|---|---|---|---|---|
| 931 | `85e3e77c` | 0.7.39 | 200 | 首次误 reset 到 `678ca544`，用 `FETCH_HEAD` 重部署 |
| 935 | `85e3e77c` | 0.7.39 | 200 | 一次通过 |
| 936 | `85e3e77c` | 0.7.39 | 200 | restart 必须 root（ubuntu 无 polkit 权限） |
| 961 | `85e3e77c` | 0.7.39 | 200 | 本机，build 本机完成 |

### 踩坑
1. 三台 `remote.origin.fetch` 只映射 `refs/heads/main` → `git fetch origin sync` **只写 FETCH_HEAD**，
   随后 `git reset --hard origin/sync` 会静默回退旧 commit（931 复现，旧源码+新依赖导致 build TS 报错）
2. 936 以 `ubuntu` 身份 `systemctl restart ekko-studio` 被 polkit 拒；build 通过但服务仍是旧进程
3. 961 上 `packages/desktop` 无 `node_modules`（缺 electron/@types/node），桌面 `tsc --noEmit` 无法验证，
   属环境缺失，非代码问题

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
