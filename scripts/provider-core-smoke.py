#!/usr/bin/env python3
"""Bounded direct Artifacts provider tests; no app-user/authentication claim."""
import pathlib,subprocess,json,os,time,hashlib,sys
from importlib.machinery import SourceFileLoader
cf=SourceFileLoader('cf','scripts/cloudflare-core-api.py').load_module();api=cf.API()
ROOT=pathlib.Path('.tmp/core-provider-smoke-'+str(time.time_ns())).resolve();ROOT.mkdir(exist_ok=True)
NAME='cf-native-forge-provider-smoke';TASK='cf-native-forge-provider-task';checks=[];commands=[]
def git(args,cwd=None,token=None,ok=True):
    env=dict(os.environ);env.pop('GH_TOKEN',None);env.pop('GITHUB_TOKEN',None)
    env.update(GIT_TERMINAL_PROMPT='0',GIT_LFS_SKIP_SMUDGE='1',GIT_CONFIG_NOSYSTEM='1')
    if token:env.update(GIT_CONFIG_COUNT='2',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+token,GIT_CONFIG_KEY_1='credential.helper',GIT_CONFIG_VALUE_1='')
    started=time.time();p=subprocess.run(['git','-c','core.hooksPath=/dev/null',*args],cwd=cwd,env=env,capture_output=True,text=True,timeout=90)
    commands.append({'args':args,'exit':p.returncode,'ms':round((time.time()-started)*1000,2),'stdout':p.stdout.strip(),'stderr':p.stderr.strip()})
    if ok:assert p.returncode==0,'Git failed: '+str(args)
    else:assert p.returncode!=0,'Denied Git operation unexpectedly succeeded'
    return p.stdout.strip()
def check(name,**detail):checks.append({'name':name,'passed':True,**detail})
def stream(source,target,base,candidate,ok=True):
    body={'source':source,'target':target,'base':base,'candidate':candidate,'ref':'refs/heads/main'}
    p=subprocess.run(['node_modules/.bin/tsx','scripts/stream-provider.ts'],input=json.dumps(body),capture_output=True,text=True,timeout=120)
    result=json.loads(p.stdout);assert (p.returncode==0)==ok,str(result);return result
try:
    r=api.call(cf.BASE+'/repos','POST',{'name':NAME,'read_only':False,'set_default_branch':'main'});remote=r['remote'];initial=r['token']
    work=ROOT/'work';work.mkdir();git(['init','--initial-branch=main'],work);git(['config','user.name','Synthetic Provider Test'],work);git(['config','user.email','synthetic@example.invalid'],work)
    (work/'README.md').write_text('Native Git fixture\n');git(['add','.'],work);git(['commit','-m','base'],work);base=git(['rev-parse','HEAD'],work)
    git(['branch','side'],work);git(['tag','-a','v1','-m','annotated'],work)
    git(['push',remote,'main','side','refs/tags/v1'],work,initial);check('real native authenticated push',base=base)
    git(['ls-remote',remote],ok=False);check('anonymous Git denied')
    read=api.call(cf.BASE+'/tokens','POST',{'repo':NAME,'scope':'read','ttl':60})
    consumer=ROOT/'consumer';git(['clone',remote,str(consumer)],token=read['plaintext']);assert (consumer/'README.md').read_text()=='Native Git fixture\n';check('real native authenticated clone and checkout')
    git(['push',remote,'main'],work,read['plaintext'],ok=False);check('read token cannot push')
    fork=api.call(cf.BASE+'/repos/'+NAME+'/fork','POST',{'name':TASK,'default_branch_only':False,'read_only':False})
    source_refs=git(['ls-remote','--heads','--tags',remote],token=initial)
    task_refs=git(['ls-remote','--heads','--tags',fork['remote']],token=fork['token']);assert source_refs==task_refs;check('native fork preserves branch and annotated tag tips',refs=source_refs.splitlines())
    (work/'README.md').write_text('Reviewed native change\n');git(['add','.'],work);git(['commit','-m','candidate'],work);candidate=git(['rev-parse','HEAD'],work);git(['push',fork['remote'],'HEAD:main'],work,fork['token']);check('task native Git push',candidate=candidate)
    target=api.call(cf.BASE+'/tokens','POST',{'repo':NAME,'scope':'write','ttl':60})
    result=stream({'remote':fork['remote'],'plaintext':fork['token']},{'remote':remote,'plaintext':target['plaintext']},base,candidate);check('actual core smart HTTP publisher',receipt=result)
    git(['fetch',remote],consumer,initial);git(['checkout','--detach',candidate],consumer);assert (consumer/'README.md').read_text()=='Reviewed native change\n';check('real native fetch and accepted checkout')
    # Same old ref and immutable candidate after canonical advanced must be rejected atomically.
    stale=stream({'remote':fork['remote'],'plaintext':fork['token']},{'remote':remote,'plaintext':target['plaintext']},base,candidate,ok=False);check('provider rejects stale old head',receipt=stale)
    api.call(cf.BASE+'/tokens/'+read['id'],'DELETE');git(['ls-remote',remote],token=read['plaintext'],ok=False);check('native token revocation exercised')
    for name in [NAME,TASK]:
        for t in api.call(cf.BASE+'/repos/'+name+'/tokens?state=active&per_page=100'):api.call(cf.BASE+'/tokens/'+t['id'],'DELETE')
    subprocess.run(['security','delete-generic-password','-s','cf-native-forge/provider-smoke-token','-a','cf-native-forge'],capture_output=True)
    # Preserve receipts, delete only these own small disposable repos. Keep migration.
    api.call(cf.BASE+'/repos/'+TASK,'DELETE');api.call(cf.BASE+'/repos/'+NAME,'DELETE');check('own disposable repos cleaned after verification')
    out={'boundary':'direct authenticated Artifacts provider, no WorkOS app identity','passed':True,'checks':checks,'commands':commands,'base':base,'candidate':candidate}
    pathlib.Path('docs/core/raw/provider-core-smoke.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'checks':len(checks),'passed':True,'base':base,'candidate':candidate}))
except Exception as e:
    pathlib.Path('docs/core/raw/provider-core-smoke-failure.json').write_text(json.dumps({'type':type(e).__name__,'message':str(e),'checks':checks,'commands':commands},indent=2)+'\n');print(type(e).__name__,str(e));sys.exit(1)
finally:api.save('provider-core-api')
