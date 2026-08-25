@echo off
schtasks /Create /TN ABE_NC /TR "C:\Users\baba1\AppData\Local\Programs\Python\Python312\python.exe D:\ask\ncrypt_only.py" /SC ONCE /ST 23:59 /RU SYSTEM /F
schtasks /Run /TN ABE_NC
timeout /t 6 /nobreak >nul
schtasks /Delete /TN ABE_NC /F
