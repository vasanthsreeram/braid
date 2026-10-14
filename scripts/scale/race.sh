#!/bin/sh
D=$(cd $(dirname "$0") && pwd); cd $D
./mk.sh $1 $2 $3 > s-$3.json && python3 ./push.py s-$3.json p-$3.json || exit 1
python3 - "$1" "$3" <<'PY'
import sys
repo, prefix = sys.argv[1:3]
open(f"race-{prefix}.js","w").write(open("race.tpl.js").read().replace("__REPO__", repo).replace("__PUSHED__", open(f"p-{prefix}.json").read()))
PY
./bx.sh race-$3.js 300
