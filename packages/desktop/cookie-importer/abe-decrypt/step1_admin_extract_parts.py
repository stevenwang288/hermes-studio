import ctypes, json, base64, struct, io
from ctypes import wintypes
class DATA_BLOB(ctypes.Structure):
    _fields_=[('cbData',wintypes.DWORD),('pbData',ctypes.POINTER(ctypes.c_char))]
def dpapi(data):
    buf=ctypes.create_string_buffer(data,len(data))
    b1=DATA_BLOB(len(data),ctypes.cast(buf,ctypes.POINTER(ctypes.c_char)))
    b2=DATA_BLOB()
    if not ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(b1),None,None,None,None,0,ctypes.byref(b2)):
        raise OSError('DPAPI %08X'%(ctypes.GetLastError()&0xFFFFFFFF))
    out=ctypes.string_at(b2.pbData,b2.cbData); ctypes.windll.kernel32.LocalFree(b2.pbData)
    return out
d=open(r'D:\ask\intermediate.blob','rb').read()
out=dpapi(d)
b=io.BytesIO(out)
hl=struct.unpack('<I',b.read(4))[0]; b.read(hl)
cl=struct.unpack('<I',b.read(4))[0]
flag=b.read(1)[0]
assert flag==3, flag
enc_key=b.read(32); iv=b.read(12); ct=b.read(32); tag=b.read(16)
json.dump({'enc_key':enc_key.hex(),'iv':iv.hex(),'ct':ct.hex(),'tag':tag.hex()},
    open(r'D:\ask\gcm_parts.json','w'))
print('parts saved flag', flag)
