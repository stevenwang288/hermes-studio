# 编译发布流程

本文件描述爱马仕 (Hermes Studio Fork) 从代码改动到安装包下载的完整流程。

## 前提

- 仓库：`stevenwang288/hermes-studio`
- 本地源码：`D:\OneDrive\steven\code\ai\13IDE\hermes-studio`
- 931 部署源码：`/opt/hermes-studio-ekko`
- 下载位置：`D:\Desk`
- Release 页面：https://github.com/stevenwang288/hermes-studio/releases

## 流程

### 1. 提交代码

```bash
git add -A && git commit -m "改动说明" && git push origin main
```

### 2. 创建 Release tag

```bash
gh release create v0.6.47-fork.X --repo stevenwang288/hermes-studio \
  --title "爱马仕 0.6.47-fork.X" --notes "改动说明" --target main
```

### 3. 触发编译

```bash
gh workflow run desktop-release.yml --repo stevenwang288/hermes-studio \
  --ref main -f tag=v0.6.47-fork.X
```

### 4. 等待完成

```bash
gh run watch <run_id> --repo stevenwang288/hermes-studio --exit-status
```

编译约 5-8 分钟，全平台（Windows x64 + macOS + Linux）。

### 5. 下载 exe

```bash
gh release download v0.6.47-fork.X --repo stevenwang288/hermes-studio \
  --pattern "AimaShi-*.exe" --dir "D:\Desk" --clobber
```

下载到：`D:\Desk\AimaShi-0.6.47-fork.X-x64.exe`（直接是 exe，无需解压）

### 6. 安装

双击 exe 运行。安装程序自动：
- 停旧进程（兼容 爱马仕.exe 和 Hermes Studio.exe）
- 迁移旧版 localStorage（工作区历史路径不丢失）
- 刷新图标缓存（快捷方式图标更新）

## 931 服务器同步

```bash
ssh root@192.168.9.31 "cd /opt/hermes-studio-ekko && \
  git fetch fork main && git reset --hard fork/main && \
  npm ci --include=dev && npm run build && \
  systemctl stop hermes-web-ui && \
  cp -r dist /usr/lib/node_modules/hermes-web-ui/dist && \
  cp package.json /usr/lib/node_modules/hermes-web-ui/package.json && \
  systemctl start hermes-web-ui && sleep 2 && systemctl is-active hermes-web-ui"
```

访问：http://192.168.9.31:8648

## 快速模式（仅 Windows）

不需要全平台时，手动触发只编译 Windows：

```bash
gh workflow run desktop-manual-build.yml --repo stevenwang288/hermes-studio \
  --ref main -f target_os=win32 -f target_arch=x64
```

注意：manual-build 下载的是 zip（GitHub artifact 限制），需解压。Release 流程直接下载 exe。

## 联邦全量更新 SOP（Agent + Studio + 桌面版）

当上游同时发布 Agent 和 Studio 新版本时，按以下顺序操作。

### 前置：确认版本

```bash
# 查 Studio 上游绑定的 Agent 版本
cat packages/desktop/scripts/runtime-config.mjs | head -4
# 输出 DEFAULT_HERMES_VERSION = '0.20.6' 等

# 查上游 Studio 最新提交
git fetch upstream main
git log --oneline upstream/main -5
```

### 步骤 1：合并上游 Studio 到 fork

```bash
git merge upstream/main --no-edit
# 冲突解决策略见 CUSTOM_CHANGES.md「合并上游 SOP」
npm install --no-audit --no-fund
npm run build          # 本地验证编译通过
git push origin main   # 推到 fork
```

### 步骤 2：99号 Windows 桌面版（并行，耗时长）

```bash
# 触发 GitHub Actions 编译 Windows x64
gh workflow run desktop-manual-build.yml --repo stevenwang288/hermes-studio \
  --ref main -f target_os=win32 -f target_arch=x64

# 查进度
gh run list --repo stevenwang288/hermes-studio --limit 1

# 完成后下载 artifact（约 5-8 分钟）
gh run download <run_id> --repo stevenwang288/hermes-studio --dir "D:\desk\desktop-win32-x64"

# 清理旧版 + 安装新版
Stop-Process -Name "hermes-studio-self" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\baba1\AppData\Local\Programs\hermes-studio-self" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\baba1\AppData\Local\Programs\Hermes Studio" -Recurse -Force -ErrorAction SilentlyContinue
Move-Item "D:\desk\desktop-win32-x64\desktop-win32-x64\AimaShi-*-x64.exe" "D:\desk\"
Remove-Item "D:\desk\desktop-win32-x64" -Recurse -Force
# 静默安装
Start-Process "D:\desk\AimaShi-<version>-x64.exe" -ArgumentList "/S" -Wait
# 删 blockmap（自用版不需要增量更新校验文件）
Remove-Item "D:\desk\AimaShi-*.exe.blockmap" -Force
```

