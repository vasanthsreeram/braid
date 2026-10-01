#!/usr/bin/env python3
"""Read-only source -> native Artifacts importer -> full private verification.
Does not execute imported code, rewrite history, smudge LFS, initialize submodules,
or persist a credential in Git config/URL/reports.
"""
import pathlib, subprocess, json, os, hashlib, time, sys
from importlib.machinery import SourceFileLoader
cf=SourceFileLoader('cf','scripts/cloudflare-core-api.py').load_module()
NAME='Maggie-s_Farm_consolidated'
TARGET='cf-native-forge-maggies-farm-migration'
SOURCE='https://github.com/vasanthsreeram/'+NAME+'.git'
ROOT=pathlib.Path('.tmp/core-migration').resolve()
api=cf.API();receipts=[]
def git(args,cwd=None,token=None,allow_failure=False):
    env=dict(os.environ);env.pop('GH_TOKEN',None);env.pop('GITHUB_TOKEN',None)
    env.update(GIT_TERMINAL_PROMPT='0',GIT_LFS_SKIP_SMUDGE='1',GIT_CONFIG_NOSYSTEM='1')
    if token:env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+token)
    started=time.time()
    p=subprocess.run(['git','-c','core.hooksPath=/dev/null',*args],cwd=cwd,env=env,capture_output=True,timeout=240)
    receipts.append({'command':['git','-c','core.hooksPath=/dev/null',*args],'exit':p.returncode,'ms':round((time.time()-started)*1000,2),'stdout_bytes':len(p.stdout),'stderr_bytes':len(p.stderr)})
    if p.returncode and not allow_failure:raise RuntimeError('Git command failed: '+str(args)+' exit '+str(p.returncode))
    return p.stdout.decode().strip()
def refs(directory):return git(['--git-dir',str(directory),'for-each-ref','--format=%(objectname) %(refname)','refs/heads','refs/tags']).splitlines()
def inventory(directory,kind):
    rows=git(['--git-dir',str(directory),'rev-list','--all',*(['--objects','--no-object-names'] if kind=='objects' else [])]).splitlines()
    return sorted(set(rows))
def checkout(directory,dest,commit):
    git(['clone','--no-local',str(directory),str(dest)])
    git(['checkout','--detach',commit],dest)
    rows=git(['ls-tree','-r',commit],dest).splitlines();content=[]
    for row in rows:
        meta,path=row.split('\t',1);mode,kind,oid=meta.split()
        if kind=='commit':raise RuntimeError('Submodule requires separate migration: '+path)
        p=dest/path
        b=os.readlink(p).encode() if mode=='120000' else p.read_bytes()
        content.append({'path':path,'mode':mode,'git_oid':oid,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
    return content
try:
    pre=json.loads(pathlib.Path('docs/core/raw/'+NAME+'-preflight.json').read_text())
    assert not pre['violations'] and not pre['lfs_pointers'] and pre['object_bytes']<1000000000
    before=git(['ls-remote','--heads','--tags',SOURCE]).splitlines()
    normalized=lambda rows:sorted(x.replace('\t',' ') for x in rows)
    assert normalized(before)==sorted(pre['refs']), 'Source drift before import'
    # The first native import's genuine 413 receipt is retained separately.
    result=api.call(cf.BASE+'/repos','POST',{'name':TARGET,'read_only':False,'set_default_branch':'main'})
    stream=subprocess.run(['node_modules/.bin/tsx','scripts/stream-provider.ts'],input=json.dumps({'mode':'import','source':{'remote':SOURCE},'target':{'remote':result['remote'],'plaintext':result['token']}}),capture_output=True,text=True,timeout=240)
    stream_result=json.loads(stream.stdout)
    pathlib.Path('docs/core/raw/migration-stream-transfer.json').write_text(json.dumps(stream_result,indent=2)+'\n')
    assert stream.returncode==0, 'Stream transfer failed: '+str(stream_result)
    # Returned initial token remains only in this process until revocation.
    token=result['token'];remote=result['remote']
    assert remote.startswith('https://'+cf.ACCOUNT+'.artifacts.cloudflare.net/git/'+cf.NAMESPACE+'/')
    dest=ROOT/(TARGET+'.git');git(['clone','--mirror',remote,str(dest)],token=token)
    source=ROOT/(NAME+'.git');sr=refs(source);dr=refs(dest);assert sr==dr,'Ref mismatch'
    so=inventory(source,'objects');do=inventory(dest,'objects');assert so==do,'Reachable object mismatch'
    sc=inventory(source,'commits');dc=inventory(dest,'commits');assert sc==dc,'Commit mismatch'
    commit=sr[0].split()[0]
    source_content=checkout(source,ROOT/'source-checkout',commit)
    dest_content=checkout(dest,ROOT/'destination-checkout',commit)
    assert source_content==dest_content,'Full checkout content mismatch'
    assert not (dest/'shallow').exists()
    after=git(['ls-remote','--heads','--tags',SOURCE]).splitlines();assert before==after,'Source drift during verification'
    denied=git(['ls-remote',remote],allow_failure=True);assert not denied,'Anonymous private repo readable'
    tokens=api.call(cf.BASE+'/repos/'+TARGET+'/tokens?state=active&per_page=100')
    for t in tokens:api.call(cf.BASE+'/tokens/'+t['id'],'DELETE')
    # Credential invalidation is exercised after revoke using the same token.
    rejected=git(['ls-remote',remote],token=token,allow_failure=True);assert not rejected,'Revoked token still readable'
    out={'status':'verified','test_boundary':'direct provider streaming Git import after native 40MB-limit rejection; not WorkOS app importer','source':SOURCE,'destination':remote,'destination_id':result['id'],'read_only':False,'visibility':'private-token-required','source_refs_before':before,'source_refs_after':after,'source_refs':sr,'destination_refs':dr,'commit_count':len(sc),'reachable_object_count':len(so),'reachable_object_ids_sha256':hashlib.sha256(('\n'.join(so)+'\n').encode()).hexdigest(),'commit_ids':sc,'checkout_files':source_content,'no_shallow':True,'lfs_pointers':[],'submodules':[],'commands':receipts}
    pathlib.Path('docs/core/raw/migration-verification.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({k:v for k,v in out.items() if k not in ['checkout_files','commands','commit_ids']}))
except Exception as e:
    pathlib.Path('docs/core/raw/migration-failure.json').write_text(json.dumps({'type':type(e).__name__,'message':str(e),'commands':receipts},indent=2)+'\n')
    print(type(e).__name__,str(e));sys.exit(1)
finally:api.save('migration-provider-api')
