# 集群标准（本机 = 唯一标准样本）

> 制定于 2026-11-20。原则：**本机 Windows 桌面版测试通过 → 才同步给 PVE**。
> 本机不是"另一台机器"，是**黄金样本**。任何参数冲突，以本机为准，除非本文件另有标注。

## 0. 五个终端

| 终端 | 角色 | 说明 |
|---|---|---|
| **本机 Windows 桌面版** | **黄金样本** | 所有变更先在这里验证 |
| 931 | PVE 生产 | `/opt/hermes-studio-ekko` |
| **935** | **已退出本项目** | 用户 2026-11-20 确认 935 不再承载 EKKO。内存仅 1.9G，`vite build` 必 OOM |
| 936 | PVE 生产 | `/opt/hermes-studio-fork`（服务跑 ubuntu 用户）|
| 961 | PVE + New API | `/opt/hermes-studio` + 4010/4013 网关 |

> **同步范围 = 本机 + 931 + 936 + 961 四端**。935 不在范围内。

### 0.1 provider 命名差异（已知，不要强行统一）

| 终端 | provider 名 | gateway 模型 ID |
|---|---|---|
| 本机 / 935 / 936 / 961 | `custom:商汤` / `custom:腾讯` | `商汤/sensenova/<model>` |
| 931 | `custom:sensenova` / `custom:tencent` | `sensenova/sensenova/<model>` |

**实测：把 provider 名改成中文后，该 provider 会直接从 gateway 消失**（961 验证，只剩腾讯 31 个）。
所以**只统一参数，不统一名字**。写测试脚本时按机器选前缀。


---

## 1. 模型配置（唯一权威，2026-11-20 校对）

配置文件：`~/.hermes-web-ui/providers/users/1/config.yaml`
（**不是** `~/.hermes/config.yaml` —— 那个对 coding-agent 无效，见全局 AGENTS.md §8）

### 1.1 商汤（base_url `http://192.168.9.61:4010/v1`，api_key `sk-1111`）

| 模型 | context_length | max_tokens | vision | 备注 |
|---|---|---|---|---|
| `sensenova/deepseek-flash` | 1048576 | 393216 | ✅ | 实测支持图片（2026-11-20 验证） |
| `sensenova/glm-5.3` | 1048576 | 131072 | ❌ | |
| `sensenova/kimi-k3` | 1048576 | 131072 | ✅ | 原生视觉 |
| `sensenova/sensenova-6.8-flash` | 1048576 | 131072 | ✅ | 强制思考，思考令牌含在 max_tokens |
| `sensenova/sensenova-6.8-flash-lite` | 262144 | 65536 | ✅ | |
| `sensenova/sensenova-u1.5-lite` | 262144 | 65536 | ❌ | **生图模型**，走 `/v1/images/generations` |
| `sensenova/sensenova-u1.5-fast` | 262144 | 65536 | ❌ | **生图模型** |

### 1.2 腾讯（base_url `http://192.168.9.61:4013/v1`）

14 个模型，完整值见本机 config.yaml。**长任务、agent 模式、大上下文一律走这组**（不受商汤 RPM 限制）。

### 1.3 ⛔ 已知错误配置（931/935/936 现状，必须改）

931 等机器上商汤组**全部填成 `262144 / 65536`**，这是初版偷懒值：

| 错误 | 后果 |
|---|---|
| ctx 1M 写成 262144 | 浪费 3/4 上下文，长文档直接截断 |
| deepseek-flash 输出 393216 写成 65536 | 少 6 倍，长回答被砍 |
| glm-5.3 / kimi-k3 / 6.8-flash 输出 131072 写成 65536 | 少一半 |
| kimi-k3 / glm-5.3 的 vision 标记缺失 | 模型能力未被 UI 识别 |

**同步时以第 1.1 节表格为准覆盖。**

---

## 2. MCP 白名单（EKKO 项目用）

### 2.1 本机实测保留（4 个）

| MCP | 用途 | 备注 |
|---|---|---|
| `github` | 仓库/PR/issue | token 明文在 config，待改环境变量 |
| `tavily936` | 搜索 | `http://192.168.9.36:60002/mcp` |
| `hindsight` | 记忆 | `http://192.168.9.36:8888/mcp/user/` |
| `node_repl` | ChatGPT 桌面版 browser/computer-use | **仅本机需要**，PVE 不需要 |

### 2.2 已删除（不要加回来）

| MCP | 删除原因 |
|---|---|
| `ai-memory` | 与 `hindsight` 功能重复；且 skills 里有 6 个 ai-memory-* |
| `codebase-memory-mcp` | 与 `hindsight` 重复，且本地 exe 路径不存在 |
| `playwright` | 与浏览器类 skill + browser MCP 三重重复 |
| DSH 的 5 个（github/playwright/tavily/hindsight/ai-memory） | 曾导致 15 万 token 卡死，已全部移除 |

