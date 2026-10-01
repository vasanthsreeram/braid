#!/usr/bin/env python3
"""Dedicated evaluation only. Existing Wrangler OAuth; no secret output or rotation.
Run Wrangler whoami first if its normal OAuth session needs a refresh.
"""
import json, pathlib, tomllib, urllib.request, urllib.error, re
ACCOUNT='7efeb52ec5727a903edd8ef7ae8eb925'
NAMESPACE='cf-native-forge-evaluation'
BASE=f'/accounts/{ACCOUNT}/artifacts/namespaces/{NAMESPACE}'
def redacted(v):
    if isinstance(v,dict):return {k:('[REDACTED]' if k.lower() in ['token','plaintext','secret','access_token','refresh_token'] else redacted(x)) for k,x in v.items()}
    if isinstance(v,list):return [redacted(x) for x in v]
    return v
class API:
    def __init__(self):
        config=tomllib.loads((pathlib.Path.home()/'.wrangler/config/default.toml').read_text())
        self.token=config['oauth_token']
        self.receipts=[]
    def call(self,path,method='GET',body=None):
        assert path.startswith(BASE) or path in [f'/accounts/{ACCOUNT}/subscriptions',f'/accounts/{ACCOUNT}/workers/account-settings',f'/accounts/{ACCOUNT}/workers/subdomain',f'/accounts/{ACCOUNT}/r2/buckets/cf-native-forge-lfs-evaluation']
        if path.startswith(BASE):assert re.match(re.escape(BASE)+r'(?:/repos(?:/cf-native-forge-[A-Za-z0-9_-]+(?:/(?:import|fork|tokens)(?:/[^/]+)?)?)?|/tokens(?:/[^/?]+)?)?(?:\?[^ ]*)?$',path)
        req=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,data=None if body is None else json.dumps(body).encode(),method=method,headers={'Authorization':'Bearer '+self.token,'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=240) as r:data=json.load(r);status=r.status
        except urllib.error.HTTPError as e:status=e.code;data=json.load(e)
        self.receipts.append({'path':path,'method':method,'status':status,'request':body,'response':redacted(data)})
        if status>=400 or not data.get('success',False):raise RuntimeError(json.dumps({'status':status,'errors':data.get('errors')}))
        return data.get('result')
    def save(self,name):pathlib.Path('docs/core/raw/'+name+'.json').write_text(json.dumps(self.receipts,indent=2)+'\n')
if __name__=='__main__':
    api=API()
    for path in [f'/accounts/{ACCOUNT}/workers/account-settings',f'/accounts/{ACCOUNT}/subscriptions',f'/accounts/{ACCOUNT}/workers/subdomain',f'/accounts/{ACCOUNT}/r2/buckets/cf-native-forge-lfs-evaluation']:
        try:print(json.dumps(redacted(api.call(path))))
        except RuntimeError as e:print(str(e))
    api.save('account-oauth-current')
