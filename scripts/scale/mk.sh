#!/bin/sh
# mk.sh REPO N PREFIX -> strands json
D=$(dirname "$0")
sed -e "s/__REPO__/$1/" -e "s/__N__/$2/" -e "s/__PREFIX__/$3/" $D/strands.tpl.js > $D/run-strands.js
$D/bx.sh $D/run-strands.js 600
