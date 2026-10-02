#!/usr/bin/env python3
"""One bounded Workers AI request using the existing Cloudflare deployment OAuth.
No OpenAI/Codex/Grok credentials, token output, generic proxy or account mutation.
stdin is JSON model input; stdout contains only inference response/evidence metadata.
"""
import json,pathlib,tomllib,urllib.request,urllib.error,sys
MODEL='@cf/qwen/qwen3-30b-a3b-fp8'
ACCOUNT='7efeb52ec5727a903edd8ef7ae8eb925'
body=sys.stdin.buffer.read(60001)
assert len(body)<=60000, 'Inference input too large'
v=json.loads(body)
assert v.get('max_tokens',0)<=1200 and v.get('stream') is False
config=tomllib.loads((pathlib.Path.home()/'.wrangler/config/default.toml').read_text())
request=urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/ai/run/{MODEL}',data=body,method='POST',headers={'Authorization':'Bearer '+config['oauth_token'],'Content-Type':'application/json'})
try:
 with urllib.request.urlopen(request,timeout=45) as r: result=json.load(r);status=r.status
except urllib.error.HTTPError as e: result=json.load(e);status=e.code
print(json.dumps({'httpStatus':status,'success':result.get('success'),'result':result.get('result'),'errors':result.get('errors')}))
