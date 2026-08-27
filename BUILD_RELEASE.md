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

## 常见编译失败

| 问题 | 解决 |
|------|------|
| `icon.ico Invalid DataView length` | 重新生成多尺寸 ICO（16/32/48/64/128/256） |
| `label not used` | NSIS installer.nsh 有未引用标签，删掉 |
| `vue-tsc type error` | CI 用 `npx vite build` 跳过类型检查 |
| `@rolldown/pluginutils not found` | `npm ci --include=dev` 重装依赖 |
