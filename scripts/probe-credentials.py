#!/usr/bin/env python3
"""Read-only, allowlisted CF probes. Secrets stay solely in memory, never child argv/logs."""
import concurrent.futures, json, pathlib, subprocess, urllib.request, urllib.error, re, os
SERVICES = [('bugguide-deploy-token','lintware','7efeb52ec5727a903edd8ef7ae8eb925'),('unified-token','lintware','7efeb52ec5727a903edd8ef7ae8eb925'),('cloudflare_api_token','lintware','7efeb52ec5727a903edd8ef7ae8eb925'),('workers-pages-dns-token','noverse','d548b7a718412ded2345edbf8733cdc3'),('pages-token','lintware','7efeb52ec5727a903edd8ef7ae8eb925'),('novoschool-workers-deploy-token','lintware','7efeb52ec5727a903edd8ef7ae8eb925')]
results=[]
for short,user,aid in SERVICES:
    p=subprocess.run(['security','find-generic-password','-s',('openclaw/cloudflare/novoschool/workers-deploy-token' if short=='novoschool-workers-deploy-token' else 'openclaw/cloudflare/'+user+'/'+short),'-a',user,'-w'],capture_output=True)
    if p.returncode:results.append({'credential':short,'keychain':'unavailable'});continue
    key=p.stdout.decode().strip()
    for path in ['/user/tokens/verify','/accounts/'+aid,'/accounts/'+aid+'/workers/account-settings','/accounts/'+aid+'/artifacts/namespaces/default/repos?limit=1','/accounts/'+aid+'/r2/buckets','/accounts/'+aid+'/subscriptions']:
        req=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers={'Authorization':'Bearer '+key})
        try:r=urllib.request.urlopen(req,timeout=25);status=r.status;data=json.load(r)
        except urllib.error.HTTPError as e:status=e.code;data=json.load(e)
        out={'credential':short,'account':aid,'path':path,'status':status,'success':data.get('success'),'errors':data.get('errors')}
        v=data.get('result')
        if path.endswith('/verify') and isinstance(v,dict):out['token_status']=v.get('status')
        if path.endswith('account-settings') and isinstance(v,dict):out['settings']={k:v.get(k) for k in ['default_usage_model','usage_model','max_subdomain_count']}
        if path.endswith('/subscriptions') and isinstance(v,list):out['plans']=[{k:x.get(k) for k in ['id','state','frequency','price','rate_plan']} for x in v]
        results.append(out)
# No bucket/repo contents, returned tokens or request headers are emitted.
path=pathlib.Path('docs/benchmarks/raw/cloudflare-probes-v1.json')
path.write_text(json.dumps(results,indent=2)+'\n')
print('Read-only probe rows:',len(results),'statuses:',sorted(set(r.get('status') for r in results if 'status' in r)))
