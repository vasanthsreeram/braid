#!/usr/bin/env python3
"""Configure ONLY Gitflare GitHub OAuth from dedicated Keychain values.
WorkOS MCP OAuth stays in the native Keychain client. Application secrets travel
only through subprocess stdin and are never printed or passed as command args.
The GitHub OAuth App and WorkOS credential record must already exist.
"""
import subprocess,json,sys
ENVIRONMENT='environment_01M3WQ9V3GK4KJ67E7BXDB1YXB'
values={}
for field in ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET']:
 service='gitflare/'+field.lower().replace('_','-')
 p=subprocess.run(['security','find-generic-password','-s',service,'-a','gitflare','-w'],capture_output=True,text=True,timeout=15)
 if p.returncode or not p.stdout.strip():
  print(json.dumps({'blocked':'Dedicated Gitflare GitHub OAuth credential is missing','keychain_service':service,'account':'gitflare'}));sys.exit(1)
 values[field]=p.stdout.strip()
query={'operation':'connectionsByType','environment_id':ENVIRONMENT,'variables':{'type':'GithubOAuth'}}
p=subprocess.run(['python3','scripts/workos-mcp.py','query','-'],input=json.dumps(query),capture_output=True,text=True,timeout=65)
if p.returncode: print('WorkOS query failed; credential-bearing details withheld');sys.exit(1)
result=json.loads(p.stdout);rows=[]
for block in result.get('content',[]):
 if block.get('type')=='text':
  try:rows.extend(json.loads(block['text']).get('oauthCredentialsByType',{}).get('data',[]))
  except (ValueError,TypeError):pass
if len(rows)!=1:
 print(json.dumps({'blocked':'Open Gitflare Staging → Authentication → OAuth providers → GitHub → Manage in WorkOS Dashboard and configure the dedicated app first','credential_records':len(rows)}));sys.exit(1)
# Install Worker revocation credentials first; token-returning login needs both sides.
p=subprocess.run(['python3','scripts/configure-core-secrets.py','--github'],capture_output=True,text=True,timeout=200)
if p.returncode:print('GitHub Worker secret installation failed; no WorkOS provider mutation performed');sys.exit(1)
args={'operation':'updateOauthCredentials','environment_id':ENVIRONMENT,'variables':{'oauthCredentialId':rows[0]['id'],'clientId':values['GITHUB_CLIENT_ID'],'clientSecret':values['GITHUB_CLIENT_SECRET'],'returnProviderTokens':True,'customScopes':[],'isUserlandEnabled':True}}
p=subprocess.run(['python3','scripts/workos-mcp.py','mutate','-'],input=json.dumps(args),capture_output=True,text=True,timeout=120)
if p.returncode:print('Gitflare WorkOS GitHub configuration failed; credential-bearing details withheld');sys.exit(1)
r=json.loads(p.stdout)
if r.get('isError'):print('WorkOS rejected configuration; credential-bearing details withheld');sys.exit(1)
print(json.dumps({'environment':ENVIRONMENT,'github_provider_tokens_enabled':True,'additional_repository_scopes_requested':False,'worker_revocation_credentials_installed':True,'boundary':'Configuration completed; real sign-in, repo listing and app imports still require verification'}))
