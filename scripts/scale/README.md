# Scale harness

Drives the **live** Braid API to measure strand creation, concurrent pushes, the braid
queue (with fast catch-up) and the merge fence under contention. API calls run inside a
browser tab that is signed in to Braid (cmux browser, isolated-world `eval`), so no
session token ever leaves the browser. Git pushes run locally with the 60-second,
strand-scoped write tokens the API issues.

```sh
export BRAID_SURFACE=surface:N               # a cmux browser surface signed in to Braid
git init -q -b main base && (cd base && git commit -q --allow-empty -m seed) && git -C base rev-parse HEAD > base.sha
REPO=$(./newrepo.sh braid-scale | tail -1)   # create + seed a private test repository
./exp.sh $REPO 50 run1 1800 > out-run1.txt; python3 summarize.py run1   # N strands → propose → queue → drain
./race.sh $REPO 20 race1                     # N approved proposals braid in at the same instant
```

`exp.sh` creates N strands (8 at a time), pushes one commit per strand (each adds its own
file under `scale/`), proposes all of them on the same base, queues them all, waits for
the queue to drain, and checks that every strand's file is in the final tree and the
history is linear. Results are in the top-level README's Scale section.
