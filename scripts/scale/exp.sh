#!/bin/sh
# exp.sh REPO N PREFIX WAIT_S [shared]
D=$(dirname "$0"); cd $D
./mk.sh $1 $2 $3 > s-$3.json || exit 1
python3 ./push.py s-$3.json p-$3.json $5 || exit 1
python3 - "$1" "$3" "$4" <<'PY'
import sys
repo, prefix, wait = sys.argv[1:4]
t = open("queue.tpl.js").read().replace("__REPO__", repo).replace("__PUSHED__", open(f"p-{prefix}.json").read()).replace("__WAIT__", wait)
open(f"q-{prefix}.js", "w").write(t)
PY
./bx.sh q-$3.js $(( $4 + 120 )) > r-$3.json
python3 -c "import json;print(json.dumps(json.load(open('r-$3.json')),indent=1)[:3000])"
