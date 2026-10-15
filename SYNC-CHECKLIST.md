# 上游同步一条龙 · 执行清单

> **这是唯一的执行入口。** 每次做「同步上游 / 一条龙」时，**打开本文件，从上往下逐步打勾**，
> 每步都有命令和**判据（不达标不许往下走）**。
> 详细背景、坑的原理见 `MAINTAIN.md`；自研功能与记账见 `CUSTOM_CHANGES.md`。
>
> **第 10 步（终检）是硬闸门**：由 `scripts/delivery-verify.mjs` 自动校验 9 项，
> **只要有 1 项 FAIL，本轮就不算完成。**

---

## 开始前

```bash
cd /d/OneDrive/steven/code/ai/13IDE/hermes-studio
```

**唯一有效分支 `sync`**（`main` 是废弃旧基线，禁止用它做任何部署）。

---

## 第 1 步 · 判断要不要动

```bash
git fetch upstream main --tags --force
git rev-list --left-right --count sync...upstream/main   # 输出 A B
```

- **判据：`B = 0` → 上游没新东西**，直接回复用户「无需同步」并结束。
- `B > 0` → 继续。`git log --oneline sync..upstream/main` 看清上游新提交是什么。

> ⚠ **别看 tag 列表判断版本**：上游 tag 命名空间是混的（`v1.0.0`~`v1.0.7` 是**安卓 App**的 tag，
> 且全是 main 的祖先）。判断依据只有 `upstream/main` 的 head + GitHub Releases。

---

## 第 2 步 · 合并上游

```bash
git branch "backup-sync-$(date +%Y%m%d-%H%M%S)" sync    # 先留后路
git checkout sync
git merge upstream/main --no-edit
```

- **判据**：无 CONFLICT；`git diff --name-only --diff-filter=U` 为空；合并后再跑一次第 1 步的命令，**B 应回到 0**。
- 冲突铁律：`[zoom patch]` / `[preempt patch]` / `workspace-badge` 标记处 → **保留 fork**；其余一律取上游。
- 可提前预演：`git merge-tree --write-tree sync upstream/main`。

---

## 第 3 步 · 本地三验（**跳过就是耍流氓**）

```bash
npm install --include=dev --no-audit --no-fund
npm run build                                            # 必须 exit=0
cd packages/desktop && npx tsc -p tsconfig.json --noEmit # 必须 exit=0
```

- **判据：两条都 exit=0**，且 `dist/server/index.js` 的 mtime 是**刚刚**。
- 撞 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`（沙箱批量删除保护，**不是代码错**）→
  `mv dist dist.old-$(date +%s) && npm run build`。

**自研存活自检**（合并后必做，确认 8 项自研没被上游吃掉）：

```bash
node scripts/self-check-custom.mjs
```

判据：**全部命点 PASS**（消息队列 4 个端点 / 字体缩放 / 路径显示 / 链接默认浏览器+强制Chrome+zoom修复 /
微信DM策略 / tool_calls 空串修复 / MCP常驻 / 商汤 384000 cap）。
有 FAIL → 回第 2 步按冲突铁律重新应用自研代码，别往下走。

---

## 第 4 步 · ✱ 推自己的 GitHub（**大哥点名必须有的步骤，不许跳过**）

```bash
git push origin sync
```

- **前置红线**：本地未通过第 3 步（build + tsc）→ **不许 push**。
- **判据**：`git ls-remote origin sync` 的前 8 位 == 本地 `git rev-parse --short sync`。
  推完要**向用户报告远端 commit 变成了什么**，不准只说「推好了」。
- 报 `TLS ... unexpected eof` / push 长时间无输出 = **代理节点挂了** →
  **停下让用户切 V2rayN 节点**，不要反复盲试。
- 彻底不通的旁路：`git bundle create` + `scp` 内网直传（见 `MAINTAIN.md` 第 3 步）。

> 本轮如果中间又改了东西（记账、脚本修复），**最后还要再 push 一次**，确保 GitHub 与本地完全一致。

---

## 第 5 步 · 4 台 PVE 部署（线上服务，**重启前必须经用户同意**）

先确认 VM 开机（**931/961 常常是 stopped**）：

```bash
ssh PVE "qm list"        # 状态不是 running 就 qm start <vmid>
```

逐台部署，用真实退出码版脚本（**不要用会吞退出码的旧脚本**）：

```bash
bash scripts/deploy-one-vm.sh 931
bash scripts/deploy-one-vm.sh 935
bash scripts/deploy-one-vm.sh 936
bash scripts/deploy-one-vm.sh 961
```

**每台部署后必核 4 项**（别只看脚本日志说成功）：

```bash
git rev-parse --short HEAD                          # == 本地 sync
node -e "console.log(require('./package.json').version)"
stat -c '%y' dist/server/index.js                   # ★ mtime 必须是刚构建
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8648   # 应 200
```

- **判据：4 台 HEAD 都等于本地 sync，HTTP 全 200。**
- 服务重启后**需约 14 秒**才绑定 8648，太早访问会误判失败（`http=000` 时先等再复查）。
- **961 只有 4G 内存**：撞 `exit=137` 是 OOM 不是网络，**`NODE_OPTIONS` 无效**，解法是加 swap（已加过 4G 并写 fstab，正常情况下不用再管）。

---

## 第 6 步 · 浏览器验收 4 台（**能否真用的最终判据**）

Chrome CDP **必须与脚本在同一条命令内**启动（否则后台进程被回收 → `ECONNREFUSED 9222`）：

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9222 \
  --user-data-dir="C:/Users/baba1/AppData/Local/Temp/chrome-cdp-profile" \
  --no-first-run --no-default-browser-check --headless=new about:blank &
sleep 12
node scripts/verify-fleet.mjs
```

