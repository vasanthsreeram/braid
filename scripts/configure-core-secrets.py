#!/usr/bin/env python3
"""Install already-provided dedicated credentials. Creates no provider account/key.
All values are read from macOS Keychain and passed to Wrangler solely via stdin.
No .env, provider credential files, OAuth rotation, login or billing actions.
"""
import subprocess,os,json,sys
AUTH=['WORKOS_API_KEY']
R2=['R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']
keys=R2 if '--r2' in sys.argv else AUTH
values={}
for name in keys:
 account = 'cf-native-forge' if '--r2' in sys.argv else 'gitflare'
 service=account+'/'+name.lower().replace('_','-')
 p=subprocess.run(['security','find-generic-password','-s',service,'-a',account,'-w'],capture_output=True,text=True)
 if p.returncode or not p.stdout.strip():print(json.dumps({'missing_keychain_service':service,'account':account}));sys.exit(1)
 values[name]=p.stdout.strip()
env=dict(os.environ)
for name in ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_API_KEY','CLOUDFLARE_EMAIL']:env.pop(name,None)
env['WRANGLER_SEND_METRICS']='false'
for name,value in values.items():
 p=subprocess.run(['node_modules/.bin/wrangler','secret','put',name],input=value+'\n',env=env,capture_output=True,text=True,timeout=90)
 print(json.dumps({'name':name,'exit':p.returncode}))
 if p.returncode:sys.exit(1)
print('Credentials installed; run real browser login/upload verification before claiming success.')