### 步骤 3：更新联邦服务器 Agent（31/35/36/61）

```bash
# 全联邦统一：mihomo (clash) TUN 模式，7890 端口，直连 GitHub
# 31/61 号：root 用户，Agent 在 /usr/local/lib/hermes-agent
# 35   号：root 用户，同上
# 36   号：ubuntu 用户，Agent 在 /home/ubuntu/.hermes/hermes-agent

# 31号
ssh root@192.168.9.31 'hermes update -y 2>&1 | tail -10'
ssh root@192.168.9.31 'systemctl restart hermes-gateway hermes-web-ui; sleep 2; systemctl is-active hermes-gateway hermes-web-ui'

# 35号（如 git 不走 TUN，加 ALL_PROXY=http://127.0.0.1:7890）
ssh root@192.168.9.35 'ALL_PROXY=http://127.0.0.1:7890 hermes update -y 2>&1 | tail -10'
ssh root@192.168.9.35 'systemctl restart hermes-gateway; sleep 2; systemctl is-active hermes-gateway'

# 36号（ubuntu 用户）
ssh root@192.168.9.36 'su - ubuntu -c "hermes update -y" 2>&1 | tail -10'

# 61号
ssh root@192.168.9.61 'hermes update -y 2>&1 | tail -10'
ssh root@192.168.9.61 'systemctl restart hermes-gateway; sleep 2; systemctl is-active hermes-gateway'
```

### 步骤 4：更新联邦服务器 Studio（仅 31/36 号有 Studio）

```bash
# 31号（symlink 模式：/usr/lib/node_modules/hermes-web-ui → /opt/hermes-studio-ekko）
ssh root@192.168.9.31 'cd /opt/hermes-studio-ekko && git fetch fork main && git merge fork/main --no-edit && npm install --no-audit --no-fund && npm run build && systemctl restart hermes-web-ui'

# 36号（symlink 模式：/home/ubuntu/.local/npm-global/lib/node_modules/hermes-web-ui → /opt/hermes-studio-fork）
ssh root@192.168.9.36 'cd /opt/hermes-studio-fork && git fetch origin main && git merge origin/main --no-edit && npm install --no-audit --no-fund && npm run build && systemctl restart hermes-web-ui'
```

### 步骤 5：验证全部节点

```bash
# 一键检查所有节点 Agent + Studio 版本和状态
for ip in 31 35 36 61; do
  echo "=== ${ip}号 ==="
  ssh root@192.168.9.${ip} 'hermes --version 2>&1 | head -1; systemctl is-active hermes-gateway hermes-web-ui 2>&1' 2>&1
done
```

### 联邦节点速查

| 节点 | IP | 用户 | Agent 路径 | Studio 路径 | Studio symlink |
|------|-----|------|-----------|------------|----------------|
| 31号 | 192.168.9.31 | root | /usr/local/lib/hermes-agent | /opt/hermes-studio-ekko | → /usr/lib/node_modules/hermes-web-ui |
| 35号 | 192.168.9.35 | root | /usr/local/lib/hermes-agent | 无 | — |
| 36号 | 192.168.9.36 | ubuntu | /home/ubuntu/.hermes/hermes-agent | /opt/hermes-studio-fork | → /home/ubuntu/.local/npm-global/lib/node_modules/hermes-web-ui |
| 61号 | 192.168.9.61 | root | /usr/local/lib/hermes-agent | 无 | — |
| 99号 | 本机 | — | 打包内（runtime-release.json） | AppData\Local\Programs\hermes-studio-self | — |

### 网络说明

全联邦 4 台服务器统一：**mihomo (clash) TUN 模式，7890 端口**。
- TUN 模式下 curl/git 直连 GitHub，无需额外代理
- 如 `hermes update` 的 git 不走 TUN（报 GnuTLS 错），加 `ALL_PROXY=http://127.0.0.1:7890`
- 不要混用 V2 代理和 clash，全联邦只用 mihomo

## 常见编译失败

| 问题 | 解决 |
|------|------|
| `icon.ico Invalid DataView length` | 重新生成多尺寸 ICO（16/32/48/64/128/256） |
| `label not used` | NSIS installer.nsh 有未引用标签，删掉 |
| `vue-tsc type error` | CI 用 `npx vite build` 跳过类型检查 |
| `@rolldown/pluginutils not found` | `npm ci --include=dev` 重装依赖 |
| `Top-level await not available` | vite.config.ts target 改 `es2022`（上游用了 top-level await） |
| `MISSING_EXPORT` rolldown 报错 | 清缓存 `rm -rf node_modules/.cache node_modules/.vite` 后重新 build |
| `hermes update` GnuTLS 握手失败 | `ALL_PROXY=http://127.0.0.1:7890 hermes update -y`（git 没走 TUN） |
| `gateway auto-restart failed` (mixed sys.modules) | 手动 `systemctl restart hermes-gateway` 即可 |
