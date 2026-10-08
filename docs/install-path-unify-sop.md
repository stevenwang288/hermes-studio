# 安装路径统一到官方标准路径 SOP

> 2026-10-09 由 99 号编写并实地扫描验证。
> 目标：把 `C:\Users\baba1\AppData\Local\Programs\Hermes Studio\Ekko Studio\`
> 统一为官方标准路径 `C:\Users\baba1\AppData\Local\Programs\Ekko Studio\`。

## 一、背景与根因（已求证）

- 上游官方 rebrand（commit `91466ab2`，2026-09-08 "feat: rebrand Studio as Ekko Studio"）
  把 electron-builder.yml 的 `productName` 从 `Hermes Studio` 改为 `Ekko Studio`。
- electron-builder 安装目录规则（`multiUser.nsh` 26-48 行源码）：
  **注册表 `HKCU\Software\<APP_GUID>\InstallLocation` 存在旧路径 → 新装复用旧路径；
  不存在 → 落 `%LocalAppData%\Programs\<productName>`。**
- 本机升级时继承旧的 `Hermes Studio\` 容器目录，因此出现两层
  `Hermes Studio\Ekko Studio\`。**这是官方升级逻辑的正常行为，不是 fork 代码问题**
  （本地 electron-builder.yml / installer.nsh 与上游 diff 均为空）。

## 二、扫描结论：哪些文件引用旧路径（2026-10-09 实测）

### 2.1 引用旧路径、必须处理 ✅

| # | 位置 | 内容 | 处理方式 |
|---|------|------|---------|
| 1 | 桌面快捷方式 `D:\desk\Ekko Studio.lnk` | Target → 旧路径 exe | 重装后重建 |
| 2 | 开始菜单 `Ekko Studio.lnk` | Target → 旧路径 exe | 重装时安装器自动重建（若残留则手动删旧） |
| 3 | 注册表 `HKCU\...\Uninstall\f6bd0604-...` | InstallLocation / UninstallString → 旧路径 | **卸载时自动清除**（本轮操作的关键点） |
| 4 | 仓库 `MAINTAIN.md` 314/320 行 | 文档写了旧安装位置 | 改文档 |

### 2.2 与安装路径独立、**零改动** ✅

| 位置 | 说明 |
|------|------|
| `C:\Users\baba1\.hermes-web-ui\`（HERMES_WEB_UI_HOME） | 数据库/聊天/配置/runtime 全在这，路径引用全部指向自身（`.hermes-web-ui\desktop-runtime\hermes\0.20.x`），**与安装目录无关** |
| 当前 Hermes 会话 | cli 模式，跑在 `.hermes-web-ui\desktop-runtime` 下，卸载桌面版不影响 |
| 系统启动项 | 无（已查） |

**结论：没有任何用户数据文件需要挪、没有任何配置文件需要提前改路径。**

## 三、操作顺序（核心：先卸载，后安装，不挪文件）

```
① 退出桌面版（3 个 Ekko Studio.exe 进程）
② 卸载 0.7.32（用注册表里的 Uninstall String）→ 自动清 InstallLocation
   ★ 必须在此步清掉注册表，否则新装会复用旧目录，白折腾
③ 确认注册表 InstallLocation 已空；删除残留空壳目录 Hermes Studio\
④ 重装 D:\desk\Ekko.Studio-0.7.32-x64.exe → electron-builder 无旧路径可复用，
   自动落到标准路径 C:\Users\baba1\AppData\Local\Programs\Ekko Studio\
