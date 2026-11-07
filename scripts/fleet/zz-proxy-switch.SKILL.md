---
name: zz-proxy-switch
description: 本机翻墙（mihomo/clash）排障与换节点。当 GitHub/npm/raw.githubusercontent 超时、git fetch 报 TLS/GnuTLS 握手失败、curl 返回 000、pip/npm 装包卡住、或怀疑"网络不通"时使用。提供 zz-proxy status/test/list/best/node/auto/refresh 命令，自动测速择优，禁止手工乱改配置。
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [proxy, mihomo, clash, network, github, timeout, tls, fleet]
    related_skills: [devops]
---

# zz-proxy-switch · 翻墙排障与自动换节点

## When to Use

出现以下任一现象，先读本技能，不要先怀疑代码或服务：

- `git fetch/pull/push` 报 `GnuTLS, handshake failed`、`TLS connection was non-properly terminated`、`Failed to connect ... 443`
- `curl https://github.com` / `raw.githubusercontent.com` 返回 `000`、超时，或 `api.github.com` 能通但 github.com 不通
- `npm install` 卡在下载、`pip install` 超时
- 模型/工具调用莫名大量超时，但本机服务本身 `/health` 正常
- 上一次部署的"老经验"说能通，现在不通了

## 先看现状（一条命令）

```bash
zz-proxy status
```

输出会告诉你：mihomo 是否 active、当前自动选中的节点、该节点延迟、候选真实节点数、TUN 是否关闭。

## 判断与处置顺序

| 现象 | 处置 |
|---|---|
| 当前节点延迟 < 500ms，`zz-proxy test` 全 OK | 网络正常，问题不在代理，去查代码/配置 |
| 当前节点延迟超时 / `test` 有 FAIL | `zz-proxy best` 立刻切到最快节点，再 `zz-proxy test` 复验 |
| `best` 说"无可用延迟数据" | `zz-proxy refresh` 刷新订阅，等 10 秒后 `zz-proxy status` |
| 刷新后仍全挂 | 订阅过期或本机到代理服务器被墙。**停下来告知用户**，不要反复重试浪费十分钟 |
| 只有 raw.githubusercontent 挂、github 正常 | 常见瞬断，重试一次；连续 3 次失败按上一行处理 |

## 命令清单

```bash
zz-proxy status          # 服务状态 / 当前节点 / 延迟 / TUN
zz-proxy test            # 测 GitHub、raw、Google、百度
zz-proxy list 10         # 测速并列出最快 10 个节点
zz-proxy best            # 全组测速 → 自动切最快节点
zz-proxy node "🇯🇵日本专线3-0.1倍率"   # 手动钉某节点（名称要完全一致）
zz-proxy auto            # 恢复自动择优（默认就应该是这个）
zz-proxy refresh         # 强制刷新订阅
```

## 核心事实（别记错）

- 混合代理端口 **`127.0.0.1:7890`**（HTTP + SOCKS5 同一个口），mihomo 控制 API **`127.0.0.1:9090`**
- 配置 **`/etc/mihomo/config.yaml`**，订阅 provider **`/etc/mihomo/providers/yfjc.yaml`**
- **AUTO 分组是 `url-test`**：每 **180 秒**自动测速，50ms 内不切换（防抖），节点挂了会自动换 ——
  **所以正常情况下根本不需要手动切节点**，`zz-proxy auto` 保持默认即可
- **TUN 必须是 `false`**。开着 TUN 时如果唯一节点挂掉，整机网络会一起断
  （2026-11-07 931 就是这样整机代理失效的）
- 订阅里混有"剩余流量 / 套餐到期"这类**伪节点**，AUTO/PROXY 已用 `exclude-filter` 排除；
  若 `status` 显示当前节点是这类名字，说明配置被改坏了，见下方"配置基线"
- 应用层代理：`git config --global http.proxy = http://127.0.0.1:7890`；
  npm 走 `registry.npmmirror.com`（国内源，无需代理）

## 铁律

1. **不要用 `curl -x` 之外的方式验证**：判断通不通就用 `zz-proxy test`，别自己拼参数。
2. **不要手工 `vim /etc/mihomo/config.yaml`**。要改就走 `zz-proxy`；真要改配置，先
   `cp /etc/mihomo/config.yaml /etc/mihomo/config.yaml.bak-$(date +%Y%m%d-%H%M%S)`，改完
   `python3 -c "import yaml;yaml.safe_load(open('/etc/mihomo/config.yaml'))"` 校验，再 `systemctl restart mihomo`。
3. **不要开着 TUN 做服务器部署**（会连累整机网络）。
4. **`mihomo` 重启会短暂断网**（约 5~10 秒），不要在跑长任务（npm install / git clone）时重启。
5. **代理只是"通路"**，不是"加速器"：节点延迟 200~500ms 正常，别为了几十毫秒反复切换。

## 配置基线（4 台必须一致）

`/etc/mihomo/config.yaml` 全集群使用同一份内容，关键字段：

```yaml
mixed-port: 7890
external-controller: 127.0.0.1:9090
allow-lan: true
mode: rule
tun:
  enable: false          # 必须 false
proxy-groups:
  - name: AUTO           # url-test，interval 180，tolerance 50，lazy false
    type: url-test
    use: [yfjc]
    url: https://www.gstatic.com/generate_204
    exclude-filter: "剩余流量|套餐到期|到期时间|官网|订阅|重置|流量重置"
  - name: PROXY          # select，default AUTO
    type: select
    proxies: [AUTO, SG-Alibaba]
    use: [yfjc]
    default: AUTO
rules:
  # ... 上游规则 ...
  - GEOIP,CN,DIRECT
  - MATCH,AUTO
```

自检一条：`zz-proxy status` 应显示 `TUN: False`、`mixed-port: 7890`、当前节点是一个真实节点名。
