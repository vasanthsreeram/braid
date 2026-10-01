// Developer provider verification: credentials enter on stdin, never args/files/logs.
import { importHTTP, publishHTTP } from "../src/git-http.ts";
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const v = JSON.parse(raw);
raw = "";
try {
  const result =
    v.mode === "import"
      ? await importHTTP(v.source, v.target)
      : await publishHTTP(v.source, v.target, v.ref, v.base, v.candidate);
  console.log(JSON.stringify({ ok: true, result }));
} catch (e: any) {
  console.log(
    JSON.stringify({ ok: false, status: e.status ?? 500, message: e.message }),
  );
  process.exitCode = 1;
}
