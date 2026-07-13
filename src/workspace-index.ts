import { basename, resolve } from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";
import { request as httpRequest } from "http";
import { scanWorkspaceTree, type FileTreeNode } from "./workspace-scanner.ts";
import { watchWorkspace } from "./file-watcher.ts";
import { fuzzyScore } from "./client/utils/fuzzy-search.ts";
import { markExploded } from "./scan-guard.ts";

export const scanCache = new Map<string, { tree: FileTreeNode; ts: number }>();
const scanInFlight = new Map<string, Promise<FileTreeNode>>();
const SCAN_CACHE_FRESH_MS = 10_000;
const SCAN_CACHE_MAX_ENTRIES = 30;
const BACKGROUND_REFRESH_DELAY_MS = 100;
const GO_SCANNER_TIMEOUT_MS = 10_000;
const GO_DAEMON_REQUEST_TIMEOUT_MS = 10_000;
const GO_SCANNER_PATH = resolve(".cache/mdv-workspace-scanner");

const backgroundQueue: string[] = [];
const backgroundQueued = new Set<string>();
let backgroundRunning = false;

interface DaemonHttpResponse<T> {
  statusCode: number;
  body: string;
  data?: T;
}

function setScanCache(path: string, tree: FileTreeNode): void {
  scanCache.delete(path);
  scanCache.set(path, { tree, ts: Date.now() });
  if (scanCache.size > SCAN_CACHE_MAX_ENTRIES) {
    const oldest = scanCache.keys().next().value;
    if (oldest !== undefined) scanCache.delete(oldest);
  }
}

function touchCached(path: string): FileTreeNode | null {
  const cached = scanCache.get(path);
  if (!cached) return null;
  scanCache.delete(path);
  scanCache.set(path, cached);
  return cached.tree;
}

function shouldRefresh(path: string): boolean {
  const cached = scanCache.get(path);
  return !cached || Date.now() - cached.ts >= SCAN_CACHE_FRESH_MS;
}

async function runScan(resolvedPath: string): Promise<FileTreeNode> {
  const inFlight = scanInFlight.get(resolvedPath);
  if (inFlight) return inFlight;

  // Recursive workspace watchers are expensive. Opened files are watched
  // individually; whole-workspace watching remains opt-in for debugging.
  if (process.env.MDV_WATCH_WORKSPACES === "1") {
    watchWorkspace(resolvedPath);
  }

  const scanPromise = scanWorkspaceTreeWithAdapter(resolvedPath)
    .then((tree) => {
      setScanCache(resolvedPath, tree);
      scanInFlight.delete(resolvedPath);
      return tree;
    })
    .catch((err) => {
      scanInFlight.delete(resolvedPath);
      throw err;
    });
  scanInFlight.set(resolvedPath, scanPromise);
  return scanPromise;
}

async function scanWorkspaceTreeWithAdapter(resolvedPath: string): Promise<FileTreeNode> {
  if (shouldUseGoDaemon()) {
    try {
      const tree = await daemonRequest<FileTreeNode>("/scan", { path: resolvedPath, force: true });
      applyScanWarnings(tree);
      return tree;
    } catch (err: any) {
      if (hasConfiguredDaemonSocket()) {
        throw new Error(`Go daemon scan failed: ${err?.message || err}`);
      }
      console.warn(`[workspace-index] Go daemon scan failed, falling back to one-shot scanner: ${err?.message || err}`);
    }
  }

  if (process.env.MDV_WORKSPACE_SCANNER !== "ts" && existsSync(GO_SCANNER_PATH)) {
    try {
      const tree = await scanWorkspaceTreeWithGo(resolvedPath);
      applyScanWarnings(tree);
      return tree;
    } catch (err: any) {
      console.warn(`[workspace-index] Go scanner failed, falling back to TypeScript scanner: ${err?.message || err}`);
    }
  }
  return scanWorkspaceTree(resolvedPath);
}

function shouldUseGoDaemon(): boolean {
  return Boolean(getConfiguredDaemonSocketPath());
}