### 2.3 PVE 上额外的

PVE 的 Studio 自带 gateway MCP 组（`ekko-studio-api` / `-plugins` / `-browser` / `-use` / `-interaction`），由服务端自动生成，**不要手改**。

---

## 3. Skills（不是全量同步！）

### 3.1 铁律

- 本机 `~/.agents/skills` 共 **144 项**，**只同步 EKKO 需要的子集到 PVE**
- PVE 上放在 `~/.hermes/skills/`（931/935/961 是 root，936 是 ubuntu）
- **不要**把 lark / frida / android / pve-ssh 等与本项目无关的推过去

### 3.2 EKKO 项目需要（建议白名单，待确认）

| 类别 | skills |
|---|---|
| Office / 文档 | `workbuddy-*` 系列（docx / pptx / sheetagent / pdf）|
| 浏览器 | `ego-browser`、`browser-testing-with-devtools`、`lightpanda` |
| 开发 | `code-review`、`tdd`、`implement`、`improve-codebase-architecture`、`diagnosing-bugs` |
| 记忆 | `ai-memory-*`（6 个）|
| 自研运维 | `zz-pve-ssh`、`zz-ai-config-sync` |
| 前端/设计 | `ui-ux-pro-max`、`web-design-guidelines`、`design-taste-frontend` |

### 3.3 明确不同步

`lark-*`（28 个，飞书）、`frida-*`（14 个）、`zz-android-*`、`zz-tabs-recover`、`zz-browser-backup` 等与 EKKO 运行时无关的。

---

## 4. 智能体（coding agents）

### 4.1 本机（黄金样本，2026-11-20 实测全部可用）

| agent | 版本 | 备注 |
|---|---|---|
| claude-code | 2.1.327 | |
| codex | 0.170.0 | **必须经 gateway**（只支持 `wire_api="responses"`）|
| opencode | **2.2.5（v2）** | v1 已废弃；官网 `curl -fsSL https://opencode.ai/v2/install \| bash` |
| dsh | 0.2.2-rc.1 | |
| codebuddy | 2.183.0 | |
| zcode | 0.17.1 | |

### 4.2 PVE（931 实测）

| agent | 版本 | 差异 |
|---|---|---|
| claude-code | 2.1.328 | 比本机新 1 个补丁 |
| codex | 0.170.0 | 同 |
| opencode | **2.3.2（v2）** | 比本机新 |
| dsh | 0.2.2-rc.5 | 比本机新 |

**结论**：agent 版本不必强求一致，但**主版本线必须一致**（尤其 opencode 必须 v2）。

### 4.3 驱动方式（关键，别再用 REST）

coding agent 的 run **不走** `POST /api/coding-agents/runs` + `/runs/:sid/input`。
必须用 **Socket.IO `/chat-run`** 命名空间：

```js
socket.emit('run', {
  input, session_id, coding_agent_id: 'codex',
  mode: 'scoped', provider: 'custom:商汤', model: 'sensenova/deepseek-flash'
})
```

脚本模板：`/tmp/sock_agent.js`（PVE）、`C:/Users/Administrator/.workbuddy/local_sock.js`（本机）。

---

## 5. 提示词

`packages/server/src/modules/studio/public/runs/prompt.ts` 三节：

| 节 | 常量 | 注入条件 |
|---|---|---|
| ① 输出格式规范 | `AI_OUTPUT_FORMAT_GUIDELINES`（中）/ `_EN` | 恒注入，按 outputLanguage 二选一 |
| ② MCP 使用规范 | `HERMES_MCP_USAGE_GUIDELINES` + `BROWSER_MCP_GUIDELINES` | 按 capabilities 动态拼 |
| ③ 工作流节点 | `WORKFLOW_NODE_SYSTEM_CONTEXT` / `_ZH` | 仅 source=workflow |

**2026-11-20 已改**：路径示例去硬编码、700 字浏览器规则拆 7 条、补中文 workflow。

---

## 6. 同步流程（一条龙）

```
本机改 → 本机实测通过（webui 200 + agent 对话出结果）
  → 提交 GitHub sync 分支
  → PVE 逐台部署（不要批量，一台一台来）
  → 每台浏览器验收
  → 记账 UPDATE_LOG.md
  → 跑 delivery-verify.mjs
```

**禁止**：本地没验证完就推 PVE；PVE 一次推 4 台。

---

## 7. 启动方式（桌面版专用坑）

`Start-Process` / `cmd start` 启动 Electron 会立即退出（exit 0，无报错）。

必须：
```powershell
explorer.exe "C:\Users\Administrator\AppData\Local\Programs\Ekko Studio\Ekko Studio.exe"
```

---

## 8. 变更记录

- 2026-11-20：建立本文件。确立"本机 = 黄金样本"。修正商汤参数表（931 全填 262144/65536 是错的）。skills 改为白名单制（不全量同步）。
