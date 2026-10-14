#!/bin/sh
# Usage: bx.sh <file.js> [timeout_s]  — runs async body (must `return` a value) in the Braid tab, prints JSON.
S=${BRAID_SURFACE:?set BRAID_SURFACE to the cmux browser surface signed in to Braid}
D=$(dirname "$0")
T=${2:-120}
BODY=$(cat "$1")
LIB=$(cat "$D/lib.js")
cmux browser $S eval "window.__out=undefined; ${LIB}; (async()=>{ ${BODY} })().then(v=>{window.__out=JSON.stringify({ok:v})}).catch(e=>{window.__out=JSON.stringify({err:String(e&&e.stack||e)})}); 'started'" >/dev/null
i=0
while [ $i -lt $T ]; do
  R=$(cmux browser $S eval 'window.__out||""')
  if [ -n "$R" ]; then echo "$R"; exit 0; fi
  sleep 1; i=$((i+1))
done
echo '{"err":"timeout"}'
