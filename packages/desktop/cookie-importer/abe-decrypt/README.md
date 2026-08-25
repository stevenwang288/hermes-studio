# Chrome v20 Cookie ABE 解密工具链

绕过 Chrome 127+ 的 App-Bound Encryption，把系统 Chrome 的全部登录态
Cookie 解密导出为 JSON（供内置浏览器导入或备份）。

## 背景

Chrome 127+ 将 cookie 加密密钥（app_bound_key）用三层保护：

1. SYSTEM DPAPI 加密（存于 `Local State` 的 `os_crypt.app_bound_encrypted_key`）
2. 用户 DPAPI 再包一层
3. 最内层的 AES key 又被机器级 CNG 密钥（NCrypt `Google Chromekey1`）加密，
   并 XOR 固定 key

因此完整解密需要三种上下文各出一次力：SYSTEM 任务、提权管理员、普通用户。

## 文件与执行顺序

| 步骤 | 文件 | 运行上下文 | 作用 |
|---|---|---|---|
| 0 | `step1_admin_extract_parts.py` | 提权管理员 (UAC) | user DPAPI 解开 blob，解析出 flag=3 结构：`enc_key/iv/ct/tag` → `gcm_parts.json` |
| 1 | `step2_run_ncrypt_as_system.bat` | 提权管理员 (UAC) | 注册并以 SYSTEM 身份运行 `step2_ncrypt_decrypt.py` |
| 2 | `step2_ncrypt_decrypt.py` | SYSTEM（计划任务） | NCrypt 用机器密钥 `Google Chromekey1` 解出内层 AES key → `nc_result.json` |
| 3 | `step3_export_all_cookies.py` | 普通用户 | XOR 得 app_bound_key → AES-256-GCM 解密 Cookies 库全部 v20 条目 → `cookies_final.json` |

## 使用方法

```bat
:: 前提: 关闭 Chrome（Cookies 数据库有独占锁）
python step1_admin_extract_parts.py          :: 弹 UAC，点允许
step2_run_ncrypt_as_system.bat               :: 弹 UAC，点允许
python step3_export_all_cookies.py           :: 普通权限直接跑
```

产物：`D:\ask\cookies_final.json`（路径写在脚本里，可自行修改）。

## 已验证

- Windows 11 + Chrome 151.0.7922.174（cookie 格式 v20），2892/2892 条解密成功、0 失败
- YouTube 登录态核心 cookie（SID / SAPISID / __Secure-1PSID / __Secure-3PSID / LOGIN_INFO）全部解出且有效期正常

## 注意

- 全程需要两次 UAC 确认；安全软件（如火绒）可能拦截「隐藏窗口提权」，属正常防护行为
- `intermediate.blob` / `gcm_parts.json` 等中间文件含敏感密钥，用完即删
