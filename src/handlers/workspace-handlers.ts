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

export async function handleSetWorkspaceAgentCommand(c: Context) {
  const body = await c.req.json<{ path?: string; command?: string[] | null }>().catch(() => ({}) as any);
  if (!body?.path) return c.json({ error: "缺少 path 参数" }, 400);
  setWorkspaceAgentCommand(resolve(body.path), body.command ?? null);
  return c.json({ ok: true });
}

export async function handleWorkspaceSearch(c: Context) {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(c.req.query("limit") ?? "50"), 200);

  if (!q) return c.json({ results: [] });
  const results = await searchWorkspaceFiles(q, getWorkspacePaths(), limit);
  return c.json({ results });
}
