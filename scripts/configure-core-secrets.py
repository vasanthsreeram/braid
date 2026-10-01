#!/usr/bin/env python3
"""Install already-provided dedicated credentials. Creates no provider account/key.
All values are read from macOS Keychain and passed to Wrangler solely via stdin.
No .env, provider credential files, OAuth rotation, login or billing actions.
"""
import subprocess,os,json,sys
AUTH=['WORKOS_CLIENT_ID','WORKOS_ISSUER','WORKOS_API_KEY']
R2=['R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']
keys=R2 if '--r2' in sys.argv else AUTH
values={}
for name in keys:
 service='cf-native-forge/'+name.lower().replace('_','-')
 p=subprocess.run(['security','find-generic-password','-s',service,'-a','cf-native-forge','-w'],capture_output=True,text=True)
 if p.returncode or not p.stdout.strip():print(json.dumps({'missing_keychain_service':service,'account':'cf-native-forge'}));sys.exit(1)
 values[name]=p.stdout.strip()
env=dict(os.environ)
for name in ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_API_KEY','CLOUDFLARE_EMAIL']:env.pop(name,None)
env['WRANGLER_SEND_METRICS']='false'
# Remove the nonsecret placeholder before adding a secret of the same name.
# Future deploys retain the Worker secret; no real credential enters configuration.
if 'WORKOS_CLIENT_ID' in values:
 from pathlib import Path
 p=Path('wrangler.jsonc');s=p.read_text();s=s.replace('    "WORKOS_CLIENT_ID": "UNCONFIGURED",\n','');p.write_text(s)
 p=subprocess.run(['node_modules/.bin/wrangler','deploy'],env=env,capture_output=True,text=True,timeout=90)
 if p.returncode:print(json.dumps({'operation':'remove-placeholder-deploy','exit':p.returncode}));sys.exit(1)
for name,value in values.items():
 p=subprocess.run(['node_modules/.bin/wrangler','secret','put',name],input=value+'\n',env=env,capture_output=True,text=True,timeout=90)
 print(json.dumps({'name':name,'exit':p.returncode}))
 if p.returncode:sys.exit(1)
print('Credentials installed; run real browser login/upload verification before claiming success.')