- **判据：`通过 4/4`** —— 每台发一道随机加法题，**AI 答对**才算过。
- 三个已知坑已处理在脚本里，改脚本别删：① Enter 不发送，必须点 `button.send-button`；
  ② 首次登录弹「请修改默认账户和密码」遮挡点击，先点「稍后提醒」；③ 只读**新增的** assistant 消息，避免拿历史消息误判通过。

---

## 第 7 步 · 本地打包 Windows 安装程序

```bash
CODEBUDDY_SAFE_DELETE_ENABLED=0 bash scripts/local-package-win.sh
```

- **必须加 `CODEBUDDY_SAFE_DELETE_ENABLED=0`**（否则 `npm prune`/`electron-builder`/`vite` 的批量删除被沙箱 shim 拦成 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`）。
- 耗时 8~26 分钟，**后台跑**，别中途插手。脚本一条龙 6 步：prune dev → desktop `npm ci` → `dist:win` → 校验体积 → 拷 exe 到 `d:\desk` 并清旧版 → 恢复 dev 依赖。
- **判据**：`d:\desk` 出现 `Ekko.Studio-<version>-x64.exe`，体积 **约 189~200MB**（>300MB 说明没 prune）；旧版 exe 已清，**桌面只留一个 exe**。

---

## 第 8 步 · 装到本机并跑起来

```powershell
Get-Process -Name 'Ekko Studio' -ErrorAction SilentlyContinue | Stop-Process -Force   # 占用会装失败
Start-Process -FilePath 'd:\desk\Ekko.Studio-<version>-x64.exe' -ArgumentList '/S' -Wait -PassThru
Start-Process explorer.exe -ArgumentList '"C:\Users\baba1\AppData\Local\Programs\Ekko Studio\Ekko Studio.exe"'
```

- **必须用 `explorer.exe` 代启动**：直接 `Start-Process <exe>` 会被安全软件拦截（进程数 0、ExitCode 0、无输出），**别据此判断应用坏了**。
- **判据**：17~20 个进程 + 有 `MainWindowHandle -ne 0` 的窗口；`ProductVersion` == 目标版本；
  `/health` 返回 `webui_version` 匹配。
- **`agent_bridge` 要等约 30~60 秒**才从 `unreachable` 转 `ready`，早查会误判失败。

---

## 第 9 步 · ✱ 更新文档与记账（**大哥点名必须有的步骤，不许跳过**)

| 文件 | 什么时候改 | 必须写什么 |
|---|---|---|
| **`CUSTOM_CHANGES.md`** | **每轮必改** | 「最近一次合并」段：上游提交数与主要 PR、冲突情况、自研 grep 结果、差异文件数；再追加「部署与交付」段：4 台 PVE 结果与验收分数、打包体积与耗时、**本机安装后的 ProductVersion 与 /health 结果**、本轮踩的新坑 |
| `MAINTAIN.md` | **流程有变才改** | 新坑进「故障速查」表；命令/路径变了就同步改；**不要为改而改** |
| `.workbuddy/memory/YYYY-MM-DD.md` | 每轮必写 | 本轮做了什么、结论、下次注意什么 |

- **判据**：`CUSTOM_CHANGES.md` 里能搜到**今天的日期**和本轮版本号。
- 记账属于代码的一部分 → **写完必须回到第 4 步再 push 一次**，保证 GitHub 上的文档是最新的。

---

## 第 10 步 · ✱ 终检（硬闸门，一键机器校验）

```bash
node scripts/delivery-verify.mjs
```

自动校验 9 项，**全部 PASS 才算完成**：

| # | 校验项 | 判据 |
|---|--------|------|
| 1 | 工作区干净 | `git status --short` 为空 |
| 2 | 本地 == GitHub | `sync` 本地 SHA == `origin/sync` |
| 3 | 不落后上游 | `sync...upstream/main` 的 B == 0 |
| 4 | 4 台 PVE commit | 每台 HEAD == 本地 `sync` |
| 5 | 4 台 PVE 存活 | `curl 127.0.0.1:8648` == 200 |
| 6 | 桌面安装包 | `d:\desk` 只有一个 exe，且文件名含当前版本号 |
| 7 | 本机安装版本 | `ProductVersion` == 当前版本 |
| 8 | 桌面服务健康 | `/health` 的 `webui_version` 匹配且 `agent_bridge.ready == true` |
| 9 | 记账没漏 | `CUSTOM_CHANGES.md` 含今天日期 |

**只要有一项 FAIL → 回去把那一步补完，重跑本脚本。**
把最终表格贴给用户汇报，别口头说「都好了」。

---

## 两个只有用户能做的停点

1. **切 V2rayN 代理节点**（GitHub 推不上去时）
2. **授权重启 4 台 PVE 上的线上服务**（他可以在触发句里预先授权）

---

## 一句话铁律

> **上游合进来 → 本地验过 → 推自己 GitHub → 4 台 PVE + 浏览器验收 → 打包 → 装本机 → 更新文档 → 跑终检全绿。**
> **缺任何一环都不算完成，尤其是「推自己 GitHub」和「更新文档」两步 —— 历史上漏过，别再漏。**
