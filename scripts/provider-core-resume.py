#!/usr/bin/env python3
"""Continue the recorded bounded provider run after fixing native packet framing."""
import pathlib,subprocess,json,os,time,sys
from importlib.machinery import SourceFileLoader
cf=SourceFileLoader('cf','scripts/cloudflare-core-api.py').load_module();api=cf.API()
prior=json.loads(pathlib.Path('docs/core/raw/provider-core-smoke-failure.json').read_text());checks=prior['checks'];commands=prior['commands'];NAME='cf-native-forge-provider-smoke';TASK='cf-native-forge-provider-task';work=pathlib.Path('.tmp/core-provider-smoke/work').resolve();consumer=pathlib.Path('.tmp/core-provider-smoke/consumer').resolve()
def git(args,cwd=None,token=None,ok=True):
 env=dict(os.environ);env.pop('GH_TOKEN',None);env.pop('GITHUB_TOKEN',None);env.update(GIT_TERMINAL_PROMPT='0',GIT_LFS_SKIP_SMUDGE='1',GIT_CONFIG_NOSYSTEM='1')
 if token:env.update(GIT_CONFIG_COUNT='2',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+token,GIT_CONFIG_KEY_1='credential.helper',GIT_CONFIG_VALUE_1='')
 p=subprocess.run(['git','-c','core.hooksPath=/dev/null',*args],cwd=cwd,env=env,capture_output=True,text=True,timeout=90)
 commands.append({'args':args,'exit':p.returncode,'stdout':p.stdout.strip(),'stderr':p.stderr.strip()});assert (p.returncode==0)==ok,str(args);return p.stdout.strip()
def check(name,**detail):checks.append({'name':name,'passed':True,**detail})
try:
 s=api.call(cf.BASE+'/repos/'+TASK);t=api.call(cf.BASE+'/repos/'+NAME)
 source=api.call(cf.BASE+'/tokens','POST',{'repo':TASK,'scope':'write','ttl':300});target=api.call(cf.BASE+'/tokens','POST',{'repo':NAME,'scope':'write','ttl':60});read=api.call(cf.BASE+'/tokens','POST',{'repo':NAME,'scope':'read','ttl':60})
 base=prior['checks'][0]['base'];candidate=prior['checks'][-1]['candidate']
 result=json.loads(pathlib.Path('docs/core/raw/provider-publisher-verified-framing.json').read_text());assert result['ok'];check('core publisher success with verified native pack framing',receipt=result)
 git(['fetch',t['remote']],consumer,read['plaintext']);git(['checkout','--detach',candidate],consumer);assert (consumer/'README.md').read_text()=='Reviewed native change\n';check('real native fetch and accepted checkout',candidate=candidate)
 body={'source':{'remote':s['remote'],'plaintext':source['plaintext']},'target':{'remote':t['remote'],'plaintext':target['plaintext']},'ref':'refs/heads/main','base':base,'candidate':candidate}
 p=subprocess.run(['node_modules/.bin/tsx','scripts/stream-provider.ts'],input=json.dumps(body),capture_output=True,text=True,timeout=120);stale=json.loads(p.stdout);assert p.returncode!=0 and stale['status']==409;check('core rejects known stale native head',receipt=stale)
 candidates=[]
 for i in [1,2]:
  branch='race-'+str(i);git(['checkout','-B',branch,candidate],work);(work/'README.md').write_text('Racing approved candidate '+str(i)+'\n');git(['add','.'],work);git(['commit','-m',branch],work);sha=git(['rev-parse','HEAD'],work);assert git(['show','-s','--format=%P','HEAD'],work)==candidate;git(['push',s['remote'],'HEAD:refs/heads/'+branch],work,source['plaintext']);candidates.append(sha)
 body['base']=candidate;body['candidates']=candidates
 p=subprocess.run(['node_modules/.bin/tsx','scripts/provider-race.ts'],input=json.dumps(body),capture_output=True,text=True,timeout=120);race=json.loads(p.stdout);assert p.returncode==0,race
 final=git(['ls-remote',t['remote'],'refs/heads/main'],token=read['plaintext']).split()[0];winner=[r for r in race if r['ok']][0];assert final==winner['candidate'];check('actual native atomic ref race: one winner, stale competing push rejected',outcomes=race,final=final)
 api.call(cf.BASE+'/tokens/'+read['id'],'DELETE');git(['ls-remote',t['remote']],token=read['plaintext'],ok=False);check('native revocation invalidates live read token')
 for name in [NAME,TASK]:
  for token in api.call(cf.BASE+'/repos/'+name+'/tokens?state=active&per_page=100'):api.call(cf.BASE+'/tokens/'+token['id'],'DELETE')
 subprocess.run(['security','delete-generic-password','-s','cf-native-forge/provider-smoke-token','-a','cf-native-forge'],capture_output=True)
 api.call(cf.BASE+'/repos/'+TASK,'DELETE');api.call(cf.BASE+'/repos/'+NAME,'DELETE');check('own disposable provider repositories cleaned')
 pathlib.Path('docs/core/raw/provider-core-smoke.json').write_text(json.dumps({'boundary':'direct authenticated native provider and core Git protocol; no WorkOS app identity','passed':True,'checks':checks,'commands':commands,'base':base,'candidate':candidate,'final':final,'earlier_failures':'provider-core-smoke-failure.json and publisher diagnostics retained'},indent=2)+'\n');print(json.dumps({'checks':len(checks),'passed':True,'final':final}))
except Exception as e:
 pathlib.Path('docs/core/raw/provider-core-resume-failure.json').write_text(json.dumps({'message':str(e),'checks':checks,'commands':commands},indent=2)+'\n');print(type(e).__name__,str(e));sys.exit(1)
finally:api.save('provider-core-resume-api')
