import { randomUUID } from "crypto";
import { getDb } from "./annotation-db.ts";
import { normalizeDocPath } from "./annotation-storage.ts";

export interface AgentSession {
  docPath: string;
  sessionId: string;
  running: boolean;
  runId: string | null;
  updatedAt: number;
}

interface AgentSessionRow {
  doc_path: string;
  session_id: string;
  running: number;
  run_id: string | null;
  updated_at: number;
}

function rowToSession(row: AgentSessionRow): AgentSession {
  return {
    docPath: row.doc_path,
    sessionId: row.session_id,
    running: row.running === 1,
    runId: row.run_id,
    updatedAt: row.updated_at,
  };
}

export function getAgentSession(docPath: string): AgentSession | null {
  const path = normalizeDocPath(docPath);
  const row = getDb().query("SELECT * FROM agent_sessions WHERE doc_path = ?").get(path) as AgentSessionRow | null;
  return row ? rowToSession(row) : null;
}

/** 获取（或按需创建）文档对应的 session id；sessionIdOverride 用于手动关联到已有会话。 */
export function ensureAgentSessionId(docPath: string, sessionIdOverride?: string): string {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing) return existing.sessionId;
  const sessionId = sessionIdOverride || randomUUID();
  getDb().query(
    "INSERT INTO agent_sessions (doc_path, session_id, running, run_id, updated_at) VALUES (?, ?, 0, NULL, ?)"
  ).run(path, sessionId, Date.now());
  return sessionId;
}

/** 尝试把某文档标记为"运行中"，成功返回 true；已在运行中则返回 false（并发锁）。 */
export function tryMarkAgentRunning(docPath: string, runId: string): boolean {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing?.running) return false;
  getDb().query(
    "UPDATE agent_sessions SET running = 1, run_id = ?, updated_at = ? WHERE doc_path = ?"
  ).run(runId, Date.now(), path);
  return true;
}

export function markAgentIdle(docPath: string): void {
  const path = normalizeDocPath(docPath);
  getDb().query(
    "UPDATE agent_sessions SET running = 0, updated_at = ? WHERE doc_path = ?"
  ).run(Date.now(), path);
}

/** 把某文档手动指向另一个已有 session（多文档共享会话）。不允许在运行中改。 */
export function setAgentSessionId(docPath: string, sessionId: string): boolean {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing?.running) return false;
  if (existing) {
    getDb().query("UPDATE agent_sessions SET session_id = ?, updated_at = ? WHERE doc_path = ?").run(sessionId, Date.now(), path);
  } else {
    getDb().query(
      "INSERT INTO agent_sessions (doc_path, session_id, running, run_id, updated_at) VALUES (?, ?, 0, NULL, ?)"
    ).run(path, sessionId, Date.now());
  }
  return true;
}

/** 给文档换一个全新的 session（放弃旧的关联）。运行中不允许换。 */
export function resetAgentSessionId(docPath: string): string | null {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing?.running) return null;
  const sessionId = randomUUID();
  if (existing) {
    getDb().query("UPDATE agent_sessions SET session_id = ?, updated_at = ? WHERE doc_path = ?").run(sessionId, Date.now(), path);
  } else {
    getDb().query(
      "INSERT INTO agent_sessions (doc_path, session_id, running, run_id, updated_at) VALUES (?, ?, 0, NULL, ?)"
    ).run(path, sessionId, Date.now());
  }
  return sessionId;
}

/** 列出某 workspace 下所有已经有 session 的文档（用于"关联到已有会话"的选择列表）。 */
export function listAgentSessionsForWorkspace(workspacePath: string): AgentSession[] {
  const rows = getDb().query("SELECT * FROM agent_sessions ORDER BY updated_at DESC").all() as AgentSessionRow[];
  const prefix = workspacePath.endsWith("/") ? workspacePath : workspacePath + "/";
  return rows
    .filter((r) => r.doc_path === workspacePath || r.doc_path.startsWith(prefix))
    .map(rowToSession);
}

export interface AgentRunUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  costUsd?: number;
  model?: string;
}

export interface AgentTranscriptMsg {
  kind: "user" | "text" | "tool" | "tool-result" | "error" | "result";
  text: string;
  timestamp: number;
  model?: string;
}

