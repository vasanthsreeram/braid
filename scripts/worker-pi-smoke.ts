import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { git } from "./local.ts";
import assert from "node:assert/strict";
await mkdir(".tmp", { recursive: true });
const module = resolve(".tmp/pi-worker-probe.ts"),
  config = resolve(".tmp/pi-worker-probe.json");
await writeFile(
  module,
  `
import {Harness,createRegistry,defineDoc} from '@earendil-works/pi-durable';
import {createModels} from '@earendil-works/pi-ai/models';
import {JsonlStorage} from '@earendil-works/pi-durable/storage/jsonl';
import {BACKGROUND_CONTEXT as C} from '@earendil-works/chord/context';
import {journalFiles} from '../src/pi-storage.ts';
import {piReview,ReadBroker,reviewScope,REVIEW_MODEL} from '../src/read-agent.ts';
export {ReviewCoordinator} from '../src/review-coordinator.ts';
export class ProbeJournal {
 constructor(public ctx,public env){}
 async fetch(request){
 const b=await request.json();
 const open=()=>JsonlStorage.open('/probe',journalFiles(this.ctx.storage.sql,'/probe'),C,{fsync:true});
 if(b.kind==='journal'){
 const Doc=defineDoc({kind:'app.probe',version:1,scope:'conversation',history:'latest',fork:'initial',initial:()=>({value:0})});
 let h=await Harness.open(await open(),{models:createModels(),registry:createRegistry()},C);let root=await h.root(C);await root.commit(async tx=>{(await tx.doc(Doc,root.id)).value=42;},C);const id=root.id;await h.close(C);
 h=await Harness.open(await open(),{models:createModels(),registry:createRegistry()},C);root=await h.root(C);const persisted=await h.snapshot(Doc,id,C);await h.close(C);return Response.json({persisted,id,same:root.id===id,runtime:'real local workerd DO SQLite + Pi JSONL'});
 }
 const repo={id:'local-worker-source',physical:'actual-project-snapshot',tenant:'local-only',owner:'local-verifier',name:'private-source',visibility:'private',state:'ready',parent:null};
 const file=b.file,commit=b.commit;let sourceReads=0;
 const plane={commit:async(_,sha)=>sha===commit.sha?commit:null,tree:async()=>[{name:file.path,type:'blob',mode:'100644',hash:file.hash}],file:async(_,sha,path)=>{if(sha!==commit.sha||path!==file.path)throw Error('scope');sourceReads++;return new Blob([file.text]);}};
 // Selected filename is flattened only inside this source snapshot adapter. Its
 // content and object SHA are the actual private project object supplied by Git.
 const broker=new ReadBroker(plane,reviewScope(repo,{sha:commit.sha,paths:[file.path]}),async()=>{});
 const directory='/actual-'+b.id;
 const realStorage=await JsonlStorage.open(directory,journalFiles(this.ctx.storage.sql,directory),C,{fsync:true});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),45000);let requests=0;
 try{const result=await piReview(realStorage,broker,async input=>{try{const response=await this.env.AI.run(REVIEW_MODEL,input);await this.ctx.storage.put('last-model-response',response);return response;}catch(e){await this.ctx.storage.put('last-model-response',{errorType:e.name,code:e.code??null,message:String(e.message).slice(0,700).replace(/https?:[^ ]+/g,'[url]')});throw e;}},async()=>{if(++requests>3)throw Error('budget');},ctrl.signal);return Response.json({passed:true,sourceReads,...result});}catch(e){return Response.json({passed:false,error:e.message,requests,response:await this.ctx.storage.get('last-model-response')});}finally{clearTimeout(timer);}
 }
}
export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/budget-'))return env.REVIEWS.get(env.REVIEWS.idFromName('fixture-budget-'+btoa(url.pathname.split('-').slice(1).join('-')))).fetch('https://internal/reserve',{method:'POST'});return env.PROBE.get(env.PROBE.idFromName(url.pathname)).fetch(request);}};
`,
);
await writeFile(
  config,
  JSON.stringify({
    name: "gitflare-local-pi-verifier",
    account_id: "7efeb52ec5727a903edd8ef7ae8eb925",
    main: module,
    compatibility_date: "2026-10-01",
    compatibility_flags: ["nodejs_compat"],
    ai: { binding: "AI", remote: true },
    durable_objects: {
      bindings: [
        { name: "PROBE", class_name: "ProbeJournal" },
        { name: "REVIEWS", class_name: "ReviewCoordinator" },
      ],
    },
    migrations: [
      { tag: "v1", new_sqlite_classes: ["ProbeJournal", "ReviewCoordinator"] },
    ],
  }),
);
const processEnv: NodeJS.ProcessEnv = {
  ...process.env,
  WRANGLER_SEND_METRICS: "false",
};
delete processEnv.GH_TOKEN;
delete processEnv.GITHUB_TOKEN;
const worker = spawn(
  resolve("node_modules/.bin/wrangler"),
  [
    "dev",
    "--config",
    config,
    "--port",
    "0",
    "--inspector-port",
    "0",
    "--persist-to",
    resolve(".tmp/pi-workerd-store"),
  ],
  { env: processEnv, stdio: ["pipe", "pipe", "pipe"] },
);
let logs = "";
worker.stdout.on("data", (b) => (logs += b));
worker.stderr.on("data", (b) => (logs += b));
try {
  const url = await new Promise<string>((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const found = logs.match(/Ready on (http:\/\/localhost:\d+)/);
      if (found) {
        clearInterval(interval);
        resolve(found[1]);
      } else if (Date.now() - start > 30000) {
        clearInterval(interval);
        reject(Error("Worker start timed out"));
      }
    }, 100);
    worker.on("exit", () => {
      clearInterval(interval);
      reject(Error("Worker stopped"));
    });
  });
  const checks: any[] = [];
  const journal = (await (
    await fetch(url + "/journal", {
      method: "POST",
      body: JSON.stringify({ kind: "journal" }),
    })
  ).json()) as any;
  assert.equal(journal.persisted.value, 42);
  assert.equal(journal.same, true);
  checks.push({ journal, passed: true });
  const budgetId = crypto.randomUUID();
  let final = 0;
  for (let i = 0; i < 37; i++) {
    const r = await fetch(url + "/budget-" + budgetId, { method: "POST" });
    final = r.status;
  }
  assert.equal(final, 429);
  checks.push({
    deploymentBudget: 36,
    request37: final,
    realInference: false,
    passed: true,
  });
  const sha = await git(["rev-parse", "HEAD"]),
    path = "src/pi-storage.ts",
    raw = await import("node:child_process"),
    util = await import("node:util"),
    text = (
      await util.promisify(raw.execFile)("git", [
        "-c",
        "core.hooksPath=/dev/null",
        "show",
        sha + ":" + path,
      ])
    ).stdout,
    hash = await git(["rev-parse", sha + ":" + path]);
  const commit = {
    sha,
    tree: "snapshot-tree",
    parents: [],
    message: "Actual cf-native-forge immutable source snapshot",
  };
  const response = (await (
    await fetch(url + "/actual-source-review", {
      method: "POST",
      body: JSON.stringify({
        kind: "real-review",
        id: crypto.randomUUID(),
        commit,
        file: { path: "pi-storage.ts", hash, text },
      }),
    })
  ).json()) as any;
  await writeFile(
    "docs/collab-agent/raw/worker-pi-smoke.json",
    JSON.stringify(
      {
        boundary:
          "Real local workerd Durable Object journal and Pi runtime; actual private project source snapshot adapter; real remote Workers AI binding. No WorkOS app identity or app-owned import.",
        sourceCommit: sha,
        originalPath: path,
        hash,
        checks,
        review: response,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Workerd journal persistence and 36-request deployment quota passed; remote-binding review passed=" +
      response.passed,
  );
} catch (e) {
  await writeFile(
    "docs/collab-agent/raw/worker-pi-smoke-error.txt",
    String(e) + "\n" + logs.replace(/https:\/\/[^\s]+/g, "[url omitted]"),
  );
  throw e;
} finally {
  worker.kill("SIGINT");
}