function hasConfiguredDaemonSocket(): boolean {
  return Boolean(getConfiguredDaemonSocketPath());
}

function getConfiguredDaemonSocketPath(): string | null {
  const socketPath = process.env.MDV_WORKSPACE_DAEMON_SOCKET?.trim();
  return socketPath ? resolve(socketPath) : null;
}

async function daemonRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const socketPath = getConfiguredDaemonSocketPath();
  if (!socketPath) {
    throw new Error("workspace daemon socket is not configured");
  }
  const response = await requestDaemonOverUnixSocket<T>(socketPath, endpoint, { method: "POST", body });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(response.body.trim() || `HTTP ${response.statusCode}`);
  }
  return response.data as T;
}

function requestDaemonOverUnixSocket<T>(
  socketPath: string,
  endpoint: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<DaemonHttpResponse<T>> {
  return new Promise((resolvePromise, reject) => {
    const method = options.method ?? "POST";
    const hasBody = options.body !== undefined;
    const payload = hasBody ? JSON.stringify(options.body) : "";
    const req = httpRequest({
      socketPath,
      path: endpoint,
      method,
      headers: hasBody
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          }
        : undefined,
      timeout: GO_DAEMON_REQUEST_TIMEOUT_MS,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        if ((res.statusCode ?? 500) < 200 || (res.statusCode ?? 500) >= 300) {
          resolvePromise({ statusCode: res.statusCode ?? 500, body: text });
          return;
        }
        try {
          resolvePromise({
            statusCode: res.statusCode ?? 200,
            body: text,
            data: JSON.parse(text) as T,
          });
        } catch (err: any) {
          reject(new Error(`Go daemon returned invalid JSON: ${err?.message || err}`));
        }
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error(`Go daemon request timed out after ${GO_DAEMON_REQUEST_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    req.end(payload);
  });
}

function applyScanWarnings(tree: FileTreeNode): void {
  for (const warning of tree.scanWarnings ?? []) {
    markExploded(warning.path, warning.entryCount);
    console.warn(`[workspace-scanner] 目录条目数过多，已跳过扫描: ${warning.path} (${warning.entryCount} 项，超过上限)`);
  }
}

function scanWorkspaceTreeWithGo(resolvedPath: string): Promise<FileTreeNode> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(GO_SCANNER_PATH, [resolvedPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Go scanner timed out after ${GO_SCANNER_TIMEOUT_MS}ms`));
    }, GO_SCANNER_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(Buffer.concat(stderr).toString("utf8").trim() || `Go scanner exited with ${code}`));
        return;
      }
      try {
        resolvePromise(JSON.parse(Buffer.concat(stdout).toString("utf8")) as FileTreeNode);
      } catch (err: any) {
        reject(new Error(`Go scanner returned invalid JSON: ${err?.message || err}`));
      }
    });
  });
}

function pumpBackgroundQueue(): void {
  if (backgroundRunning) return;
  const next = backgroundQueue.shift();
  if (!next) return;
  backgroundQueued.delete(next);
  backgroundRunning = true;
  setTimeout(() => {
    runScan(next)
      .catch((err) => {
        console.warn(`[workspace-index] 后台刷新失败: ${next}: ${err?.message || err}`);
      })
      .finally(() => {
        backgroundRunning = false;
        pumpBackgroundQueue();
      });
  }, BACKGROUND_REFRESH_DELAY_MS);
}

export function warmWorkspace(path: string): void {
  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) return;
  if (!shouldRefresh(resolvedPath)) return;
  if (scanInFlight.has(resolvedPath) || backgroundQueued.has(resolvedPath)) return;
  backgroundQueued.add(resolvedPath);
  backgroundQueue.push(resolvedPath);
  pumpBackgroundQueue();
}