⑤ 重建桌面快捷方式 D:\desk\Ekko Studio.lnk 指向新路径
⑥ 改仓库 MAINTAIN.md 里的安装位置说明
⑦ 验证（见第五节）
```

**为什么不是"先挪文件/先改配置"**：用户数据在独立目录，不存在要挪的文件；
配置文件无一条引用安装路径。唯一"会记住旧路径"的是注册表，而它被卸载器清空。
**先装新版本再卸载也不对**：安装器会先读注册表旧 InstallLocation 并复用旧目录。

## 四、逐步命令

### ① 退出桌面版
```bash
taskkill /IM "Ekko Studio.exe" /F 2>/dev/null
# 或正常关闭: 右键托盘图标退出
```

### ② 卸载 0.7.32（清注册表）
```powershell
# 用注册表里的 UninstallString（不要用控制面板，直接调卸载器）
& "C:\Users\baba1\AppData\Local\Programs\Hermes Studio\Ekko Studio\Uninstall Ekko Studio.exe" /currentuser
# 或静默: & "…\Uninstall Ekko Studio.exe" /S
```

### ③ 清残留 + 验证注册表已清
```bash
# 删空壳目录（卸载后应只剩空的 Hermes Studio\ 容器）
rm -rf "$LOCALAPPDATA/Programs/Hermes Studio" 2>/dev/null
# 验证决定路径的键已不存在（关键门禁）：
# electron-builder 读的是 HKCU\Software\<APP_GUID>\InstallLocation（实测 GUID 键 = f6bd0604-...）
reg query "HKCU\Software\f6bd0604-87fa-534e-9fb2-f5a02394db55" /v InstallLocation 2>&1 | grep -q "Hermes" && echo "FAIL: 注册表未清, 新装会复用旧目录" || echo "PASS: InstallLocation 已清, 新装将落标准路径"
```
> 注：`f6bd0604-...` 是 APP_GUID 键（NSIS 用 `Software\<APP_GUID>` 存 InstallLocation），
> 卸载器删除该键；若整个键消失则更干净。另外两个历史键
> `48ae4bdc-...`（hermes-desktop）和 `3a796f66-...`（hermes-studio-self）指向的目录已不存在，
> 属孤儿记录，可一并 `reg delete` 清理（可选）。

### ④ 重装到标准路径
```bash
# 直接双击 D:\desk\Ekko.Studio-0.7.32-x64.exe，一路默认
# 安装向导会显示标准路径 ...\Programs\Ekko Studio（可用 /D= 强指定）
```

### ⑤ 重建桌面快捷方式
```powershell
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut("D:\desk\Ekko Studio.lnk")
$lnk.TargetPath = "C:\Users\baba1\AppData\Local\Programs\Ekko Studio\Ekko Studio.exe"
$lnk.WorkingDirectory = "C:\Users\baba1\AppData\Local\Programs\Ekko Studio"
$lnk.Save()
```

### ⑥ 改 MAINTAIN.md（314/320 行）
把 `Hermes Studio\` 前缀去掉，统一为新安装位置。

## 五、验证清单（全绿才算完成）

| # | 验证项 | 命令 |
|---|--------|------|
| 1 | 安装目录为标准路径 | `ls "$LOCALAPPDATA/Programs/Ekko Studio/Ekko Studio.exe"` |
| 2 | 无旧容器残留 | `ls "$LOCALAPPDATA/Programs/" | grep -i "Hermes Studio"` → 无输出 |
| 3 | 注册表 InstallLocation 指向新路径 | `reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\f6bd0604-..." /v InstallLocation` |
| 4 | 版本正确 |  exe ProductVersion = 0.7.32 |
| 5 | 桌面快捷方式指向新路径 | `(New-Object -ComObject WScript.Shell).CreateShortcut('D:\desk\Ekko Studio.lnk').TargetPath` |
| 6 | 桌面版可启动 | 启动后进主界面，频道/账号正常（用户数据未动） |
| 7 | 数据未丢 | `ls "$USERPROFILE/.hermes-web-ui/"` 原有文件齐全（db/config/desktop-runtime） |

## 六、风险与回滚

- **风险**：卸载→重装窗口期桌面版不可用（几分钟）；卸载器若异常中断可能留注册表残留 →
  手动删 `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\f6bd0604-...` 和 `HKCU\Software\<APP_GUID>`。
- **回滚**：安装包 `D:\desk\Ekko.Studio-0.7.32-x64.exe` 随时可重装；用户数据全程未动，无数据损失面。
- **不可逆点**：无。所有操作都可重复执行或反向重装。