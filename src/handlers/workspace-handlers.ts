import { resolve } from "path";
import type { Context } from "hono";
import {
  getWorkspaceIndexHealth,
  registerWorkspaceIndex,
  scanWorkspace,
  searchWorkspaceFiles,
  unregisterWorkspaceIndex,
} from "../workspace-index.ts";
import {
  deleteWorkspacePath,
  getWorkspaceAgentCommand,
  getWorkspacePaths,
  setWorkspaceAgentCommand,
  upsertWorkspacePath,
} from "../workspace-storage.ts";

export { scanCache } from "../workspace-index.ts";

export async function handleScanWorkspace(c: Context) {
  try {
    const { path } = await c.req.json() as any;
    if (!path) {
      return c.json({ error: "缺少 path 参数" }, 400);
    }

    const tree = await scanWorkspace(path, { preferCached: true });
    return c.json(tree);
  } catch (error: any) {
    const message = error?.message || "扫描工作区失败";
    return c.json({ error: message }, message.startsWith("目录不存在:") ? 404 : 500);
  }
}

export function handleGetWorkspaces(c: Context) {
  return c.json({ paths: getWorkspacePaths() });
}

export async function handleWorkspaceIndexStats(c: Context) {
  const health = await getWorkspaceIndexHealth();
  return c.json(health, health.ok ? 200 : 503);
}

export async function bootstrapWorkspaceIndexes(): Promise<void> {
  for (const path of getWorkspacePaths()) {
    await registerWorkspaceIndex(path).catch((err) => {
      console.warn(`[workspace-index] bootstrap register failed: ${path}: ${err?.message || err}`);
    });
  }
}

export function handleRegisterWorkspace(c: Context) {
  const body = c.req.json() as any;
  return body.then(async ({ path }: { path: string }) => {
    if (!path) return c.json({ error: "缺少 path" }, 400);
    const resolvedPath = resolve(path);
    upsertWorkspacePath(resolvedPath);
    await registerWorkspaceIndex(resolvedPath).catch((err) => {
      console.warn(`[workspace-index] register failed: ${resolvedPath}: ${err?.message || err}`);
    });
    return c.json({ ok: true });
  });
}

export function handleUnregisterWorkspace(c: Context) {
  const body = c.req.json() as any;
  return body.then(async ({ path }: { path: string }) => {
    if (!path) return c.json({ error: "缺少 path" }, 400);
    const resolvedPath = resolve(path);
    deleteWorkspacePath(resolvedPath);
    await unregisterWorkspaceIndex(resolvedPath).catch((err) => {
      console.warn(`[workspace-index] unregister failed: ${resolvedPath}: ${err?.message || err}`);
    });
    return c.json({ ok: true });
  });
}

export function handleGetWorkspaceAgentCommand(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  return c.json({ command: getWorkspaceAgentCommand(resolve(path)) });
}

const AGENT_COMMAND_MAX_ARGS = 32;
const AGENT_COMMAND_MAX_ARG_LENGTH = 1024;

/**
 * 校验用户配置的 Agent 命令。该命令会被直接作为可执行文件启动（不经过 shell），
 * 所以这里只允许合理形状：非空字符串数组，数量与长度有上限，不含 NUL。
 * 返回 null 表示清除自定义命令（回到默认 backend）。
 */
export function validateAgentCommand(input: unknown): { ok: true; command: string[] | null } | { ok: false; error: string } {
  if (input === null || input === undefined) return { ok: true, command: null };
  if (!Array.isArray(input) || !input.every((x) => typeof x === "string")) {
    return { ok: false, error: "command 必须是字符串数组" };
  }
  if (input.length === 0) return { ok: true, command: null };
  if (input.length > AGENT_COMMAND_MAX_ARGS) return { ok: false, error: `command 最多 ${AGENT_COMMAND_MAX_ARGS} 项` };
  for (const arg of input as string[]) {
    if (arg.length === 0 || arg.length > AGENT_COMMAND_MAX_ARG_LENGTH) return { ok: false, error: "command 参数长度不合法" };
    if (arg.includes("\0")) return { ok: false, error: "command 参数含非法字符" };
  }
  return { ok: true, command: input as string[] };
}

export async function handleSetWorkspaceAgentCommand(c: Context) {
  const body = await c.req.json<{ path?: string; command?: unknown }>().catch(() => ({}) as any);
  if (!body?.path) return c.json({ error: "缺少 path 参数" }, 400);
  const checked = validateAgentCommand(body.command);
  if (!checked.ok) return c.json({ error: checked.error }, 400);
  setWorkspaceAgentCommand(resolve(body.path), checked.command);
  return c.json({ ok: true });
}

export async function handleWorkspaceSearch(c: Context) {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(c.req.query("limit") ?? "50"), 200);

  if (!q) return c.json({ results: [] });
  const results = await searchWorkspaceFiles(q, getWorkspacePaths(), limit);
  return c.json({ results });
}