export async function scanWorkspace(
  path: string,
  options: { preferCached?: boolean } = {},
): Promise<FileTreeNode> {
  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) {
    throw new Error(`目录不存在: ${resolvedPath}`);
  }

  const cachedTree = touchCached(resolvedPath);
  if (cachedTree) {
    if (options.preferCached) {
      warmWorkspace(resolvedPath);
      return cachedTree;
    }
    if (!shouldRefresh(resolvedPath)) {
      return cachedTree;
    }
  }

  return runScan(resolvedPath);
}

export async function registerWorkspaceIndex(path: string): Promise<void> {
  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath) || !shouldUseGoDaemon()) return;
  await daemonRequest<{ ok: boolean }>("/register", { path: resolvedPath });
}

export async function unregisterWorkspaceIndex(path: string): Promise<void> {
  const resolvedPath = resolve(path);
  scanCache.delete(resolvedPath);
  if (!shouldUseGoDaemon()) return;
  await daemonRequest<{ ok: boolean }>("/unregister", { path: resolvedPath });
}

export interface WorkspaceIndexStats {
  workspaceCount: number;
  indexedFileCount: number;
  watchedDirCount: number;
  inFlightCount: number;
  scanCount: number;
  refreshCount: number;
  scanErrorCount: number;
  watchErrorCount: number;
  watchLimitCount: number;
  lastError?: string;
  lastRefreshUnix?: number;
  maxIndexedWorkspaces: number;
  maxWatchedDirsPerWorkspace: number;
  workspaces: Record<string, string>;
}

export interface WorkspaceIndexHealth {
  ok: boolean;
  configured: boolean;
  stats?: WorkspaceIndexStats;
  error?: string;
}

export async function getWorkspaceIndexHealth(): Promise<WorkspaceIndexHealth> {
  const socketPath = getConfiguredDaemonSocketPath();
  if (!socketPath) {
    return { ok: false, configured: false, error: "workspace daemon socket is not configured" };
  }
  try {
    const response = await requestDaemonOverUnixSocket<WorkspaceIndexStats>(socketPath, "/stats", { method: "GET" });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return { ok: false, configured: true, error: response.body.trim() || `HTTP ${response.statusCode}` };
    }
    return { ok: true, configured: true, stats: response.data as WorkspaceIndexStats };
  } catch (err: any) {
    return { ok: false, configured: true, error: err?.message || String(err) };
  }
}

export interface WorkspaceFileSearchResult {
  path: string;
  display: string;
  workspaceRoot: string;
}

function collectMatches(
  node: FileTreeNode,
  query: string,
  workspaceRoot: string,
  results: WorkspaceFileSearchResult[],
  limit: number,
): void {
  if (results.length >= limit) return;
  if (node.type === "file") {
    const name = basename(node.path);
    if (fuzzyScore(name, query) !== 0) {
      results.push({ path: node.path, display: name, workspaceRoot });
    }
    return;
  }

  for (const child of node.children ?? []) {
    collectMatches(child, query, workspaceRoot, results, limit);
    if (results.length >= limit) return;
  }
}

export async function searchWorkspaceFiles(
  query: string,
  workspaceRoots: string[],
  limit: number,
): Promise<WorkspaceFileSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (shouldUseGoDaemon()) {
    try {
      const response = await daemonRequest<{ results: WorkspaceFileSearchResult[] }>("/search", {
        query: q,
        roots: workspaceRoots.map((root) => resolve(root)),
        limit,
      });
      return response.results ?? [];
    } catch (err: any) {
      if (hasConfiguredDaemonSocket()) {
        throw new Error(`Go daemon search failed: ${err?.message || err}`);
      }
      console.warn(`[workspace-index] Go daemon search failed, falling back to in-process cache: ${err?.message || err}`);
    }
  }

  const results: WorkspaceFileSearchResult[] = [];
  for (const root of workspaceRoots) {
    if (results.length >= limit) break;
    const resolvedRoot = resolve(root);
    const tree = touchCached(resolvedRoot);
    warmWorkspace(resolvedRoot);
    if (tree) collectMatches(tree, q, resolvedRoot, results, limit);
  }
  return results;
}
