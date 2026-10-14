# push.py strands.json out.json [shared]  — one commit per strand on base, pushed in parallel.
# shared: every strand edits the same file (to force overlaps) instead of its own file.
import json, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
import os; D = os.path.dirname(os.path.abspath(sys.argv[0]))
REPO = os.environ.get("BRAID_SCALE_WORK", D + "/base")
shared = len(sys.argv) > 3 and sys.argv[3] == "shared"
strands = json.load(open(sys.argv[1]))["ok"]["strands"]
def g(*a, inp=None):
    return subprocess.run(["git", *a], cwd=REPO, input=inp, capture_output=True, text=True, check=True).stdout.strip()
# Strands fork the canonical head: build on what the first strand actually holds.
s0 = strands[0]
g("-c", f"http.extraHeader=Authorization: Bearer {s0['token']}", "fetch", "-q", s0["remote"], "main")
base = g("rev-parse", "FETCH_HEAD")
root_entries = g("ls-tree", base)
scale_entries = g("ls-tree", base + ":scale") if "\tscale" in root_entries else ""
def build(s):
    name = s["name"]
    blob = g("hash-object", "-w", "--stdin", inp=f"Strand {name} was here.\n")
    fname = "shared.txt" if shared else f"{name}.txt"
    have = [l for l in scale_entries.split("\n") if l and not l.endswith("\t" + fname)]
    sub = g("mktree", inp="\n".join(have + [f"100644 blob {blob}\t{fname}"]) + "\n")
    lines = [l for l in root_entries.split("\n") if not l.endswith("\tscale")] + [f"040000 tree {sub}\tscale"]
    tree = g("mktree", inp="\n".join(lines) + "\n")
    return g("commit-tree", tree, "-p", base, "-m", f"Strand {name}: add scale/{fname}")
def push(s):
    sha = build(s)
    t = time.time()
    r = subprocess.run(["git", "-c", f"http.extraHeader=Authorization: Bearer {s['token']}", "push", "-q", s["remote"], f"{sha}:refs/heads/main"], cwd=REPO, capture_output=True, text=True)
    return {"id": s["id"], "name": s["name"], "candidate": sha, "pushMs": round((time.time() - t) * 1000), "ok": r.returncode == 0, "err": r.stderr[-200:]}
t = time.time()
with ThreadPoolExecutor(16) as ex:
    out = list(ex.map(push, strands))
json.dump({"base": base, "wallMs": round((time.time() - t) * 1000), "strands": out}, open(sys.argv[2], "w"))
ok = [o for o in out if o["ok"]]
ms = sorted(o["pushMs"] for o in ok)
print(f"pushed {len(ok)}/{len(out)} in {round((time.time()-t)*1000)} ms; push p50 {ms[len(ms)//2] if ms else '-'} ms, max {ms[-1] if ms else '-'} ms")
for o in out:
    if not o["ok"]: print("FAIL", o["name"], o["err"])
