// agent-demo/agent-server/auth.ts
import { execSync } from "child_process";

export function getAuthToken(): string {
  const cmd = process.env.MCLI_TOKEN_CMD;
  if (cmd) return execSync(cmd, { encoding: "utf-8", shell: "/bin/bash" }).trim();
  if (process.env.ANTHROPIC_AUTH_TOKEN) return process.env.ANTHROPIC_AUTH_TOKEN;
  throw new Error("需要设置 ANTHROPIC_AUTH_TOKEN 或 MCLI_TOKEN_CMD");
}
