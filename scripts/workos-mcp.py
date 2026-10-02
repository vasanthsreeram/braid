#!/usr/bin/env python3
"""WorkOS MCP via the registered native client. No agent/model turns, credential
reads, or application-key provisioning. OAuth remains managed by native Keychain.
Usage: python3 scripts/workos-mcp.py list
       python3 scripts/workos-mcp.py TOOL '{"argument":"value"}'
"""
import json, subprocess, sys, time, selectors
p = subprocess.Popen(['codex','app-server','-c','mcp_oauth_credentials_store="keyring"'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
ENVIRONMENT = 'environment_01M3WQ9V3GK4KJ67E7BXDB1YXB'
READS = {'authkitSettings','redirectUris','logoutUris','defaultAuthkitApplication','connectionsByType','users','userSessions','userDetails'}
WRITES = {'createProjectWithNewEnvironments','setRedirectUris','setLogoutUris','updateAuthkitApplication','updateAuthkitSettings','updateOauthCredentials'}
def validate(tool, args):
    assert tool in {'whoami','list_operations','query','mutate'}, 'Unsupported MCP tool'
    if tool == 'query':
        assert args.get('operation') in READS, 'Only scoped configuration and auth evidence queries are allowed'
        if args.get('operation') in {'connectionsByType','users','userSessions','userDetails'}:
            assert args.get('environment_id') == ENVIRONMENT, 'Auth evidence restricted to Gitflare'
    if tool == 'mutate':
        op = args.get('operation'); assert op in WRITES, 'Mutation outside Gitflare setup scope'
        v = args.get('variables',{})
        if op == 'createProjectWithNewEnvironments':
            assert v == {'includeProductionEnvironment':False,'name':'Gitflare'}
        else:
            assert args.get('environment_id') == ENVIRONMENT, 'Only dedicated Gitflare environment may be changed'
            if op == 'updateOauthCredentials':
                assert not any(k in v for k in ['appleKeyId','applePrivateKey','appleTeamId']), 'Only Gitflare GitHub credentials may be changed'
                # Resolve ownership at the provider, rather than trusting a caller-supplied ID.
                proof=rpc('mcpServer/tool/call',{'threadId':t,'server':'workos','tool':'query','arguments':{'operation':'connectionsByType','environment_id':ENVIRONMENT,'variables':{'type':'GithubOAuth'}}})
                ids=[]
                for block in proof.get('content',[]):
                    if block.get('type')=='text':
                        try:
                            rows=json.loads(block['text']).get('oauthCredentialsByType',{}).get('data',[])
                            ids.extend(row.get('id') for row in rows)
                        except (ValueError,TypeError): pass
                assert v.get('oauthCredentialId') in ids, 'GitHub credential does not belong to dedicated Gitflare environment'
            if op == 'updateAuthkitApplication': assert v.get('applicationId') == 'app_01M3WQ9VPR19MF2K8359SNVN0S'
def scrub(value):
    if isinstance(value,dict):
        return {k:('[redacted]' if isinstance(v,str) and any(w in k.lower() for w in ['secret','access_token','refresh_token','authorization_code','privatekey']) else scrub(v)) for k,v in value.items()}
    if isinstance(value,list): return [scrub(v) for v in value]
    if isinstance(value,str):
        try: return json.dumps(scrub(json.loads(value)))
        except (ValueError,TypeError): return value
    return value
seq = 0
sel = selectors.DefaultSelector(); sel.register(p.stdout, selectors.EVENT_READ)
def rpc(method, params):
    global seq
    seq += 1; ident = seq
    p.stdin.write(json.dumps({'id':ident,'method':method,'params':params})+'\n'); p.stdin.flush()
    deadline = time.monotonic()+55
    while time.monotonic()<deadline:
        if not sel.select(timeout=1): continue
        line = p.stdout.readline()
        if not line: raise RuntimeError('Native MCP client exited')
        v = json.loads(line)
        if v.get('id') == ident:
            if 'error' in v: raise RuntimeError('Native MCP failed; provider error details withheld to protect credentials')
            return v['result']
    raise RuntimeError('Native MCP call timed out; no prompts bypassed')
try:
    rpc('initialize',{'clientInfo':{'name':'gitflare_mcp_configuration','version':'1'},'capabilities':{'experimentalApi':True}})
    p.stdin.write('{"method":"initialized"}\n'); p.stdin.flush()
    t = rpc('thread/start',{'cwd':'/Users/admin/projects/cf-native-forge','ephemeral':True})['thread']['id']
    if sys.argv[1] == 'list':
        v = rpc('mcpServerStatus/list',{'threadId':t})
        v['data'] = [x for x in v['data'] if x['name'] == 'workos']
        print(json.dumps(v,indent=2))
    elif sys.argv[1] == 'batch':
        rows=[]
        for call in json.loads(sys.stdin.read() if sys.argv[2] == '-' else sys.argv[2]):
            if any('secret' in k.lower() for k in call.get('arguments',{}).get('variables',{})): assert sys.argv[2]=='-', 'Secrets must use stdin'
            validate(call['tool'],call.get('arguments',{}))
            v=rpc('mcpServer/tool/call',{'threadId':t,'server':'workos','tool':call['tool'],'arguments':call.get('arguments',{})})
            rows.append({'call':call,'result':v})
        print(json.dumps(scrub(rows),indent=2))
    else:
        args=json.loads(sys.stdin.read() if sys.argv[2] == '-' else sys.argv[2])
        if sys.argv[1]=='mutate' and any('secret' in k.lower() for k in args.get('variables',{})):
            assert sys.argv[2]=='-', 'Secrets must use stdin, never command arguments'
        validate(sys.argv[1],args)
        v = rpc('mcpServer/tool/call',{'threadId':t,'server':'workos','tool':sys.argv[1],'arguments':args})
        print(json.dumps(scrub(v),indent=2))
finally:
    p.terminate(); p.wait(timeout=5)
