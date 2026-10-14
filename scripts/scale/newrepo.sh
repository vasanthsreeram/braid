#!/bin/sh
# newrepo.sh NAME -> prints repo id (seeded with one commit)
D=$(cd $(dirname "$0") && pwd); cd $D
echo "return (await B.api('/api/repos', {name: '$1'})).v.id;" > nr.js
ID=$(./bx.sh nr.js 60 | python3 -c "import json,sys;print(json.load(sys.stdin)['ok'])")
./mk.sh $ID 1 seed > seed-$1.json
python3 - $1 <<'PY'
import json,subprocess,sys
s=json.load(open(f"seed-{sys.argv[1]}.json"))['ok']['strands'][0]
sha=open('base.sha').read().strip()
subprocess.run(["git","-c",f"http.extraHeader=Authorization: Bearer {s['token']}","push","-q",s['remote'],f"{sha}:refs/heads/main"],cwd='base',check=True)
open('seed-task','w').write(s['id'])
PY
cat > sb.js <<JS
const repo="$ID", task="$(cat seed-task)", c="$(cat base.sha)", Z="0".repeat(40);
const p = await B.api(\`/api/repos/\${repo}/proposals\`, {task, base: Z, candidate: c});
await B.api(\`/api/repos/\${repo}/review\`, {id: p.v.id, status: "approved"});
return (await B.api(\`/api/repos/\${repo}/merge\`, {id: p.v.id})).status;
JS
./bx.sh sb.js 60 >&2
echo $ID
