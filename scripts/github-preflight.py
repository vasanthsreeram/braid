#!/usr/bin/env python3
"""Read public Git histories without executing checkout code or using gh credentials.
Mirrors are ignored, hooks disabled, global/system Git config and LFS smudge disabled.
"""
import subprocess,os,json,hashlib,pathlib
names=['cloudnee','himaldb','formninja']
base=pathlib.Path('.tmp/github-preflight');base.mkdir(parents=True,exist_ok=True)
env=dict(os.environ)
for k in ['GH_TOKEN','GITHUB_TOKEN']:env.pop(k,None)
env.update(GIT_TERMINAL_PROMPT='0',GIT_CONFIG_GLOBAL='/dev/null',GIT_CONFIG_NOSYSTEM='1',GIT_LFS_SKIP_SMUDGE='1')
def git(args,cwd=None):
 p=subprocess.run(['git','-c','core.hooksPath=/dev/null',*args],cwd=cwd,env=env,capture_output=True,timeout=60)
 if p.returncode:raise RuntimeError('Git read failed; output withheld')
 return p.stdout
rows=[]
for name in names:
 mirror=base/(name+'.git');url='https://github.com/vasanthsreeram/'+name+'.git'
 original=git(['ls-remote','--heads','--tags',url]).decode().splitlines()
 if not mirror.exists():git(['clone','--mirror',url,str(mirror)])
 else:git(['fetch','--prune','--force',url,'+refs/heads/*:refs/heads/*','+refs/tags/*:refs/tags/*'],mirror)
 refs=git(['for-each-ref','--format=%(refname) %(objectname)'],mirror).decode().splitlines()
 advertised=sorted(' '.join(reversed(line.split())) for line in original if not line.endswith('^{}'))
 assert sorted(refs)==advertised, 'Mirror refs differ from source advertisement'
 assert len(refs)<=512, 'Source exceeds native branch/tag ref limit'
 objects=sorted(set(git(['rev-list','--objects','--all'],mirror).decode().splitlines()))
 oids=sorted({x.split()[0] for x in objects})
 data=subprocess.run(['git','-c','core.hooksPath=/dev/null','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],input=('\n'.join(oids)+'\n').encode(),cwd=mirror,env=env,capture_output=True,timeout=60,check=True).stdout.decode().splitlines()
 blobs=[(int(x.split()[2]),x.split()[0]) for x in data if x.split()[1]=='blob']
 max_blob=max(blobs,default=(0,''))
 packbytes=len(git(['bundle','create','-','--all'],mirror))
 head=git(['rev-parse','HEAD'],mirror).decode().strip()
 files=[]; pointers=[]
 for entry in git(['ls-tree','-rz',head],mirror).split(b'\0'):
  if not entry:continue
  metadata,path=entry.split(b'\t',1);mode,typ,oid=metadata.decode().split()
  if typ=='blob':
   content=git(['cat-file','blob',oid],mirror)
   files.append({'path':path.decode(errors='replace'),'mode':mode,'oid':oid,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
  elif mode=='160000':files.append({'path':path.decode(errors='replace'),'mode':mode,'oid':oid,'submodule':True})
 for size,oid in blobs:
  if size<=1024 and git(['cat-file','blob',oid],mirror).startswith(b'version https://git-lfs.github.com/spec/v1\n'):pointers.append(oid)
 after=git(['ls-remote','--heads','--tags',url]).decode().splitlines()
 row={'name':name,'source':url,'sourceRefsBefore':original,'sourceRefsAfter':after,'mirrorRefs':refs,'unchanged':original==after,'shallow':git(['rev-parse','--is-shallow-repository'],mirror).decode().strip()=='true','head':head,'commits':git(['rev-list','--all'],mirror).decode().splitlines(),'reachableObjectIds':oids,'reachableObjectSetSha256':hashlib.sha256(('\n'.join(oids)+'\n').encode()).hexdigest(),'reachableUncompressedBytes':sum(int(x.split()[2]) for x in data),'largestBlobBytes':max_blob[0],'bundleBytes':packbytes,'checkout':files,'historicalLfsPointers':pointers,'submodules':any(x.get('submodule') for x in files),'fitsNativeBlob32MBAndImporter40MB':max_blob[0]<32*1024*1024 and packbytes<40*1024*1024}
 rows.append(row)
 print(json.dumps({k:row[k] for k in ['name','head','largestBlobBytes','bundleBytes','reachableUncompressedBytes','fitsNativeBlob32MBAndImporter40MB']}))
pathlib.Path('docs/github-auth/raw/preflight.json').write_text(json.dumps({'boundary':'Anonymous public Git preflight only; no app destination imports','repositories':rows},indent=2)+'\n')
