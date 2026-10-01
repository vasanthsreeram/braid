import {publishHTTP} from "../src/git-http.ts";
import {writeFile} from "node:fs/promises";
let raw="";for await(const chunk of process.stdin)raw+=chunk;const v=JSON.parse(raw);raw="";
const trace:any[]=[];
const request:typeof fetch=async(url,init)=>{
 const r=await fetch(url,init);const row:any={url:String(url),status:r.status,contentType:r.headers.get("content-type")};
 if(String(url).endsWith("git-upload-pack")) {
  const bytes=new Uint8Array(await r.arrayBuffer());await writeFile(".tmp/core-provider-smoke/pack-response.bin",bytes);row.bytes=bytes.length;row.prefix=Buffer.from(bytes.slice(0,80)).toString("hex");trace.push(row);return new Response(bytes,{status:r.status,headers:r.headers});
 }
 if(!r.ok)row.body=(await r.clone().text()).slice(0,2000);trace.push(row);return r;
};
try{const result=await publishHTTP(v.source,v.target,v.ref,v.base,v.candidate,request);console.log(JSON.stringify({ok:true,result,trace}));}
catch(e:any){console.log(JSON.stringify({ok:false,message:e.message,status:e.status,trace}));process.exitCode=1;}
