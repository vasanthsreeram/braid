#!/usr/bin/env python3
"""WorkOS MCP via the registered native client. No agent/model turns, credential
reads, or application-key provisioning. OAuth remains managed by native Keychain.
Usage: python3 scripts/workos-mcp.py list
       python3 scripts/workos-mcp.py TOOL '{"argument":"value"}'
"""
import json, subprocess, sys, time, selectors
p = subprocess.Popen(['codex','app-server','-c','mcp_oauth_credentials_store="keyring"'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
ENVIRONMENT = 'environment_01M3WQ9V3GK4KJ67E7BXDB1YXB'
READS = {'authkitSettings','redirectUris','logoutUris','defaultAuthkitApplication'}
WRITES = {'createProjectWithNewEnvironments','setRedirectUris','setLogoutUris','updateAuthkitApplication'}
def validate(tool, args):
    assert tool in {'whoami','list_operations','query','mutate'}, 'Unsupported MCP tool'
    if tool == 'query': assert args.get('operation') in READS, 'Only nonsecret configuration queries are allowed'
    if tool == 'mutate':
        op = args.get('operation'); assert op in WRITES, 'Mutation outside Gitflare setup scope'
        v = args.get('variables',{})
        if op == 'createProjectWithNewEnvironments':
            assert v == {'includeProductionEnvironment':False,'name':'Gitflare'}
        else:
            assert args.get('environment_id') == ENVIRONMENT, 'Only dedicated Gitflare environment may be changed'
            if op == 'updateAuthkitApplication': assert v.get('applicationId') == 'app_01M3WQ9VPR19MF2K8359SNVN0S'
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
            if 'error' in v: raise RuntimeError(json.dumps(v['error']))
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
        for call in json.loads(sys.argv[2]):
            validate(call['tool'],call.get('arguments',{}))
            v=rpc('mcpServer/tool/call',{'threadId':t,'server':'workos','tool':call['tool'],'arguments':call.get('arguments',{})})
            rows.append({'call':call,'result':v})
        print(json.dumps(rows,indent=2))
    else:
        validate(sys.argv[1],json.loads(sys.argv[2]))
        v = rpc('mcpServer/tool/call',{'threadId':t,'server':'workos','tool':sys.argv[1],'arguments':json.loads(sys.argv[2])})
        print(json.dumps(v,indent=2))
finally:
    p.terminate(); p.wait(timeout=5)
