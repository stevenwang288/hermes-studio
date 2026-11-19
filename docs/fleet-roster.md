# EKKO 家族清单（Roster）

> **本文件是 EKKO 家族的机器清单 + 模型清单的唯一真相。**
> 增删机器、换模型、改地址 → **必须同步更新本文件**，否则视为未完成部署。
> 最后核对：2026-11-20 08:00（UTC+8）

## 1. 家族成员（4 台）

| # | 代号 | 地址 | 角色 | 部署路径 | 服务用户 |
|---|---|---|---|---|---|
| 1 | **本机** | Windows 本地 | **黄金样本**，所有变更先在此验证 | `%LOCALAPPDATA%\Programs\Ekko Studio` | 当前用户 |
| 2 | **931** | 192.168.9.31 | 生产（GPU 机） | `/opt/hermes-studio-ekko` | root |
| 3 | **936** | 192.168.9.36 | 生产（New API 机） | `/opt/hermes-studio-fork` | **ubuntu** |
| 4 | **961** | 192.168.9.61 | 生产 + 模型网关（4010 商汤 / 4013 腾讯） | `/opt/hermes-studio` | root |

**不在家族内**：935（192.168.9.35）—— 2026-11-20 用户确认为 phone-backend 专用，不再承载 EKKO。

### 1.1 服务信息

| 项 | 值 |
|---|---|
| 服务名 | `ekko-studio`（**只用这个**，禁止 `hermes-studio` / `hermes-web-ui` / `hermes-gateway`）|
| 端口 | 8648 |
| 桌面版端口 | 8748（WebUI）+ 动态 bridge |
| 版本（当前） | **0.8.28**，commit `0f9fdb1b4` |

## 2. 模型清单

### 2.1 provider 命名（**按机器不同，写脚本时必须区分**）

| 机器 | 商汤 provider | 腾讯 provider | gateway 模型 ID 前缀 |
|---|---|---|---|
| 本机 | `custom:商汤` | `custom:腾讯` | `商汤/` |
| 931 | `custom:sensenova` | `custom:tencent` | `sensenova/` |
| 936 | `custom:商汤` | `custom:腾讯` | `商汤/` |
| 961 | `custom:sensenova` | `custom:腾讯` | `sensenova/` |

> 改成一致的实测结果：**该 provider 会直接从 gateway 消失**（961 验证）。所以只统一参数，不统一名字。

### 2.2 商汤组（7 个，全部机器一致）

`base_url: http://192.168.9.61:4010/v1` · `api_key: sk-1111`

| 模型 | context_length | max_tokens | vision | 类型 |
|---|---|---|---|---|
| `sensenova/deepseek-flash` | 1048576 | **393216** | ✅ | chat（DeepSeek V4.1 Flash）|
| `sensenova/glm-5.3` | 1048576 | 131072 | ❌ | chat |
| `sensenova/kimi-k3` | 1048576 | 131072 | ✅ | chat（输出上限动态 = 1M − prompt）|
| `sensenova/sensenova-6.8-flash` | 1048576 | 131072 | ✅ | chat（强制思考）|
| `sensenova/sensenova-6.8-flash-lite` | 262144 | 65536 | ✅ | chat |
| `sensenova/sensenova-u1.5-lite` | 262144 | 65536 | ❌ | **生图** |
| `sensenova/sensenova-u1.5-fast` | 262144 | 65536 | ❌ | **生图** |

官方来源：<https://platform.sensenova.cn/docs>（2026-11-20 核对）

### 2.3 腾讯组（14 个，全部机器一致）

`base_url: http://192.168.9.61:4013/v1`

| 模型 | context_length | max_tokens | vision |
|---|---|---|---|
| `腾讯/hy4-preview` | 960000 | 64000 | ✅ |
| `腾讯/hy3` | 192000 | 64000 | ✅ |
| `腾讯/deepseek-v4.1-flash` | 1000000 | 128000 | ✅ |
| `腾讯/deepseek-v4-pro` | 1000000 | 128000 | ✅ |
| `腾讯/step-5-preview` | 1000000 | 64000 | ✅ |
| `腾讯/glm-5.3` | 1000000 | 64000 | ✅ |
| `腾讯/glm-5.3-flash` | 1000000 | 131072 | ✅ |
| `腾讯/glm-5.2` | 1000000 | 64000 | ✅ |
| `腾讯/space-bunny` | 1000000 | 128000 | ✅ |
| `腾讯/minimax-m3.1-flash` | 1000000 | 128000 | ✅ |
| `腾讯/minimax-m3` | 512000 | 64000 | ✅ |
| `腾讯/kimi-k3.1-pro` | 1000000 | 32000 | ✅ |
| `腾讯/kimi-k3-1` | 1000000 | 32000 | ✅ |
| `腾讯/mimo-v2.6-pro` | 1000000 | 128000 | ✅ |

### 2.4 第三方

| 机器 | provider | 模型 |
|---|---|---|
| 本机 / 936 / 961 | `custom:apihub.agnes-ai.com` | `agnes-3.0-flash`（实时拉取）|
| 931 | 无 | — |

## 3. 实测记录（2026-11-20 08:00）

统一用 `sensenova/deepseek-flash`（DeepSeek V4.1 Flash）提问 `3*5等于几？只回答数字`：

| 机器 | gateway 模型 ID | 回答 | HTTP |
|---|---|---|---|
| 本机 | `商汤/sensenova/deepseek-flash` | **15** | 200 |
| 931 | `sensenova/sensenova/deepseek-flash` | **15** | 200 |
| 936 | `商汤/sensenova/deepseek-flash` | **15** | 200 |
| 961 | `sensenova/sensenova/deepseek-flash` | **15** | 200 |

## 4. 维护约定（**每次变更必须遵守**）

1. **本文件与机器实际状态不一致 = 部署未完成。**
2. 增删机器、换模型、改参数、改地址 → **同一个 commit 里更新本文件**。
3. 每次全量核对后，更新顶部「最后核对」时间和第 3 节的实测记录。
4. 模型参数的唯一权威来源：商汤官方文档 <https://platform.sensenova.cn/docs>；
   **不要**采信 new-api `/v1/models` 的 `context_length`（渠道缓存，实测有误）。
5. provider 命名差异见 2.1，**不要试图统一**（会掉 provider）。
6. 新增机器时补齐：代号 / 地址 / 路径 / 服务用户 / provider 名 / 模型数 / 实测记录。

## 5. 变更记录

- **2026-11-20**：建立本文件。4 台统一 0.8.28 + 商汤参数修正为官方值；935 移出家族。
  实测 4/4 全通（DeepSeek V4.1 Flash `3*5 → 15`）。
