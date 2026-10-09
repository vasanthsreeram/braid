// Minimal typing for the runtime module; @cloudflare/workers-types is not in the global
// `types` list here (Node tests share this tsconfig).
declare module "cloudflare:workers" {
  export abstract class WorkerEntrypoint<Env = unknown, Props = {}> {
    protected ctx: import("@cloudflare/workers-types").ExecutionContext & {
      readonly props: Props;
      readonly exports: any;
    };
    protected env: Env;
    constructor(ctx: unknown, env: Env);
  }
}