export interface AgentRun {
  id: string;
  docPath: string;
  sessionId: string;
  workspacePath: string | null;
  command: string;
  status: "running" | "success" | "error";
  startedAt: number;
  finishedAt: number | null;
  usage: AgentRunUsage;
  error: string | null;
  transcript: AgentTranscriptMsg[];
}

export function insertAgentRun(run: {
  id: string;
  docPath: string;
  sessionId: string;
  workspacePath: string | null;
  command: string[];
}): void {
  getDb().query(`
    INSERT INTO agent_runs (id, doc_path, session_id, workspace_path, command, status, started_at)
    VALUES (?, ?, ?, ?, ?, 'running', ?)
  `).run(run.id, normalizeDocPath(run.docPath), run.sessionId, run.workspacePath, JSON.stringify(run.command), Date.now());
}

export function finishAgentRun(id: string, result: {
  status: "success" | "error";
  usage?: AgentRunUsage;
  error?: string;
  transcript?: AgentTranscriptMsg[];
}): void {
  getDb().query(`
    UPDATE agent_runs SET
      status = ?, finished_at = ?, input_tokens = ?, output_tokens = ?,
      cache_creation_tokens = ?, cache_read_tokens = ?, cost_usd = ?, model = ?, error = ?, transcript_json = ?
    WHERE id = ?
  `).run(
    result.status,
    Date.now(),
    result.usage?.inputTokens ?? null,
    result.usage?.outputTokens ?? null,
    result.usage?.cacheCreationTokens ?? null,
    result.usage?.cacheReadTokens ?? null,
    result.usage?.costUsd ?? null,
    result.usage?.model ?? null,
    result.error ?? null,
    result.transcript ? JSON.stringify(result.transcript) : null,
    id
  );
}

function rowToRun(row: any): AgentRun {
  return {
    id: row.id,
    docPath: row.doc_path,
    sessionId: row.session_id,
    workspacePath: row.workspace_path,
    command: row.command,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    usage: {
      inputTokens: row.input_tokens ?? undefined,
      outputTokens: row.output_tokens ?? undefined,
      cacheCreationTokens: row.cache_creation_tokens ?? undefined,
      cacheReadTokens: row.cache_read_tokens ?? undefined,
      costUsd: row.cost_usd ?? undefined,
      model: row.model ?? undefined,
    },
    error: row.error,
    transcript: row.transcript_json ? JSON.parse(row.transcript_json) : [],
  };
}

export function getAgentRuns(docPath: string, limit = 20): AgentRun[] {
  const path = normalizeDocPath(docPath);
  const rows = getDb().query(
    "SELECT * FROM agent_runs WHERE doc_path = ? ORDER BY started_at DESC LIMIT ?"
  ).all(path, limit) as any[];
  return rows.map(rowToRun);
}

export interface AgentUsageSummary {
  workspacePath: string | null;
  runCount: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export function sessionHasHistory(sessionId: string): boolean {
  const row = getDb().query("SELECT 1 FROM agent_runs WHERE session_id = ? LIMIT 1").get(sessionId);
  return !!row;
}

/** 某个 session 的完整历史（跨文档，按发生顺序），用于连续对话视图。 */
export function getRunsBySession(sessionId: string, limit = 200): AgentRun[] {
  const rows = getDb().query(
    "SELECT * FROM agent_runs WHERE session_id = ? ORDER BY started_at ASC LIMIT ?"
  ).all(sessionId, limit) as any[];
  return rows.map(rowToRun);
}

export function listRecentAgentRuns(limit = 50, workspacePath?: string): AgentRun[] {
  const rows = workspacePath
    ? getDb().query("SELECT * FROM agent_runs WHERE workspace_path = ? ORDER BY started_at DESC LIMIT ?").all(workspacePath, limit) as any[]
    : getDb().query("SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT ?").all(limit) as any[];
  return rows.map(rowToRun);
}

export function getAgentUsageSummary(sinceMs: number): AgentUsageSummary[] {
  const rows = getDb().query(`
    SELECT
      workspace_path AS workspacePath,
      COUNT(*) AS runCount,
      COALESCE(SUM(cost_usd), 0) AS totalCostUsd,
      COALESCE(SUM(input_tokens), 0) AS totalInputTokens,
      COALESCE(SUM(output_tokens), 0) AS totalOutputTokens
    FROM agent_runs
    WHERE started_at >= ? AND status != 'running'
    GROUP BY workspace_path
    ORDER BY totalCostUsd DESC
  `).all(sinceMs) as AgentUsageSummary[];
  return rows;
}
