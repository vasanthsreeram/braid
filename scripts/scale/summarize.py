import json,sys,collections,statistics as st
p=sys.argv[1]
t=open(f'out-{p}.txt').read(); i=t.find('{'); print(t[:i].strip())
d=json.loads(t[i:t.rfind('}')+1])['ok']; w=sorted(d.pop('waited'))
s=json.load(open(f's-{p}.json'))['ok']; c=[x['createMs'] for x in s['strands']]
print('strands created', len(s['strands']), 'failed', len(s['errors']), collections.Counter(json.dumps(e['err'].get('v')) for e in s['errors']), 'create wall ms', s['totalMs'], 'create p50', st.median(c) if c else '-')
print({k:v for k,v in d.items()})
if w: print('braided', len(w), 'drain ms', d['drainMs'], 'per braid ms', round(d['drainMs']/len(w)), 'queue wait p50/max', st.median(w), w[-1])
