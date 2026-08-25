@echo off
schtasks /Create /TN ABE_SYS /TR "C:\Users\baba1\AppData\Local\Programs\Python\Python312\python.exe D:\ask\sys_ncrypt.py" /SC ONCE /ST 23:59 /RU SYSTEM /F
schtasks /Run /TN ABE_SYS
timeout /t 8 /nobreak >nul
schtasks /Delete /TN ABE_SYS /F
