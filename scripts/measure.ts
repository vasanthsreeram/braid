import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { cleanEnv } from "./local.ts";
export interface Measurement {
  backend: string;
  repetition: number;
  operation: string;
  wallMs: number;
  userSeconds: number | null;
  systemSeconds: number | null;
  maxRssBytes: number | null;
  exitCode: number | null;
  timeout: boolean;
  error?: string;
  [key: string]: unknown;
}
export const rows: Measurement[] = [];
export async function command(
  backend: string,
  repetition: number,
  operation: string,
  program: string,
  args: string[],
  cwd?: string,
  extraEnv: Record<string, string> = {},
  timeoutMs = 60000,
  allowFailure = false,
) {
  const start = performance.now();
  let stdout = "",
    stderr = "",
    timeout = false;
  const env = { ...cleanEnv(), ...extraEnv };
  const p = spawn("/usr/bin/time", ["-l", program, ...args], {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  p.stdout.on("data", (b) => (stdout += b));
  p.stderr.on("data", (b) => (stderr += b));
  const timer = setTimeout(() => {
    timeout = true;
    p.kill("SIGKILL");
  }, timeoutMs);
  const code = await new Promise<number | null>((r, reject) => {
    p.on("close", r);
    p.on("error", reject);
  });
  clearTimeout(timer);
  const times = stderr.match(/([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys/);
  const rss = stderr.match(/(\d+)\s+maximum resident set size/);
  const row: Measurement = {
    backend,
    repetition,
    operation,
    wallMs: performance.now() - start,
    userSeconds: times ? Number(times[2]) : null,
    systemSeconds: times ? Number(times[3]) : null,
    maxRssBytes: rss ? Number(rss[1]) : null,
    exitCode: code,
    timeout,
  };
  if (code !== 0)
    row.error =
      "Command failed (output withheld to avoid credential-bearing diagnostics)";
  rows.push(row);
  if ((code !== 0 || timeout) && !allowFailure)
    throw Error(
      `${backend} ${operation} failed, exit=${code}, timeout=${timeout}`,
    );
  return { stdout: stdout.trim(), stderr, code, row };
}
export async function gitMeasured(
  backend: string,
  rep: number,
  op: string,
  args: string[],
  cwd?: string,
  env: Record<string, string> = {},
  allowFailure = false,
) {
  return command(
    backend,
    rep,
    op,
    "git",
    [
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "core.autocrlf=false",
      "-c",
      "pack.compression=6",
      ...args,
    ],
    cwd,
    env,
    60000,
    allowFailure,
  );
}
export function csv(data: Record<string, unknown>[]) {
  const keys = [...new Set(data.flatMap((r) => Object.keys(r)))];
  const field = (v: unknown) =>
    '"' + String(v ?? "").replaceAll('"', '""') + '"';
  return (
    [
      keys.map(field).join(","),
      ...data.map((r) =>
        keys
          .map((k) =>
            field(typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k]),
          )
          .join(","),
      ),
    ].join("\n") + "\n"
  );
}
