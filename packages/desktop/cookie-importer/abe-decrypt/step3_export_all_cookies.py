# 最终: XOR得master key -> 解密全部v20 cookie
import json, sqlite3, shutil
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

parts = json.load(open(r'D:\ask\gcm_parts.json'))
nc = json.load(open(r'D:\ask\nc_result.json'))
dec_key = bytes.fromhex(nc['decrypted'])
xor_key = bytes.fromhex('CCF8A1CEC56605B8517552BA1A2D061C03A29E90274FB2FCF59BA4B75C392390')
xored = bytes([a^b for a,b in zip(dec_key, xor_key)])
master = AESGCM(xored)

iv=bytes.fromhex(parts['iv']); ct=bytes.fromhex(parts['ct']); tag=bytes.fromhex(parts['tag'])
app_bound_key = master.decrypt(iv, ct+tag, None)
print('app_bound_key:', app_bound_key.hex())

aesgcm = AESGCM(app_bound_key)
shutil.copy(r'C:\Users\baba1\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies', r'D:\ask\ck_run.db')
con = sqlite3.connect(r'D:\ask\ck_run.db')
rows = con.execute("select host_key,name,path,is_httponly,is_secure,samesite,expires_utc,encrypted_value,value from cookies").fetchall()
out=[]; ok=fail=plain=skip=0
for host,name,path,ho,sec,ss,exp,enc,val in rows:
    try:
        if enc[:3]==b'v20':
            pt = aesgcm.decrypt(enc[3:15], enc[15:-16]+enc[-16:], None)
            value = pt[32:].decode('utf-8', errors='replace')  # 前32字节padding
            ok+=1
        elif val:
            value=val; plain+=1
        else:
            skip+=1; continue
    except Exception:
        fail+=1; continue
    out.append({"name":name,"value":value,"domain":host,"path":path or "/",
        "hostOnly":not host.startswith('.'),"httpOnly":bool(ho),"secure":bool(sec),
        "sameSite":"unspecified",
        "expirationDate":round(exp/1000000-11644473600) if exp else None})
json.dump(out, open(r'D:\ask\cookies_final.json','w'), ensure_ascii=False)
print(f"ok={ok} plain={plain} fail={fail} skip={skip} total={len(out)}")
